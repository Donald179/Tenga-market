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
    const details = document.createElement("div");
    details.className = "product-back";
    details.innerHTML = `
        <span class="detail-label">Fiche produit</span>
        <h3>${getProductName(product)}</h3>
        <p>${description}</p>
        <p class="product-back-info">Produit disponible en stock. Contactez-nous sur WhatsApp pour connaitre les caracteristiques et le delai de livraison.</p>
        <p class="prix">${price}</p>
        <div class="product-back-actions">
            <button class="retour" type="button">Retour</button>
            <button class="product-buy" type="button">Acheter</button>
        </div>
    `;
    product.appendChild(details);
    product.classList.add("is-flipped");
};

document.addEventListener("click", event => {
    const detailButton = event.target.closest(".produit .bouton button.details");
    const returnButton = event.target.closest(".product-back .retour");
    const buyButton = event.target.closest(".produit .achat, .product-back .product-buy");

    if (detailButton) {
        showProductDetails(detailButton.closest(".produit"));
    }

    if (returnButton) {
        returnButton.closest(".produit").classList.remove("is-flipped");
        returnButton.closest(".product-back").remove();
    }

    if (buyButton) {
        buyProduct(buyButton.closest(".produit"));
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
    actions.innerHTML = '<button class="details" type="button">Details</button><button class="achat" type="button">Acheter</button>';
    details.append(description, price, actions);
    article.append(badge, image, name, details);
    publicProductsGrid.append(article);
};

const loadPublicProducts = async () => {
    if (!supabaseClient || !publicProductsGrid) return;
    const { data, error } = await supabaseClient.from("products").select("id, name, category, price, description, image_url").eq("published", true).order("created_at", { ascending: false });
    if (error) return;
    data.forEach(renderPublicProduct);
};

loadPublicProducts();
