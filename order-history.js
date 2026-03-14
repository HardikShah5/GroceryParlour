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
      </article>
    `;
    })
    .join("");
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
