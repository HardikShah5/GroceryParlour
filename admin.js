const store = window.DBStore;

let categories = [];
let products = [];
let orders = [];
const LOW_STOCK_THRESHOLD = 10;

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const adminStatsEl = document.getElementById("adminStats");
const categoryListEl = document.getElementById("categoryList");
const categoryForm = document.getElementById("categoryForm");
const categoryOldNameEl = document.getElementById("categoryOldName");
const categoryNameEl = document.getElementById("categoryName");
const categoryImageEl = document.getElementById("categoryImage");

const productListEl = document.getElementById("productList");
const productForm = document.getElementById("productForm");
const productIdEl = document.getElementById("productId");
const productNameEl = document.getElementById("productName");
const productCategoryEl = document.getElementById("productCategory");
const productPriceEl = document.getElementById("productPrice");
const productStockEl = document.getElementById("productStock");
const productImageEl = document.getElementById("productImage");

const orderListEl = document.getElementById("orderList");
const adminLogoutBtnEl = document.getElementById("adminLogoutBtn");
const adminIdentityEl = document.getElementById("adminIdentity");
const inventoryAlertsEl = document.getElementById("inventoryAlerts");
const inventoryAlertSummaryEl = document.getElementById("inventoryAlertSummary");
const menuItems = Array.from(document.querySelectorAll(".menu-item"));
const sectionOrdersEl = document.getElementById("section-orders");
const sectionCategoriesEl = document.getElementById("section-categories");
const sectionProductsEl = document.getElementById("section-products");
let adminProfile = null;

function getProductCountByCategory(categoryId) {
  return products.filter((item) => Number(item.categoryId) === Number(categoryId)).length;
}

async function refreshData() {
  [categories, products, orders] = await Promise.all([
    store.listCategories(),
    store.listProducts(),
    store.listOrders(),
  ]);
}

function renderStats() {
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (order) => order.status === "New" || order.status === "Processing"
  ).length;
  const lowStockCount = products.filter(
    (item) => Number(item.stock) > 0 && Number(item.stock) <= LOW_STOCK_THRESHOLD
  ).length;
  const outOfStockCount = products.filter((item) => Number(item.stock) <= 0).length;
  const totalUnitsInStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
  const inventoryValue = products.reduce(
    (sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0),
    0
  );
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const deliveredRevenue = orders
    .filter((order) => order.status === "Delivered")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  adminStatsEl.innerHTML = `
    <article class="stat-card"><p>Total Products</p><strong>${totalProducts}</strong></article>
    <article class="stat-card"><p>Total Categories</p><strong>${totalCategories}</strong></article>
    <article class="stat-card"><p>Total Orders</p><strong>${totalOrders}</strong></article>
    <article class="stat-card"><p>Pending Orders</p><strong>${pendingOrders}</strong></article>
    <article class="stat-card"><p>Low Stock (≤ ${LOW_STOCK_THRESHOLD})</p><strong>${lowStockCount}</strong></article>
    <article class="stat-card"><p>Out Of Stock</p><strong>${outOfStockCount}</strong></article>
    <article class="stat-card"><p>Units In Stock</p><strong>${totalUnitsInStock}</strong></article>
    <article class="stat-card"><p>Inventory Value</p><strong>${currency.format(inventoryValue)}</strong></article>
    <article class="stat-card"><p>Order Value (All)</p><strong>${currency.format(totalRevenue)}</strong></article>
    <article class="stat-card"><p>Delivered Revenue</p><strong>${currency.format(deliveredRevenue)}</strong></article>
  `;
}

function renderInventoryAlerts() {
  const outOfStock = products
    .filter((item) => Number(item.stock) <= 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const lowStock = products
    .filter((item) => Number(item.stock) > 0 && Number(item.stock) <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => Number(a.stock) - Number(b.stock) || a.name.localeCompare(b.name));

  const totalAlerts = outOfStock.length + lowStock.length;
  inventoryAlertSummaryEl.textContent =
    totalAlerts === 0
      ? `No alerts. Threshold set to ${LOW_STOCK_THRESHOLD}.`
      : `${totalAlerts} alert${totalAlerts === 1 ? "" : "s"} · threshold ≤ ${LOW_STOCK_THRESHOLD}`;

  if (totalAlerts === 0) {
    inventoryAlertsEl.innerHTML =
      '<p class="empty-note">Inventory healthy. No low-stock or out-of-stock products.</p>';
    return;
  }

  const outHtml = outOfStock
    .map(
      (product) => `
      <article class="row-card alert-row alert-critical">
        <div class="row-main">
          <img class="thumb-icon" src="${product.image}" alt="${product.name}" loading="lazy" />
          <div>
            <strong>${product.name}</strong>
            <p>${product.category}</p>
          </div>
        </div>
        <strong class="alert-badge critical">Out Of Stock</strong>
      </article>
    `
    )
    .join("");

  const lowHtml = lowStock
    .map(
      (product) => `
      <article class="row-card alert-row alert-warning">
        <div class="row-main">
          <img class="thumb-icon" src="${product.image}" alt="${product.name}" loading="lazy" />
          <div>
            <strong>${product.name}</strong>
            <p>${product.category}</p>
          </div>
        </div>
        <strong class="alert-badge warning">${product.stock} left</strong>
      </article>
    `
    )
    .join("");

  inventoryAlertsEl.innerHTML = outHtml + lowHtml;
}

function resetCategoryForm() {
  categoryOldNameEl.value = "";
  categoryNameEl.value = "";
  categoryImageEl.value = "";
}

function renderCategories() {
  if (categories.length === 0) {
    categoryListEl.innerHTML = '<p class="empty-note">No categories found.</p>';
    return;
  }

  categoryListEl.innerHTML = categories
    .map((category) => {
      const count = getProductCountByCategory(category.id);
      return `
      <article class="row-card">
        <div class="row-main">
          <img class="thumb-icon" src="${category.imageUrl}" alt="${category.name}" loading="lazy" />
          <div>
            <strong>${category.name}</strong>
            <p>${count} product${count === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div class="row-actions">
          <button class="small-btn" data-action="edit-category" data-id="${category.id}">Edit</button>
          <button class="small-btn danger" data-action="delete-category" data-id="${category.id}">Delete</button>
        </div>
      </article>
    `;
    })
    .join("");

  categoryListEl.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      const category = categories.find((item) => Number(item.id) === id);
      if (!category) return;

      if (action === "edit-category") {
        categoryOldNameEl.value = String(category.id);
        categoryNameEl.value = category.name;
        categoryImageEl.value = category.imageUrl;
        categoryNameEl.focus();
      }

      if (action === "delete-category") {
        const confirmed = window.confirm(`Delete category "${category.name}"?`);
        if (!confirmed) return;

        const count = getProductCountByCategory(id);
        if (count > 0) {
          window.alert("Cannot delete category with existing products. Remove or reassign products first.");
          return;
        }

        try {
          await store.deleteCategory(id);
          await renderAll();
        } catch (error) {
          console.error(error);
          window.alert(error.message || "Failed to delete category.");
        }
      }
    });
  });
}

function renderCategoryOptions() {
  productCategoryEl.innerHTML = categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join("");
}

function resetProductForm() {
  productIdEl.value = "";
  productNameEl.value = "";
  productPriceEl.value = "";
  productStockEl.value = "";
  productImageEl.value = "";
  if (productCategoryEl.options.length > 0) {
    productCategoryEl.value = productCategoryEl.options[0].value;
  }
}

function renderProducts() {
  if (products.length === 0) {
    productListEl.innerHTML = '<p class="empty-note">No products found.</p>';
    return;
  }

  const sorted = [...products].sort((a, b) => Number(a.id) - Number(b.id));

  productListEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${sorted
          .map(
            (product) => `
          <tr class="${Number(product.stock) <= 0 ? "stock-out-row" : Number(product.stock) <= LOW_STOCK_THRESHOLD ? "stock-low-row" : ""}">
            <td>#${product.id}</td>
            <td>
              <div class="table-main">
                <img class="thumb-icon thumb-icon-sm" src="${product.image}" alt="${product.name}" loading="lazy" />
                <span>${product.name}</span>
              </div>
            </td>
            <td>${product.category}</td>
            <td>${currency.format(product.price)}</td>
            <td>
              <span class="stock-pill ${
                Number(product.stock) <= 0
                  ? "critical"
                  : Number(product.stock) <= LOW_STOCK_THRESHOLD
                    ? "warning"
                    : ""
              }">${product.stock}</span>
            </td>
            <td>
              <button class="small-btn" data-action="edit-product" data-id="${product.id}">Edit</button>
              <button class="small-btn danger" data-action="delete-product" data-id="${product.id}">Delete</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  productListEl.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const id = Number(button.dataset.id);
      const product = products.find((item) => Number(item.id) === id);
      if (!product) return;

      if (action === "edit-product") {
        productIdEl.value = String(product.id);
        productNameEl.value = product.name;
        productCategoryEl.value = String(product.categoryId);
        productPriceEl.value = String(product.price);
        productStockEl.value = String(product.stock);
        productImageEl.value = product.image;
        productNameEl.focus();
      }

      if (action === "delete-product") {
        const confirmed = window.confirm(`Delete product "${product.name}"?`);
        if (!confirmed) return;

        try {
          await store.deleteProduct(id);
          await renderAll();
        } catch (error) {
          console.error(error);
          window.alert(error.message || "Failed to delete product.");
        }
      }
    });
  });
}

function renderOrders() {
  if (orders.length === 0) {
    orderListEl.innerHTML = '<p class="empty-note">No orders yet. Orders are created when users click "Place Order".</p>';
    return;
  }

  orderListEl.innerHTML = orders
    .map((order) => {
      const date = new Date(order.createdAt).toLocaleString("en-IN");
      const items = (order.items || [])
        .map((item) => `<li>${item.name} x ${item.qty} (${currency.format(item.lineTotal)})</li>`)
        .join("");

      return `
      <article class="order-card">
        <div class="order-top">
          <div>
            <strong>${order.orderNumber || order.id}</strong>
            <p class="order-meta">${date} · ${order.itemCount} items · ${currency.format(order.total)}</p>
            <p class="order-meta">
              Payment: ${order.paymentStatus || "pending"} ${
                order.paymentId ? `· ${order.paymentId}` : ""
              }
            </p>
            <p class="order-meta">
              ${order.customerName || "N/A"} · ${order.customerPhone || "N/A"} · ${order.customerEmail || "N/A"}
            </p>
            <p class="order-meta">${order.customerAddress || "Address not provided"}</p>
          </div>
          <div class="row-actions">
            <select class="status-select" data-action="update-order" data-id="${order.id}">
              <option ${order.status === "New" ? "selected" : ""}>New</option>
              <option ${order.status === "Processing" ? "selected" : ""}>Processing</option>
              <option ${order.status === "Delivered" ? "selected" : ""}>Delivered</option>
              <option ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
            <button class="small-btn danger" data-action="delete-order" data-id="${order.id}">Delete</button>
          </div>
        </div>
        <ul class="order-items">${items}</ul>
      </article>
    `;
    })
    .join("");

  orderListEl.querySelectorAll("[data-action='update-order']").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await store.updateOrderStatus(select.dataset.id, select.value);
        await renderAll();
      } catch (error) {
        console.error(error);
        window.alert(error.message || "Failed to update order status.");
      }
    });
  });

  orderListEl.querySelectorAll("[data-action='delete-order']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const confirmed = window.confirm(`Delete order "${id}"?`);
      if (!confirmed) return;

      try {
        await store.deleteOrder(id);
        await renderAll();
      } catch (error) {
        console.error(error);
        window.alert(error.message || "Failed to delete order.");
      }
    });
  });
}

async function renderAll() {
  await refreshData();
  renderStats();
  renderCategories();
  renderCategoryOptions();
  renderProducts();
  renderInventoryAlerts();
  renderOrders();
}

function setActiveSection(target) {
  menuItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.target === target);
  });

  sectionOrdersEl.classList.toggle("hidden", target !== "orders");
  sectionCategoriesEl.classList.toggle("hidden", target !== "categories");
  sectionProductsEl.classList.toggle("hidden", target !== "products");
}

async function guardAdminAccess() {
  const session = await store.getSession();
  if (!session) {
    window.location.href = "auth.html?next=admin.html";
    return false;
  }

  const profile = await store.getProfile();
  if (!profile || profile.role !== "admin") {
    window.alert("Admin access only.");
    window.location.href = "index.html";
    return false;
  }

  adminProfile = profile;
  adminIdentityEl.textContent = `Signed in as ${profile.fullName || profile.email} (${profile.role})`;
  return true;
}

document.getElementById("resetCategoryForm").addEventListener("click", resetCategoryForm);

document.getElementById("resetProductForm").addEventListener("click", resetProductForm);

menuItems.forEach((item) => {
  item.addEventListener("click", () => {
    setActiveSection(item.dataset.target);
  });
});

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = categoryOldNameEl.value ? Number(categoryOldNameEl.value) : null;
  const payload = {
    id,
    name: categoryNameEl.value.trim(),
    imageUrl: categoryImageEl.value.trim(),
  };

  if (!payload.name || !payload.imageUrl) return;

  try {
    await store.upsertCategory(payload);
    resetCategoryForm();
    await renderAll();
  } catch (error) {
    console.error(error);
    window.alert(error.message || "Failed to save category.");
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    id: productIdEl.value ? Number(productIdEl.value) : null,
    name: productNameEl.value.trim(),
    categoryId: Number(productCategoryEl.value),
    price: Number(productPriceEl.value),
    stock: Number(productStockEl.value),
    image: productImageEl.value.trim(),
    description: "",
  };

  if (!payload.name || !payload.categoryId || !payload.image) return;

  try {
    await store.upsertProduct(payload);
    resetProductForm();
    await renderAll();
  } catch (error) {
    console.error(error);
    window.alert(error.message || "Failed to save product.");
  }
});

adminLogoutBtnEl.addEventListener("click", async () => {
  try {
    await store.signOut();
    window.location.href = "auth.html";
  } catch (error) {
    console.error(error);
    window.alert("Failed to sign out.");
  }
});

(async () => {
  try {
    const allowed = await guardAdminAccess();
    if (!allowed) return;
    await renderAll();
    setActiveSection("orders");
  } catch (error) {
    console.error(error);
    orderListEl.innerHTML = '<p class="empty-note">Failed to load admin data from database.</p>';
  }
})();
