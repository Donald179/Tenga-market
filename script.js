const buttons = document.querySelectorAll(".category-btn");
const produits = document.querySelectorAll("#boutique .produit");

const hamburger = document.querySelector(".hamburger");
const navigation = document.querySelector("#navigation-principale");
const navigationLinks = document.querySelectorAll(".nav-links a");
const whatsappNumber = "22655757299";
const supabaseUrl = "VOTRE_URL_SUPABASE";
const supabaseAnonKey = "VOTRE_CLE_ANON_SUPABASE";
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

        produits.forEach(produit => {
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
