(() => {
  const config = window.SUPABASE_CONFIG;
  if (!config?.url || !config?.publishableKey) {
    throw new Error("Missing SUPABASE_CONFIG (url/publishableKey)");
  }

  const client = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function mapProductRow(row) {
    return {
      id: toNumber(row.id),
      name: row.name,
      category: row.categories?.name || row.category_name || "Uncategorized",
      categoryId: toNumber(row.category_id),
      price: toNumber(row.price),
      stock: toNumber(row.stock),
      image: row.image_url,
      description: row.description || "",
    };
  }

function mapOrderRow(order, itemsByOrderId) {
  return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      itemCount: toNumber(order.item_count),
      total: toNumber(order.total),
      customerName: order.customer_name || "",
      customerPhone: order.customer_phone || "",
    customerEmail: order.customer_email || "",
    customerAddress: order.customer_address || "",
    paymentProvider: order.payment_provider || "",
    paymentStatus: order.payment_status || "pending",
    paymentOrderId: order.payment_order_id || "",
    paymentId: order.payment_id || "",
    createdAt: order.created_at,
    items: itemsByOrderId[order.id] || [],
  };
}

  async function getItemsByOrderIds(orderIds) {
    if (!orderIds || orderIds.length === 0) return {};

    const { data: items, error: itemError } = await client
      .from("order_items")
      .select("id,order_id,product_id,product_name,qty,unit_price,line_total")
      .in("order_id", orderIds)
      .order("id", { ascending: true });
    if (itemError) throw itemError;

    return (items || []).reduce((acc, item) => {
      const key = item.order_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: toNumber(item.id),
        productId: item.product_id ? toNumber(item.product_id) : null,
        name: item.product_name,
        qty: toNumber(item.qty),
        price: toNumber(item.unit_price),
        lineTotal: toNumber(item.line_total),
      });
      return acc;
    }, {});
  }

  async function getCatalog() {
    const { data: categoryRows, error: categoryError } = await client
      .from("categories")
      .select("id,name,image_url")
      .order("name", { ascending: true });
    if (categoryError) throw categoryError;

    const { data: productRows, error: productError } = await client
      .from("products")
      .select("id,name,price,stock,image_url,description,category_id,categories(name)")
      .order("id", { ascending: true });
    if (productError) throw productError;

    const categoryImages = { All: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" };
    for (const row of categoryRows || []) {
      categoryImages[row.name] = row.image_url;
    }

    return {
      categories: (categoryRows || []).map((row) => ({
        id: toNumber(row.id),
        name: row.name,
        imageUrl: row.image_url,
      })),
      products: (productRows || []).map(mapProductRow),
      categoryImages,
    };
  }

  async function getProductById(id) {
    const { data, error } = await client
      .from("products")
      .select("id,name,price,stock,image_url,description,category_id,categories(name)")
      .eq("id", id)
      .single();
    if (error) return null;
    return mapProductRow(data);
  }

  async function createOrder(payload) {
    const rpcItems = (payload.items || []).map((item) => ({
      productId: item.productId,
      qty: item.qty,
    }));

    const { data, error } = await client.rpc("place_order", {
      p_customer_name: payload.customerName || null,
      p_customer_phone: payload.customerPhone || null,
      p_customer_email: payload.customerEmail || null,
      p_customer_address: payload.customerAddress || null,
      p_items: rpcItems,
      p_payment_provider: payload.paymentProvider || null,
      p_payment_status: payload.paymentStatus || null,
      p_payment_order_id: payload.paymentOrderId || null,
      p_payment_id: payload.paymentId || null,
    });

    if (error) throw error;

    const order = Array.isArray(data) ? data[0] : data;
    if (!order) throw new Error("Failed to create order.");

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      itemCount: toNumber(order.item_count),
      total: toNumber(order.total),
      customerName: order.customer_name || "",
      customerPhone: order.customer_phone || "",
      customerEmail: order.customer_email || "",
      customerAddress: order.customer_address || "",
      paymentProvider: payload.paymentProvider || "",
      paymentStatus: payload.paymentStatus || "pending",
      paymentOrderId: payload.paymentOrderId || "",
      paymentId: payload.paymentId || "",
      createdAt: order.created_at,
      items: payload.items || [],
    };
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getCurrentUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function signUp(payload) {
    const email = (payload?.email || "").trim();
    const password = payload?.password || "";
    const fullName = (payload?.fullName || "").trim();
    const mobile = String(payload?.mobile || "").replace(/\D+/g, "").slice(0, 15);

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
          phone: mobile || null,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(payload) {
    const email = (payload?.email || "").trim();
    const password = payload?.password || "";
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function getProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("id,email,full_name,phone,role")
      .eq("id", user.id)
      .single();
    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || "",
      phone: data.phone || "",
      role: data.role || "user",
    };
  }

  async function updateProfile(payload) {
    const user = await getCurrentUser();
    if (!user) throw new Error("Please sign in.");

    const updates = {
      full_name: (payload?.fullName || "").trim() || null,
      phone: String(payload?.phone || "").replace(/\D+/g, "").slice(0, 15) || null,
    };

    const { error } = await client.from("profiles").update(updates).eq("id", user.id);
    if (error) throw error;
  }

  async function listOrders() {
    const { data: orders, error: orderError } = await client
      .from("orders")
      .select("id,order_number,status,item_count,total,customer_name,customer_phone,customer_email,customer_address,payment_provider,payment_status,payment_order_id,payment_id,created_at")
      .order("created_at", { ascending: false });
    if (orderError) throw orderError;

    const orderIds = (orders || []).map((o) => o.id);
    const itemsByOrderId = await getItemsByOrderIds(orderIds);
    return (orders || []).map((order) => mapOrderRow(order, itemsByOrderId));
  }

  async function listOrdersByContact(payload) {
    const email = (payload?.email || "").trim();
    const phone = (payload?.phone || "").trim();
    if (!email && !phone) return [];

    const rows = [];
    if (email) {
      const { data, error } = await client
        .from("orders")
        .select("id,order_number,status,item_count,total,customer_name,customer_phone,customer_email,customer_address,payment_provider,payment_status,payment_order_id,payment_id,created_at")
        .eq("customer_email", email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      rows.push(...(data || []));
    }

    if (phone) {
      const { data, error } = await client
        .from("orders")
        .select("id,order_number,status,item_count,total,customer_name,customer_phone,customer_email,customer_address,payment_provider,payment_status,payment_order_id,payment_id,created_at")
        .eq("customer_phone", phone)
        .order("created_at", { ascending: false });
      if (error) throw error;
      rows.push(...(data || []));
    }

    const deduped = [];
    const seen = new Set();
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      deduped.push(row);
    }

    deduped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const itemsByOrderId = await getItemsByOrderIds(deduped.map((row) => row.id));
    return deduped.map((order) => mapOrderRow(order, itemsByOrderId));
  }

  async function listMyOrders() {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data: orders, error: orderError } = await client
      .from("orders")
      .select("id,order_number,status,item_count,total,customer_name,customer_phone,customer_email,customer_address,payment_provider,payment_status,payment_order_id,payment_id,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (orderError) throw orderError;

    const orderIds = (orders || []).map((o) => o.id);
    const itemsByOrderId = await getItemsByOrderIds(orderIds);
    return (orders || []).map((order) => mapOrderRow(order, itemsByOrderId));
  }

  async function updateOrderStatus(id, status) {
    const { error } = await client.from("orders").update({ status }).eq("id", id);
    if (error) throw error;
  }

  async function deleteOrder(id) {
    const { error } = await client.from("orders").delete().eq("id", id);
    if (error) throw error;
  }

  async function listCategories() {
    const { data, error } = await client
      .from("categories")
      .select("id,name,image_url")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: toNumber(row.id),
      name: row.name,
      imageUrl: row.image_url,
    }));
  }

  async function upsertCategory(payload) {
    if (payload.id) {
      const { error } = await client
        .from("categories")
        .update({ name: payload.name, image_url: payload.imageUrl })
        .eq("id", payload.id);
      if (error) throw error;
      return;
    }

    const { error } = await client.from("categories").insert({
      name: payload.name,
      image_url: payload.imageUrl,
    });
    if (error) throw error;
  }

  async function deleteCategory(id) {
    const { error } = await client.from("categories").delete().eq("id", id);
    if (error) throw error;
  }

  async function listProducts() {
    const { data, error } = await client
      .from("products")
      .select("id,name,price,stock,image_url,description,category_id,categories(name)")
      .order("id", { ascending: true });
    if (error) throw error;
    return (data || []).map(mapProductRow);
  }

  async function upsertProduct(payload) {
    const row = {
      category_id: payload.categoryId,
      name: payload.name,
      price: payload.price,
      stock: payload.stock,
      image_url: payload.image,
      description: payload.description || null,
    };

    if (payload.id) {
      const { error } = await client.from("products").update(row).eq("id", payload.id);
      if (error) throw error;
      return;
    }

    const { error } = await client.from("products").insert(row);
    if (error) throw error;
  }

  async function deleteProduct(id) {
    const { error } = await client.from("products").delete().eq("id", id);
    if (error) throw error;
  }

  window.DBStore = {
    client,
    getCatalog,
    getProductById,
    createOrder,
    getSession,
    getCurrentUser,
    signUp,
    signIn,
    signOut,
    getProfile,
    updateProfile,
    listOrders,
    listOrdersByContact,
    listMyOrders,
    updateOrderStatus,
    deleteOrder,
    listCategories,
    upsertCategory,
    deleteCategory,
    listProducts,
    upsertProduct,
    deleteProduct,
  };
})();
