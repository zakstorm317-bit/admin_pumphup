// PumpHub.tn — interactions de démonstration côté navigateur.
// Les données sont temporaires : elles ne sont pas encore reliées à Supabase.
const DEFAULT_PRODUCTS = [
  { id: 1, name: "Training Oversized T-Shirt", category: "Homme", price: 89.9, tag: "Nouveau", color: "Noir", sizes: ["S", "M", "L", "XL"], image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85", description: "T-shirt ample pour l’entraînement et le quotidien. Vérifie la disponibilité réelle avant la mise en ligne." },
  { id: 2, name: "Essential Training Tank", category: "Homme", price: 74.9, tag: "Populaire", color: "Gris", sizes: ["S", "M", "L", "XL"], image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=900&q=85", description: "Débardeur léger au style sportif et minimal." },
  { id: 3, name: "Training Shorts", category: "Homme", price: 99.9, tag: "Nouveau", color: "Noir", sizes: ["S", "M", "L", "XL"], image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=85", description: "Short de sport pour les séances en salle et les journées actives." },
  { id: 4, name: "Performance Leggings", category: "Femme", price: 119.9, tag: "Sélection", color: "Noir", sizes: ["XS", "S", "M", "L"], image: "https://images.unsplash.com/photo-1506629905607-d9b1d3c5f0f5?auto=format&fit=crop&w=900&q=85", description: "Legging de sport au design sobre. Les tailles affichées sont des exemples." },
  { id: 5, name: "Women's Training Top", category: "Femme", price: 84.9, tag: "", color: "Beige", sizes: ["XS", "S", "M", "L"], image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=900&q=85", description: "Haut de sport à associer à tes essentiels d’entraînement." },
  { id: 6, name: "Classic Hoodie", category: "Homme", price: 149.9, tag: "", color: "Gris", sizes: ["S", "M", "L", "XL"], image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85", description: "Sweat à capuche confortable pour l’échauffement et la récupération." },
  { id: 7, name: "Gym Training Bag", category: "Accessoires", price: 109.9, tag: "Essentiel", color: "Noir", sizes: ["Unique"], image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", description: "Sac pratique pour transporter tes affaires de sport." },
  { id: 8, name: "Sports Water Bottle", category: "Accessoires", price: 29.9, tag: "", color: "Vert", sizes: ["Unique"], image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=85", description: "Gourde pour garder de l’eau à portée de main pendant l’entraînement." }
];

const PRODUCT_STORAGE_KEY = "pumphub_products_v1";
function loadStorefrontProducts() {
  try {
    const raw = localStorage.getItem(PRODUCT_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved)) return saved.map(p => ({...p, stock: Number(p.stock) || 0, sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ["Unique"]}));
    }
  } catch (error) { console.warn("Lecture du catalogue local impossible.", error); }
  const initial = DEFAULT_PRODUCTS.map(p => ({...p, stock: 10}));
  try { localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(initial)); } catch (error) { console.warn(error); }
  return initial;
}
let products = loadStorefrontProducts();
window.addEventListener("storage", event => { if (event.key === PRODUCT_STORAGE_KEY) { products = loadStorefrontProducts(); renderProducts(); } });

const state = {
  category: "Tous",
  search: "",
  sort: "featured",
  favoritesOnly: false,
  favorites: new Set(),
  cart: [],
  selectedProduct: null,
  selectedSize: null
};

const $ = (selector) => document.querySelector(selector);
const productGrid = $("#productGrid");
const emptyState = $("#emptyState");
const resultsLabel = $("#resultsLabel");
const cartDrawer = $("#cartDrawer");
const overlay = $("#overlay");
const toast = $("#toast");
let toastTimer;

function formatPrice(price) {
  return new Intl.NumberFormat("fr-TN", { style: "currency", currency: "TND", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(price);
}

function getVisibleProducts() {
  let list = products.filter((product) => {
    const matchesCategory = state.category === "Tous" || product.category === state.category;
    const query = state.search.trim().toLocaleLowerCase("fr");
    const matchesSearch = !query || `${product.name} ${product.category} ${product.color}`.toLocaleLowerCase("fr").includes(query);
    const matchesFavorite = !state.favoritesOnly || state.favorites.has(product.id);
    return matchesCategory && matchesSearch && matchesFavorite;
  });
  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  return list;
}

function renderProducts() {
  const list = getVisibleProducts();
  productGrid.innerHTML = list.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap" data-open-product="${product.id}" tabindex="0" role="button" aria-label="Voir ${escapeHtml(product.name)}">
        <img class="product-image" src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">
        ${product.tag ? `<span class="product-tag">${escapeHtml(product.tag)}</span>` : ""}
        <button class="favorite-toggle ${state.favorites.has(product.id) ? "is-favorite" : ""}" data-favorite="${product.id}" aria-label="${state.favorites.has(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}" aria-pressed="${state.favorites.has(product.id)}">${state.favorites.has(product.id) ? "♥" : "♡"}</button>
        <button class="quick-add" data-quick-add="${product.id}">VOIR LES OPTIONS +</button>
      </div>
      <div class="product-info">
        <div class="product-title-line"><span class="product-title">${escapeHtml(product.name)}</span><span class="product-price">${formatPrice(product.price)}</span></div>
        <p class="product-meta">${escapeHtml(product.category)} · ${escapeHtml(product.color)} · ${Number(product.stock)>0 ? "En stock" : "Épuisé"}</p>
        <div class="swatches" aria-label="Couleurs proposées"><span class="swatch" style="background:${product.color === "Vert" ? "#496a4c" : product.color === "Beige" ? "#d8c7a7" : product.color === "Gris" ? "#8b8b8b" : "#171717"}"></span></div>
      </div>
    </article>`).join("");
  emptyState.hidden = list.length !== 0;
  resultsLabel.textContent = `${list.length} produit${list.length > 1 ? "s" : ""}`;
  syncCategoryButtons();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function syncCategoryButtons() {
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === state.category);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function setCategory(category) {
  state.category = category;
  state.favoritesOnly = false;
  $("#favoritesButton").textContent = "♡";
  renderProducts();
  $("#nouveautes").scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  renderProducts();
  if (state.favoritesOnly && state.favorites.size === 0) showToast("Aucun favori enregistré.");
}

function openProduct(id) {
  const product = products.find((item) => item.id === Number(id));
  if (!product) return;
  state.selectedProduct = product;
  state.selectedSize = null;
  $("#dialogContent").innerHTML = `
    <img src="${product.image}" alt="${escapeHtml(product.name)}">
    <div class="dialog-details">
      <p class="eyebrow">${escapeHtml(product.category)} · PUMPHUB.TN</p>
      <h2>${escapeHtml(product.name)}</h2>
      <div class="dialog-price">${formatPrice(product.price)}</div>
      <p>${escapeHtml(product.description)}</p>
      <span class="option-label">Choisir une taille</span>
      <div class="size-options">${product.sizes.map((size) => `<button class="size-option" data-size="${escapeHtml(size)}">${escapeHtml(size)}</button>`).join("")}</div>
      <button class="button button-dark dialog-add" id="dialogAdd">AJOUTER AU PANIER <span>＋</span></button>
      <p>Maquette de démonstration : prix, tailles et stock à confirmer par le propriétaire.</p>
    </div>`;
  $("#productDialog").showModal();
}

function addToCart(product, size) {
  const inCart = state.cart.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0);
  if (Number(product.stock) <= inCart) { showToast("Stock indisponible dans cette démo."); return; }
  const existing = state.cart.find((item) => item.productId === product.id && item.size === size);
  if (existing) existing.quantity += 1;
  else state.cart.push({ productId: product.id, size, quantity: 1 });
  renderCart();
  $("#productDialog").close();
  showToast("Produit ajouté au panier.");
}

function renderCart() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cartCount").textContent = count;
  $("#drawerCount").textContent = `(${count})`;
  $("#cartEmpty").hidden = state.cart.length > 0;
  $("#cartItems").innerHTML = state.cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return `<div class="cart-item">
      <img src="${product.image}" alt="">
      <div><h3>${escapeHtml(product.name)}</h3><p>Taille : ${escapeHtml(item.size)} · ${formatPrice(product.price)}</p>
      <div class="quantity-control"><button data-quantity="${product.id}|${escapeHtml(item.size)}|-1" aria-label="Diminuer la quantité">−</button><span>${item.quantity}</span><button data-quantity="${product.id}|${escapeHtml(item.size)}|1" aria-label="Augmenter la quantité">+</button></div></div>
      <button class="remove-item" data-remove="${product.id}|${escapeHtml(item.size)}" aria-label="Retirer le produit">×</button>
    </div>`;
  }).join("");
  const subtotal = state.cart.reduce((sum, item) => sum + products.find((p) => p.id === item.productId).price * item.quantity, 0);
  $("#cartSubtotal").textContent = formatPrice(subtotal);
}

function openCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("no-scroll");
  $("#closeCart").focus();
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("no-scroll");
}

document.addEventListener("click", (event) => {
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) { setCategory(categoryButton.dataset.category); return; }

  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) { event.stopPropagation(); toggleFavorite(Number(favoriteButton.dataset.favorite)); return; }

  const quickAdd = event.target.closest("[data-quick-add]");
  if (quickAdd) { event.stopPropagation(); openProduct(quickAdd.dataset.quickAdd); return; }

  const productTarget = event.target.closest("[data-open-product]");
  if (productTarget) { openProduct(productTarget.dataset.openProduct); return; }

  const sizeButton = event.target.closest("[data-size]");
  if (sizeButton) {
    state.selectedSize = sizeButton.dataset.size;
    document.querySelectorAll(".size-option").forEach((button) => button.classList.toggle("selected", button === sizeButton));
    return;
  }

  const quantityButton = event.target.closest("[data-quantity]");
  if (quantityButton) {
    const [id, size, delta] = quantityButton.dataset.quantity.split("|");
    const item = state.cart.find((entry) => entry.productId === Number(id) && entry.size === size);
    if (item) {
      item.quantity += Number(delta);
      if (item.quantity <= 0) state.cart = state.cart.filter((entry) => entry !== item);
      renderCart();
    }
    return;
  }

  const removeButton = event.target.closest("[data-remove]");
  if (removeButton) {
    const [id, size] = removeButton.dataset.remove.split("|");
    state.cart = state.cart.filter((item) => !(item.productId === Number(id) && item.size === size));
    renderCart();
  }
});

$("#searchInput").addEventListener("input", (event) => {
  state.search = event.target.value;
  renderProducts();
});
$("#sortSelect").addEventListener("change", (event) => {
  state.sort = event.target.value;
  renderProducts();
});
$("#favoritesButton").addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  $("#favoritesButton").textContent = state.favoritesOnly ? "♥" : "♡";
  renderProducts();
  $("#nouveautes").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("#cartButton").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("#closeProduct").addEventListener("click", () => $("#productDialog").close());
$("#productDialog").addEventListener("click", (event) => {
  if (event.target === $("#productDialog")) $("#productDialog").close();
});
$("#dialogContent").addEventListener("click", (event) => {
  if (event.target.closest("#dialogAdd")) {
    if (!state.selectedProduct) return;
    if (!state.selectedSize) {
      showToast("Choisis une taille avant de continuer.");
      return;
    }
    addToCart(state.selectedProduct, state.selectedSize);
  }
});
$("#checkoutButton").addEventListener("click", () => {
  showToast(state.cart.length ? "La validation sera activée après la connexion à Supabase." : "Ton panier est vide.");
});
$("#menuToggle").addEventListener("click", () => {
  const isOpen = $("#mainNav").classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
});
$("#mainNav").addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    $("#mainNav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});
$("#year").textContent = new Date().getFullYear();

renderProducts();
renderCart();
