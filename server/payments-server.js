import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();
const port = Number(process.env.PAYMENTS_PORT || 8787);
const allowedOrigin = process.env.PAYMENTS_ALLOWED_ORIGIN || "http://127.0.0.1:3000";

const supabaseUrl = process.env.SUPABASE_URL;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!supabaseUrl || !supabasePublishableKey || !razorpayKeyId || !razorpayKeySecret) {
  console.error(
    "Missing env. Required: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"
  );
}

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "1mb" }));

function getAuthToken(req) {
  const value = req.headers.authorization || "";
  if (!value.toLowerCase().startsWith("bearer ")) return "";
  return value.slice(7).trim();
}

function getSupabaseHeaders(token) {
  return {
    apikey: supabasePublishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function fetchAuthenticatedUser(token) {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: getSupabaseHeaders(token),
  });
  if (!response.ok) return null;
  return response.json();
}

async function fetchProductsForItems(token, items) {
  const ids = [...new Set(items.map((item) => Number(item.productId)).filter(Number.isFinite))];
  if (ids.length === 0) throw new Error("Cart is empty.");

  const queryIds = ids.join(",");
  const url = `${supabaseUrl}/rest/v1/products?select=id,name,price,stock&id=in.(${queryIds})`;
  const response = await fetch(url, { headers: getSupabaseHeaders(token) });
  if (!response.ok) {
    throw new Error("Failed to fetch product pricing.");
  }
  return response.json();
}

function buildOrderSummary(items, productRows) {
  const productMap = new Map(productRows.map((row) => [Number(row.id), row]));
  let total = 0;
  let itemCount = 0;
  for (const item of items) {
    const productId = Number(item.productId);
    const qty = Number(item.qty);
    if (!Number.isFinite(productId) || !Number.isFinite(qty) || qty <= 0) {
      throw new Error("Invalid item payload.");
    }
    const product = productMap.get(productId);
    if (!product) throw new Error(`Product ${productId} not found.`);
    if (Number(product.stock) < qty) {
      throw new Error(`Insufficient stock for "${product.name}".`);
    }
    total += Number(product.price) * qty;
    itemCount += qty;
  }
  return { total, itemCount };
}

async function createRazorpayOrder(amountPaise) {
  if (
    !razorpayKeyId ||
    !razorpayKeySecret ||
    razorpayKeyId.includes("replace_me") ||
    razorpayKeySecret.includes("replace_me")
  ) {
    throw new Error("Razorpay test keys are not configured. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.");
  }

  const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: `grocery_${Date.now()}`,
      payment_capture: 1,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    let message = data?.error?.description || "Failed to create Razorpay order.";
    if (String(message).toLowerCase().includes("authentication failed")) {
      message =
        "Razorpay authentication failed. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env and restart payment server.";
    }
    throw new Error(message);
  }
  return data;
}

async function placeOrderViaSupabase(token, payload) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/place_order`, {
    method: "POST",
    headers: getSupabaseHeaders(token),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.message || data?.error || "Failed to place order after payment.";
    throw new Error(message);
  }
  return Array.isArray(data) ? data[0] : data;
}

app.post("/api/payments/create-order", async (req, res) => {
  try {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ message: "Missing user token." });
    const user = await fetchAuthenticatedUser(token);
    if (!user?.id) return res.status(401).json({ message: "Invalid user token." });

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const products = await fetchProductsForItems(token, items);
    const summary = buildOrderSummary(items, products);
    const amountPaise = Math.round(summary.total * 100);
    if (amountPaise <= 0) {
      return res.status(400).json({ message: "Invalid cart amount." });
    }

    const razorpayOrder = await createRazorpayOrder(amountPaise);
    return res.json({
      keyId: razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      itemCount: summary.itemCount,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error?.message || "Failed to create payment order." });
  }
});

app.post("/api/payments/verify-and-place-order", async (req, res) => {
  try {
    const token = getAuthToken(req);
    if (!token) return res.status(401).json({ message: "Missing user token." });
    const user = await fetchAuthenticatedUser(token);
    if (!user?.id) return res.status(401).json({ message: "Invalid user token." });

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      customerDetails,
    } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing payment verification payload." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    const order = await placeOrderViaSupabase(token, {
      p_customer_name: customerDetails?.name || null,
      p_customer_phone: customerDetails?.phone || null,
      p_customer_email: customerDetails?.email || null,
      p_customer_address: customerDetails?.address || null,
      p_items: items || [],
      p_payment_provider: "razorpay",
      p_payment_status: "paid",
      p_payment_order_id: razorpayOrderId,
      p_payment_id: razorpayPaymentId,
    });

    return res.json({
      verified: true,
      order,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ message: error?.message || "Failed to verify payment." });
  }
});

app.get("/api/payments/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Payments API running on http://127.0.0.1:${port}`);
});
