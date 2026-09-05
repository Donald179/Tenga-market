const supabaseUrl = "https://hqbeyovlitndojowznmn.supabase.co".replace(/\/+$/, "");
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYmV5b3ZsaXRuZG9qb3d6bm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzIzNjQsImV4cCI6MjEwNDIwODM2NH0.fx_-Owqh3WaAfXwVuy9hry2VLKXykAzCLsqPj1a4omU";
const supabaseClient = window.supabase && !supabaseUrl.startsWith("VOTRE_")
    ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
    : null;

const getFormValues = form => Object.fromEntries(new FormData(form).entries());
const showStatus = (element, message, isError = false) => {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
};

const requireSupabase = status => {
    if (supabaseClient) return true;
    showStatus(status, "Configurez Supabase dans seller-auth.js avant de continuer.", true);
    return false;
};

const loginForm = document.querySelector("#login-form");
if (loginForm) {
    const status = document.querySelector("#login-status");
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!requireSupabase(status)) return;
        const values = getFormValues(loginForm);
        showStatus(status, "Connexion en cours...");
        const { error } = await supabaseClient.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) {
            showStatus(status, error.message, true);
            return;
        }
        window.location.href = "tableau-bord.html";
    });
}

const signupForm = document.querySelector("#signup-form");
if (signupForm) {
    const status = document.querySelector("#signup-status");
    signupForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!requireSupabase(status)) return;
        const values = getFormValues(signupForm);
        showStatus(status, "Création du compte...");
        const { error } = await supabaseClient.auth.signUp({
            email: values.email,
            password: values.password,
            options: { data: { first_name: values.first_name, last_name: values.last_name, whatsapp: values.whatsapp, store_name: values.store_name, address: values.address } }
        });
        if (error) {
            showStatus(status, error.message, true);
            return;
        }
        window.location.href = "vendeur.html?inscription=ok";
    });
}

const dashboard = document.querySelector("#dashboard-products");
if (dashboard) {
    const productForm = document.querySelector("#dashboard-product-form");
    const status = document.querySelector("#dashboard-status");
    const productSubmit = document.querySelector("#product-submit");
    const cancelEdit = document.querySelector("#cancel-edit");
    let currentSeller = null;

    const resetProductForm = () => {
        productForm.reset();
        productForm.elements.id.value = "";
        productSubmit.textContent = "Publier le produit";
        cancelEdit.hidden = true;
        document.querySelector("#product-form-title").textContent = "Ajouter un produit";
    };

    const renderProducts = products => {
        dashboard.innerHTML = "";
        document.querySelector("#product-count").textContent = `${products.length} produit${products.length > 1 ? "s" : ""}`;
        if (!products.length) {
            dashboard.innerHTML = '<p class="empty-state">Vous n\'avez pas encore publié de produit.</p>';
            return;
        }
        products.forEach(product => {
            const card = document.createElement("article");
            card.className = "dashboard-product";
            const image = document.createElement("img");
            image.src = product.image_url;
            image.alt = product.name;
            const info = document.createElement("div");
            const category = document.createElement("span");
            category.className = "eyebrow";
            category.textContent = product.category;
            const name = document.createElement("h3");
            name.textContent = product.name;
            const description = document.createElement("p");
            description.textContent = product.description;
            const price = document.createElement("strong");
            price.textContent = `${Number(product.price).toLocaleString("fr-FR")} FCFA`;
            info.append(category, name, description, price);
            const actions = document.createElement("div");
            actions.className = "dashboard-product-actions";
            const editButton = document.createElement("button");
            editButton.className = "secondary-button";
            editButton.type = "button";
            editButton.textContent = "Modifier";
            const deleteButton = document.createElement("button");
            deleteButton.className = "danger-button";
            deleteButton.type = "button";
            deleteButton.textContent = "Supprimer";
            actions.append(editButton, deleteButton);
            card.append(image, info, actions);
            editButton.addEventListener("click", () => {
                Object.entries(product).forEach(([key, value]) => { if (productForm.elements[key]) productForm.elements[key].value = value; });
                productSubmit.textContent = "Enregistrer les modifications";
                cancelEdit.hidden = false;
                document.querySelector("#product-form-title").textContent = "Modifier le produit";
                productForm.scrollIntoView({ behavior: "smooth" });
            });
            deleteButton.addEventListener("click", async () => {
                if (!window.confirm(`Supprimer ${product.name} ?`)) return;
                const { error } = await supabaseClient.from("products").delete().eq("id", product.id).eq("seller_id", currentSeller.id);
                if (error) { showStatus(status, error.message, true); return; }
                loadProducts();
            });
            dashboard.append(card);
        });
    };

    const loadProducts = async () => {
        const { data, error } = await supabaseClient.from("products").select("*").eq("seller_id", currentSeller.id).order("created_at", { ascending: false });
        if (error) { showStatus(status, error.message, true); return; }
        renderProducts(data);
    };

    const loadDashboard = async () => {
        if (!requireSupabase(status)) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) { window.location.href = "vendeur.html"; return; }
        document.querySelector("#seller-email").textContent = user.email;
        const profile = user.user_metadata || {};
        const { data, error } = await supabaseClient.from("sellers").select("*").eq("user_id", user.id).maybeSingle();
        if (error) { showStatus(status, error.message, true); return; }
        if (data) currentSeller = data;
        else {
            const result = await supabaseClient.from("sellers").insert({ user_id: user.id, first_name: profile.first_name || "", last_name: profile.last_name || "", email: user.email, whatsapp: profile.whatsapp || "", store_name: profile.store_name || "Ma boutique", address: profile.address || "" }).select().single();
            if (result.error) { showStatus(status, result.error.message, true); return; }
            currentSeller = result.data;
        }
        document.querySelector("#store-title").textContent = currentSeller.store_name;
        loadProducts();
    };

    productForm.addEventListener("submit", async event => {
        event.preventDefault();
        const values = getFormValues(productForm);
        const id = values.id;
        delete values.id;
        values.price = Number(values.price);
        values.seller_id = currentSeller.id;
        showStatus(status, id ? "Mise à jour..." : "Publication...");
        const query = id ? supabaseClient.from("products").update(values).eq("id", id).eq("seller_id", currentSeller.id) : supabaseClient.from("products").insert(values);
        const { error } = await query;
        if (error) { showStatus(status, error.message, true); return; }
        resetProductForm();
        showStatus(status, "Produit enregistré.");
        loadProducts();
    });
    cancelEdit.addEventListener("click", resetProductForm);
    document.querySelector("#logout-button").addEventListener("click", async () => { await supabaseClient.auth.signOut(); window.location.href = "vendeur.html"; });
    loadDashboard();
}