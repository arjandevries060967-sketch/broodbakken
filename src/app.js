// ─── Supabase configuratie ───────────────────────────────────────────────────
const SUPABASE_URL = "https://hyoicgalewuficlmancd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2ljZ2FsZXd1ZmljbG1hbmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjgwNzIsImV4cCI6MjA5NDM0NDA3Mn0.8O7X9SObL2um55BiAuwQwQadQ8v4WmHkdqnQwEttLp4";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Seed recepten ────────────────────────────────────────────────────────────
const seedRecipes = [
  {
    name: "Wit",
    flour_total: 400,
    category: "Wit brood",
    description: "Luchtig wit brood met T65 label rouge, boter en een zachte kruim.",
    method: "Meng de ingrediënten, kneed tot een soepel deeg, laat rijzen, vorm het brood en bak heet af.",
    favorite: false,
    shared: false,
    last_used_at: 0,
    target_dough_weight: 0,
    loaf_count: 1,
    ingredients: [
      { name: "T65 label rouge", percentage: 1, unit: "g" },
      { name: "Water", percentage: 0.65, unit: "g" },
      { name: "Gedroogde gist", percentage: 0.015, unit: "g" },
      { name: "Basterdsuiker", percentage: 0.015, unit: "g" },
      { name: "Boter", percentage: 0.015, unit: "g" },
      { name: "Zout", percentage: 0.018, unit: "g" },
    ],
    notes: [
      { date: "20 okt 2024", rating: "goed", text: "Deeg opgebold en laten rijzen in de oven op 30 graden. Lekker van smaak; volgende keer de eerste rijs iets korter houden." },
    ],
  },
  {
    name: "Bruin 35",
    flour_total: 700,
    category: "Bruin brood",
    description: "Bruin brood met 35% volkorenmeel, extra broodpoeder en zonnebloemolie.",
    method: "Kneed het deeg goed door, laat rijzen tot dubbel volume, vorm en bak in blik of op steen.",
    favorite: false,
    shared: false,
    last_used_at: 0,
    target_dough_weight: 0,
    loaf_count: 1,
    ingredients: [
      { name: "T65 label rouge", percentage: 0.65, unit: "g" },
      { name: "Tarwe volkoren Molensteen", percentage: 0.35, unit: "g" },
      { name: "Water", percentage: 0.68, unit: "g" },
      { name: "Gedroogde gist", percentage: 0.015, unit: "g" },
      { name: "Broodpoeder", percentage: 0.03, unit: "g" },
      { name: "Basterdsuiker", percentage: 0.015, unit: "g" },
      { name: "Zout", percentage: 0.018, unit: "g" },
      { name: "Zonnebloemolie", percentage: 0.01, unit: "g" },
    ],
    notes: [],
  },
];

const colorTokens = [
  { name: "oven-bruin", value: "#7a3f24", usage: "primaire acties" },
  { name: "meel", value: "#f6efe2", usage: "achtergrond" },
  { name: "rogge", value: "#e4d0b2", usage: "panelen" },
  { name: "gist-groen", value: "#6f7f4d", usage: "subtiele status" },
  { name: "steen-grijs", value: "#514d46", usage: "tekst en lijnen" },
  { name: "zout-wit", value: "#fffaf1", usage: "hoog contrast" },
];

const EMPTY_ROWS = 6;
const CATEGORY_OPTIONS = ["Wit brood", "Bruin brood", "Volkoren", "Desem", "Zoet", "Pizza", "Overig"];
const RATING_OPTIONS = [
  { value: "mislukt", label: "Mislukt" },
  { value: "ok", label: "Oké" },
  { value: "goed", label: "Goed" },
  { value: "favoriet", label: "Favoriet" },
];

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  user: null,
  recipes: [],
  selectedRecipeId: "",
  saveMessage: "",
  recipeDrawerOpen: false,
  activeTab: "ingredients",
  categories: [...CATEGORY_OPTIONS],
  loading: true,
  authView: "login", // "login" | "register"
};

const root = document.querySelector("#root");
let activeDictation = null;

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    state.user = session.user;
    await loadRecipesFromDB();
  }
  state.loading = false;
  render();

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      state.user = session.user;
      await loadRecipesFromDB();
      render();
    } else if (event === "SIGNED_OUT") {
      state.user = null;
      state.recipes = [];
      state.selectedRecipeId = "";
      render();
    }
  });
}

async function signIn(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  return null;
}

async function signUp(email, password) {
  const { error } = await db.auth.signUp({ email, password });
  if (error) return error.message;
  return null;
}

async function signOut() {
  await db.auth.signOut();
}

// ─── Database ─────────────────────────────────────────────────────────────────
async function loadRecipesFromDB() {
  const { data, error } = await db
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    state.saveMessage = "Fout bij laden recepten";
    return;
  }

  if (data.length === 0) {
    await seedInitialRecipes();
    return;
  }

  state.recipes = data.map(dbToLocal);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
}

async function seedInitialRecipes() {
  const userId = state.user.id;
  const toInsert = seedRecipes.map((r) => ({ ...r, user_id: userId }));
  const { data, error } = await db.from("recipes").insert(toInsert).select();
  if (!error && data) {
    state.recipes = data.map(dbToLocal);
    state.selectedRecipeId = state.recipes[0]?.id || "";
    state.categories = getCategoriesFromRecipes(state.recipes);
  }
}

async function saveRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  const { error } = await db
    .from("recipes")
    .upsert({ ...dbRecipe, user_id: state.user.id });

  if (error) {
    state.saveMessage = "Fout bij opslaan";
  } else {
    state.saveMessage = "Opgeslagen";
  }
}

async function deleteRecipeFromDB(recipeId) {
  await db.from("recipes").delete().eq("id", recipeId);
}

async function insertRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  const { data, error } = await db
    .from("recipes")
    .insert({ ...dbRecipe, user_id: state.user.id })
    .select()
    .single();

  if (error) {
    state.saveMessage = "Fout bij aanmaken";
    return null;
  }
  return dbToLocal(data);
}

// ─── Data conversie (DB ↔ lokaal) ────────────────────────────────────────────
function dbToLocal(row) {
  const recipe = {
    id: row.id,
    name: row.name,
    flourTotal: Number(row.flour_total) || 0,
    category: row.category || "Overig",
    description: row.description || "",
    method: row.method || "",
    favorite: Boolean(row.favorite),
    shared: Boolean(row.shared),
    lastUsedAt: Number(row.last_used_at) || 0,
    targetDoughWeight: Number(row.target_dough_weight) || 0,
    loafCount: Math.max(1, Number(row.loaf_count) || 1),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    notes: Array.isArray(row.notes) ? row.notes : [],
  };
  ensureEditableRows(recipe);
  return recipe;
}

function localToDB(recipe) {
  return {
    id: recipe.id,
    name: recipe.name,
    flour_total: recipe.flourTotal || 0,
    category: recipe.category || "Overig",
    description: recipe.description || "",
    method: recipe.method || "",
    favorite: Boolean(recipe.favorite),
    shared: Boolean(recipe.shared),
    last_used_at: recipe.lastUsedAt || 0,
    target_dough_weight: recipe.targetDoughWeight || 0,
    loaf_count: recipe.loafCount || 1,
    ingredients: recipe.ingredients.filter((i) => i.name || i.percentage > 0),
    notes: recipe.notes,
  };
}

// ─── Recipe helpers ───────────────────────────────────────────────────────────
function ensureEditableRows(recipe) {
  recipe.favorite = Boolean(recipe.favorite);
  recipe.shared = Boolean(recipe.shared);
  recipe.lastUsedAt = Number(recipe.lastUsedAt) || 0;
  recipe.category = recipe.category || "Overig";
  recipe.method = recipe.method || "";
  recipe.targetDoughWeight = Number(recipe.targetDoughWeight) || 0;
  recipe.loafCount = Math.max(1, Number(recipe.loafCount) || 1);
  recipe.notes = Array.isArray(recipe.notes) ? recipe.notes : [];
  recipe.notes.forEach((note) => { note.rating = note.rating || "ok"; });

  // Verwijder lege rijen — worden dynamisch toegevoegd via de knop
  recipe.ingredients = recipe.ingredients.filter((i) => i.name || i.percentage > 0);
}

function createBlankIngredient() {
  return { name: "", percentage: 0, unit: "g" };
}

function createBlankRecipe() {
  return {
    id: `nieuw-${Date.now()}`,
    name: `Nieuw recept`,
    flourTotal: 500,
    targetDoughWeight: 0,
    loafCount: 1,
    category: "Overig",
    description: "Eigen broodrecept.",
    favorite: false,
    shared: false,
    lastUsedAt: Date.now(),
    ingredients: [
      { name: "Bloem", percentage: 1, unit: "g" },
    ],
    notes: [],
  };
}

function cloneRecipe(recipe) {
  return {
    ...structuredClone(recipe),
    id: `nieuw-${Date.now()}`,
    name: `${recipe.name} kopie`,
    favorite: false,
    shared: false,
    lastUsedAt: Date.now(),
  };
}

function getSelectedRecipe() {
  return state.recipes.find((r) => r.id === state.selectedRecipeId) || state.recipes[0];
}

function selectRecipe(recipeId) {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;
  state.selectedRecipeId = recipe.id;
  recipe.lastUsedAt = Date.now();
  state.saveMessage = "";
  render();
  saveRecipeToDB(recipe);
}

function getRecentRecipes() {
  const recent = [...state.recipes]
    .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
    .slice(0, 2);
  return recent.some((r) => r.lastUsedAt) ? recent : state.recipes.slice(0, 2);
}

function getSortedRecipes() {
  return [...state.recipes].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name, "nl", { sensitivity: "base" });
  });
}

function calculateIngredients(recipe, flourTotal) {
  return recipe.ingredients.map((ingredient, index) => ({
    ...ingredient,
    index,
    amount: ingredient.percentage * flourTotal,
  }));
}

function getRecipeRatioTotal(recipe) {
  return recipe.ingredients.reduce((sum, ingredient) => {
    const hasValue = ingredient.name || ingredient.percentage > 0;
    return hasValue ? sum + ingredient.percentage : sum;
  }, 0);
}

function createBakeSnapshot(recipe, calculatedIngredients, totalDoughWeight) {
  return {
    flourTotal: recipe.flourTotal || 0,
    doughWeight: Math.round(totalDoughWeight),
    ingredients: calculatedIngredients
      .filter((i) => i.name || i.percentage > 0)
      .map((i) => ({
        name: i.name || "Naamloos",
        amount: Math.round(i.amount * 10) / 10,
        unit: i.unit || "g",
        percentage: Math.round(i.percentage * 1000) / 10,
      })),
  };
}

function getCategoriesFromRecipes(recipes) {
  return [...new Set([...CATEGORY_OPTIONS, ...recipes.map((r) => r.category).filter(Boolean)])].sort(
    (a, b) => a.localeCompare(b, "nl", { sensitivity: "base" })
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function icon(name) {
  const paths = {
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    chef: '<path d="M6.5 14.5h11"/><path d="M6.5 18.5h11"/><path d="M8 22h8"/><path d="M5.5 14.5A4.5 4.5 0 0 1 8 6a4 4 0 0 1 8 0 4.5 4.5 0 0 1 2.5 8.5"/><path d="M8 14.5V22"/><path d="M16 14.5V22"/>',
    flame: '<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.5 4.5 0 0 0 3.5-7.5c-1.7-1.9-2.2-3.7-1.5-6.5-2.8 1.4-5.4 3.5-5.5 6.5z"/><path d="M12 22c1.3-1.2 1.7-2.7 1.1-4.4-.4-1.1-1.3-2.1-1.1-3.6-1.5 1-2.8 2.6-2.4 4.5.2 1.2 1 2.5 2.4 3.5z"/>',
    grain: '<path d="M12 2v20"/><path d="M12 8c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 14c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 20c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 8c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 14c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 20c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/><path d="M8 22h8"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    scale: '<path d="M16 16h6"/><path d="M19 13v6"/><path d="M6 16h6"/><path d="M9 13v6"/><path d="M12 3v18"/><path d="M5 6h14"/><path d="M6 6l-3 7h6L6 6z"/><path d="M18 6l-3 7h6l-3-7z"/>',
    star: '<path d="M11.5 2.8 14.4 8.7l6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-.9 2.9-5.9z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatNumber(value, decimals = 1) {
  return String(Number(value.toFixed(decimals)));
}
function formatPercent(value) {
  return `${formatNumber(value * 100, 1)}%`;
}
function formatWeight(value) {
  return `${Math.round(value)} g`;
}
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function makePreview(value) {
  const text = String(value).trim();
  return text.length > 72 ? `${text.slice(0, 72)}...` : text;
}
function getRatingLabel(value) {
  return RATING_OPTIONS.find((r) => r.value === value)?.label || "Oké";
}
function getTodayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}
function formatDateForLog(inputValue) {
  const [year, month, day] = inputValue.split("-").map(Number);
  if (!year || !month || !day) {
    return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  }
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
}

// ─── Render functies ──────────────────────────────────────────────────────────
function renderCategoryOptions(selectedCategory) {
  return state.categories.map(
    (cat) => `<option value="${escapeHtml(cat)}" ${cat === selectedCategory ? "selected" : ""}>${escapeHtml(cat)}</option>`
  ).join("");
}
function renderRatingOptions(selectedRating) {
  return RATING_OPTIONS.map(
    (r) => `<option value="${r.value}" ${r.value === selectedRating ? "selected" : ""}>${r.label}</option>`
  ).join("");
}
function renderSnapshot(snapshot) {
  if (!snapshot) return "";
  return `
    <details class="snapshot">
      <summary>Bakbeurt: ${formatWeight(snapshot.doughWeight || 0)} deeg · ${formatWeight(snapshot.flourTotal || 0)} bloem</summary>
      <div class="snapshot-grid">
        ${(snapshot.ingredients || []).slice(0, 10).map(
          (i) => `<span>${escapeHtml(i.name)}</span><strong>${formatNumber(Number(i.amount) || 0, 1)} ${escapeHtml(i.unit || "g")}</strong>`
        ).join("")}
      </div>
    </details>
  `;
}

// ─── Login scherm ─────────────────────────────────────────────────────────────
function renderAuthScreen() {
  const isLogin = state.authView === "login";
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark">${icon("chef")}</div>
          <div>
            <p class="eyebrow">Bakkerij dashboard</p>
            <h1>Broodboek</h1>
          </div>
        </div>
        <div class="auth-form-wrap">
          <h2>${isLogin ? "Inloggen" : "Account aanmaken"}</h2>
          ${state.saveMessage ? `<p class="auth-error">${escapeHtml(state.saveMessage)}</p>` : ""}
          <div class="auth-form">
            <label>
              <span>E-mailadres</span>
              <input id="auth-email" type="email" placeholder="jouw@email.nl" autocomplete="email" />
            </label>
            <label>
              <span>Wachtwoord</span>
              <input id="auth-password" type="password" placeholder="minimaal 6 tekens" autocomplete="${isLogin ? "current-password" : "new-password"}" />
            </label>
            <button class="tool-button primary auth-submit" id="auth-submit">
              ${isLogin ? "Inloggen" : "Account aanmaken"}
            </button>
          </div>
          <p class="auth-switch">
            ${isLogin
              ? `Nog geen account? <button class="auth-link" id="auth-toggle">Aanmaken</button>`
              : `Al een account? <button class="auth-link" id="auth-toggle">Inloggen</button>`
            }
          </p>
        </div>
      </div>
    </div>
  `;
  bindAuthEvents();
}

function bindAuthEvents() {
  document.getElementById("auth-toggle").addEventListener("click", () => {
    state.authView = state.authView === "login" ? "register" : "login";
    state.saveMessage = "";
    renderAuthScreen();
  });

  document.getElementById("auth-submit").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    if (!email || !password) {
      state.saveMessage = "Vul e-mailadres en wachtwoord in";
      renderAuthScreen();
      return;
    }
    const btn = document.getElementById("auth-submit");
    btn.disabled = true;
    btn.textContent = "Even wachten...";

    let error;
    if (state.authView === "login") {
      error = await signIn(email, password);
    } else {
      error = await signUp(email, password);
      if (!error) {
        state.saveMessage = "Account aangemaakt. Controleer je e-mail om te bevestigen, log daarna in.";
        state.authView = "login";
        renderAuthScreen();
        return;
      }
    }

    if (error) {
      state.saveMessage = error;
      renderAuthScreen();
    }
  });

  document.getElementById("auth-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("auth-password").focus();
  });
  document.getElementById("auth-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("auth-submit").click();
  });
}

// ─── Hoofdrender ──────────────────────────────────────────────────────────────
function render() {
  if (state.loading) {
    root.innerHTML = `<div class="auth-shell"><p style="color:var(--gist-groen);font-weight:700">Laden...</p></div>`;
    return;
  }
  if (!state.user) {
    renderAuthScreen();
    return;
  }

  const recipe = getSelectedRecipe();
  if (!recipe) {
    root.innerHTML = `<div class="auth-shell"><p>Geen recepten gevonden.</p></div>`;
    return;
  }

  ensureEditableRows(recipe);
  const flourTotal = recipe.flourTotal || 0;
  const calculatedIngredients = calculateIngredients(recipe, flourTotal);
  const hydration = calculatedIngredients.find((i) => i.name === "Water");
  const recentRecipes = getRecentRecipes();
  const sortedRecipes = getSortedRecipes();
  const ratioTotal = getRecipeRatioTotal(recipe);
  const totalDoughWeight = calculatedIngredients.reduce((sum, i) => {
    return (i.name || i.percentage > 0) ? sum + i.amount : sum;
  }, 0);
  if (!recipe.targetDoughWeight) recipe.targetDoughWeight = Math.round(totalDoughWeight);
  const loafWeight = recipe.loafCount > 0 ? Math.round(totalDoughWeight / recipe.loafCount) : Math.round(totalDoughWeight);

  root.innerHTML = `
    <main class="app-shell">
      <section class="topbar" aria-label="Broodboek overzicht">
        <div class="brand-lockup">
          <div class="brand-mark">${icon("chef")}</div>
          <div>
            <h1>Broodboek</h1>
          </div>
        </div>
        <div class="topbar-user">
          <span class="user-email">${escapeHtml(state.user.email)}</span>
          <button class="tool-button" id="btn-logout">${icon("logout")}Uitloggen</button>
        </div>
      </section>

      <section class="dashboard-grid">
        <aside class="recipe-panel" aria-label="Recepten">
          <div class="panel-heading">${icon("book")}<h2>Recepten</h2></div>
          <div class="sidebar-actions">
            <button class="tool-button" data-new-recipe type="button">${icon("plus")}Nieuw</button>
            <button class="tool-button primary" data-save-recipes type="button">${icon("save")}Opslaan</button>
          </div>
          <details class="more-options">
            <summary>Meer opties</summary>
            <div class="more-options-list">
              <button class="tool-button wide" data-save-as type="button">${icon("save")}Opslaan als</button>
              <button class="tool-button wide ${recipe.shared ? "primary" : ""}" data-toggle-shared type="button">${icon("share")}${recipe.shared ? "Gedeeld (klik om privé)" : "Privé (klik om te delen)"}</button>
              <button class="tool-button wide" data-export-recipes type="button">${icon("save")}Export</button>
              <label class="tool-button wide file-tool">${icon("plus")}Import<input data-import-recipes type="file" accept="application/json,.json" /></label>
              <button class="tool-button danger wide" data-delete-recipe type="button">${icon("trash")}Verwijder recept</button>
            </div>
          </details>
          <p class="save-message" data-save-message>${state.saveMessage}</p>

          <section class="recent-recipes" aria-label="Laatste gebruikte recepten">
            <p class="sidebar-label">Laatste gebruikt</p>
            <div class="recent-grid">
              ${recentRecipes.map((item) => `
                <article class="recipe-card recent-card ${item.id === recipe.id ? "active" : ""}" data-select-recipe="${item.id}" role="button" tabindex="0">
                  <button class="star-button ${item.favorite ? "active" : ""}" data-star-recipe="${item.id}" type="button" aria-label="${item.favorite ? "Ster verwijderen" : "Recept met ster aanmerken"}">${icon("star")}</button>
                  <div class="recipe-card-content">
                    <span data-recipe-name-label="${item.id}">${escapeHtml(item.name)}</span>
                    <small>${escapeHtml(item.category || "Overig")}${item.shared ? " · Gedeeld" : ""}</small>
                    <strong data-recipe-flour="${item.id}">${formatWeight(item.flourTotal || 0)} bloem</strong>
                  </div>
                </article>
              `).join("")}
            </div>
          </section>

          <details class="recipe-drawer" data-recipe-drawer ${state.recipeDrawerOpen ? "open" : ""}>
            <summary>Alle recepten</summary>
            <div class="recipe-list">
              ${sortedRecipes.map((item) => `
                <article class="recipe-card list-card ${item.id === recipe.id ? "active" : ""}" data-select-recipe="${item.id}" role="button" tabindex="0">
                  <button class="star-button ${item.favorite ? "active" : ""}" data-star-recipe="${item.id}" type="button" aria-label="${item.favorite ? "Ster verwijderen" : "Recept met ster aanmerken"}">${icon("star")}</button>
                  <div class="recipe-card-content">
                    <span data-recipe-name-label="${item.id}">${escapeHtml(item.name)}</span>
                    <small>${escapeHtml(item.category || "Overig")}${item.shared ? " · Gedeeld" : ""}</small>
                    <strong data-recipe-flour="${item.id}">${formatWeight(item.flourTotal || 0)} bloem</strong>
                  </div>
                </article>
              `).join("")}
            </div>
          </details>
        </aside>

        <section class="workbench" aria-label="Recept calculator">
          <div class="recipe-header">
            <div>
              <label class="recipe-name-field">
                <span>Receptnaam</span>
                <input data-recipe-name type="text" value="${escapeHtml(recipe.name)}" />
              </label>
              <label class="category-field">
                <span>Categorie</span>
                <div>
                  <select data-recipe-category>${renderCategoryOptions(recipe.category)}</select>
                  <input data-new-category type="text" placeholder="Nieuwe categorie" />
                  <button class="tool-button" data-add-category type="button">${icon("plus")}Toevoegen</button>
                </div>
              </label>
              <label class="description-field">
                <span>Korte omschrijving</span>
                <textarea data-recipe-description rows="2" placeholder="Korte omschrijving van dit recept">${escapeHtml(recipe.description || "")}</textarea>
              </label>
            </div>
            <label class="flour-input">
              <span>Bloem totaal</span>
              <div>
                <input data-flour-input inputmode="decimal" min="1" type="number" value="${flourTotal || ""}" />
                <span>gram</span>
              </div>
            </label>
          </div>

          <div class="metric-row" aria-label="Kerngetallen">
            <div>${icon("scale")}<span>Deeggewicht</span><strong data-dough-weight>${formatWeight(totalDoughWeight)}</strong></div>
            <div>${icon("flame")}<span>Hydratatie</span><strong data-hydration>${formatPercent(hydration?.percentage || 0)}</strong></div>
            <div>${icon("note")}<span>Per brood</span><strong data-loaf-weight>${formatWeight(loafWeight)}</strong></div>
          </div>

          <details class="scale-panel-wrap">
            <summary>Schalen</summary>
            <section class="scale-panel" aria-label="Deeg schalen">
              <label>
                <span>Gewenst totaal deeg</span>
                <div>
                  <input data-target-dough inputmode="decimal" min="1" type="number" value="${Math.round(recipe.targetDoughWeight || totalDoughWeight)}" />
                  <span>g</span>
                </div>
              </label>
              <label>
                <span>Aantal broden</span>
                <input data-loaf-count inputmode="numeric" min="1" type="number" value="${recipe.loafCount || 1}" />
              </label>
              <p>Past bloem totaal aan op basis van het gewenste deeggewicht.</p>
            </section>
          </details>

          <div class="tabbar" role="tablist" aria-label="Recept onderdelen">
            <button class="${state.activeTab === "ingredients" ? "active" : ""}" data-tab="ingredients" type="button">Ingrediënten</button>
            <button class="${state.activeTab === "method" ? "active" : ""}" data-tab="method" type="button">Werkwijze</button>
            <button class="${state.activeTab === "logbook" ? "active" : ""}" data-tab="logbook" type="button">Logboek</button>
          </div>

          ${state.activeTab === "ingredients" ? `
            <div class="table-wrap">
              <table>
                <caption>Ingrediënten</caption>
                <thead>
                  <tr>
                    <th>Gebruikt materiaal</th>
                    <th>Percentage</th>
                    <th>Hoeveelheid</th>
                  </tr>
                </thead>
                <tbody>
                  ${calculatedIngredients.map((ingredient, index) => `
                    <tr>
                      <td><input class="material-input" aria-label="Gebruikt materiaal" data-ingredient-index="${index}" data-kind="name" type="text" value="${escapeHtml(ingredient.name)}" placeholder="bijv. water" /></td>
                      <td>
                        <label class="number-cell">
                          <input aria-label="${ingredient.name} percentage" data-ingredient-index="${index}" data-kind="percentage" inputmode="decimal" min="0" step="0.1" type="number" value="${formatNumber(ingredient.percentage * 100, 3)}" />
                          <span>%</span>
                        </label>
                      </td>
                      <td>
                        <label class="number-cell amount-cell">
                          <input aria-label="${ingredient.name} gram" data-ingredient-index="${index}" data-kind="amount" inputmode="decimal" min="0" step="1" type="number" value="${formatNumber(ingredient.amount, 1)}" />
                          <span>g</span>
                        </label>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <button class="tool-button" data-add-ingredient type="button" style="margin-top:10px">${icon("plus")}Ingrediënt toevoegen</button>
            </div>
          ` : state.activeTab === "method" ? `
            <section class="method-panel" aria-label="Werkwijze">
              <label>
                <span class="field-header">
                  Werkwijze
                  <button class="dictate-button" data-dictate-target="[data-recipe-method]" type="button">${icon("mic")}Inspreken</button>
                </span>
                <textarea data-recipe-method rows="12" placeholder="Beschrijf hier stap voor stap hoe je dit brood maakt.">${escapeHtml(recipe.method || "")}</textarea>
                <small class="dictation-status" data-dictation-status></small>
              </label>
            </section>
          ` : `
            <section class="logbook-workspace" aria-label="Volledig baklogboek">
              <form class="note-form note-form-wide" data-note-form>
                <input data-note-date type="date" aria-label="Datum" value="${getTodayInputValue()}" />
                <select data-note-rating aria-label="Beoordeling">${renderRatingOptions("goed")}</select>
                <div class="dictation-field">
                  <button class="dictate-button" data-dictate-target="[data-note-text]" type="button">${icon("mic")}Inspreken</button>
                  <textarea data-note-text rows="4" placeholder="Nieuwe logboeknotitie" aria-label="Nieuwe logboeknotitie"></textarea>
                  <small class="dictation-status" data-dictation-status></small>
                </div>
                <button class="tool-button primary" type="submit">${icon("plus")}Toevoegen</button>
              </form>
              <div class="note-list note-list-wide">
                ${recipe.notes.length
                  ? recipe.notes.map((note, index) => `
                    <details class="note" ${index === 0 ? "open" : ""}>
                      <summary>
                        <time>${escapeHtml(note.date)}</time>
                        <strong class="rating-badge ${escapeHtml(note.rating || "ok")}">${getRatingLabel(note.rating)}</strong>
                        <span>${escapeHtml(makePreview(note.text))}</span>
                      </summary>
                      <div class="note-body">
                        <div>
                          <p>${escapeHtml(note.text)}</p>
                          ${renderSnapshot(note.snapshot)}
                        </div>
                        <div class="note-actions">
                          <select data-note-rating-update="${index}" aria-label="Beoordeling aanpassen">${renderRatingOptions(note.rating || "ok")}</select>
                          <button class="icon-action danger" data-delete-note="${index}" type="button" aria-label="Logboekitem verwijderen">${icon("trash")}</button>
                        </div>
                      </div>
                    </details>
                  `).join("")
                  : `<p class="empty-state">Nog geen logboekitems voor dit recept.</p>`
                }
              </div>
            </section>
          `}
        </section>
      </section>

    </main>
  `;

  bindEvents();
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  document.getElementById("btn-logout")?.addEventListener("click", signOut);

  document.querySelector("[data-new-recipe]").addEventListener("click", async () => {
    const blank = createBlankRecipe();
    const saved = await insertRecipeToDB(blank);
    if (saved) {
      state.recipes.push(saved);
      state.selectedRecipeId = saved.id;
      state.categories = getCategoriesFromRecipes(state.recipes);
      renderAndRestoreFocus("[data-recipe-name]");
    }
  });

  document.querySelector("[data-save-recipes]").addEventListener("click", async () => {
    const recipe = getSelectedRecipe();
    await saveRecipeToDB(recipe);
    render();
  });

  document.querySelector("[data-save-as]").addEventListener("click", async () => {
    const copy = cloneRecipe(getSelectedRecipe());
    const saved = await insertRecipeToDB(copy);
    if (saved) {
      state.recipes.push(saved);
      state.selectedRecipeId = saved.id;
      renderAndRestoreFocus("[data-recipe-name]");
    }
  });

  document.querySelector("[data-toggle-shared]").addEventListener("click", async () => {
    const recipe = getSelectedRecipe();
    recipe.shared = !recipe.shared;
    await saveRecipeToDB(recipe);
    render();
  });

  document.querySelector("[data-export-recipes]").addEventListener("click", () => {
    const data = { exportedAt: new Date().toISOString(), app: "Broodboek", recipes: state.recipes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `broodboek-${getTodayInputValue()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("[data-import-recipes]").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const imported = JSON.parse(String(reader.result));
        const recipes = Array.isArray(imported) ? imported : imported.recipes;
        if (!Array.isArray(recipes) || recipes.length === 0) throw new Error("Geen recepten gevonden");
        for (const r of recipes) {
          ensureEditableRows(r);
          const saved = await insertRecipeToDB(r);
          if (saved) state.recipes.push(saved);
        }
        state.selectedRecipeId = state.recipes[0]?.id || "";
        state.categories = getCategoriesFromRecipes(state.recipes);
        state.saveMessage = "Import opgeslagen";
        render();
      } catch {
        state.saveMessage = "Import mislukt";
        render();
      }
    });
    reader.readAsText(file);
  });

  document.querySelector("[data-recipe-drawer]").addEventListener("toggle", (event) => {
    state.recipeDrawerOpen = event.target.open;
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      render();
    });
  });

  document.querySelectorAll("[data-dictate-target]").forEach((button) => {
    button.addEventListener("click", () => startDictation(button));
  });

  document.querySelector("[data-add-ingredient]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    recipe.ingredients.push(createBlankIngredient());
    render();
    const inputs = document.querySelectorAll("[data-kind='name']");
    inputs[inputs.length - 1]?.focus();
  });

  document.querySelector("[data-delete-recipe]").addEventListener("click", async () => {
    const recipe = getSelectedRecipe();
    if (state.recipes.length <= 1) {
      state.saveMessage = "Laatste recept kan niet weg";
      render();
      return;
    }
    if (!confirm(`Recept "${recipe.name}" verwijderen?`)) return;
    await deleteRecipeFromDB(recipe.id);
    state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
    state.selectedRecipeId = state.recipes[0].id;
    render();
  });

  document.querySelector("[data-note-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const recipe = getSelectedRecipe();
    const dateInput = document.querySelector("[data-note-date]");
    const ratingInput = document.querySelector("[data-note-rating]");
    const textInput = document.querySelector("[data-note-text]");
    const text = textInput.value.trim();
    if (!text) { textInput.focus(); return; }
    const calculatedIngredients = calculateIngredients(recipe, recipe.flourTotal || 0);
    const totalDoughWeight = calculatedIngredients.reduce((sum, i) => (i.name || i.percentage > 0) ? sum + i.amount : sum, 0);
    recipe.notes.unshift({
      date: formatDateForLog(dateInput.value || getTodayInputValue()),
      rating: ratingInput.value || "ok",
      snapshot: createBakeSnapshot(recipe, calculatedIngredients, totalDoughWeight),
      text,
    });
    dateInput.value = getTodayInputValue();
    textInput.value = "";
    await saveRecipeToDB(recipe);
    renderAndRestoreFocus("[data-note-text]");
  });

  document.querySelectorAll("[data-select-recipe]").forEach((button) => {
    button.addEventListener("click", () => selectRecipe(button.dataset.selectRecipe));
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectRecipe(button.dataset.selectRecipe); }
    });
  });

  document.querySelectorAll("[data-star-recipe]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const recipe = state.recipes.find((r) => r.id === button.dataset.starRecipe);
      if (!recipe) return;
      recipe.favorite = !recipe.favorite;
      render();
      await saveRecipeToDB(recipe);
    });
  });

  document.querySelectorAll("[data-delete-note]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const recipe = getSelectedRecipe();
      const noteIndex = Number(button.dataset.deleteNote);
      if (!Number.isInteger(noteIndex) || !recipe.notes[noteIndex]) return;
      if (!confirm("Logboekitem verwijderen?")) return;
      recipe.notes.splice(noteIndex, 1);
      await saveRecipeToDB(recipe);
      render();
    });
  });

  document.querySelectorAll("[data-note-rating-update]").forEach((select) => {
    select.addEventListener("change", async () => {
      const recipe = getSelectedRecipe();
      const noteIndex = Number(select.dataset.noteRatingUpdate);
      if (!Number.isInteger(noteIndex) || !recipe.notes[noteIndex]) return;
      recipe.notes[noteIndex].rating = select.value;
      render();
      await saveRecipeToDB(recipe);
    });
  });

  document.querySelector("[data-recipe-name]").addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    recipe.name = event.target.value || "Naamloos recept";
    document.querySelectorAll(`[data-recipe-name-label="${recipe.id}"]`).forEach((label) => {
      label.textContent = recipe.name;
    });
    markUnsaved();
  });

  document.querySelector("[data-recipe-category]").addEventListener("change", (event) => {
    const recipe = getSelectedRecipe();
    recipe.category = event.target.value;
    markUnsaved();
  });

  document.querySelector("[data-recipe-description]").addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    recipe.description = event.target.value;
    markUnsaved();
  });

  document.querySelector("[data-recipe-method]")?.addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    recipe.method = event.target.value;
    markUnsaved();
  });

  document.querySelector("[data-add-category]").addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    const input = document.querySelector("[data-new-category]");
    const category = input.value.trim();
    if (!category) { input.focus(); return; }
    if (!state.categories.some((c) => c.toLowerCase() === category.toLowerCase())) {
      state.categories.push(category);
      state.categories.sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
    }
    recipe.category = category;
    markUnsaved();
    render();
  });

  document.querySelector("[data-flour-input]").addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    const parsed = Number(event.target.value);
    recipe.flourTotal = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    recipe.targetDoughWeight = Math.round(recipe.flourTotal * getRecipeRatioTotal(recipe));
    updateComputedFields();
    markUnsaved();
  });

  document.querySelector("[data-target-dough]").addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    const parsed = Number(event.target.value);
    const ratioTotal = getRecipeRatioTotal(recipe);
    recipe.targetDoughWeight = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    if (ratioTotal > 0) {
      recipe.flourTotal = recipe.targetDoughWeight / ratioTotal;
      const flourInput = document.querySelector("[data-flour-input]");
      if (flourInput) flourInput.value = formatNumber(recipe.flourTotal, 1);
    }
    updateComputedFields();
    markUnsaved();
  });

  document.querySelector("[data-loaf-count]").addEventListener("input", (event) => {
    const recipe = getSelectedRecipe();
    const parsed = Number(event.target.value);
    recipe.loafCount = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
    updateComputedFields();
    markUnsaved();
  });

  document.querySelectorAll("[data-ingredient-index]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const recipe = getSelectedRecipe();
      const flourTotal = recipe.flourTotal || 0;
      const ingredientIndex = Number(event.target.dataset.ingredientIndex);
      const parsed = Number(event.target.value);
      const ingredient = recipe.ingredients[ingredientIndex];
      if (event.target.dataset.kind === "name") ingredient.name = event.target.value;
      if (event.target.dataset.kind === "percentage") ingredient.percentage = Number.isFinite(parsed) && parsed >= 0 ? parsed / 100 : 0;
      if (event.target.dataset.kind === "amount") ingredient.percentage = Number.isFinite(parsed) && parsed >= 0 && flourTotal > 0 ? parsed / flourTotal : 0;
      if (event.target.dataset.kind === "unit") {
        ingredient.unit = event.target.value;
        const unitLabel = document.querySelector(`[data-ingredient-index="${ingredientIndex}"][data-kind="amount"]`)?.closest(".amount-cell")?.querySelector("span");
        if (unitLabel) unitLabel.textContent = ingredient.unit;
      }
      updateComputedFields();
      markUnsaved();
    });
  });
}

function updateComputedFields() {
  const recipe = getSelectedRecipe();
  const flourTotal = recipe.flourTotal || 0;
  const calculatedIngredients = calculateIngredients(recipe, flourTotal);
  const activeElement = document.activeElement;

  calculatedIngredients.forEach((ingredient, index) => {
    const percentageInput = document.querySelector(`[data-ingredient-index="${index}"][data-kind="percentage"]`);
    const amountInput = document.querySelector(`[data-ingredient-index="${index}"][data-kind="amount"]`);
    if (percentageInput && percentageInput !== activeElement) percentageInput.value = formatNumber(ingredient.percentage * 100, 3);
    if (amountInput && amountInput !== activeElement) amountInput.value = formatNumber(ingredient.amount, 1);
  });

  const hydration = calculatedIngredients.find((i) => i.name === "Water");
  const totalDoughWeight = calculatedIngredients.reduce((sum, i) => (i.name || i.percentage > 0) ? sum + i.amount : sum, 0);
  document.querySelectorAll(`[data-recipe-flour="${recipe.id}"]`).forEach((label) => { label.textContent = `${formatWeight(flourTotal)} bloem`; });
  document.querySelector("[data-dough-weight]").textContent = formatWeight(totalDoughWeight);
  document.querySelector("[data-hydration]").textContent = formatPercent(hydration?.percentage || 0);
  document.querySelector("[data-loaf-weight]").textContent = formatWeight(totalDoughWeight / (recipe.loafCount || 1));
}

function markUnsaved() {
  state.saveMessage = "Niet opgeslagen";
  const saveMessage = document.querySelector("[data-save-message]");
  if (saveMessage) saveMessage.textContent = state.saveMessage;
}

function renderAndRestoreFocus(selector) {
  render();
  const input = document.querySelector(selector);
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
}

// ─── Dictation ────────────────────────────────────────────────────────────────
function startDictation(button) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const target = document.querySelector(button.dataset.dictateTarget);
  const status = button.closest(".method-panel, .dictation-field")?.querySelector("[data-dictation-status]");
  if (!target) return;
  if (activeDictation?.button === button) { activeDictation.recognition.stop(); return; }
  if (activeDictation) activeDictation.recognition.stop();
  if (!SpeechRecognition) {
    state.saveMessage = "Spraakherkenning wordt niet ondersteund in deze browser";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "nl-NL";
  recognition.interimResults = true;
  recognition.continuous = true;
  const baseValue = target.value.trimEnd();
  button.classList.add("listening");
  button.innerHTML = `${icon("mic")}Stop`;
  if (status) status.textContent = "Luisteren...";
  activeDictation = { button, recognition };
  recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results).map((r) => r[0]?.transcript || "").join(" ").trim();
    if (!transcript) return;
    target.value = appendDictatedText(baseValue, transcript);
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
  });
  recognition.addEventListener("end", () => {
    button.classList.remove("listening");
    button.innerHTML = `${icon("mic")}Inspreken`;
    if (activeDictation?.recognition === recognition) activeDictation = null;
  });
  recognition.addEventListener("error", () => {
    button.classList.remove("listening");
    button.innerHTML = `${icon("mic")}Inspreken`;
    if (activeDictation?.recognition === recognition) activeDictation = null;
  });
  recognition.start();
}

function appendDictatedText(currentValue, transcript) {
  const trimmed = currentValue.trimEnd();
  if (!trimmed) return transcript;
  const separator = /[.!?]\s*$/.test(trimmed) ? "\n" : " ";
  return `${trimmed}${separator}${transcript}`;
}

// ─── Start ────────────────────────────────────────────────────────────────────
initAuth();
