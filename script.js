const cartStorageKey = "grocery-parlour-cart";
const selectedProductStorageKey = "grocery-parlour-selected-product";

let activeCategory = "All";
let searchTerm = "";
let cart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
let products = [];
let categoryImages = { All: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" };
let closeCartTimer = null;
let currentSession = null;
let currentProfile = null;

const store = window.DBStore;

const categoriesEl = document.getElementById("categories");
const productsEl = document.getElementById("products");
const totalItemsEl = document.getElementById("totalItems");
const activeCategoryLabelEl = document.getElementById("activeCategoryLabel");
const cartCountEl = document.getElementById("cartCount");
const cartItemsEl = document.getElementById("cartItems");
const summaryItemsEl = document.getElementById("summaryItems");
const summaryTotalEl = document.getElementById("summaryTotal");
const cartPanelEl = document.getElementById("cartPanel");
const searchInputEl = document.getElementById("searchInput");
const placeOrderEl = document.getElementById("placeOrder");
const orderMessageEl = document.getElementById("orderMessage");
const checkoutModalEl = document.getElementById("checkoutModal");
const checkoutFormEl = document.getElementById("checkoutForm");
const checkoutNameEl = document.getElementById("checkoutName");
const checkoutPhoneEl = document.getElementById("checkoutPhone");
const checkoutEmailEl = document.getElementById("checkoutEmail");
const checkoutAddressEl = document.getElementById("checkoutAddress");
const checkoutErrorEl = document.getElementById("checkoutError");
const cancelCheckoutEl = document.getElementById("cancelCheckout");
const confirmPlaceOrderEl = document.getElementById("confirmPlaceOrder");
const toggleCategoriesEl = document.getElementById("toggleCategories");
const sidebarEl = document.querySelector(".sidebar");
const toastStackEl = document.getElementById("toastStack");
const authLinkEl = document.getElementById("authLink");
const logoutBtnEl = document.getElementById("logoutBtn");
const adminLinkEl = document.getElementById("adminLink");

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function getCategoryMap() {
  const map = {};
  for (const item of products) {
    map[item.category] = (map[item.category] || 0) + 1;
  }
  return map;
}

function persistCart() {
  localStorage.setItem(cartStorageKey, JSON.stringify(cart));
}

function getProductById(id) {
  return products.find((item) => Number(item.id) === Number(id));
}

function cartQuantityForProduct(productId) {
  return cart[productId] || 0;
}

function totalCartItemCount() {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

function totalCartAmount() {
  return Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = getProductById(Number(productId));
    return product ? sum + product.price * qty : sum;
  }, 0);
}

function openProductDetail(productId) {
  const product = getProductById(productId);
  if (!product) return;
  localStorage.setItem(selectedProductStorageKey, JSON.stringify(product));
  window.location.href = `product-detail.html?id=${product.id}`;
}

function bindProductActionHandlers(root) {
  root.querySelectorAll(".add-btn[data-product-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const productId = Number(button.dataset.productId);
      changeQty(productId, 1);
    });
  });

  root.querySelectorAll(".product-qty-controls button[data-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const productId = Number(button.dataset.productId);
      const action = button.dataset.action;
      changeQty(productId, action === "increase" ? 1 : -1);
    });
  });
}

function refreshProductCardState(productId) {
  const product = getProductById(productId);
  if (!product) return;
  const card = productsEl.querySelector(`.product-clickable[data-product-id="${productId}"]`);
  if (!card) return;

  const remaining = product.stock - cartQuantityForProduct(productId);
  const qty = cartQuantityForProduct(productId);
  const badgeEl = card.querySelector(".badge");
  const actionEl = card.querySelector(".product-action");
  if (!badgeEl || !actionEl) return;

  badgeEl.textContent = `${remaining} left`;
  if (qty <= 0) {
    actionEl.innerHTML = `<button class="add-btn" data-product-id="${productId}" ${remaining <= 0 ? "disabled" : ""}>${
      remaining <= 0 ? "Out of stock" : "Add to cart"
    }</button>`;
  } else {
    actionEl.innerHTML = `
      <div class="qty-controls product-qty-controls">
        <button data-action="decrease" data-product-id="${productId}" ${qty <= 0 ? "disabled" : ""}>-</button>
        <span class="product-qty-count">${qty}</span>
        <button data-action="increase" data-product-id="${productId}" ${remaining <= 0 ? "disabled" : ""}>+</button>
      </div>
    `;
  }

  bindProductActionHandlers(card);
}

function validateCustomerDetails(details) {
  if (!details.name) return "Please enter your name.";
  if (!details.phone) return "Please enter your phone number.";
  if (!/^[0-9]{10}$/.test(details.phone.replace(/\s+/g, ""))) {
    return "Phone number should be 10 digits.";
  }
  if (!details.email) return "Please enter your email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
    return "Please enter a valid email address.";
  }
  return "";
}

function getCheckoutDetails() {
  return {
    name: checkoutNameEl.value.trim(),
    phone: checkoutPhoneEl.value.trim(),
    email: checkoutEmailEl.value.trim(),
    address: checkoutAddressEl.value.trim(),
  };
}

function openCheckoutModal() {
  checkoutErrorEl.textContent = "";
  checkoutModalEl.classList.remove("hidden");
  checkoutModalEl.setAttribute("aria-hidden", "false");
  checkoutNameEl.focus();
}

function closeCheckoutModal() {
  checkoutModalEl.classList.add("hidden");
  checkoutModalEl.setAttribute("aria-hidden", "true");
}

async function refreshAuthControls() {
  try {
    const session = await store.getSession();
    currentSession = session;
    if (!session) {
      currentProfile = null;
      authLinkEl.textContent = "Sign In";
      authLinkEl.href = "auth.html?next=index.html";
      logoutBtnEl.hidden = true;
      adminLinkEl.hidden = true;
      return;
    }

    const profile = await store.getProfile();
    currentProfile = profile;
    const label = profile?.fullName || session.user?.email || "Account";
    authLinkEl.textContent = label;
    authLinkEl.href = "account.html";
    logoutBtnEl.hidden = false;
    adminLinkEl.hidden = !(profile?.role === "admin");
  } catch (error) {
    console.error(error);
    currentSession = null;
    currentProfile = null;
    authLinkEl.textContent = "Sign In";
    authLinkEl.href = "auth.html?next=index.html";
    logoutBtnEl.hidden = true;
    adminLinkEl.hidden = true;
  }
}

function showToast(message, type = "success") {
  if (!toastStackEl || !message) return;
  const toastEl = document.createElement("div");
  toastEl.className = `toast${type === "error" ? " error" : ""}`;
  toastEl.textContent = message;
  toastStackEl.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.add("hide");
    setTimeout(() => {
      toastEl.remove();
    }, 220);
  }, 2600);
}

async function saveOrderFromCart(customerDetails) {
  const items = getCartItemsPayload();
  if (items.length === 0) return null;

  return store.createOrder({
    customerName: customerDetails.name,
    customerPhone: customerDetails.phone,
    customerEmail: customerDetails.email,
    customerAddress: customerDetails.address,
    itemCount: totalCartItemCount(),
    total: totalCartAmount(),
    items,
    paymentProvider: customerDetails.paymentProvider || null,
    paymentStatus: customerDetails.paymentStatus || null,
    paymentOrderId: customerDetails.paymentOrderId || null,
    paymentId: customerDetails.paymentId || null,
  });
}

function getCartItemsPayload() {
  const entries = Object.entries(cart);
  if (entries.length === 0) return [];

  return entries
    .map(([productId, qty]) => {
      const product = getProductById(Number(productId));
      if (!product) return null;
      return {
        productId: Number(productId),
        name: product.name,
        qty,
        price: product.price,
        lineTotal: product.price * qty,
      };
    })
    .filter(Boolean);
}

function getAutoCustomerDetails() {
  const email = currentSession?.user?.email || "";
  const name = (currentProfile?.fullName || "").trim() || (email ? email.split("@")[0] : "Customer");
  return {
    name,
    phone: (currentProfile?.phone || "").trim(),
    email,
    address: "",
  };
}

function getPaymentApiBaseUrl() {
  return window.PAYMENT_CONFIG?.apiBaseUrl || "http://127.0.0.1:8787";
}

function openRazorpayCheckout(paymentOrder, customerDetails) {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error("Razorpay checkout script not loaded."));
      return;
    }

    const options = {
      key: paymentOrder.keyId,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency || "INR",
      name: window.PAYMENT_CONFIG?.companyName || "Grocery Parlour",
      description: window.PAYMENT_CONFIG?.description || "Order payment",
      order_id: paymentOrder.orderId,
      prefill: {
        name: customerDetails.name || "",
        email: customerDetails.email || "",
        contact: customerDetails.phone || "",
      },
      theme: { color: "#2e7d32" },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
      handler: (response) => resolve(response),
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", (event) => {
      const message =
        event?.error?.description || event?.error?.reason || "Payment failed. Please try again.";
      reject(new Error(message));
    });
    razorpay.open();
  });
}

async function processPaymentAndPlaceOrder(customerDetails) {
  const session = await store.getSession();
  if (!session?.access_token) {
    throw new Error("Please sign in before placing an order.");
  }

  const items = getCartItemsPayload();
  if (items.length === 0) throw new Error("Cart is empty.");

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };

  const createOrderResponse = await fetch(`${getPaymentApiBaseUrl()}/api/payments/create-order`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, qty: item.qty })) }),
  });
  const createOrderData = await createOrderResponse.json();
  if (!createOrderResponse.ok) {
    throw new Error(createOrderData?.message || "Failed to start payment.");
  }

  const paymentResult = await openRazorpayCheckout(createOrderData, customerDetails);

  const verifyResponse = await fetch(`${getPaymentApiBaseUrl()}/api/payments/verify-and-place-order`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      razorpayOrderId: paymentResult.razorpay_order_id,
      razorpayPaymentId: paymentResult.razorpay_payment_id,
      razorpaySignature: paymentResult.razorpay_signature,
      items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
      customerDetails,
    }),
  });
  const verifyData = await verifyResponse.json();
  if (!verifyResponse.ok || !verifyData?.verified || !verifyData?.order) {
    throw new Error(verifyData?.message || "Payment verification failed.");
  }

  return verifyData.order;
}

async function submitOrder(customerDetails) {
  confirmPlaceOrderEl.disabled = true;
  placeOrderEl.disabled = true;
  checkoutErrorEl.textContent = "";
  orderMessageEl.textContent = "Placing your order...";

  try {
    const order = customerDetails.usePayment
      ? await processPaymentAndPlaceOrder(customerDetails)
      : await saveOrderFromCart(customerDetails);
    cart = {};
    persistCart();
    const catalog = await store.getCatalog();
    products = catalog.products;
    categoryImages = catalog.categoryImages;
    render();
    closeCheckoutModal();
    checkoutFormEl.reset();
    orderMessageEl.textContent = `Order placed successfully (${order.orderNumber || order.id}).`;
    showToast("Order placed successfully");
    if (closeCartTimer) {
      clearTimeout(closeCartTimer);
    }
    closeCartTimer = setTimeout(() => {
      cartPanelEl.classList.remove("open");
    }, 3000);
  } catch (error) {
    console.error(error);
    const message = error?.message || "Failed to place order. Please try again.";
    checkoutErrorEl.textContent = message;
    orderMessageEl.textContent = message;
    showToast(message, "error");
  } finally {
    confirmPlaceOrderEl.disabled = false;
    placeOrderEl.disabled = false;
  }
}

function renderCategories() {
  const categoryMap = getCategoryMap();
  const totalProducts = products.length;
  totalItemsEl.textContent = `${totalProducts} products available`;

  const categoryEntries = [["All", totalProducts], ...Object.entries(categoryMap)];

  categoriesEl.innerHTML = categoryEntries
    .map(([category, count]) => {
      const isActive = category === activeCategory;
      return `
      <button class="category-item ${isActive ? "active" : ""}" data-category="${category}" type="button">
        <span>${category}</span>
        <strong>${count}</strong>
      </button>
    `;
    })
    .join("");

  categoriesEl.querySelectorAll(".category-item").forEach((item) => {
    item.addEventListener("click", () => {
      activeCategory = item.dataset.category;
      render();
    });
  });
}

function renderProducts() {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered =
    activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory);

  const searchFiltered = filtered.filter((product) => {
    if (!normalizedSearch) return true;
    const haystack = `${product.name} ${product.category}`.toLowerCase();
    return haystack.includes(normalizedSearch);
  });

  activeCategoryLabelEl.textContent =
    activeCategory === "All" ? "All categories" : activeCategory;

  if (normalizedSearch) {
    activeCategoryLabelEl.textContent += ` · ${searchFiltered.length} match${
      searchFiltered.length === 1 ? "" : "es"
    }`;
  }

  if (searchFiltered.length === 0) {
    productsEl.innerHTML =
      '<article class="product-card"><p class="empty">No products match your search.</p></article>';
    return;
  }

  productsEl.innerHTML = searchFiltered
    .map((product) => {
      const inCartQty = cartQuantityForProduct(product.id);
      const remaining = product.stock - inCartQty;
      const fallbackImage = categoryImages[product.category] || categoryImages.All;
      return `
      <article class="product-card product-clickable" data-product-id="${product.id}" role="button" tabindex="0" aria-label="Open details for ${product.name}">
        <img class="product-thumb" src="${product.image}" data-fallback="${fallbackImage}" alt="${product.name}" loading="lazy" />
        <div class="product-top">
          <div>
            <h3>${product.name}</h3>
            <p>${product.category}</p>
          </div>
          <span class="badge">${remaining} left</span>
        </div>
        <div class="product-bottom">
          <strong>${currency.format(product.price)}</strong>
          <div class="product-action">
            ${
              inCartQty <= 0
                ? `<button class="add-btn" data-product-id="${product.id}" ${remaining <= 0 ? "disabled" : ""}>${
                    remaining <= 0 ? "Out of stock" : "Add to cart"
                  }</button>`
                : `<div class="qty-controls product-qty-controls">
                    <button data-action="decrease" data-product-id="${product.id}" ${inCartQty <= 0 ? "disabled" : ""}>-</button>
                    <span class="product-qty-count">${inCartQty}</span>
                    <button data-action="increase" data-product-id="${product.id}" ${remaining <= 0 ? "disabled" : ""}>+</button>
                  </div>`
            }
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  bindProductActionHandlers(productsEl);

  productsEl.querySelectorAll(".product-clickable").forEach((card) => {
    card.addEventListener("click", () => {
      openProductDetail(Number(card.dataset.productId));
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openProductDetail(Number(card.dataset.productId));
    });
  });

  productsEl.querySelectorAll(".product-thumb").forEach((imageEl) => {
    imageEl.addEventListener("error", () => {
      const fallbackImage = imageEl.dataset.fallback || categoryImages.All;
      if (imageEl.src !== fallbackImage) imageEl.src = fallbackImage;
    });
  });
}

function changeQty(productId, delta) {
  const product = getProductById(productId);
  if (!product) return;

  const currentQty = cart[productId] || 0;
  const next = currentQty + delta;
  let didIncrease = false;
  if (next <= 0) {
    delete cart[productId];
  } else if (next <= product.stock) {
    cart[productId] = next;
    didIncrease = next > currentQty;
  }

  persistCart();
  renderCart();
  refreshProductCardState(productId);
  if (didIncrease) {
    showToast("Added to cart");
  }
}

function renderCart() {
  const validEntries = Object.entries(cart).filter(([productId, qty]) => {
    const product = getProductById(Number(productId));
    return product && Number(qty) > 0;
  });

  if (validEntries.length !== Object.keys(cart).length) {
    const cleaned = {};
    for (const [productId, qty] of validEntries) {
      cleaned[productId] = qty;
    }
    cart = cleaned;
    persistCart();
  }

  cartCountEl.textContent = String(totalCartItemCount());
  summaryItemsEl.textContent = String(totalCartItemCount());
  summaryTotalEl.textContent = currency.format(totalCartAmount());
  placeOrderEl.disabled = validEntries.length === 0;

  if (validEntries.length === 0) {
    cartItemsEl.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }

  cartItemsEl.innerHTML = validEntries
    .map(([productId, qty]) => {
      const product = getProductById(Number(productId));
      if (!product) return "";
      return `
      <article class="cart-row">
        <strong>${product.name}</strong>
        <p>${currency.format(product.price)} each</p>
        <div class="product-bottom">
          <div class="qty-controls">
            <button data-action="decrease" data-product-id="${product.id}">-</button>
            <span>${qty}</span>
            <button data-action="increase" data-product-id="${product.id}">+</button>
          </div>
          <strong>${currency.format(product.price * qty)}</strong>
        </div>
      </article>
    `;
    })
    .join("");

  cartItemsEl.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const productId = Number(button.dataset.productId);
      const action = button.dataset.action;
      changeQty(productId, action === "increase" ? 1 : -1);
    });
  });
}

function render() {
  renderCategories();
  renderProducts();
  renderCart();
}

async function initCatalog() {
  try {
    const catalog = await store.getCatalog();
    products = catalog.products;
    categoryImages = catalog.categoryImages;
    render();
  } catch (error) {
    console.error(error);
    productsEl.innerHTML = '<article class="product-card"><p class="empty">Failed to load products from database.</p></article>';
  }
}

document.getElementById("cartToggle").addEventListener("click", () => {
  cartPanelEl.classList.add("open");
});

document.getElementById("closeCart").addEventListener("click", () => {
  cartPanelEl.classList.remove("open");
});

document.getElementById("clearCart").addEventListener("click", () => {
  cart = {};
  persistCart();
  orderMessageEl.textContent = "";
  render();
});

placeOrderEl.addEventListener("click", async () => {
  if (Object.keys(cart).length === 0) return;
  const session = await store.getSession();
  if (!session) {
    showToast("Please sign in before placing an order.", "error");
    setTimeout(() => {
      window.location.href = "auth.html?next=index.html";
    }, 600);
    return;
  }
  currentSession = session;
  if (!currentProfile) {
    try {
      currentProfile = await store.getProfile();
    } catch (error) {
      console.error(error);
    }
  }
  const details = getAutoCustomerDetails();
  details.usePayment = true;
  await submitOrder(details);
});

cancelCheckoutEl.addEventListener("click", () => {
  closeCheckoutModal();
});

checkoutModalEl.addEventListener("click", (event) => {
  if (event.target === checkoutModalEl) {
    closeCheckoutModal();
  }
});

checkoutFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const details = getCheckoutDetails();
  const validationError = validateCustomerDetails(details);
  if (validationError) {
    checkoutErrorEl.textContent = validationError;
    return;
  }
  await submitOrder(details);
});

searchInputEl.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  orderMessageEl.textContent = "";
  renderProducts();
});

if (toggleCategoriesEl && sidebarEl) {
  toggleCategoriesEl.addEventListener("click", () => {
    const nextCollapsed = !sidebarEl.classList.contains("collapsed");
    sidebarEl.classList.toggle("collapsed", nextCollapsed);
    toggleCategoriesEl.textContent = nextCollapsed ? "Expand" : "Collapse";
    toggleCategoriesEl.setAttribute("aria-expanded", String(!nextCollapsed));
  });
}

logoutBtnEl.addEventListener("click", async () => {
  try {
    await store.signOut();
    showToast("Signed out successfully");
    await refreshAuthControls();
  } catch (error) {
    console.error(error);
    showToast("Failed to sign out", "error");
  }
});

initCatalog();
refreshAuthControls();
