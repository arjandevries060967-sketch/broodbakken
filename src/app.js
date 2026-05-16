// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://hyoicgalewuficlmancd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2ljZ2FsZXd1ZmljbG1hbmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjgwNzIsImV4cCI6MjA5NDM0NDA3Mn0.8O7X9SObL2um55BiAuwQwQadQ8v4WmHkdqnQwEttLp4";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Constanten ───────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = ["Wit brood", "Bruin brood", "Volkoren", "Desem", "Zoet", "Pizza", "Overig"];
const RATING_OPTIONS = [
  { value: "mislukt", label: "Mislukt" },
  { value: "ok", label: "Oké" },
  { value: "goed", label: "Goed" },
  { value: "favoriet", label: "Favoriet" },
];
const FLOUR_LIBRARY = [
  "Tarwebloem T45",
  "Tarwebloem T55",
  "Tarwebloem T65",
  "Tarwebloem T80",
  "Volkoren tarwemeel T110",
  "Volkoren tarwemeel T150",
  "Roggemeel T85",
  "Roggemeel T115",
  "Roggemeel T130",
  "Roggemeel T170",
  "Speltmeel T70",
  "Speltmeel T90",
  "Speltmeel T110",
  "Speltmeel T130",
  "Patentbloem T45",
  "Patentbloem T55",
  "Typo 00",
  "Maismeel",
  "Havermeel",
  "Boekweitmeel",
  "Meergranenmeel",
];
const ADDITION_LIBRARY = [
  "Water",
  "Zout",
  "Gist",
  "Zuurdesemstarter",
  "Olijfolie",
  "Boter",
  "Melk",
  "Honing",
  "Suiker",
  "Moutpoeder / moutmeel",
  "Zonnebloempitten",
  "Pompoenpitten",
  "Lijnzaad",
  "Sesamzaad",
  "Havervlokken",
  "Volkoren granen of gekookte granen",
  "Broodverbeteraar",
];
const SEED_RECIPES = [
  {
    name: "Wit", flour_total: 0, category: "Wit brood",
    description: "Luchtig wit brood met T65 label rouge, boter en een zachte kruim.",
    method: "Meng de ingrediënten, kneed tot een soepel deeg, laat rijzen, vorm het brood en bak heet af.",
    favorite: false, shared: false, last_used_at: 0, target_dough_weight: 0, loaf_count: 1,
    ingredients: [
      { name: "T65 label rouge", percentage: 1, unit: "g" },
      { name: "Water", percentage: 0.65, unit: "g" },
      { name: "Gedroogde gist", percentage: 0.015, unit: "g" },
      { name: "Basterdsuiker", percentage: 0.015, unit: "g" },
      { name: "Boter", percentage: 0.015, unit: "g" },
      { name: "Zout", percentage: 0.018, unit: "g" },
    ],
    notes: [{ date: "20 okt 2024", rating: "goed", text: "Deeg opgebold en laten rijzen in de oven op 30 graden. Lekker van smaak; volgende keer de eerste rijs iets korter houden." }],
  },
  {
    name: "Bruin 35", flour_total: 0, category: "Bruin brood",
    description: "Bruin brood met 35% volkorenmeel, extra broodpoeder en zonnebloemolie.",
    method: "Kneed het deeg goed door, laat rijzen tot dubbel volume, vorm en bak in blik of op steen.",
    favorite: false, shared: false, last_used_at: 0, target_dough_weight: 0, loaf_count: 1,
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

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  user: null,
  loading: true,
  authView: "login",
  screen: "myrecipes",      // "myrecipes" | "workbench" | "library" | "profile"
  recipes: [],
  selectedRecipeId: "",
  activeTab: "ingredients",
  categories: [...CATEGORY_OPTIONS],
  saveMessage: "",
  library: [],
  libraryLoading: false,
  profile: { display_name: "", avatar_url: "" },
  profileSaving: false,
  hiddenRecipes: new Set(), // verborgen bibliotheekitems (lokaal)
  libraryProfiles: {},     // profiel per userId
  recipeFilter: "alle",    // "alle" | "gist" | "zuurdesem" | "favoriet"
};

const root = document.querySelector("#root");
let activeDictation = null;
let autosaveTimer = null;

function isPasswordRecoveryUrl() {
  const params = new URLSearchParams(window.location.hash.replace("#", ""));
  return params.get("type") === "recovery";
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function initAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    state.user = session.user;
    if (isPasswordRecoveryUrl()) {
      state.authView = "reset";
    } else {
      await Promise.all([loadRecipesFromDB(), loadProfile()]);
    }
  }
  state.loading = false;
  render();

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
      state.user = session.user;
      state.authView = "reset";
      state.saveMessage = "";
      renderAuthScreen();
    } else if (event === "SIGNED_IN" && session?.user) {
      state.user = session.user;
      if (state.authView === "reset") { renderAuthScreen(); return; }
      await Promise.all([loadRecipesFromDB(), loadProfile()]);
      render();
    } else if (event === "SIGNED_OUT") {
      state.user = null;
      state.recipes = [];
      state.selectedRecipeId = "";
      state.library = [];
      state.screen = "myrecipes";
      state.profile = { display_name: "", avatar_url: "" };
      render();
    }
  });
}

async function signIn(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  return error?.message || null;
}
async function signUp(email, password) {
  const { error } = await db.auth.signUp({ email, password });
  return error?.message || null;
}
async function requestPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
  return error?.message || null;
}
async function updatePassword(password) {
  const { error } = await db.auth.updateUser({ password });
  return error?.message || null;
}
async function signOut() { await db.auth.signOut(); }

// ─── Database ─────────────────────────────────────────────────────────────────
async function loadRecipesFromDB() {
  const { data, error } = await db.from("recipes").select("*").eq("user_id", state.user.id).order("created_at", { ascending: true });
  if (error) { state.saveMessage = "Fout bij laden"; return; }
  if (data.length === 0) { await seedInitialRecipes(); return; }
  state.recipes = data.map(dbToLocal);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
}

async function seedInitialRecipes() {
  const toInsert = SEED_RECIPES.map((r) => ({ ...r, user_id: state.user.id }));
  const { data, error } = await db.from("recipes").insert(toInsert).select();
  if (!error && data) {
    state.recipes = data.map(dbToLocal);
    state.selectedRecipeId = state.recipes[0]?.id || "";
    state.categories = getCategoriesFromRecipes(state.recipes);
  }
}

async function loadLibrary() {
  state.libraryLoading = true;
  render();
  const { data, error } = await db.from("recipes").select("*").eq("shared", true).order("updated_at", { ascending: false });
  state.libraryLoading = false;
  if (!error && data) state.library = data.map(dbToLocal);
  await loadLibraryProfiles();
  render();
}

async function saveRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  const { error } = await db.from("recipes").upsert({ ...dbRecipe, user_id: state.user.id });
  state.saveMessage = error ? "Fout bij opslaan" : "Opgeslagen";
  const el = document.querySelector("[data-save-message]");
  if (el) el.textContent = state.saveMessage;
}

async function deleteRecipeFromDB(id) {
  await db.from("recipes").delete().eq("id", id).eq("user_id", state.user.id);
}

async function insertRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  delete dbRecipe.id;
  const { data, error } = await db.from("recipes").insert({ ...dbRecipe, user_id: state.user.id }).select().single();
  if (error) { state.saveMessage = "Fout bij aanmaken"; return null; }
  return dbToLocal(data);
}

// ─── Profiel ──────────────────────────────────────────────────────────────────
async function loadProfile() {
  const { data } = await db.from("profiles").select("*").eq("id", state.user.id).single();
  if (data) state.profile = { display_name: data.display_name || "", avatar_url: data.avatar_url || "" };
}

async function saveProfile(displayName, avatarUrl) {
  const { error } = await db.from("profiles").upsert({
    id: state.user.id,
    display_name: displayName,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

async function uploadAvatar(file) {
  const ext = file.name.split(".").pop();
  const path = `${state.user.id}/avatar.${ext}`;
  const { error } = await db.storage.from("avatars").upload(path, file, { upsert: true });
  if (error) return null;
  const { data } = db.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

async function loadLibraryProfiles() {
  if (state.library.length === 0) return;
  const userIds = [...new Set(state.library.map((r) => r.userId))];
  const { data } = await db.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
  if (data) {
    state.libraryProfiles = Object.fromEntries(data.map((p) => [p.id, p]));
  }
}


function dbToLocal(row) {
  const r = {
    id: row.id, userId: row.user_id, name: row.name,
    flourTotal: Number(row.flour_total) || 0,
    category: row.category || "Overig",
    leavening: row.leavening || "gist",
    description: row.description || "",
    method: row.method || "",
    favorite: Boolean(row.favorite),
    shared: Boolean(row.shared),
    lastUsedAt: Number(row.last_used_at) || 0,
    loafCount: Math.max(1, Number(row.loaf_count) || 1),
    flours: Array.isArray(row.flours) ? row.flours : [],
    additions: Array.isArray(row.additions) ? row.additions : [],
    notes: Array.isArray(row.notes) ? row.notes : [],
  };
  r.flours = r.flours.filter((i) => i.name || i.percentage > 0);
  r.additions = r.additions.filter((i) => i.name || i.percentage > 0);
  r.notes.forEach((n) => { n.rating = n.rating || "ok"; });
  return r;
}

function localToDB(recipe) {
  return {
    id: recipe.id, name: recipe.name,
    flour_total: recipe.flourTotal || 0,
    category: recipe.category || "Overig",
    leavening: recipe.leavening || "gist",
    description: recipe.description || "",
    method: recipe.method || "",
    favorite: Boolean(recipe.favorite),
    shared: Boolean(recipe.shared),
    last_used_at: recipe.lastUsedAt || 0,
    loaf_count: recipe.loafCount || 1,
    flours: recipe.flours.filter((i) => i.name || i.percentage > 0).map(({ _new, amount, ...i }) => i),
    additions: recipe.additions.filter((i) => i.name || i.percentage > 0).map(({ _new, ...i }) => i),
    notes: recipe.notes,
  };
}

// ─── Recipe helpers ───────────────────────────────────────────────────────────
function getSelectedRecipe() {
  return state.recipes.find((r) => r.id === state.selectedRecipeId) || state.recipes[0];
}
function getSortedRecipes() {
  return [...state.recipes].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name, "nl", { sensitivity: "base" });
  });
}
function getCategoriesFromRecipes(recipes) {
  return [...new Set([...CATEGORY_OPTIONS, ...recipes.map((r) => r.category).filter(Boolean)])].sort(
    (a, b) => a.localeCompare(b, "nl", { sensitivity: "base" })
  );
}
function renderDatalist(id, items) {
  return `<datalist id="${id}">${items.map((name) => `<option value="${esc(name)}"></option>`).join("")}</datalist>`;
}
function renderIngredientDatalists() {
  return [
    renderDatalist("flour-library", FLOUR_LIBRARY),
    renderDatalist("addition-library", ADDITION_LIBRARY),
  ].join("");
}
function createBlankRecipe() {
  return {
    name: "Nieuw recept", flourTotal: 0, loafCount: 1,
    category: "Overig", leavening: "gist", description: "", favorite: false, shared: false,
    lastUsedAt: Date.now(),
    flours: [{ name: "", percentage: 0, unit: "g", _new: true }],
    additions: [],
    notes: [],
  };
}
function cloneRecipe(recipe) {
  return { ...structuredClone(recipe), name: `${recipe.name} kopie`, favorite: false, shared: false, lastUsedAt: Date.now() };
}

// Bloem: gebruiker vult percentage in, grammen berekend t.o.v. flourTotal
function getTotalFlourWeight(recipe) {
  return recipe.flourTotal || 0;
}

function calculateFlours(recipe) {
  const f = recipe.flourTotal || 0;
  return (recipe.flours || []).map((i, index) => ({
    ...i, index,
    percentage: Number(i.percentage) || 0,
    amount: f > 0 ? (Number(i.percentage) || 0) / 100 * f : 0,
  }));
}

// Toevoegingen: percentage t.o.v. totaal meel, grammen berekend
function calculateAdditions(recipe) {
  const f = getTotalFlourWeight(recipe);
  return (recipe.additions || []).map((i, index) => ({ ...i, index, amount: (i.percentage / 100) * f }));
}

function getHydration(recipe) {
  const water = (recipe.additions || []).find((i) => i.name?.toLowerCase() === "water");
  if (!water) return 0;
  const f = getTotalFlourWeight(recipe);
  return f > 0 ? (water.percentage / 100) : 0;
}

function getTotalDoughWeight(recipe) {
  const f = getTotalFlourWeight(recipe);
  const additionsTotal = (recipe.additions || []).reduce((s, i) => s + (i.percentage / 100) * f, 0);
  return f + additionsTotal;
}

function createBakeSnapshot(recipe) {
  const total = getTotalDoughWeight(recipe);
  const flours = calculateFlours(recipe);
  const additions = calculateAdditions(recipe);
  return {
    flourTotal: getTotalFlourWeight(recipe),
    doughWeight: Math.round(total),
    flours: flours.filter((i) => i.name).map((i) => ({
      name: i.name, amount: Math.round(i.amount * 10) / 10, unit: "g", percentage: i.percentage,
    })),
    additions: additions.filter((i) => i.name).map((i) => ({
      name: i.name, amount: Math.round(i.amount * 10) / 10, unit: "g", percentage: i.percentage,
    })),
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmt(v, d = 1) { return String(Number(v.toFixed(d))); }
function fmtPct(v) { return `${fmt(v * 100, 1)}%`; }
function fmtW(v) { return `${Math.round(v)} g`; }
function esc(v) {
  return String(v).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function preview(v) { const t = String(v).trim(); return t.length > 72 ? `${t.slice(0, 72)}...` : t; }
function ratingLabel(v) { return RATING_OPTIONS.find((r) => r.value === v)?.label || "Oké"; }
function todayValue() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function fmtDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function icon(name) {
  const p = {
    chef: '<path d="M6.5 14.5h11"/><path d="M6.5 18.5h11"/><path d="M8 22h8"/><path d="M5.5 14.5A4.5 4.5 0 0 1 8 6a4 4 0 0 1 8 0 4.5 4.5 0 0 1 2.5 8.5"/><path d="M8 14.5V22"/><path d="M16 14.5V22"/>',
    flame: '<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.5 4.5 0 0 0 3.5-7.5c-1.7-1.9-2.2-3.7-1.5-6.5-2.8 1.4-5.4 3.5-5.5 6.5z"/><path d="M12 22c1.3-1.2 1.7-2.7 1.1-4.4-.4-1.1-1.3-2.1-1.1-3.6-1.5 1-2.8 2.6-2.4 4.5.2 1.2 1 2.5 2.4 3.5z"/>',
    grain: '<path d="M12 2v20"/><path d="M12 8c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 14c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 20c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 8c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 14c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 20c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
    mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/><path d="M8 22h8"/>',
    note: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    scale: '<path d="M16 16h6"/><path d="M19 13v6"/><path d="M6 16h6"/><path d="M9 13v6"/><path d="M12 3v18"/><path d="M5 6h14"/><path d="M6 6l-3 7h6L6 6z"/><path d="M18 6l-3 7h6l-3-7z"/>',
    star: '<path d="M11.5 2.8 14.4 8.7l6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-.9 2.9-5.9z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p[name]}</svg>`;
}

// ─── Render helpers ───────────────────────────────────────────────────────────
function renderCategoryOptions(selected) {
  return state.categories.map((c) => `<option value="${esc(c)}" ${c === selected ? "selected" : ""}>${esc(c)}</option>`).join("");
}
function renderRatingOptions(selected) {
  return RATING_OPTIONS.map((r) => `<option value="${r.value}" ${r.value === selected ? "selected" : ""}>${r.label}</option>`).join("");
}
function renderSnapshot(snap) {
  if (!snap) return "";
  const items = [
    ...(Array.isArray(snap.flours) ? snap.flours : []),
    ...(Array.isArray(snap.additions) ? snap.additions : []),
    ...(Array.isArray(snap.ingredients) ? snap.ingredients : []),
  ];
  return `
    <details class="snapshot">
      <summary>Bakbeurt: ${fmtW(snap.doughWeight || 0)} deeg · ${fmtW(snap.flourTotal || 0)} bloem</summary>
      <div class="snapshot-grid">
        ${items.slice(0, 12).map((i) => `<span>${esc(i.name)}</span><strong>${fmt(Number(i.amount) || 0, 1)} ${esc(i.unit || "g")}</strong>`).join("")}
      </div>
    </details>`;
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
function renderTopbar(showBack = false, backLabel = "") {
  const avatarHtml = state.profile.avatar_url
    ? `<img src="${esc(state.profile.avatar_url)}" class="avatar-small" alt="profiel" />`
    : `<div class="avatar-small avatar-placeholder">${esc((state.profile.display_name || state.user.email).charAt(0).toUpperCase())}</div>`;

  return `
    <header class="topbar">
      <div class="brand-lockup">
        <div class="brand-mark"><img src="./assets/logo.png" alt="Broodboek logo" /></div>
        <h1>Mijn Broodboek</h1>
      </div>
      ${showBack ? `
        <nav class="main-nav">
          <button class="nav-btn" data-go-back>${icon("arrowLeft")}${esc(backLabel)}</button>
        </nav>` : `
        <nav class="main-nav">
          <button class="nav-btn ${state.screen === "myrecipes" ? "active" : ""}" data-screen="myrecipes">${icon("grain")}Mijn recepten</button>
          <button class="nav-btn ${state.screen === "library" ? "active" : ""}" data-screen="library">${icon("book")}Bibliotheek</button>
        </nav>`}
      <div class="topbar-user">
        <button class="avatar-btn" data-screen="profile" title="Profiel">${avatarHtml}</button>
        <button class="tool-button" id="btn-logout">${icon("logout")}Uitloggen</button>
      </div>
    </header>`;
}

// ─── Auth scherm ──────────────────────────────────────────────────────────────
function renderAuthScreen() {
  const isLogin = state.authView === "login";
  const isForgot = state.authView === "forgot";
  const isReset = state.authView === "reset";
  root.innerHTML = `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-mark"><img src="./assets/logo.png" alt="Broodboek logo" /></div>
          <div><h1>Broodboek</h1></div>
        </div>
        <div class="auth-form-wrap">
          <h2>${isForgot ? "Wachtwoord vergeten" : isReset ? "Nieuw wachtwoord" : isLogin ? "Inloggen" : "Account aanmaken"}</h2>
          ${state.saveMessage ? `<p class="auth-error">${esc(state.saveMessage)}</p>` : ""}
          <div class="auth-form">
            ${isReset ? `
              <label><span>Nieuw wachtwoord</span><input id="auth-password" type="password" placeholder="minimaal 6 tekens" autocomplete="new-password" /></label>
              <label><span>Herhaal wachtwoord</span><input id="auth-password-repeat" type="password" placeholder="nog een keer" autocomplete="new-password" /></label>
              <button class="tool-button primary auth-submit" id="auth-submit">Wachtwoord opslaan</button>
            ` : `
              <label><span>E-mailadres</span><input id="auth-email" type="email" placeholder="jouw@email.nl" autocomplete="email" /></label>
              ${isForgot ? "" : `<label><span>Wachtwoord</span><input id="auth-password" type="password" placeholder="minimaal 6 tekens" autocomplete="${isLogin ? "current-password" : "new-password"}" /></label>`}
              <button class="tool-button primary auth-submit" id="auth-submit">${isForgot ? "Herstellink sturen" : isLogin ? "Inloggen" : "Account aanmaken"}</button>
            `}
          </div>
          <p class="auth-switch">
            ${isReset
              ? `Klaar? <button class="auth-link" id="auth-toggle">Naar inloggen</button>`
              : isForgot
                ? `Weet je je wachtwoord weer? <button class="auth-link" id="auth-toggle">Inloggen</button>`
                : isLogin
                  ? `Nog geen account? <button class="auth-link" id="auth-toggle">Aanmaken</button><br><button class="auth-link" id="auth-forgot">Wachtwoord vergeten?</button>`
                  : `Al een account? <button class="auth-link" id="auth-toggle">Inloggen</button>`}
          </p>
        </div>
      </div>
    </div>`;
  bindAuthEvents();
}
function bindAuthEvents() {
  document.getElementById("auth-toggle").addEventListener("click", async () => {
    if (state.authView === "reset") await signOut();
    state.authView = state.authView === "login" ? "register" : "login";
    state.saveMessage = "";
    renderAuthScreen();
  });
  document.getElementById("auth-forgot")?.addEventListener("click", () => {
    state.authView = "forgot";
    state.saveMessage = "";
    renderAuthScreen();
  });
  document.getElementById("auth-submit").addEventListener("click", async () => {
    const btn = document.getElementById("auth-submit");
    btn.disabled = true; btn.textContent = "Even wachten...";

    if (state.authView === "reset") {
      const password = document.getElementById("auth-password").value;
      const repeat = document.getElementById("auth-password-repeat").value;
      if (!password || password.length < 6) { state.saveMessage = "Kies een wachtwoord van minimaal 6 tekens"; renderAuthScreen(); return; }
      if (password !== repeat) { state.saveMessage = "De wachtwoorden zijn niet gelijk"; renderAuthScreen(); return; }
      const error = await updatePassword(password);
      if (error) { state.saveMessage = error; renderAuthScreen(); return; }
      await signOut();
      state.authView = "login";
      state.saveMessage = "Wachtwoord aangepast — log opnieuw in.";
      renderAuthScreen();
      return;
    }

    const email = document.getElementById("auth-email").value.trim();
    if (!email) { state.saveMessage = "Vul je e-mailadres in"; renderAuthScreen(); return; }

    if (state.authView === "forgot") {
      const error = await requestPasswordReset(email);
      state.authView = "login";
      state.saveMessage = error || "Herstellink verstuurd — controleer je e-mail.";
      renderAuthScreen();
      return;
    }

    const password = document.getElementById("auth-password").value;
    if (!password) { state.saveMessage = "Vul e-mailadres en wachtwoord in"; renderAuthScreen(); return; }
    const error = state.authView === "login" ? await signIn(email, password) : await signUp(email, password);
    if (!error && state.authView === "register") { state.saveMessage = "Account aangemaakt — controleer je e-mail en log daarna in."; state.authView = "login"; renderAuthScreen(); return; }
    if (error) { state.saveMessage = error; renderAuthScreen(); }
  });
  document.getElementById("auth-email")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("auth-password")?.focus() || document.getElementById("auth-submit").click();
  });
  document.getElementById("auth-password")?.addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("auth-submit").click(); });
  document.getElementById("auth-password-repeat")?.addEventListener("keydown", (e) => { if (e.key === "Enter") document.getElementById("auth-submit").click(); });
}
// ─── Profielpagina ────────────────────────────────────────────────────────────
function renderProfile() {
  const avatarHtml = state.profile.avatar_url
    ? `<img src="${esc(state.profile.avatar_url)}" class="avatar-large" alt="profiel" />`
    : `<div class="avatar-large avatar-placeholder">${esc((state.profile.display_name || state.user.email).charAt(0).toUpperCase())}</div>`;

  return `
    <main class="app-shell">
      ${renderTopbar(true, "Terug")}
      <div class="tile-screen">
        <div class="tile-screen-header">
          <h2>Mijn profiel</h2>
        </div>
        <div class="profile-form">
          <div class="avatar-section">
            ${avatarHtml}
            <label class="tool-button file-tool">
              ${icon("plus")}Foto uploaden
              <input type="file" id="avatar-upload" accept="image/jpeg,image/png,image/webp" />
            </label>
          </div>
          <label class="profile-field">
            <span>Weergavenaam</span>
            <input id="profile-name" type="text" value="${esc(state.profile.display_name)}" placeholder="Jouw naam" maxlength="60" />
          </label>
          <label class="profile-field">
            <span>E-mailadres</span>
            <input type="email" value="${esc(state.user.email)}" disabled />
          </label>
          <button class="tool-button primary" id="profile-save" ${state.profileSaving ? "disabled" : ""}>
            ${state.profileSaving ? "Opslaan..." : `${icon("save")}Opslaan`}
          </button>
          ${state.saveMessage ? `<p class="save-message">${esc(state.saveMessage)}</p>` : ""}
        </div>
      </div>
    </main>`;
}

// ─── Mijn recepten scherm ─────────────────────────────────────────────────────
function renderMyRecipes() {
  const all = getSortedRecipes();
  const filtered = all.filter((r) => {
    if (state.recipeFilter === "gist") return r.leavening !== "zuurdesem";
    if (state.recipeFilter === "zuurdesem") return r.leavening === "zuurdesem";
    if (state.recipeFilter === "favoriet") return r.favorite;
    if (state.recipeFilter === "gedeeld") return r.shared;
    return true;
  });

  return `
    <main class="app-shell">
      ${renderTopbar()}
      <div class="tile-screen">
        <div class="tile-screen-header">
          <h2>Mijn recepten</h2>
          <button class="tool-button primary" data-new-recipe type="button">${icon("plus")}Nieuw</button>
        </div>
        <div class="recipe-filters">
          ${["alle", "favoriet", "gist", "zuurdesem", "gedeeld"].map((f) => `
            <button class="filter-btn ${state.recipeFilter === f ? "active" : ""}" data-filter="${f}">
              ${f === "favoriet" ? "★ " : ""}${f.charAt(0).toUpperCase() + f.slice(1)}
            </button>`).join("")}
        </div>
        ${filtered.length === 0
          ? `<p class="empty-state">Geen recepten gevonden.</p>`
          : `<div class="tile-grid">
              ${filtered.map((r) => `
                <article class="recipe-tile">
                  <div class="recipe-tile-body">
                    <div class="recipe-tile-top">
                      <span class="recipe-tile-name">${esc(r.name)}</span>
                      <div class="recipe-tile-badges">
                        ${r.shared ? `<span class="badge badge-shared">${icon("share")}Gedeeld</span>` : ""}
                        <span class="badge badge-leavening">${r.leavening === "zuurdesem" ? "Zuurdesem" : "Gist"}</span>
                      </div>
                    </div>
                    <span class="recipe-tile-cat">${esc(r.category || "Overig")}</span>
                    <span class="recipe-tile-meta">${fmtW(r.flourTotal || 0)} bloem · ${fmtPct(getHydration(r))} hydratatie</span>
                    ${r.description ? `<p class="recipe-tile-desc">${esc(preview(r.description))}</p>` : ""}
                  </div>
                  <div class="recipe-tile-actions">
                    <button class="tool-button" data-open-recipe="${r.id}" type="button">${icon("edit")}Openen</button>
                    <button class="icon-action ${r.favorite ? "active-star" : ""}" data-toggle-favorite="${r.id}" type="button" title="${r.favorite ? "Favoriet verwijderen" : "Favoriet"}">${icon("star")}</button>
                    <button class="icon-action ${r.shared ? "active-share" : ""}" data-toggle-shared-tile="${r.id}" type="button" title="${r.shared ? "Privé maken" : "Delen"}">${icon("share")}</button>
                    <button class="icon-action danger" data-delete-tile="${r.id}" type="button" title="Verwijderen">${icon("trash")}</button>
                  </div>
                </article>`).join("")}
            </div>`}
      </div>
    </main>`;
}

// ─── Bibliotheek scherm ───────────────────────────────────────────────────────
function renderLibrary() {
  const content = () => {
    if (state.libraryLoading) return `<p class="empty-state">Bibliotheek laden...</p>`;
    const others = state.library.filter((r) => r.userId !== state.user.id && !state.hiddenRecipes.has(r.id));
    if (others.length === 0) return `<p class="empty-state">Nog geen recepten van anderen gedeeld. Zodra iemand een recept deelt verschijnt het hier.</p>`;

    const renderCard = (item) => {
      const profile = state.libraryProfiles[item.userId];
      const naam = profile?.display_name || "Onbekend";
      const avatarUrl = profile?.avatar_url;
      const avatarHtml = avatarUrl
        ? `<img src="${esc(avatarUrl)}" class="avatar-tiny" alt="${esc(naam)}" />`
        : `<div class="avatar-tiny avatar-placeholder">${esc(naam.charAt(0).toUpperCase())}</div>`;

      return `
      <article class="recipe-tile">
        <div class="recipe-tile-body">
          <div class="recipe-tile-top">
            <span class="recipe-tile-name">${esc(item.name)}</span>
          </div>
          <span class="recipe-tile-cat">${esc(item.category || "Overig")}</span>
          <span class="recipe-tile-meta">${fmtW(item.flourTotal || 0)} bloem · ${fmtPct(getHydration(item))} hydratatie</span>
          ${item.description ? `<p class="recipe-tile-desc">${esc(preview(item.description))}</p>` : ""}
          <div class="library-author">${avatarHtml}<span>${esc(naam)}</span></div>
        </div>
        <div class="recipe-tile-actions">
          <button class="tool-button" data-copy-library="${item.id}" type="button">${icon("copy")}Kopiëren</button>
          <button class="icon-action danger" data-hide-recipe="${item.id}" type="button" title="Verbergen">${icon("trash")}</button>
        </div>
      </article>`;
    };

    return `<div class="tile-grid">${others.map(renderCard).join("")}</div>`;
  };

  return `
    <main class="app-shell">
      ${renderTopbar()}
      <div class="tile-screen">
        <div class="tile-screen-header">
          <h2>Bibliotheek</h2>
        </div>
        ${content()}
      </div>
    </main>`;
}

// ─── Werkbench scherm ─────────────────────────────────────────────────────────
function renderWorkbench() {
  const recipe = getSelectedRecipe();
  if (!recipe) return `<main class="app-shell">${renderTopbar(true, "Mijn recepten")}<p class="empty-state" style="padding:18px">Geen recept gevonden.</p></main>`;

  const flourTotal = recipe.flourTotal || 0;
  const flours = calculateFlours(recipe);
  const additions = calculateAdditions(recipe);
  const hydration = getHydration(recipe);
  const totalDoughWeight = getTotalDoughWeight(recipe);
  const loafWeight = Math.round(totalDoughWeight / (recipe.loafCount || 1));

  return `
    <main class="app-shell">
      ${renderTopbar(true, "Mijn recepten")}
      <div class="workbench-screen">
        <div class="workbench-topbar">
          <h2 class="workbench-title">${esc(recipe.name)}</h2>
          <div class="workbench-actions">
            <button class="tool-button ${recipe.shared ? "primary" : ""}" data-toggle-shared type="button">${icon("share")}${recipe.shared ? "Gedeeld" : "Privé"}</button>
            <button class="tool-button" data-print-recipe type="button">${icon("note")}Printen</button>
            <details class="more-options">
              <summary>Meer opties</summary>
              <div class="more-options-list">
                <button class="tool-button wide" data-save-as type="button">${icon("save")}Opslaan als kopie</button>
                <button class="tool-button wide" data-export-recipes type="button">${icon("save")}Export</button>
                <label class="tool-button wide file-tool">${icon("plus")}Import<input data-import-recipes type="file" accept="application/json,.json" /></label>
                <button class="tool-button danger wide" data-delete-recipe type="button">${icon("trash")}Verwijder recept</button>
              </div>
            </details>
            <p class="save-message" data-save-message>${state.saveMessage}</p>
          </div>
        </div>

        <div class="workbench-body">
          <div class="recipe-header">
            <div>
              <label class="recipe-name-field">
                <span>Receptnaam</span>
                <input data-recipe-name type="text" value="${esc(recipe.name)}" />
              </label>
              <label class="leavening-field">
                <span>Rijsmiddel</span>
                <div class="leavening-options">
                  <label class="leavening-option">
                    <input type="radio" name="leavening" value="gist" ${recipe.leavening !== "zuurdesem" ? "checked" : ""} data-leavening />
                    <span>Gist</span>
                  </label>
                  <label class="leavening-option">
                    <input type="radio" name="leavening" value="zuurdesem" ${recipe.leavening === "zuurdesem" ? "checked" : ""} data-leavening />
                    <span>Zuurdesem</span>
                  </label>
                </div>
              </label>
              <label class="category-field">
                <span>Soort brood</span>
                <div>
                  <select data-recipe-category>${renderCategoryOptions(recipe.category)}</select>
                  <input data-new-category type="text" placeholder="Nieuwe categorie" />
                  <button class="tool-button" data-add-category type="button">${icon("plus")}Toevoegen</button>
                </div>
              </label>
              <label class="description-field">
                <span class="field-header">Korte omschrijving
                  <button class="dictate-button" data-dictate-target="[data-recipe-description]" type="button">${icon("mic")}Inspreken</button>
                </span>
                <textarea data-recipe-description rows="2" placeholder="Korte omschrijving van dit recept">${esc(recipe.description || "")}</textarea>
                <small class="dictation-status" data-dictation-status></small>
              </label>
            </div>
          </div>

          <div class="metric-row">
            <div>${icon("grain")}<span>Bloem/meel</span><strong data-flour-display>${fmtW(flourTotal)}</strong></div>
            <div>${icon("flame")}<span>Hydratatie</span><strong data-hydration>${fmtPct(hydration)}</strong></div>
            <div>${icon("scale")}<span>Deeggewicht</span><strong data-dough-weight>${fmtW(totalDoughWeight)}</strong></div>
          </div>

          <div class="tabbar" role="tablist">
            <button class="${state.activeTab === "ingredients" ? "active" : ""}" data-tab="ingredients" type="button">Ingrediënten</button>
            <button class="${state.activeTab === "method" ? "active" : ""}" data-tab="method" type="button">Werkwijze</button>
            <button class="${state.activeTab === "logbook" ? "active" : ""}" data-tab="logbook" type="button">Logboek</button>
          </div>

          ${state.activeTab === "ingredients" ? `
            ${renderIngredientDatalists()}
            <div class="ingredients-section">

              <div class="ingredients-group">
                ${(() => {
                  const flourPctTotal = flours.reduce((s, i) => s + (i.percentage || 0), 0);
                  const pctClass = Math.abs(flourPctTotal - 100) < 0.1 ? "pct-ok" : flourPctTotal > 100 ? "pct-over" : "pct-under";
                  return `<h3 class="ingredients-group-title">Bloem / meel
                    <span class="flour-total-indicator">
                      <input class="flour-total-input" data-flour-input inputmode="decimal" min="1" type="number" value="${recipe.flourTotal || ""}" placeholder="gram" />
                      <span>g</span>
                      <span class="pct-total ${pctClass}" data-flour-pct-total>100% / ${fmt(flourPctTotal, 1)}%</span>
                    </span>
                  </h3>`;
                })()}
                <div class="table-wrap">
                  ${flours.length === 0 ? `
                    <p class="empty-state" style="padding:10px 0">Nog geen meelsoort toegevoegd — klik op de knop hieronder.</p>
                  ` : `<table>
                    <thead><tr><th>Meelsoort</th><th>Percentage</th><th>Hoeveelheid</th><th></th></tr></thead>
                    <tbody>
                      ${flours.map((ing) => `
                        <tr>
                          <td><input class="material-input" list="flour-library" data-flour-index="${ing.index}" data-kind="name" type="text" value="${esc(ing.name)}" placeholder="bijv. T65 label rouge" /></td>
                          <td><label class="number-cell"><input data-flour-index="${ing.index}" data-kind="percentage" inputmode="decimal" min="0" max="100" step="0.1" type="number" value="${ing.percentage > 0 ? fmt(ing.percentage, 1) : ""}" placeholder="%" /><span>%</span></label></td>
                          <td><label class="number-cell amount-cell"><input data-flour-index="${ing.index}" data-kind="amount" inputmode="decimal" min="0" step="0.1" type="number" value="${ing.amount > 0 ? fmt(ing.amount, 1) : ""}" placeholder="g" /><span>g</span></label></td>
                          <td><button class="icon-action danger" data-delete-flour="${ing.index}" type="button">${icon("trash")}</button></td>
                        </tr>`).join("")}
                    </tbody>
                  </table>`}
                </div>
                <button class="tool-button" data-add-flour type="button" style="margin-top:8px">${icon("plus")}Meelsoort toevoegen</button>
              </div>

              <div class="ingredients-group">
                <h3 class="ingredients-group-title">Toevoegingen <span class="pct-hint">% van totaal meel</span></h3>
                <div class="table-wrap">
                  ${additions.length === 0 ? `
                    <p class="empty-state" style="padding:10px 0">Nog geen toevoeging toegevoegd — klik op de knop hieronder.</p>
                  ` : `<table>
                    <thead><tr><th>Ingrediënt</th><th>Percentage</th><th>Hoeveelheid</th><th></th></tr></thead>
                    <tbody>
                      ${additions.map((ing) => `
                        <tr>
                          <td><input class="material-input" list="addition-library" data-addition-index="${ing.index}" data-kind="name" type="text" value="${esc(ing.name)}" placeholder="bijv. water" /></td>
                          <td><label class="number-cell"><input data-addition-index="${ing.index}" data-kind="percentage" inputmode="decimal" min="0" step="0.1" type="number" value="${ing.percentage > 0 ? fmt(ing.percentage, 1) : ""}" placeholder="%" /><span>%</span></label></td>
                          <td><label class="number-cell amount-cell"><input data-addition-index="${ing.index}" data-kind="amount" readonly tabindex="-1" type="number" value="${ing.amount > 0 ? fmt(ing.amount, 1) : ""}" placeholder="–" /><span>g</span></label></td>
                          <td><button class="icon-action danger" data-delete-addition="${ing.index}" type="button">${icon("trash")}</button></td>
                        </tr>`).join("")}
                    </tbody>
                  </table>`}
                </div>
                <button class="tool-button" data-add-addition type="button" style="margin-top:8px">${icon("plus")}Toevoeging toevoegen</button>
              </div>

            </div>
          ` : state.activeTab === "method" ? `
            <section class="method-panel">
              <label>
                <span class="field-header">Werkwijze
                  <button class="dictate-button" data-dictate-target="[data-recipe-method]" type="button">${icon("mic")}Inspreken</button>
                </span>
                <textarea data-recipe-method rows="12" placeholder="Beschrijf hier stap voor stap hoe je dit brood maakt.">${esc(recipe.method || "")}</textarea>
                <small class="dictation-status" data-dictation-status></small>
              </label>
            </section>
          ` : `
            <section class="logbook-workspace">
              <form class="note-form note-form-wide" data-note-form>
                <input data-note-date type="date" value="${todayValue()}" />
                <select data-note-rating>${renderRatingOptions("goed")}</select>
                <label class="note-temp-field">
                  <span>Oven</span>
                  <input data-note-oven-temp type="number" inputmode="numeric" min="0" max="350" step="1" placeholder="°C" />
                </label>
                <div class="dictation-field">
                  <button class="dictate-button" data-dictate-target="[data-note-text]" type="button">${icon("mic")}Inspreken</button>
                  <textarea data-note-text rows="4" placeholder="Nieuwe logboeknotitie"></textarea>
                  <small class="dictation-status" data-dictation-status></small>
                </div>
                <button class="tool-button primary" type="submit">${icon("plus")}Toevoegen</button>
              </form>
              <div class="note-list note-list-wide">
                ${recipe.notes.length
                  ? recipe.notes.map((note, index) => `
                    <details class="note" ${index === 0 ? "open" : ""}>
                      <summary>
                        <time>${esc(note.date)}</time>
                        <strong class="rating-badge ${esc(note.rating || "ok")}">${ratingLabel(note.rating)}</strong>
                        ${note.ovenTemp ? `<strong class="temp-badge">${esc(note.ovenTemp)}°C</strong>` : ""}
                        <span>${esc(preview(note.text))}</span>
                      </summary>
                      <div class="note-body">
                        <div>
                          ${note.ovenTemp ? `<p class="note-meta">Oven: ${esc(note.ovenTemp)}°C</p>` : ""}
                          <p>${esc(note.text)}</p>
                          ${renderSnapshot(note.snapshot)}
                        </div>
                        <div class="note-actions">
                          <select data-note-rating-update="${index}">${renderRatingOptions(note.rating || "ok")}</select>
                          <button class="icon-action danger" data-delete-note="${index}" type="button">${icon("trash")}</button>
                        </div>
                      </div>
                    </details>`).join("")
                  : `<p class="empty-state">Nog geen logboekitems voor dit recept.</p>`}
              </div>
            </section>
          `}
        </div>
      </div>
    </main>`;
}

// ─── Hoofdrender ──────────────────────────────────────────────────────────────
function render() {
  if (state.loading) {
    root.innerHTML = `<div class="auth-shell"><p style="color:var(--gist-groen);font-weight:700">Laden...</p></div>`;
    return;
  }
  if (!state.user || state.authView === "reset") { renderAuthScreen(); return; }

  if (state.screen === "myrecipes") root.innerHTML = renderMyRecipes();
  else if (state.screen === "library") root.innerHTML = renderLibrary();
  else if (state.screen === "workbench") root.innerHTML = renderWorkbench();
  else if (state.screen === "profile") root.innerHTML = renderProfile();

  bindEvents();
}

// ─── Autosave ─────────────────────────────────────────────────────────────────
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    const recipe = getSelectedRecipe();
    if (recipe) await saveRecipeToDB(recipe);
  }, 2000);
}

function markUnsaved() {
  state.saveMessage = "Niet opgeslagen";
  const el = document.querySelector("[data-save-message]");
  if (el) el.textContent = state.saveMessage;
  scheduleAutosave();
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  document.getElementById("btn-logout")?.addEventListener("click", signOut);

  // Profiel events
  document.querySelector("[data-screen='profile']")?.addEventListener("click", () => {
    state.screen = "profile";
    state.saveMessage = "";
    render();
  });

  document.getElementById("profile-save")?.addEventListener("click", async () => {
    const name = document.getElementById("profile-name")?.value.trim() || "";
    state.profileSaving = true;
    render();
    const ok = await saveProfile(name, state.profile.avatar_url);
    state.profileSaving = false;
    if (ok) {
      state.profile.display_name = name;
      state.saveMessage = "Profiel opgeslagen";
    } else {
      state.saveMessage = "Fout bij opslaan";
    }
    render();
  });

  document.getElementById("avatar-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    state.profileSaving = true; render();
    const url = await uploadAvatar(file);
    state.profileSaving = false;
    if (url) {
      state.profile.avatar_url = url;
      await saveProfile(state.profile.display_name, url);
      state.saveMessage = "Foto opgeslagen";
    } else {
      state.saveMessage = "Foto uploaden mislukt — controleer of de avatars storage bucket bestaat in Supabase";
    }
    render();
  });

  // Verberg recept uit bibliotheek
  document.querySelectorAll("[data-hide-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.hiddenRecipes.add(btn.dataset.hideRecipe);
      render();
    });
  });

  // Filter knoppen
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.recipeFilter = btn.dataset.filter;
      render();
    });
  });

  // Favoriet toggle op tegel
  document.querySelectorAll("[data-toggle-favorite]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const recipe = state.recipes.find((r) => r.id === btn.dataset.toggleFavorite);
      if (!recipe) return;
      recipe.favorite = !recipe.favorite;
      render();
      await saveRecipeToDB(recipe);
    });
  });

  // Scherm navigatie
  document.querySelectorAll("[data-screen]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.screen = btn.dataset.screen;
      if (state.screen === "library") await loadLibrary();
      else render();
    });
  });

  document.querySelector("[data-go-back]")?.addEventListener("click", () => {
    state.screen = "myrecipes";
    state.saveMessage = "";
    render();
  });

  // Mijn recepten scherm
  document.querySelector("[data-new-recipe]")?.addEventListener("click", async () => {
    const saved = await insertRecipeToDB(createBlankRecipe());
    if (saved) {
      state.recipes.push(saved);
      state.selectedRecipeId = saved.id;
      state.categories = getCategoriesFromRecipes(state.recipes);
      state.screen = "workbench";
      state.activeTab = "ingredients";
      render();
      document.querySelector("[data-recipe-name]")?.focus();
    }
  });

  document.querySelectorAll("[data-open-recipe]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.selectedRecipeId = btn.dataset.openRecipe;
      state.screen = "workbench";
      state.activeTab = "ingredients";
      state.saveMessage = "";
      const recipe = getSelectedRecipe();
      if (recipe) { recipe.lastUsedAt = Date.now(); saveRecipeToDB(recipe); }
      render();
    });
  });

  document.querySelectorAll("[data-toggle-shared-tile]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const recipe = state.recipes.find((r) => r.id === btn.dataset.toggleSharedTile);
      if (!recipe) return;
      recipe.shared = !recipe.shared;
      await saveRecipeToDB(recipe);
      render();
    });
  });

  document.querySelectorAll("[data-delete-tile]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const recipe = state.recipes.find((r) => r.id === btn.dataset.deleteTile);
      if (!recipe) return;
      if (state.recipes.length <= 1) { alert("Je kunt het laatste recept niet verwijderen."); return; }
      if (!confirm(`"${recipe.name}" verwijderen?`)) return;
      await deleteRecipeFromDB(recipe.id);
      state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
      state.selectedRecipeId = state.recipes[0]?.id || "";
      render();
    });
  });

  // Bibliotheek events
  document.querySelectorAll("[data-copy-library]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const source = state.library.find((r) => r.id === btn.dataset.copyLibrary);
      if (!source) return;
      const copy = cloneRecipe(source);
      const saved = await insertRecipeToDB(copy);
      if (saved) {
        state.recipes.push(saved);
        state.selectedRecipeId = saved.id;
        state.categories = getCategoriesFromRecipes(state.recipes);
        state.screen = "workbench";
        state.activeTab = "ingredients";
        state.saveMessage = `"${saved.name}" toegevoegd`;
        render();
      }
    });
  });

  document.querySelectorAll("[data-goto-recipe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedRecipeId = btn.dataset.gotoRecipe;
      state.screen = "workbench";
      state.activeTab = "ingredients";
      render();
    });
  });

  document.querySelectorAll("[data-unpublish]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const recipe = state.recipes.find((r) => r.id === btn.dataset.unpublish);
      if (!recipe) return;
      if (!confirm(`"${recipe.name}" privé maken?`)) return;
      recipe.shared = false;
      await saveRecipeToDB(recipe);
      state.library = state.library.filter((r) => r.id !== recipe.id);
      render();
    });
  });

  // Werkbench events
  document.querySelector("[data-toggle-shared]")?.addEventListener("click", async () => {
    const recipe = getSelectedRecipe();
    recipe.shared = !recipe.shared;
    await saveRecipeToDB(recipe);
    render();
  });

  document.querySelector("[data-print-recipe]")?.addEventListener("click", () => window.print());

  document.querySelector("[data-save-as]")?.addEventListener("click", async () => {
    const saved = await insertRecipeToDB(cloneRecipe(getSelectedRecipe()));
    if (saved) {
      state.recipes.push(saved);
      state.selectedRecipeId = saved.id;
      render();
    }
  });

  document.querySelector("[data-export-recipes]")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: "Broodboek", recipes: state.recipes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `broodboek-${todayValue()}.json`; a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("[data-import-recipes]")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", async () => {
      try {
        const imp = JSON.parse(String(reader.result));
        const recipes = Array.isArray(imp) ? imp : imp.recipes;
        if (!Array.isArray(recipes) || recipes.length === 0) throw new Error();
        for (const r of recipes) {
          const saved = await insertRecipeToDB(r);
          if (saved) state.recipes.push(saved);
        }
        state.selectedRecipeId = state.recipes[0]?.id || "";
        state.categories = getCategoriesFromRecipes(state.recipes);
        state.saveMessage = "Import opgeslagen";
        render();
      } catch { state.saveMessage = "Import mislukt"; render(); }
    });
    reader.readAsText(file);
  });

  document.querySelector("[data-delete-recipe]")?.addEventListener("click", async () => {
    const recipe = getSelectedRecipe();
    if (state.recipes.length <= 1) { alert("Je kunt het laatste recept niet verwijderen."); return; }
    if (!confirm(`"${recipe.name}" verwijderen?`)) return;
    await deleteRecipeFromDB(recipe.id);
    state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
    state.selectedRecipeId = state.recipes[0]?.id || "";
    state.screen = "myrecipes";
    render();
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => { state.activeTab = btn.dataset.tab; render(); });
  });

  document.querySelector("[data-recipe-name]")?.addEventListener("input", (e) => {
    const recipe = getSelectedRecipe(); recipe.name = e.target.value || "Naamloos"; markUnsaved();
  });
  document.querySelector("[data-recipe-category]")?.addEventListener("change", (e) => {
    getSelectedRecipe().category = e.target.value; markUnsaved();
  });
  document.querySelector("[data-recipe-description]")?.addEventListener("input", (e) => {
    getSelectedRecipe().description = e.target.value; markUnsaved();
  });
  document.querySelector("[data-recipe-method]")?.addEventListener("input", (e) => {
    getSelectedRecipe().method = e.target.value; markUnsaved();
  });

  document.querySelector("[data-add-category]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    const input = document.querySelector("[data-new-category]");
    const cat = input.value.trim(); if (!cat) { input.focus(); return; }
    if (!state.categories.some((c) => c.toLowerCase() === cat.toLowerCase())) {
      state.categories.push(cat);
      state.categories.sort((a, b) => a.localeCompare(b, "nl", { sensitivity: "base" }));
    }
    recipe.category = cat; markUnsaved(); render();
  });

  document.querySelectorAll("[data-flour-input]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const recipe = getSelectedRecipe();
      const v = Number(e.target.value);
      recipe.flourTotal = Number.isFinite(v) && v > 0 ? v : 0;
      updateComputedFields(); markUnsaved();
    });
  });

  document.querySelectorAll("[data-leavening]").forEach((radio) => {
    radio.addEventListener("change", () => {
      getSelectedRecipe().leavening = radio.value; markUnsaved();
    });
  });

  // Bloem/meel: percentage en grammen zijn wederzijds gekoppeld
  document.querySelectorAll("[data-flour-index]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const recipe = getSelectedRecipe();
      const idx = Number(e.target.dataset.flourIndex);
      const v = Number(e.target.value);
      const ing = recipe.flours[idx]; if (!ing) return;
      if (e.target.dataset.kind === "name") { ing.name = e.target.value; delete ing._new; }
      if (e.target.dataset.kind === "percentage") ing.percentage = Number.isFinite(v) && v >= 0 ? v : 0;
      if (e.target.dataset.kind === "amount") ing.percentage = Number.isFinite(v) && v >= 0 && recipe.flourTotal > 0 ? (v / recipe.flourTotal) * 100 : 0;
      updateComputedFields(); markUnsaved();
    });
  });

  document.querySelector("[data-add-flour]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    recipe.flours.push({ name: "", percentage: 0, unit: "g", _new: true });
    render();
    const inputs = document.querySelectorAll("[data-flour-index][data-kind='name']");
    inputs[inputs.length - 1]?.focus();
  });

  document.querySelectorAll("[data-delete-flour]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipe = getSelectedRecipe();
      const idx = Number(btn.dataset.deleteFlour);
      recipe.flours.splice(idx, 1);
      markUnsaved(); render();
    });
  });

  // Toevoegingen events
  document.querySelectorAll("[data-addition-index]").forEach((input) => {
    input.addEventListener("input", (e) => {
      const recipe = getSelectedRecipe();
      const idx = Number(e.target.dataset.additionIndex);
      const v = Number(e.target.value);
      const ing = recipe.additions[idx]; if (!ing) return;
      if (e.target.dataset.kind === "name") { ing.name = e.target.value; delete ing._new; }
      if (e.target.dataset.kind === "percentage") ing.percentage = Number.isFinite(v) && v >= 0 ? v : 0;
      if (e.target.dataset.kind === "amount") ing.percentage = Number.isFinite(v) && v >= 0 && recipe.flourTotal > 0 ? (v / recipe.flourTotal) * 100 : 0;
      updateComputedFields(); markUnsaved();
    });
  });

  document.querySelector("[data-add-addition]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    recipe.additions.push({ name: "", percentage: 0, unit: "g", _new: true });
    render();
    const inputs = document.querySelectorAll("[data-addition-index][data-kind='name']");
    inputs[inputs.length - 1]?.focus();
  });

  document.querySelectorAll("[data-delete-addition]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const recipe = getSelectedRecipe();
      const idx = Number(btn.dataset.deleteAddition);
      recipe.additions.splice(idx, 1);
      markUnsaved(); render();
    });
  });

  document.querySelector("[data-note-form]")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const recipe = getSelectedRecipe();
    const text = document.querySelector("[data-note-text]").value.trim();
    const ovenTempValue = Number(document.querySelector("[data-note-oven-temp]").value);
    const ovenTemp = Number.isFinite(ovenTempValue) && ovenTempValue > 0 ? Math.round(ovenTempValue) : null;
    if (!text && !ovenTemp) { document.querySelector("[data-note-text]").focus(); return; }
    recipe.notes.unshift({
      date: fmtDate(document.querySelector("[data-note-date]").value || todayValue()),
      rating: document.querySelector("[data-note-rating]").value || "ok",
      ovenTemp,
      snapshot: createBakeSnapshot(recipe), text,
    });
    document.querySelector("[data-note-text]").value = "";
    await saveRecipeToDB(recipe); render();
  });

  document.querySelectorAll("[data-delete-note]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const recipe = getSelectedRecipe();
      const idx = Number(btn.dataset.deleteNote);
      if (!recipe.notes[idx] || !confirm("Logboekitem verwijderen?")) return;
      recipe.notes.splice(idx, 1);
      await saveRecipeToDB(recipe); render();
    });
  });

  document.querySelectorAll("[data-note-rating-update]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const recipe = getSelectedRecipe();
      const idx = Number(sel.dataset.noteRatingUpdate);
      if (!recipe.notes[idx]) return;
      recipe.notes[idx].rating = sel.value;
      render(); await saveRecipeToDB(recipe);
    });
  });

  document.querySelectorAll("[data-dictate-target]").forEach((btn) => {
    btn.addEventListener("click", () => startDictation(btn));
  });
}

// ─── Computed fields ──────────────────────────────────────────────────────────
function updateComputedFields() {
  const recipe = getSelectedRecipe();
  const active = document.activeElement;
  const flourTotal = recipe.flourTotal || 0;

  // Bereken bloem rijen
  const flours = calculateFlours(recipe);
  const flourPctTotal = flours.reduce((s, i) => s + (i.percentage || 0), 0);

  // Update bloem/meel velden. Het actieve veld laten we met rust, zodat typen natuurlijk blijft.
  flours.forEach((ing) => {
    const pct = document.querySelector(`[data-flour-index="${ing.index}"][data-kind="percentage"]`);
    const amt = document.querySelector(`[data-flour-index="${ing.index}"][data-kind="amount"]`);
    if (pct && pct !== active) pct.value = ing.percentage > 0 ? fmt(ing.percentage, 1) : "";
    if (amt && amt !== active) amt.value = ing.amount > 0 ? fmt(ing.amount, 1) : "";
  });

  // Update percentage indicator
  const flourPctEl = document.querySelector("[data-flour-pct-total]");
  if (flourPctEl) {
    flourPctEl.textContent = `100% / ${fmt(flourPctTotal, 1)}%`;
    flourPctEl.className = `pct-total ${Math.abs(flourPctTotal - 100) < 0.1 ? "pct-ok" : flourPctTotal > 100 ? "pct-over" : "pct-under"}`;
  }

  // Update toevoegingen grammen (berekend, readonly)
  calculateAdditions(recipe).forEach((ing) => {
    const amt = document.querySelector(`[data-addition-index="${ing.index}"][data-kind="amount"]`);
    if (amt) amt.value = ing.amount > 0 ? fmt(ing.amount, 1) : "";
  });

  // Update metrics
  const total = getTotalDoughWeight(recipe);
  const hydration = getHydration(recipe);
  const fd = document.querySelector("[data-flour-display]");
  const dw = document.querySelector("[data-dough-weight]");
  const hy = document.querySelector("[data-hydration]");
  if (fd) fd.textContent = fmtW(flourTotal);
  if (dw) dw.textContent = fmtW(total);
  if (hy) hy.textContent = fmtPct(hydration);
}

// ─── Dictation ────────────────────────────────────────────────────────────────
function startDictation(button) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const target = document.querySelector(button.dataset.dictateTarget);
  if (!target) return;
  if (activeDictation?.button === button) { activeDictation.recognition.stop(); return; }
  if (activeDictation) activeDictation.recognition.stop();
  if (!SR) { state.saveMessage = "Spraakherkenning niet ondersteund"; return; }
  const recognition = new SR();
  recognition.lang = "nl-NL"; recognition.interimResults = true; recognition.continuous = true;
  const base = target.value.trimEnd();
  button.classList.add("listening"); button.innerHTML = `${icon("mic")}Stop`;
  const status = button.closest(".method-panel, .dictation-field, .description-field")?.querySelector("[data-dictation-status]");
  if (status) status.textContent = "Luisteren...";
  activeDictation = { button, recognition };
  recognition.addEventListener("result", (e) => {
    const t = Array.from(e.results).map((r) => r[0]?.transcript || "").join(" ").trim();
    if (!t) return;
    const sep = base ? (/[.!?]\s*$/.test(base.trimEnd()) ? "\n" : " ") : "";
    target.value = base ? `${base.trimEnd()}${sep}${t}` : t;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
  });
  recognition.addEventListener("end", () => {
    button.classList.remove("listening"); button.innerHTML = `${icon("mic")}Inspreken`;
    if (status) status.textContent = "";
    if (activeDictation?.recognition === recognition) activeDictation = null;
  });
  recognition.addEventListener("error", () => {
    button.classList.remove("listening"); button.innerHTML = `${icon("mic")}Inspreken`;
    if (activeDictation?.recognition === recognition) activeDictation = null;
  });
  recognition.start();
}

// ─── Start ────────────────────────────────────────────────────────────────────
initAuth();
