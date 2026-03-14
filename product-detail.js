const selectedProductStorageKey = "grocery-parlour-selected-product";
const cartStorageKey = "grocery-parlour-cart";
const store = window.DBStore;
const detailEl = document.getElementById("productDetail");
const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const productGuides = {
  Banana: {
    description: "A naturally sweet fruit rich in quick energy and potassium.",
    pros: ["Supports energy levels", "Good source of potassium", "Easy to digest"],
    cons: ["Can raise sugar intake if eaten in excess", "Overripe bananas spoil quickly"],
    dailyQty: "1-2 medium bananas",
  },
  Apple: {
    description: "A crunchy fiber-rich fruit commonly eaten raw as a snack.",
    pros: ["Contains dietary fiber", "Low in calories", "Helps keep you full"],
    cons: ["Apple juice has less fiber than whole fruit", "Excess may cause bloating in sensitive people"],
    dailyQty: "1 medium apple",
  },
  Orange: {
    description: "Citrus fruit known for vitamin C and refreshing taste.",
    pros: ["High in vitamin C", "Hydrating fruit", "Supports immunity"],
    cons: ["Acidic for people with reflux", "Packaged orange juice may contain added sugar"],
    dailyQty: "1 medium orange",
  },
  Spinach: {
    description: "Leafy green vegetable rich in iron, folate, and antioxidants.",
    pros: ["Nutrient dense", "Supports eye and bone health", "Low calorie"],
    cons: ["Contains oxalates", "Needs proper washing to remove dirt"],
    dailyQty: "1 cup cooked or 2 cups raw",
  },
  Tomato: {
    description: "Versatile fruit-vegetable used in salads, curries, and sauces.",
    pros: ["Contains lycopene antioxidants", "Low calorie", "Adds natural flavor"],
    cons: ["Can trigger acidity in some people", "Overuse in sauces may add sodium if processed"],
    dailyQty: "1-2 medium tomatoes",
  },
  Onion: {
    description: "A staple aromatic vegetable used as base in many Indian dishes.",
    pros: ["Adds flavor without extra fat", "Contains antioxidants", "Supports gut health in moderation"],
    cons: ["May cause gas and bloating", "Strong raw flavor may irritate some people"],
    dailyQty: "1 small to medium onion",
  },
  "Milk 1L": {
    description: "Dairy source of protein, calcium, and vitamin B12.",
    pros: ["Supports bone health", "Provides protein", "Useful for growing children"],
    cons: ["Lactose intolerance in some people", "High-fat milk may add extra calories"],
    dailyQty: "200-300 ml",
  },
  "Cheddar Cheese": {
    description: "A dense dairy product high in protein and fat.",
    pros: ["Good calcium source", "High satiety", "Adds flavor to meals"],
    cons: ["High in saturated fat and sodium", "Easy to overeat"],
    dailyQty: "20-30 g",
  },
  "Yogurt Cups": {
    description: "Fermented dairy snack with probiotics and protein.",
    pros: ["Supports gut health", "Cooling and easy to digest", "Good protein snack"],
    cons: ["Flavored variants may have added sugar", "Not suitable for severe lactose intolerance"],
    dailyQty: "1 cup (100-150 g)",
  },
  "Basmati Rice": {
    description: "Long-grain rice commonly used as a staple carbohydrate.",
    pros: ["Quick energy source", "Easy to digest", "Pairs well with dal and sabzi"],
    cons: ["Low fiber when polished", "Large portions can spike blood sugar"],
    dailyQty: "1-1.5 cups cooked",
  },
  Oats: {
    description: "Whole grain known for soluble fiber and breakfast use.",
    pros: ["High in beta-glucan fiber", "Supports heart health", "Keeps you full longer"],
    cons: ["Instant flavored oats may add sugar", "Too much fiber suddenly may cause discomfort"],
    dailyQty: "40-60 g dry oats",
  },
  Lentils: {
    description: "Protein-rich pulses commonly used in Indian dal recipes.",
    pros: ["Plant protein source", "Rich in fiber and iron", "Budget-friendly nutrition"],
    cons: ["Can cause gas if not soaked/cooked well", "Needs balanced meal pairing for complete protein"],
    dailyQty: "1 cup cooked",
  },
};

const categoryGuides = {
  Beverages: {
    description: "Drinks for hydration or refreshment.",
    pros: ["Convenient", "Hydrating options available", "Useful for quick energy"],
    cons: ["Some products contain added sugar", "Packaged options can be high in sodium or additives"],
    dailyQty: "1 serving, prefer low-sugar options",
  },
  Snacks: {
    description: "Ready-to-eat items for in-between meals.",
    pros: ["Quick and convenient", "Useful during travel", "Variety of flavors"],
    cons: ["Often higher in salt or fat", "Easy to overconsume mindlessly"],
    dailyQty: "1 small portion (20-30 g)",
  },
  Spices: {
    description: "Flavor boosters used in small amounts while cooking.",
    pros: ["Enhance taste", "Contain beneficial plant compounds", "Reduce need for excess salt"],
    cons: ["Very high amounts may irritate digestion", "Adulteration risk if low-quality brands"],
    dailyQty: "1-2 teaspoons total across meals",
  },
  "Frozen Foods": {
    description: "Convenient preserved foods stored at low temperatures.",
    pros: ["Longer shelf life", "Reduces prep time", "Can retain nutrients if properly frozen"],
    cons: ["Some items are high in sodium", "Texture may differ from fresh foods"],
    dailyQty: "1 serving, not all meals",
  },
  "Personal Care": {
    description: "External-use hygiene and body care products.",
    pros: ["Supports cleanliness", "Improves skin and oral care routines", "Easy daily use"],
    cons: ["Fragrance or chemicals may irritate sensitive skin", "Overuse is unnecessary"],
    dailyQty: "Use as per label; external use only",
  },
  Household: {
    description: "Cleaning and home-maintenance essentials.",
    pros: ["Keeps home hygienic", "Helps prevent germ spread", "Improves daily convenience"],
    cons: ["Chemical exposure risk if misused", "Must be kept away from children"],
    dailyQty: "Use as needed; follow label instructions",
  },
  Breakfast: {
    description: "Morning meal staples for quick start to the day.",
    pros: ["Saves time", "Can provide balanced energy", "Good for regular meal routines"],
    cons: ["Some packaged items are sugary", "Portion control still required"],
    dailyQty: "1 serving as part of breakfast",
  },
  "Dry Fruits": {
    description: "Nutrient-dense nuts and dried fruits.",
    pros: ["Healthy fats and micronutrients", "Portable snack", "Good satiety"],
    cons: ["Calorie dense", "Salted/sugared variants are less healthy"],
    dailyQty: "20-30 g mixed dry fruits",
  },
  "Instant Foods": {
    description: "Fast-cook or ready-to-eat meal items.",
    pros: ["Very convenient", "Good for quick meals", "Long shelf life"],
    cons: ["May be high in sodium/preservatives", "Usually lower in fiber than homemade food"],
    dailyQty: "1 serving occasionally",
  },
  "Baby Care": {
    description: "Products specially made for infants and toddlers.",
    pros: ["Tailored for baby needs", "Convenient for caregivers", "Improves hygiene support"],
    cons: ["Use must match age guidance", "Always check ingredients and expiry"],
    dailyQty: "Use only as per pediatric guidance and product label",
  },
};

async function getProductFromStorage() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = Number(params.get("id"));
  if (requestedId) {
    const productFromDb = await store.getProductById(requestedId);
    if (productFromDb) return productFromDb;
  }

  const raw = localStorage.getItem(selectedProductStorageKey);
  if (!raw) return null;

  try {
    const product = JSON.parse(raw);
    if (!product || typeof product !== "object") return null;
    if (requestedId && product.id !== requestedId) return null;
    return product;
  } catch {
    return null;
  }
}

function renderMissing() {
  detailEl.innerHTML = `
    <p class="detail-empty">Product details are not available. Please go back and select a product again.</p>
  `;
}

function getGuideForProduct(product) {
  return (
    productGuides[product.name] ||
    categoryGuides[product.category] || {
      description: "A daily-use grocery product available in this category.",
      pros: ["Useful in regular household routines"],
      cons: ["Use in balanced quantity for best outcomes"],
      dailyQty: "Consume as per personal diet needs",
    }
  );
}

function renderList(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function renderProduct(product) {
  const guide = getGuideForProduct(product);
  const cart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
  const currentQty = cart[product.id] || 0;
  const remaining = Math.max(product.stock - currentQty, 0);

  detailEl.innerHTML = `
    <div class="detail-grid">
      <img class="detail-image" src="${product.image}" alt="${product.name}" />
      <div class="detail-info">
        <h1>${product.name}</h1>
        <p class="detail-meta">Category: ${product.category}</p>
        <span class="detail-chip">Selected Product</span>
        <div class="detail-stats">
          <p><span>Price</span><strong>${currency.format(product.price)}</strong></p>
          <p><span>Stock Available</span><strong>${product.stock}</strong></p>
          <p><span>Left To Add</span><strong id="detailRemaining">${remaining}</strong></p>
          <p><span>Product ID</span><strong>#${product.id}</strong></p>
        </div>
        <div class="detail-actions">
          <button id="detailAddToCart" class="add-btn" ${remaining <= 0 ? "disabled" : ""}>
            ${remaining <= 0 ? "Out of stock" : "Add To Cart"}
          </button>
          <a class="ghost-btn detail-link" href="index.html">Go To Cart</a>
        </div>
        <p id="detailCartMsg" class="detail-cart-msg"></p>
      </div>
    </div>
    <section class="detail-about">
      <h2>What Is This Product?</h2>
      <p>${guide.description}</p>
    </section>
    <section class="detail-guidance-grid">
      <article class="guide-card">
        <h3>Pros</h3>
        ${renderList(guide.pros)}
      </article>
      <article class="guide-card">
        <h3>Cons</h3>
        ${renderList(guide.cons)}
      </article>
      <article class="guide-card">
        <h3>Suggested Daily Quantity</h3>
        <p>${guide.dailyQty}</p>
      </article>
    </section>
    <p class="detail-note">
      Note: This is general guidance, not medical advice. For specific health conditions, consult a dietitian or doctor.
    </p>
  `;

  const imageEl = detailEl.querySelector(".detail-image");
  imageEl.addEventListener("error", () => {
    imageEl.src = "https://picsum.photos/seed/productdetailfallback/900/700";
  });

  const addBtn = detailEl.querySelector("#detailAddToCart");
  const remainingEl = detailEl.querySelector("#detailRemaining");
  const msgEl = detailEl.querySelector("#detailCartMsg");

  addBtn.addEventListener("click", () => {
    const nextCart = JSON.parse(localStorage.getItem(cartStorageKey) || "{}");
    const qty = nextCart[product.id] || 0;

    if (qty >= product.stock) {
      msgEl.textContent = "Cannot add more. Stock limit reached.";
      addBtn.disabled = true;
      addBtn.textContent = "Out of stock";
      remainingEl.textContent = "0";
      return;
    }

    nextCart[product.id] = qty + 1;
    localStorage.setItem(cartStorageKey, JSON.stringify(nextCart));

    const updatedRemaining = product.stock - nextCart[product.id];
    remainingEl.textContent = String(updatedRemaining);
    msgEl.textContent = `${product.name} added to cart.`;

    if (updatedRemaining <= 0) {
      addBtn.disabled = true;
      addBtn.textContent = "Out of stock";
    }
  });
}

async function init() {
  const selectedProduct = await getProductFromStorage();
  if (!selectedProduct) {
    renderMissing();
    return;
  }
  renderProduct(selectedProduct);
}

init();
