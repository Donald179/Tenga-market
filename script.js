const buttons = document.querySelectorAll(".category-btn");
const produits = document.querySelectorAll("#boutique .produit");

const hamburger = document.querySelector(".hamburger");
const navigation = document.querySelector("#navigation-principale");
const navigationLinks = document.querySelectorAll(".nav-links a");
const whatsappNumber = "22655757299";
const supabaseUrl = "https://hqbeyovlitndojowznmn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYmV5b3ZsaXRuZG9qb3d6bm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzIzNjQsImV4cCI6MjEwNDIwODM2NH0.fx_-Owqh3WaAfXwVuy9hry2VLKXykAzCLsqPj1a4omU";
const supabaseClient = window.supabase && !supabaseUrl.startsWith("VOTRE_")
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;
let sellerId = null;
let cart = JSON.parse(localStorage.getItem("teng-market-cart") || "[]");

const formatPrice = price => `${Number(price).toLocaleString("fr-FR")} FCFA`;
const parsePrice = price => Number(String(price).replace(/[^0-9]/g, ""));

const cartToggle = document.querySelector("#cart-toggle");
const cartPanel = document.querySelector("#cart-panel");
const cartClose = document.querySelector("#cart-close");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItems = document.querySelector("#cart-items");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartWhatsapp = document.querySelector("#cart-whatsapp");
const cartLabel = document.querySelector("#cart-label");

if (supabaseClient && cartToggle) {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            cartToggle.hidden = false;
            cartToggle.classList.add("seller-logout");
            cartToggle.setAttribute("aria-label", "Se déconnecter");
            cartToggle.setAttribute("aria-expanded", "false");
            if (cartLabel) cartLabel.textContent = "Déconnexion";
            if (cartCount) {
                cartCount.remove();
            }
            cartPanel.hidden = true;
            cartOverlay.hidden = true;
            const sellerLink = document.querySelector('.nav-links a[href="vendeur.html"]');
            if (sellerLink) sellerLink.parentElement.hidden = true;
            const dashboardNavItem = document.querySelector("#dashboard-nav-item");
            if (dashboardNavItem) dashboardNavItem.hidden = false;
            cartToggle.onclick = async () => {
                await supabaseClient.auth.signOut();
                window.location.reload();
            };
        }
    });
}

const saveCart = () => localStorage.setItem("teng-market-cart", JSON.stringify(cart));

const renderCart = () => {
    if (!cartItems) return;
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartCount.textContent = itemCount;
    cartTotal.textContent = formatPrice(total);
    cartWhatsapp.disabled = cart.length === 0;
    cartItems.innerHTML = "";

    if (!cart.length) {
        cartItems.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
        return;
    }

    cart.forEach(item => {
        const row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML = '<div class="cart-item-main"><strong></strong><span></span></div><div class="cart-item-actions"><button type="button" class="cart-minus" aria-label="Diminuer la quantité">-</button><span></span><button type="button" class="cart-plus" aria-label="Augmenter la quantité">+</button><button type="button" class="cart-remove" aria-label="Retirer du panier">&times;</button></div>';
        row.querySelector(".cart-item-main strong").textContent = item.name;
        row.querySelector(".cart-item-main span").textContent = formatPrice(item.price);
        row.querySelector(".cart-item-actions span").textContent = item.quantity;
        row.querySelector(".cart-minus").addEventListener("click", () => updateCartItem(item.id, -1));
        row.querySelector(".cart-plus").addEventListener("click", () => updateCartItem(item.id, 1));
        row.querySelector(".cart-remove").addEventListener("click", () => removeFromCart(item.id));
        cartItems.append(row);
    });
};

const updateCartItem = (id, change) => {
    const item = cart.find(product => product.id === id);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart = cart.filter(product => product.id !== id);
    saveCart();
    renderCart();
};

const removeFromCart = id => {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
};

const addToCart = product => {
    const id = product.dataset.productId || `${getProductName(product)}-${product.querySelector(".prix").textContent}`;
    const name = getProductName(product);
    const price = parsePrice(product.querySelector(".prix").textContent);
    const existing = cart.find(item => item.id === id);
    if (existing) existing.quantity += 1;
    else cart.push({ id, name, price, quantity: 1 });
    saveCart();
    renderCart();
};

document.querySelectorAll(".produit .achat").forEach(button => {
    button.textContent = "Ajouter";
});

const openCart = () => {
    if (cartToggle.classList.contains("seller-logout")) return;
    cartPanel.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
    cartToggle.setAttribute("aria-expanded", "true");
    cartOverlay.hidden = false;
};

const closeCart = () => {
    cartPanel.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
    cartToggle.setAttribute("aria-expanded", "false");
    cartOverlay.hidden = true;
};

if (cartToggle) cartToggle.addEventListener("click", openCart);
if (cartClose) cartClose.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);
if (cartWhatsapp) cartWhatsapp.addEventListener("click", () => {
    const lines = cart.map(item => `- ${item.name} x${item.quantity} : ${formatPrice(item.price * item.quantity)}`);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = ["Bonjour Teng Market, je souhaite commander :", "", ...lines, "", `Total : ${formatPrice(total)}`].join("\n");
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});

renderCart();

const getProductName = product => product.querySelector("h3").textContent.trim();

const buyProduct = product => {
    const productName = getProductName(product);
    const message = `Je suis interesse par le ${productName}, puis-je avoir des informations ?`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

const contactForm = document.querySelector("#contact-form");
if (contactForm) {
    const contactStatus = document.querySelector("#contact-status");
    contactForm.addEventListener("submit", async event => {
        event.preventDefault();
        const name = document.querySelector("#nom").value.trim();
        const phone = document.querySelector("#numero").value.trim();
        const email = document.querySelector("#email").value.trim();
        const message = document.querySelector("#message").value.trim();
        const submitButton = contactForm.querySelector("input[type=submit]");
        submitButton.disabled = true;
        contactStatus.textContent = "Envoi du message...";
        contactStatus.classList.remove("is-error");

        try {
            const response = await fetch(`${supabaseUrl}/functions/v1/send-contact-email`, {
                method: "POST",
                headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, phone, email, message })
            });
            const responseText = await response.text();
            let result = {};
            try {
                result = responseText ? JSON.parse(responseText) : {};
            } catch {
                throw new Error("La fonction Supabase a renvoyé une réponse invalide.");
            }
            if (!response.ok) throw new Error(result.error || "Le message n'a pas pu être envoyé.");
            contactForm.reset();
            contactStatus.textContent = "Message envoyé avec succès.";
        } catch (error) {
            contactStatus.textContent = error.message;
            contactStatus.classList.add("is-error");
        } finally {
            submitButton.disabled = false;
        }
    });
}

const showProductDetails = product => {
    if (product.classList.contains("is-flipped")) {
        return;
    }

    const description = product.querySelector(".details p").textContent.trim();
    const price = product.querySelector(".prix").textContent.trim();
    const quantity = Number(product.dataset.quantity || 1);
    const details = document.createElement("div");
    details.className = "product-back";
    details.innerHTML = `
        <span class="detail-label">Fiche produit</span>
        <h3>${getProductName(product)}</h3>
        <p>${description}</p>
        <p class="product-back-info">Boutique : ${product.dataset.storeName || "Teng Market"}<br>Vendeur : ${product.dataset.sellerName || "Vendeur Teng Market"}<br>${product.dataset.sellerDescription || "Produit disponible en stock."}</p>
        <p class="prix">${price}</p>
        <div class="product-quantity"><button class="quantity-minus" type="button">-</button><span>${quantity}</span><button class="quantity-plus" type="button">+</button></div>
        <div class="product-back-actions">
            <button class="retour" type="button">Retour</button>
            <button class="product-buy" type="button">Ajouter</button>
        </div>
    `;
    product.appendChild(details);
    product.classList.add("is-flipped");
};

document.addEventListener("click", event => {
    const detailButton = event.target.closest(".produit .bouton button.details");
    const returnButton = event.target.closest(".product-back .retour");
    const buyButton = event.target.closest(".produit .achat, .product-back .product-buy");
    const quantityButton = event.target.closest(".product-back .quantity-minus, .product-back .quantity-plus");

    if (detailButton) {
        showProductDetails(detailButton.closest(".produit"));
    }

    if (returnButton) {
        returnButton.closest(".produit").classList.remove("is-flipped");
        returnButton.closest(".product-back").remove();
    }

    if (buyButton) {
        const product = buyButton.closest(".produit");
        const quantity = Number(product.dataset.quantity || 1);
        for (let index = 0; index < quantity; index += 1) addToCart(product);
    }

    if (quantityButton) {
        const product = quantityButton.closest(".produit");
        const change = quantityButton.classList.contains("quantity-plus") ? 1 : -1;
        product.dataset.quantity = Math.max(1, Number(product.dataset.quantity || 1) + change);
        product.classList.remove("is-flipped");
        const back = product.querySelector(".product-back");
        if (back) back.remove();
        showProductDetails(product);
    }
});

const closeNavigation = () => {
    hamburger.classList.remove("active");
    navigation.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Ouvrir le menu");
};

hamburger.addEventListener("click", () => {
    const isOpen = hamburger.classList.toggle("active");
    navigation.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
});

navigationLinks.forEach(link => link.addEventListener("click", closeNavigation));

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeNavigation();
    }
});

buttons.forEach(button => {
    button.addEventListener("click", () => {

        // Retirer la classe active
        buttons.forEach(btn => btn.classList.remove("active"));

        // Ajouter active au bouton sélectionné
        button.classList.add("active");

        const category = button.dataset.category;

        document.querySelectorAll("#boutique .produit").forEach(produit => {
            if (
                category === "all" ||
                produit.dataset.category === category
            ) {
                produit.style.display = "block";
            } else {
                produit.style.display = "none";
            }
        });
    });
});

const publicProductsGrid = document.querySelector("#boutique .produits-categories");
const renderPublicProduct = product => {
    const article = document.createElement("article");
    article.className = "produit seller-public-product";
    article.dataset.productId = product.id;
    article.dataset.storeName = product.seller?.store_name || "Teng Market";
    article.dataset.sellerName = product.seller ? `${product.seller.first_name} ${product.seller.last_name}`.trim() : "Vendeur Teng Market";
    article.dataset.sellerDescription = product.seller?.description || "Produit disponible en stock.";
    article.dataset.category = product.category;
    const badge = document.createElement("span");
    badge.className = "badge badge-nouveau";
    badge.textContent = "Vendeur";
    const image = document.createElement("img");
    image.src = product.image_url;
    image.alt = product.name;
    const name = document.createElement("h3");
    name.textContent = product.name;
    const details = document.createElement("div");
    details.className = "details";
    const description = document.createElement("p");
    description.textContent = product.description;
    const price = document.createElement("p");
    price.className = "prix";
    price.textContent = `${Number(product.price).toLocaleString("fr-FR")} FCFA`;
    const actions = document.createElement("div");
    actions.className = "bouton";
    actions.innerHTML = '<button class="details" type="button">Détails</button><button class="achat" type="button">Ajouter</button>';
    details.append(description, price, actions);
    article.append(badge, image, name, details);
    publicProductsGrid.append(article);
};

const loadPublicProducts = async () => {
    if (!supabaseClient || !publicProductsGrid) return;
    const { data, error } = await supabaseClient.from("products").select("id, name, category, price, description, image_url, seller_id").eq("published", true).order("created_at", { ascending: false });
    if (error) return;
    const products = await Promise.all(data.map(async product => {
        const profile = await supabaseClient.from("seller_public_profiles").select("store_name, first_name, last_name, description, whatsapp, image_url").eq("id", product.seller_id).maybeSingle();
        return { ...product, seller: profile.data };
    }));
    products.forEach(renderPublicProduct);
};

loadPublicProducts();
