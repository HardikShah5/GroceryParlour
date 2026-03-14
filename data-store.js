(() => {
  const catalogStorageKey = "grocery-parlour-catalog-v1";
  const ordersStorageKey = "grocery-parlour-orders-v1";

const defaultProducts = [
  {
    id: 1,
    name: "Banana",
    category: "Fruits",
    price: 12,
    stock: 40,
    image:
      "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Apple",
    category: "Fruits",
    price: 16,
    stock: 32,
    image:
      "https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Orange",
    category: "Fruits",
    price: 14,
    stock: 28,
    image:
      "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Spinach",
    category: "Vegetables",
    price: 21,
    stock: 18,
    image:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Tomato",
    category: "Vegetables",
    price: 11,
    stock: 35,
    image:
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Onion",
    category: "Vegetables",
    price: 9,
    stock: 50,
    image:
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    name: "Whole Wheat Bread",
    category: "Bakery",
    price: 35,
    stock: 16,
    image:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    name: "Croissant",
    category: "Bakery",
    price: 24,
    stock: 20,
    image:
      "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 9,
    name: "Milk 1L",
    category: "Dairy",
    price: 23,
    stock: 25,
    image:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 10,
    name: "Cheddar Cheese",
    category: "Dairy",
    price: 48,
    stock: 14,
    image:
      "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 11,
    name: "Yogurt Cups",
    category: "Dairy",
    price: 31,
    stock: 22,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 12,
    name: "Basmati Rice",
    category: "Grains",
    price: 89,
    stock: 12,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 13,
    name: "Oats",
    category: "Grains",
    price: 42,
    stock: 19,
    image:
      "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 14,
    name: "Lentils",
    category: "Grains",
    price: 51,
    stock: 17,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 15,
    name: "Mango Juice",
    category: "Beverages",
    price: 35,
    stock: 26,
    image: "https://picsum.photos/seed/beverage1/800/600",
  },
  {
    id: 16,
    name: "Masala Chaas",
    category: "Beverages",
    price: 28,
    stock: 30,
    image: "https://picsum.photos/seed/beverage2/800/600",
  },
  {
    id: 17,
    name: "Coconut Water",
    category: "Beverages",
    price: 45,
    stock: 22,
    image: "https://picsum.photos/seed/beverage3/800/600",
  },
  {
    id: 18,
    name: "Lemon Soda",
    category: "Beverages",
    price: 30,
    stock: 20,
    image: "https://picsum.photos/seed/beverage4/800/600",
  },
  {
    id: 19,
    name: "Filter Coffee Decoction",
    category: "Beverages",
    price: 65,
    stock: 18,
    image: "https://picsum.photos/seed/beverage5/800/600",
  },
  {
    id: 20,
    name: "Potato Chips",
    category: "Snacks",
    price: 25,
    stock: 45,
    image: "https://picsum.photos/seed/snack1/800/600",
  },
  {
    id: 21,
    name: "Masala Peanuts",
    category: "Snacks",
    price: 40,
    stock: 34,
    image: "https://picsum.photos/seed/snack2/800/600",
  },
  {
    id: 22,
    name: "Khakhra Pack",
    category: "Snacks",
    price: 55,
    stock: 28,
    image: "https://picsum.photos/seed/snack3/800/600",
  },
  {
    id: 23,
    name: "Nachos",
    category: "Snacks",
    price: 60,
    stock: 24,
    image: "https://picsum.photos/seed/snack4/800/600",
  },
  {
    id: 24,
    name: "Roasted Makhana",
    category: "Snacks",
    price: 95,
    stock: 19,
    image: "https://picsum.photos/seed/snack5/800/600",
  },
  {
    id: 25,
    name: "Turmeric Powder",
    category: "Spices",
    price: 42,
    stock: 33,
    image: "https://picsum.photos/seed/spice1/800/600",
  },
  {
    id: 26,
    name: "Red Chilli Powder",
    category: "Spices",
    price: 58,
    stock: 27,
    image: "https://picsum.photos/seed/spice2/800/600",
  },
  {
    id: 27,
    name: "Coriander Powder",
    category: "Spices",
    price: 50,
    stock: 29,
    image: "https://picsum.photos/seed/spice3/800/600",
  },
  {
    id: 28,
    name: "Garam Masala",
    category: "Spices",
    price: 75,
    stock: 22,
    image: "https://picsum.photos/seed/spice4/800/600",
  },
  {
    id: 29,
    name: "Cumin Seeds",
    category: "Spices",
    price: 68,
    stock: 25,
    image: "https://picsum.photos/seed/spice5/800/600",
  },
  {
    id: 30,
    name: "Frozen Green Peas",
    category: "Frozen Foods",
    price: 85,
    stock: 17,
    image: "https://picsum.photos/seed/frozen1/800/600",
  },
  {
    id: 31,
    name: "French Fries",
    category: "Frozen Foods",
    price: 120,
    stock: 15,
    image: "https://picsum.photos/seed/frozen2/800/600",
  },
  {
    id: 32,
    name: "Paneer Cubes",
    category: "Frozen Foods",
    price: 135,
    stock: 14,
    image: "https://picsum.photos/seed/frozen3/800/600",
  },
  {
    id: 33,
    name: "Frozen Sweet Corn",
    category: "Frozen Foods",
    price: 98,
    stock: 16,
    image: "https://picsum.photos/seed/frozen4/800/600",
  },
  {
    id: 34,
    name: "Veg Momos",
    category: "Frozen Foods",
    price: 110,
    stock: 13,
    image: "https://picsum.photos/seed/frozen5/800/600",
  },
  {
    id: 35,
    name: "Shampoo",
    category: "Personal Care",
    price: 180,
    stock: 20,
    image: "https://picsum.photos/seed/personal1/800/600",
  },
  {
    id: 36,
    name: "Bath Soap",
    category: "Personal Care",
    price: 40,
    stock: 48,
    image: "https://picsum.photos/seed/personal2/800/600",
  },
  {
    id: 37,
    name: "Toothpaste",
    category: "Personal Care",
    price: 95,
    stock: 30,
    image: "https://picsum.photos/seed/personal3/800/600",
  },
  {
    id: 38,
    name: "Body Lotion",
    category: "Personal Care",
    price: 210,
    stock: 14,
    image: "https://picsum.photos/seed/personal4/800/600",
  },
  {
    id: 39,
    name: "Hand Wash",
    category: "Personal Care",
    price: 110,
    stock: 26,
    image: "https://picsum.photos/seed/personal5/800/600",
  },
  {
    id: 40,
    name: "Dishwash Liquid",
    category: "Household",
    price: 130,
    stock: 21,
    image: "https://picsum.photos/seed/house1/800/600",
  },
  {
    id: 41,
    name: "Floor Cleaner",
    category: "Household",
    price: 160,
    stock: 18,
    image: "https://picsum.photos/seed/house2/800/600",
  },
  {
    id: 42,
    name: "Laundry Detergent",
    category: "Household",
    price: 220,
    stock: 16,
    image: "https://picsum.photos/seed/house3/800/600",
  },
  {
    id: 43,
    name: "Garbage Bags",
    category: "Household",
    price: 90,
    stock: 27,
    image: "https://picsum.photos/seed/house4/800/600",
  },
  {
    id: 44,
    name: "Scrub Pads",
    category: "Household",
    price: 35,
    stock: 35,
    image: "https://picsum.photos/seed/house5/800/600",
  },
  {
    id: 45,
    name: "Corn Flakes",
    category: "Breakfast",
    price: 145,
    stock: 19,
    image: "https://picsum.photos/seed/breakfast1/800/600",
  },
  {
    id: 46,
    name: "Muesli",
    category: "Breakfast",
    price: 210,
    stock: 15,
    image: "https://picsum.photos/seed/breakfast2/800/600",
  },
  {
    id: 47,
    name: "Peanut Butter",
    category: "Breakfast",
    price: 185,
    stock: 17,
    image: "https://picsum.photos/seed/breakfast3/800/600",
  },
  {
    id: 48,
    name: "Jam Spread",
    category: "Breakfast",
    price: 120,
    stock: 22,
    image: "https://picsum.photos/seed/breakfast4/800/600",
  },
  {
    id: 49,
    name: "Poha Mix",
    category: "Breakfast",
    price: 70,
    stock: 24,
    image: "https://picsum.photos/seed/breakfast5/800/600",
  },
  {
    id: 50,
    name: "Almonds",
    category: "Dry Fruits",
    price: 320,
    stock: 14,
    image: "https://picsum.photos/seed/dryfruit1/800/600",
  },
  {
    id: 51,
    name: "Cashews",
    category: "Dry Fruits",
    price: 360,
    stock: 12,
    image: "https://picsum.photos/seed/dryfruit2/800/600",
  },
  {
    id: 52,
    name: "Raisins",
    category: "Dry Fruits",
    price: 140,
    stock: 21,
    image: "https://picsum.photos/seed/dryfruit3/800/600",
  },
  {
    id: 53,
    name: "Pistachios",
    category: "Dry Fruits",
    price: 420,
    stock: 10,
    image: "https://picsum.photos/seed/dryfruit4/800/600",
  },
  {
    id: 54,
    name: "Dates",
    category: "Dry Fruits",
    price: 180,
    stock: 16,
    image: "https://picsum.photos/seed/dryfruit5/800/600",
  },
  {
    id: 55,
    name: "Instant Noodles",
    category: "Instant Foods",
    price: 25,
    stock: 40,
    image: "https://picsum.photos/seed/instant1/800/600",
  },
  {
    id: 56,
    name: "Ready Pasta",
    category: "Instant Foods",
    price: 55,
    stock: 30,
    image: "https://picsum.photos/seed/instant2/800/600",
  },
  {
    id: 57,
    name: "Instant Upma Mix",
    category: "Instant Foods",
    price: 65,
    stock: 26,
    image: "https://picsum.photos/seed/instant3/800/600",
  },
  {
    id: 58,
    name: "Cup Soup",
    category: "Instant Foods",
    price: 45,
    stock: 28,
    image: "https://picsum.photos/seed/instant4/800/600",
  },
  {
    id: 59,
    name: "Ready-to-Eat Dal",
    category: "Instant Foods",
    price: 95,
    stock: 20,
    image: "https://picsum.photos/seed/instant5/800/600",
  },
  {
    id: 60,
    name: "Baby Diapers",
    category: "Baby Care",
    price: 399,
    stock: 15,
    image: "https://picsum.photos/seed/baby1/800/600",
  },
  {
    id: 61,
    name: "Baby Wipes",
    category: "Baby Care",
    price: 149,
    stock: 25,
    image: "https://picsum.photos/seed/baby2/800/600",
  },
  {
    id: 62,
    name: "Baby Lotion",
    category: "Baby Care",
    price: 199,
    stock: 18,
    image: "https://picsum.photos/seed/baby3/800/600",
  },
  {
    id: 63,
    name: "Baby Shampoo",
    category: "Baby Care",
    price: 185,
    stock: 16,
    image: "https://picsum.photos/seed/baby4/800/600",
  },
  {
    id: 64,
    name: "Cerelac Cereal",
    category: "Baby Care",
    price: 280,
    stock: 12,
    image: "https://picsum.photos/seed/baby5/800/600",
  },
];

const defaultCategoryImages = {
  All: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  Fruits:
    "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80",
  Vegetables:
    "https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80",
  Bakery:
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  Dairy:
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80",
  Grains:
    "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80",
  Beverages: "https://picsum.photos/seed/catbeverages/800/600",
  Snacks: "https://picsum.photos/seed/catsnacks/800/600",
  Spices: "https://picsum.photos/seed/catspices/800/600",
  "Frozen Foods": "https://picsum.photos/seed/catfrozen/800/600",
  "Personal Care": "https://picsum.photos/seed/catpersonal/800/600",
  Household: "https://picsum.photos/seed/cathousehold/800/600",
  Breakfast: "https://picsum.photos/seed/catbreakfast/800/600",
  "Dry Fruits": "https://picsum.photos/seed/catdryfruits/800/600",
  "Instant Foods": "https://picsum.photos/seed/catinstant/800/600",
  "Baby Care": "https://picsum.photos/seed/catbaby/800/600",
};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getCatalog() {
    const raw = localStorage.getItem(catalogStorageKey);
    if (!raw) {
      return {
        products: clone(defaultProducts),
        categoryImages: clone(defaultCategoryImages),
      };
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.products) || !parsed.categoryImages) {
        throw new Error('Invalid catalog payload');
      }

      return {
        products: clone(parsed.products),
        categoryImages: { ...clone(defaultCategoryImages), ...clone(parsed.categoryImages) },
      };
    } catch {
      return {
        products: clone(defaultProducts),
        categoryImages: clone(defaultCategoryImages),
      };
    }
  }

  function saveCatalog(catalog) {
    const payload = {
      products: clone(catalog.products || []),
      categoryImages: clone(catalog.categoryImages || {}),
    };
    localStorage.setItem(catalogStorageKey, JSON.stringify(payload));
    return payload;
  }

  function getOrders() {
    const raw = localStorage.getItem(ordersStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? clone(parsed) : [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    const safe = Array.isArray(orders) ? clone(orders) : [];
    localStorage.setItem(ordersStorageKey, JSON.stringify(safe));
    return safe;
  }

  function addOrder(order) {
    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);
    return order;
  }

  function getNextProductId(products) {
    if (!Array.isArray(products) || products.length === 0) return 1;
    return Math.max(...products.map((p) => Number(p.id) || 0)) + 1;
  }

  window.GroceryStore = {
    catalogStorageKey,
    ordersStorageKey,
    defaultProducts: clone(defaultProducts),
    defaultCategoryImages: clone(defaultCategoryImages),
    getCatalog,
    saveCatalog,
    getOrders,
    saveOrders,
    addOrder,
    getNextProductId,
  };
})();
