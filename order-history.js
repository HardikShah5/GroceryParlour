const store = window.DBStore;
const listEl = document.getElementById("ordersList");
const errorEl = document.getElementById("trackError");
const signInLinkEl = document.getElementById("signInLink");
const refreshOrdersEl = document.getElementById("refreshOrders");
const logoutOrdersEl = document.getElementById("logoutOrders");

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

async function getSessionViaStoreOrClient() {
  if (store && typeof store.getSession === "function") {
    return store.getSession();
  }
  const client = store?.client;
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

function getStatusClass(status) {
  const key = String(status || "").toLowerCase();
  if (key === "delivered") return "status-delivered";
  if (key === "cancelled") return "status-cancelled";
  if (key === "processing") return "status-processing";
  return "status-new";
}

function renderOrders(orders) {
  if (!orders || orders.length === 0) {
    listEl.innerHTML = '<p class="empty-orders">No orders found for your account yet.</p>';
    return;
  }

  listEl.innerHTML = orders
    .map((order) => {
      const date = new Date(order.createdAt).toLocaleString("en-IN");
      const items = (order.items || [])
        .map((item) => `<li>${item.name} x ${item.qty} (${currency.format(item.lineTotal)})</li>`)
        .join("");

      return `
      <article class="order-card-user">
        <div class="order-row">
          <div>
            <strong>${order.orderNumber || order.id}</strong>
            <p>${date}</p>
          </div>
          <span class="status-pill ${getStatusClass(order.status)}">${order.status}</span>
        </div>
        <p>${order.itemCount} items · ${currency.format(order.total)}</p>
        <p>${order.customerName || ""} ${order.customerAddress ? "· " + order.customerAddress : ""}</p>
        <ul class="order-items-user">${items}</ul>
        <div class="order-actions">
          <button class="small-btn" type="button" data-action="download-invoice" data-id="${order.id}">
            Download Invoice
          </button>
        </div>
      </article>
    `;
    })
    .join("");

  listEl.querySelectorAll("[data-action='download-invoice']").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const order = orders.find((item) => String(item.id) === String(id));
      if (!order) return;
      downloadInvoice(order);
    });
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildInvoiceHtml(order) {
  const items = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.qty}</td>
        <td>${currency.format(item.price)}</td>
        <td>${currency.format(item.lineTotal)}</td>
      </tr>
    `
    )
    .join("");

  const orderNumber = escapeHtml(order.orderNumber || order.id);
  const customerName = escapeHtml(order.customerName || "N/A");
  const customerEmail = escapeHtml(order.customerEmail || "N/A");
  const customerPhone = escapeHtml(order.customerPhone || "N/A");
  const customerAddress = escapeHtml(order.customerAddress || "N/A");
  const createdAt = new Date(order.createdAt).toLocaleString("en-IN");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${orderNumber}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: Arial, sans-serif; padding: 32px; color: #1b1b1b; }
      h1 { margin: 0 0 6px; font-size: 24px; }
      h2 { margin: 24px 0 12px; font-size: 18px; }
      .meta { color: #555; margin: 4px 0; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background: #f5f5f5; }
      tfoot td { font-weight: 700; }
      .total { text-align: right; }
      .brand { margin-bottom: 12px; }
    </style>
  </head>
  <body>
    <div class="brand">
      <h1>Grocery Parlour</h1>
      <div class="meta">Invoice for order ${orderNumber}</div>
      <div class="meta">Placed on ${createdAt}</div>
      <div class="meta">Status: ${escapeHtml(order.status || "New")}</div>
    </div>

    <h2>Customer Details</h2>
    <div class="meta">Name: ${customerName}</div>
    <div class="meta">Email: ${customerEmail}</div>
    <div class="meta">Phone: ${customerPhone}</div>
    <div class="meta">Address: ${customerAddress}</div>

    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${items || "<tr><td colspan=\"4\">No items</td></tr>"}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="total">Total</td>
          <td>${currency.format(order.total || 0)}</td>
        </tr>
      </tfoot>
    </table>
  </body>
</html>`;
}

function downloadInvoice(order) {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const orderNumber = String(order.orderNumber || order.id).replaceAll(/[^\w-]/g, "_");
  link.href = url;
  link.download = `invoice-${orderNumber}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function loadMyOrders() {
  errorEl.textContent = "";
  listEl.innerHTML = '<p class="empty-orders">Loading orders...</p>';
  try {
    const orders = await store.listMyOrders();
    renderOrders(orders);
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Failed to fetch orders. Please try again.";
    listEl.innerHTML = "";
  }
}

refreshOrdersEl.addEventListener("click", () => {
  loadMyOrders();
});

logoutOrdersEl.addEventListener("click", async () => {
  try {
    await store.signOut();
    window.location.href = "auth.html?next=order-history.html";
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Failed to sign out.";
  }
});

(async () => {
  try {
    const session = await getSessionViaStoreOrClient();
    if (!session) {
      errorEl.textContent = "Please sign in to view your orders.";
      signInLinkEl.hidden = false;
      refreshOrdersEl.hidden = true;
      logoutOrdersEl.hidden = true;
      listEl.innerHTML = "";
      return;
    }

    signInLinkEl.hidden = true;
    refreshOrdersEl.hidden = false;
    logoutOrdersEl.hidden = false;
    await loadMyOrders();
  } catch (error) {
    console.error(error);
    errorEl.textContent = "Failed to check session.";
  }
})();
