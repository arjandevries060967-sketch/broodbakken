// ─── Supabase ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://hyoicgalewuficlmancd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5b2ljZ2FsZXd1ZmljbG1hbmNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjgwNzIsImV4cCI6MjA5NDM0NDA3Mn0.8O7X9SObL2um55BiAuwQwQadQ8v4WmHkdqnQwEttLp4";
if (!window.supabase?.createClient) {
  const rootEl = document.querySelector("#root");
  if (rootEl) {
    rootEl.innerHTML = '<div class="auth-shell"><div class="auth-card"><div class="auth-form-wrap"><h2>App kon niet laden</h2><p class="auth-error">Supabase is niet geladen. Controleer je internetverbinding en ververs de pagina.</p></div></div></div>';
  }
  throw new Error("Supabase client is niet geladen");
}
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
  "Boekweitmeel",
  "Havermeel",
  "Maismeel",
  "Meergranenmeel",
  "Patentbloem T45",
  "Patentbloem T55",
  "Roggemeel T85",
  "Roggemeel T115",
  "Roggemeel T130",
  "Roggemeel T170",
  "Speltmeel T70",
  "Speltmeel T90",
  "Speltmeel T110",
  "Speltmeel T130",
  "Tarwebloem T45",
  "Tarwebloem T55",
  "Tarwebloem T65",
  "Tarwebloem T80",
  "Typo 00",
  "Volkoren tarwemeel T110",
  "Volkoren tarwemeel T150",
];
const ADDITION_LIBRARY = [
  "Basterdsuiker",
  "Boter",
  "Broodverbeteraar",
  "Gist gedroogd",
  "Gist vers",
  "Havervlokken",
  "Honing",
  "Kristalsuiker",
  "Lijnzaad",
  "Melk",
  "Moutpoeder / moutmeel",
  "Olijfolie",
  "Pompoenpitten",
  "Sesamzaad",
  "Volkoren granen of gekookte granen",
  "Water",
  "Zonnebloempitten",
  "Zout",
  "Zuurdesemstarter",
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
      { name: "Gist gedroogd", percentage: 0.015, unit: "g" },
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
      { name: "Gist gedroogd", percentage: 0.015, unit: "g" },
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
  screen: "myrecipes",      // "myrecipes" | "workbench" | "library" | "notes" | "profile"
  recipes: [],
  selectedRecipeId: "",
  activeTab: "ingredients",
  categories: [...CATEGORY_OPTIONS],
  saveMessage: "",
  library: [],
  libraryLoading: false,
  libraryError: "",
  notePages: [],
  selectedNotePageId: "",
  noteSearch: "",
  generalNotesError: "",
  profile: { display_name: "", avatar_url: "" },
  profileSaving: false,
  hiddenRecipes: new Set(), // verborgen bibliotheekitems (lokaal)
  libraryProfiles: {},     // profiel per userId
  recipeFilter: "alle",    // "alle" | "gist" | "zuurdesem" | "favoriet"
  photoPreview: null,
  confirmDialog: null,
  backupPanelOpen: false,
  faqPanelOpen: false,
  supportPanelOpen: false,
  supportTickets: [],
  supportLoading: false,
  supportError: "",
  supportDraft: { category: "Vraag", priority: "Normaal", subject: "", message: "" },
  isDeveloper: false,
  backups: [],
  backupSyncStatus: "",
  backupReminderDismissed: "",
};

const root = document.querySelector("#root");
let activeDictation = null;
let autosaveTimer = null;
let notesSaveTimer = null;
const BACKUP_REMINDER_DAYS = 7;

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const openOptions = document.querySelectorAll(".more-options[open]");
  if (openOptions.length) {
    openOptions.forEach((menu) => { menu.open = false; });
    return;
  }
  if (state.photoPreview) {
    state.photoPreview = null;
    render();
    return;
  }
  if (state.confirmDialog) {
    state.confirmDialog = null;
    render();
    return;
  }
  if (state.backupPanelOpen) {
    state.backupPanelOpen = false;
    render();
    return;
  }
  if (state.faqPanelOpen) {
    state.faqPanelOpen = false;
    render();
    return;
  }
  if (state.supportPanelOpen) {
    state.supportPanelOpen = false;
    render();
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest(".more-options")) return;
  document.querySelectorAll(".more-options[open]").forEach((menu) => { menu.open = false; });
});

function isPasswordRecoveryUrl() {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace("#", ""));
  return search.get("type") === "recovery" || hash.get("type") === "recovery";
}

async function exchangeRecoveryCodeIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code || !isPasswordRecoveryUrl()) return null;
  const { data, error } = await db.auth.exchangeCodeForSession(code);
  if (error) return error.message;
  state.user = data.session?.user || null;
  state.authView = "reset";
  window.history.replaceState({}, document.title, window.location.pathname);
  return null;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function loadSignedInData() {
  const results = await Promise.allSettled([
    withTimeout(loadRecipesFromDB(), "Recepten laden duurt te lang", 10000),
    withTimeout(loadProfile(), "Profiel laden duurt te lang", 10000),
    withTimeout(loadGeneralNotes(), "Notities laden duurt te lang", 10000),
    withTimeout(loadDeveloperStatus(), "Developerstatus laden duurt te lang", 10000),
  ]);
  const failed = results.find((result) => result.status === "rejected" || result.value?.timeoutError);
  if (failed) state.saveMessage = failed.reason?.message || failed.value?.timeoutError || "Niet alle gegevens konden worden geladen";
  else if (state.saveMessage === "Gegevens laden...") state.saveMessage = "";
  saveAutomaticBackup("auto");
  loadServerBackups().then(() => render());
}

async function initAuth() {
  state.loading = false;
  render();

  try {
    const recoveryError = await exchangeRecoveryCodeIfPresent();
    if (recoveryError) {
      state.authView = "forgot";
      state.saveMessage = recoveryError;
      render();
    }
    const sessionResult = await withTimeout(db.auth.getSession(), "", 4000);
    const session = sessionResult.timeoutError ? null : sessionResult.data?.session;
    if (session?.user) {
      state.user = session.user;
      if (isPasswordRecoveryUrl()) {
        state.authView = "reset";
        renderAuthScreen();
      } else {
        state.screen = "myrecipes";
        state.saveMessage = "Gegevens laden...";
        render();
        loadSignedInData().then(render);
      }
    }
  } catch (error) {
    state.saveMessage = error?.message || "Sessie controleren mislukt. Je kunt opnieuw inloggen.";
    renderAuthScreen();
  }

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY" && session?.user) {
      state.user = session.user;
      state.authView = "reset";
      state.saveMessage = "";
      window.history.replaceState({}, document.title, window.location.pathname);
      renderAuthScreen();
    } else if (event === "SIGNED_IN" && session?.user) {
      state.user = session.user;
      if (state.authView === "reset") { renderAuthScreen(); return; }
      state.screen = "myrecipes";
      state.saveMessage = "Gegevens laden...";
      render();
      await loadSignedInData();
      render();
    } else if (event === "SIGNED_OUT") {
      state.user = null;
      state.recipes = [];
      state.selectedRecipeId = "";
      state.library = [];
      state.libraryError = "";
      state.notePages = [];
      state.selectedNotePageId = "";
      state.noteSearch = "";
      state.generalNotesError = "";
      state.supportTickets = [];
      state.supportError = "";
      state.supportDraft = { category: "Vraag", priority: "Normaal", subject: "", message: "" };
      state.isDeveloper = false;
      state.screen = "myrecipes";
      state.profile = { display_name: "", avatar_url: "" };
      render();
    }
  });
}

function withTimeout(promise, message = "Supabase reageert niet. Probeer het zo opnieuw of controleer de database-instellingen.", ms = 12000) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ timeoutError: message }), ms)),
  ]);
}

async function signIn(email, password) {
  const result = await withTimeout(db.auth.signInWithPassword({ email, password }), "Inloggen duurt te lang. Probeer opnieuw.");
  if (result.timeoutError) return { error: result.timeoutError };
  return { error: result.error?.message || null, user: result.data?.user || result.data?.session?.user || null };
}
async function signUp(email, password) {
  const result = await withTimeout(db.auth.signUp({ email, password }), "Account aanmaken duurt te lang. Controleer of het Supabase profiles-script is uitgevoerd en probeer opnieuw.");
  if (result.timeoutError) return { error: result.timeoutError };
  return { error: result.error?.message || null, user: result.data?.user || result.data?.session?.user || null };
}
async function requestPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname + "?type=recovery";
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });
  return error?.message || null;
}
async function updatePassword(password) {
  const { error } = await db.auth.updateUser({ password });
  return error?.message || null;
}
function resetSignedOutState() {
  state.user = null;
  state.recipes = [];
  state.selectedRecipeId = "";
  state.library = [];
  state.libraryError = "";
  state.notePages = [];
  state.selectedNotePageId = "";
  state.noteSearch = "";
  state.generalNotesError = "";
  state.supportTickets = [];
  state.supportError = "";
  state.supportDraft = { category: "Vraag", priority: "Normaal", subject: "", message: "" };
  state.isDeveloper = false;
  state.screen = "myrecipes";
  state.authView = "login";
  state.profile = { display_name: "", avatar_url: "" };
}

async function signOut() {
  state.saveMessage = "";
  resetSignedOutState();
  render();
  await withTimeout(db.auth.signOut(), "", 5000);
}

// ─── Database ─────────────────────────────────────────────────────────────────
async function loadRecipesFromDB() {
  const { data, error } = await db.from("recipes").select("*").eq("user_id", state.user.id).order("created_at", { ascending: true });
  if (error) { state.saveMessage = "Fout bij laden"; return; }
  if (data.length === 0) {
    state.recipes = [];
    state.selectedRecipeId = "";
    state.categories = getCategoriesFromRecipes(state.recipes);
    state.backupReminderDismissed = readBackupReminderDismissed();
    return;
  }
  state.recipes = data.map(dbToLocal);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
  state.backupReminderDismissed = readBackupReminderDismissed();
}

async function seedInitialRecipes() {
  const toInsert = SEED_RECIPES.map((r) => ({ ...r, user_id: state.user.id }));
  const { data, error } = await db.from("recipes").insert(toInsert).select();
  if (!error && data) {
    state.recipes = data.map(dbToLocal);
    state.selectedRecipeId = state.recipes[0]?.id || "";
    state.categories = getCategoriesFromRecipes(state.recipes);
    saveAutomaticBackup("auto");
  }
}

async function loadLibrary() {
  state.libraryLoading = true;
  state.libraryError = "";
  render();
  try {
    const { data, error } = await db.from("recipes").select("*").eq("shared", true).order("updated_at", { ascending: false });
    if (error) throw error;
    state.library = (data || []).map(dbToLocal);
    await loadLibraryProfiles();
  } catch (error) {
    state.library = [];
    state.libraryProfiles = {};
    state.libraryError = error?.message || "Bibliotheek laden mislukt";
  } finally {
    state.libraryLoading = false;
    render();
  }
}

async function saveRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  const { error } = await db.from("recipes").upsert({ ...dbRecipe, user_id: state.user.id });
  state.saveMessage = error ? "Fout bij opslaan" : "Opgeslagen";
  const el = document.querySelector("[data-save-message]");
  if (el) el.textContent = state.saveMessage;
  if (!error) saveAutomaticBackup("auto");
}

async function deleteRecipeFromDB(id) {
  const { data, error } = await db.from("recipes").delete().eq("id", id).eq("user_id", state.user.id).select("id");
  return { ok: !error && Array.isArray(data) && data.length > 0, error };
}

async function insertRecipeToDB(recipe) {
  const dbRecipe = localToDB(recipe);
  delete dbRecipe.id;
  const { data, error } = await db.from("recipes").insert({ ...dbRecipe, user_id: state.user.id }).select().single();
  if (error) { state.saveMessage = "Fout bij aanmaken"; return null; }
  return dbToLocal(data);
}

// ─── Profiel ──────────────────────────────────────────────────────────────────
function legacyGeneralNotesStorageKey() {
  return `broodboek:general-notes:${state.user?.id || "anon"}`;
}

function notePagesStorageKey() {
  return `broodboek:note-pages:${state.user?.id || "anon"}`;
}

function makeUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16 >> Number(c) / 4)).toString(16));
}

function makeNotePage(title = "Algemene tips", content = "") {
  return {
    id: makeUuid(),
    title,
    content,
    sortOrder: state.notePages.length,
    updatedAt: new Date().toISOString(),
  };
}

function normaliseNotePage(row, index = 0) {
  return {
    id: row.id || makeNotePage().id,
    title: row.title || "Naamloos notitieblad",
    content: row.content || "",
    sortOrder: Number.isFinite(Number(row.sortOrder ?? row.sort_order)) ? Number(row.sortOrder ?? row.sort_order) : index,
    updatedAt: row.updatedAt || row.updated_at || "",
  };
}

function readLocalNotePages() {
  try {
    const raw = localStorage.getItem(notePagesStorageKey());
    const pages = raw ? JSON.parse(raw) : [];
    if (Array.isArray(pages) && pages.length) return pages.map(normaliseNotePage);
    const legacy = localStorage.getItem(legacyGeneralNotesStorageKey()) || "";
    return [makeNotePage("Algemene tips", legacy)];
  } catch {
    return [makeNotePage()];
  }
}

function writeLocalNotePages(pages = state.notePages) {
  try { localStorage.setItem(notePagesStorageKey(), JSON.stringify(pages)); } catch {}
}

function getActiveNotePage() {
  return state.notePages.find((page) => page.id === state.selectedNotePageId) || state.notePages[0] || null;
}

async function loadGeneralNotes() {
  state.notePages = readLocalNotePages();
  state.selectedNotePageId = state.selectedNotePageId || state.notePages[0]?.id || "";
  state.generalNotesError = "";
  if (!state.user) return;
  const { data, error } = await db
    .from("user_note_pages")
    .select("id, title, content, sort_order, updated_at")
    .eq("user_id", state.user.id)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) {
    state.generalNotesError = "Online notitiebladen nog niet ingericht in Supabase";
    return;
  }
  if (Array.isArray(data) && data.length) {
    state.notePages = data.map(normaliseNotePage);
    state.selectedNotePageId = state.notePages.some((page) => page.id === state.selectedNotePageId) ? state.selectedNotePageId : state.notePages[0].id;
    writeLocalNotePages();
  }
}

async function saveNotePage(page = getActiveNotePage()) {
  if (!page || !state.user) return;
  page.updatedAt = new Date().toISOString();
  writeLocalNotePages();
  state.generalNotesError = "";
  const { error } = await db.from("user_note_pages").upsert({
    id: page.id,
    user_id: state.user.id,
    title: page.title || "Naamloos notitieblad",
    content: page.content || "",
    sort_order: page.sortOrder || 0,
    updated_at: page.updatedAt,
  });
  if (error) {
    state.generalNotesError = "Online notitiebladen nog niet ingericht in Supabase";
    state.saveMessage = "Notitie lokaal bewaard";
  } else {
    state.saveMessage = "Notitieblad opgeslagen";
  }
  const saveEl = document.querySelector("[data-notes-save-state]");
  if (saveEl) saveEl.textContent = state.saveMessage;
}

function scheduleNotePageSave(page = getActiveNotePage()) {
  clearTimeout(notesSaveTimer);
  state.saveMessage = "Notitie niet opgeslagen";
  const saveEl = document.querySelector("[data-notes-save-state]");
  if (saveEl) saveEl.textContent = state.saveMessage;
  notesSaveTimer = setTimeout(() => saveNotePage(page), 900);
}

async function deleteNotePage(id) {
  const page = state.notePages.find((item) => item.id === id);
  if (!page || state.notePages.length <= 1) return;
  state.notePages = state.notePages.filter((item) => item.id !== id).map((item, index) => ({ ...item, sortOrder: index }));
  state.selectedNotePageId = state.notePages[0]?.id || "";
  writeLocalNotePages();
  if (state.user) await db.from("user_note_pages").delete().eq("id", id).eq("user_id", state.user.id);
  state.saveMessage = `"${page.title || "Notitieblad"}" verwijderd`;
  render();
}

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

async function uploadRecipePhoto(recipe, file) {
  if (!file.type.startsWith("image/")) return { error: "Kies een afbeeldingbestand" };
  if (file.size > 10 * 1024 * 1024) return { error: "Foto is groter dan 10 MB" };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${state.user.id}/${recipe.id}/brood.${ext}`;
  const { error } = await db.storage.from("recipe-photos").upload(path, file, { upsert: true, contentType: file.type });
  if (error) return { error: error.message };
  const { data } = db.storage.from("recipe-photos").getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

async function loadLibraryProfiles() {
  if (state.library.length === 0) { state.libraryProfiles = {}; return; }
  const userIds = [...new Set(state.library.map((r) => r.userId).filter(Boolean))];
  if (userIds.length === 0) { state.libraryProfiles = {}; return; }
  const { data, error } = await db.from("profiles").select("id, display_name, avatar_url").in("id", userIds);
  if (error) throw error;
  state.libraryProfiles = Object.fromEntries((data || []).map((p) => [p.id, p]));
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
    photoUrl: Array.isArray(row.notes) ? (row.notes.find((n) => n?.type === "recipe-photo")?.url || "") : "",
    flours: Array.isArray(row.flours) ? row.flours : [],
    additions: Array.isArray(row.additions) ? row.additions : [],
    notes: Array.isArray(row.notes) ? row.notes : [],
  };
  r.flours = r.flours.filter((i) => i.name || i.percentage > 0);
  r.additions = r.additions.filter((i) => i.name || i.percentage > 0);
  r.notes = r.notes.filter((n) => n?.type !== "recipe-photo");
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
    notes: [
      ...(recipe.photoUrl ? [{ type: "recipe-photo", url: recipe.photoUrl }] : []),
      ...recipe.notes.filter((n) => n?.type !== "recipe-photo"),
    ],
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
    category: "Overig", leavening: "gist", description: "", favorite: false, shared: false, photoUrl: "",
    lastUsedAt: Date.now(),
    flours: [{ name: "", percentage: 0, unit: "g", _new: true }],
    additions: [],
    notes: [],
  };
}
function cloneRecipe(recipe) {
  return { ...structuredClone(recipe), name: `${recipe.name} kopie`, favorite: false, shared: false, photoUrl: "", lastUsedAt: Date.now() };
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

function createBackupPayload() {
  return { exportedAt: new Date().toISOString(), app: "Broodboek", recipes: state.recipes, notePages: state.notePages };
}

function backupStorageKey() {
  return `broodboek:auto-backups:${state.user?.id || "anon"}`;
}

function backupReminderKey() {
  return `broodboek:backup-reminder-dismissed:${state.user?.id || "anon"}`;
}

function readBackupReminderDismissed() {
  try { return localStorage.getItem(backupReminderKey()) || ""; } catch { return ""; }
}

function dismissBackupReminder() {
  state.backupReminderDismissed = todayValue();
  try { localStorage.setItem(backupReminderKey(), state.backupReminderDismissed); } catch {}
}

function backupChecksum(serialized) {
  let hash = 0;
  for (let i = 0; i < serialized.length; i += 1) hash = ((hash << 5) - hash + serialized.charCodeAt(i)) | 0;
  return String(hash);
}

function backupContentChecksum(payload) {
  return backupChecksum(JSON.stringify({ app: payload?.app || "Broodboek", recipes: payload?.recipes || [] }));
}

function readAutomaticBackups() {
  try {
    const raw = localStorage.getItem(backupStorageKey());
    const backups = raw ? JSON.parse(raw) : [];
    return Array.isArray(backups) ? backups : [];
  } catch { return []; }
}

function localBackupToPanel(backup) {
  try {
    const payload = backup.serialized ? JSON.parse(backup.serialized) : backup.payload;
    return {
      id: backup.id || backup.createdAt || String(Date.now()),
      createdAt: backup.createdAt || payload?.exportedAt || new Date().toISOString(),
      reason: backup.reason || "auto",
      recipeCount: backup.recipeCount ?? payload?.recipes?.length ?? 0,
      payload,
      checksum: backupContentChecksum(payload || {}),
      source: "lokaal",
    };
  } catch {
    return null;
  }
}

function writeAutomaticBackups(backups) {
  try { localStorage.setItem(backupStorageKey(), JSON.stringify(backups.slice(0, 20))); } catch {}
}

function backupHasRecipes(backup) {
  return Array.isArray(backup?.payload?.recipes) && backup.payload.recipes.length > 0;
}

function getPanelBackups() {
  const server = state.backups || [];
  const local = readAutomaticBackups().map(localBackupToPanel).filter(Boolean);
  const seen = new Set();
  return [...server, ...local]
    .filter(backupHasRecipes)
    .filter((backup) => {
      const key = backup.checksum || backupContentChecksum(backup.payload || {}) || backup.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 20);
}

async function loadServerBackups() {
  if (!state.user) return;
  const { data, error } = await db
    .from("recipe_backups")
    .select("id, created_at, reason, recipe_count, payload, checksum")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    state.backups = [];
    state.backupSyncStatus = "Supabase-backups zijn nog niet ingericht";
    return;
  }
  state.backups = (data || []).map((backup) => ({
    id: backup.id,
    createdAt: backup.created_at,
    reason: backup.reason || "auto",
    recipeCount: backup.recipe_count || 0,
    payload: backup.payload,
    checksum: backupContentChecksum(backup.payload || {}),
    source: "Supabase",
  }));
  state.backupSyncStatus = "";
}

async function saveServerBackup(payload, serialized, reason, checksum) {
  if (!state.user) return;
  if (reason !== "handmatig" && state.backups[0]?.checksum === checksum) return;
  const { error } = await db.from("recipe_backups").insert({
    user_id: state.user.id,
    reason,
    recipe_count: state.recipes.length,
    payload,
    checksum,
  });
  if (error) { state.backupSyncStatus = "Supabase-backups zijn nog niet ingericht"; return; }
  await loadServerBackups();
  const { data: older } = await db
    .from("recipe_backups")
    .select("id")
    .eq("user_id", state.user.id)
    .order("created_at", { ascending: false })
    .range(20, 200);
  const extra = (older || []).map((backup) => backup.id);
  if (extra.length) await db.from("recipe_backups").delete().in("id", extra);
}

async function saveAutomaticBackup(reason = "auto") {
  if (!state.user) return;
  const payload = createBackupPayload();
  const serialized = JSON.stringify(payload);
  const checksum = backupContentChecksum(payload);
  if (state.recipes.length === 0) return;
  const backups = getPanelBackups();
  if (backups[0]?.checksum === checksum || backups[0]?.serialized === serialized) {
    await saveServerBackup(payload, serialized, reason, checksum);
    return;
  }
  const localBackups = readAutomaticBackups().filter((backup) => backup.checksum !== checksum && backup.serialized !== serialized);
  localBackups.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: payload.exportedAt,
    reason,
    recipeCount: state.recipes.length,
    checksum,
    serialized,
  });
  writeAutomaticBackups(localBackups);
  await saveServerBackup(payload, serialized, reason, checksum);
}

function daysSince(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return Infinity;
  return (Date.now() - time) / 86400000;
}

function shouldShowBackupReminder() {
  if (!state.user || state.recipes.length === 0 || state.backupPanelOpen || state.faqPanelOpen || state.supportPanelOpen || state.confirmDialog) return false;
  if (state.backupReminderDismissed === todayValue()) return false;
  const backups = getPanelBackups();
  const latestManual = backups.find((backup) => backup.reason === "handmatig" && backup.source === "Supabase");
  if (!latestManual) return true;
  return daysSince(latestManual.createdAt) >= BACKUP_REMINDER_DAYS;
}

function formatBackupDate(value) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
function downloadJsonBackup() {
  saveAutomaticBackup("handmatig");
  const blob = new Blob([JSON.stringify(createBackupPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `broodboek-volledige-backup-${todayValue()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function makeOnlineBackup() {
  await saveAutomaticBackup("handmatig");
  await loadServerBackups();
  dismissBackupReminder();
  state.saveMessage = state.backupSyncStatus ? "Online backup nog niet ingericht in Supabase" : "Online backup gelukt";
  render();
}

function makeSheet(rows) {
  return window.XLSX.utils.json_to_sheet(rows.length ? rows : [{ leeg: "Geen gegevens" }]);
}

const FAQ_ITEMS = [
  ["Waar worden mijn recepten opgeslagen?", "Je recepten worden online opgeslagen in Supabase en zijn gekoppeld aan je account."],
  ["Wat is automatisch back-uppen?", "De app maakt na wijzigingen een veiligheidskopie, zodat je minder snel werk kwijtraakt."],
  ["Wat is handmatig back-uppen?", "Met Online backup maken zet je bewust een checkpoint vast. Dat is handig voor grote wijzigingen of voordat je recepten verwijdert."],
  ["Hoe zet ik een backup terug?", "Ga naar Opties, kies Backup terugzetten en selecteer een datum. De recepten uit die backup worden toegevoegd aan je huidige recepten."],
  ["Wat is het verschil tussen Excel en volledige backup?", "Excel is bedoeld om je recepten buiten de app te bekijken. De volledige JSON-backup is bedoeld om recepten terug te zetten."],
  ["Hoe deel ik een recept?", "Gebruik de deelknop bij een recept. Daarna kan een andere gebruiker het recept in de Bibliotheek bekijken en kopiëren."],
  ["Waarom is de bibliotheek leeg?", "Dan zijn er geen recepten van anderen gedeeld, of de bibliotheek kon niet laden. In dat laatste geval toont de app een foutmelding met opnieuw proberen."],
  ["Hoe werken percentages en grammen?", "Bloem/meel is de basis. Vul je een percentage in, dan rekent de app grammen uit. Vul je grammen in bij meel, dan rekent de app het percentage terug."],
  ["Hoe voeg ik een broodfoto toe?", "Open een recept en kies Broodfoto toevoegen. Je kunt direct een foto maken of een bestaande foto uit je bibliotheek kiezen."],
  ["Wat gebeurt er als ik een recept verwijder?", "Het recept wordt uit je account verwijderd. Terughalen kan alleen via een eerder gemaakte backup."],
];

const SUPPORT_CATEGORIES = ["Vraag", "Bug", "Wens", "Account", "Backup"];
const SUPPORT_PRIORITIES = ["Normaal", "Hoog"];
const SUPPORT_STATUSES = ["nieuw", "in_behandeling", "beantwoord", "gesloten"];

function supportStatusLabel(status) {
  return ({
    nieuw: "Nieuw",
    in_behandeling: "In behandeling",
    beantwoord: "Beantwoord",
    gesloten: "Gesloten",
  })[status] || status || "Nieuw";
}

function formatSupportDate(value) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

async function loadDeveloperStatus() {
  state.isDeveloper = false;
  if (!state.user?.email) return;
  const { data, error } = await db
    .from("app_developers")
    .select("email")
    .ilike("email", state.user.email)
    .maybeSingle();
  state.isDeveloper = !error && !!data;
}

async function loadSupportTickets() {
  state.supportLoading = true;
  state.supportError = "";
  render();
  const { data, error } = await db
    .from("support_tickets")
    .select("id,user_id,user_email,subject,message,category,priority,status,developer_reply,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  state.supportLoading = false;
  if (error) {
    state.supportError = "Supporttickets laden lukt nog niet. Voer eerst het Supabase SQL-script uit.";
    state.supportTickets = [];
  } else {
    state.supportTickets = data || [];
  }
  render();
}

async function submitSupportTicket() {
  const subject = state.supportDraft.subject.trim();
  const message = state.supportDraft.message.trim();
  const category = state.supportDraft.category || "Vraag";
  const priority = state.supportDraft.priority || "Normaal";
  if (!subject || !message) {
    state.supportError = "Vul een onderwerp en bericht in.";
    render();
    return;
  }
  state.supportLoading = true;
  state.supportError = "";
  render();
  const { data, error } = await db.from("support_tickets").insert({
    user_id: state.user.id,
    user_email: state.user.email,
    subject,
    message,
    category,
    priority,
  }).select("id").single();
  state.supportLoading = false;
  if (error) {
    state.supportError = `Ticket versturen mislukt: ${error.message}`;
    render();
    return;
  }
  const { error: notifyError } = await db.functions.invoke("notify-support-ticket", {
    body: { ticketId: data.id },
  });
  state.saveMessage = notifyError
    ? "Supportvraag verstuurd, maar mailmelding niet gelukt"
    : "Supportvraag verstuurd";
  state.supportDraft = { category: "Vraag", priority: "Normaal", subject: "", message: "" };
  await loadSupportTickets();
}

async function updateSupportTicket(ticketId) {
  const status = document.querySelector(`[data-ticket-status="${ticketId}"]`)?.value || "nieuw";
  const reply = document.querySelector(`[data-ticket-reply="${ticketId}"]`)?.value || "";
  state.supportLoading = true;
  state.supportError = "";
  render();
  const { error } = await db
    .from("support_tickets")
    .update({ status, developer_reply: reply, updated_at: new Date().toISOString() })
    .eq("id", ticketId);
  state.supportLoading = false;
  if (error) {
    state.supportError = `Ticket bijwerken mislukt: ${error.message}`;
    render();
    return;
  }
  state.saveMessage = "Supportticket bijgewerkt";
  await loadSupportTickets();
}

async function deleteSupportTicket(ticketId) {
  state.supportLoading = true;
  state.supportError = "";
  render();
  const { error } = await db.from("support_tickets").delete().eq("id", ticketId);
  state.supportLoading = false;
  if (error) {
    state.supportError = `Ticket verwijderen mislukt: ${error.message}`;
    render();
    return;
  }
  state.saveMessage = "Supportticket verwijderd";
  await loadSupportTickets();
}

function renderBackupPanel() {
  if (!state.backupPanelOpen) return "";
  const backups = getPanelBackups();
  return `
    <div class="confirm-backdrop" data-backup-backdrop role="dialog" aria-modal="true" aria-label="Backup terugzetten">
      <section class="backup-panel">
        <div class="backup-panel-head">
          <div>
            <h3>Backup terugzetten</h3>
            <p>Kies een Supabase-backup met datum, of zet een volledig JSON-bestand terug.</p>
          </div>
          <button class="icon-action" data-close-backup-panel type="button" aria-label="Sluit backupvenster">&times;</button>
        </div>
        <div class="backup-list">
          ${backups.length ? backups.map((backup) => `
            <button class="backup-item" data-restore-stored-backup="${esc(backup.id)}" type="button">
              <span>
                <strong>${esc(formatBackupDate(backup.createdAt))}</strong>
                <small>${backup.recipeCount} recept${backup.recipeCount === 1 ? "" : "en"} · ${backup.source} · ${backup.reason === "handmatig" ? "handmatig" : "automatisch"}</small>
              </span>
              ${icon("arrowLeft")}
            </button>`).join("") : `<p class="empty-state">Nog geen backups gevonden. Maak eerst een backup of richt Supabase-backups in.</p>`}
          ${state.backupSyncStatus ? `<p class="empty-state">${esc(state.backupSyncStatus)}</p>` : ""}
        </div>
        <div class="backup-panel-actions">
          <button class="tool-button" data-make-auto-backup type="button">${icon("save")}Online backup maken</button>
          <button class="tool-button" data-download-json-backup type="button">${icon("save")}JSON downloaden</button>
          <label class="tool-button file-tool">${icon("plus")}JSON-bestand kiezen<input data-import-recipes type="file" accept="application/json,.json" /></label>
        </div>
      </section>
    </div>`;
}

function renderFaqPanel() {
  if (!state.faqPanelOpen) return "";
  return `
    <div class="confirm-backdrop" data-faq-backdrop role="dialog" aria-modal="true" aria-label="Veelgestelde vragen">
      <section class="backup-panel faq-panel">
        <div class="backup-panel-head">
          <div>
            <h3>Veelgestelde vragen</h3>
            <p>Korte antwoorden op de belangrijkste vragen over recepten, backups en delen.</p>
          </div>
          <button class="icon-action" data-close-faq-panel type="button" aria-label="Sluit veelgestelde vragen">&times;</button>
        </div>
        <div class="faq-list">
          ${FAQ_ITEMS.map(([question, answer]) => `
            <details class="faq-item">
              <summary>${esc(question)}</summary>
              <p>${esc(answer)}</p>
            </details>`).join("")}
        </div>
      </section>
    </div>`;
}

function renderSupportPanel() {
  if (!state.supportPanelOpen) return "";
  return `
    <div class="confirm-backdrop" data-support-backdrop role="dialog" aria-modal="true" aria-label="Supportvraag stellen">
      <section class="backup-panel support-panel">
        <div class="backup-panel-head">
          <div>
            <h3>Support / vraag stellen</h3>
            <p>Stuur een vraag, foutmelding of wens rechtstreeks naar de developer.</p>
          </div>
          <button class="icon-action" data-close-support-panel type="button" aria-label="Sluit supportvenster">&times;</button>
        </div>
        <form class="support-form" data-support-form>
          <div class="support-row">
            <label><span>Categorie</span><select name="category" data-support-draft="category">${SUPPORT_CATEGORIES.map((item) => `<option value="${esc(item)}" ${state.supportDraft.category === item ? "selected" : ""}>${esc(item)}</option>`).join("")}</select></label>
            <label><span>Urgentie</span><select name="priority" data-support-draft="priority">${SUPPORT_PRIORITIES.map((item) => `<option value="${esc(item)}" ${state.supportDraft.priority === item ? "selected" : ""}>${esc(item)}</option>`).join("")}</select></label>
          </div>
          <label><span>Onderwerp</span><input name="subject" data-support-draft="subject" type="text" value="${esc(state.supportDraft.subject)}" placeholder="Bijv. foto uploaden lukt niet" required /></label>
          <label><span>Bericht</span><textarea name="message" data-support-draft="message" placeholder="Beschrijf wat je probeerde en wat er gebeurde." required>${esc(state.supportDraft.message)}</textarea></label>
          <button class="tool-button primary" type="submit" ${state.supportLoading ? "disabled" : ""}>${icon("plus")}Ticket versturen</button>
        </form>
        ${state.supportError ? `<p class="support-error">${esc(state.supportError)}</p>` : ""}
        <div class="support-ticket-list">
          <div class="support-list-head">
            <h4>${state.isDeveloper ? "Alle supporttickets" : "Mijn supporttickets"}</h4>
            <button class="tool-button" data-refresh-support type="button" ${state.supportLoading ? "disabled" : ""}>Vernieuwen</button>
          </div>
          ${state.supportLoading ? `<p class="empty-state">Supporttickets laden...</p>` : state.supportTickets.length ? state.supportTickets.map((ticket) => `
            <article class="support-ticket">
              <div class="support-ticket-head">
                <div>
                  <strong>${esc(ticket.subject)}</strong>
                  <small>${esc(formatSupportDate(ticket.created_at))} · ${esc(ticket.category)} · ${esc(ticket.priority)}${state.isDeveloper ? ` · ${esc(ticket.user_email)}` : ""}</small>
                </div>
                <div class="support-ticket-actions">
                  <span class="support-status status-${esc(ticket.status)}">${esc(supportStatusLabel(ticket.status))}</span>
                  <button class="icon-action danger" data-delete-support-ticket="${esc(ticket.id)}" type="button" title="Ticket verwijderen" aria-label="Ticket verwijderen">${icon("trash")}</button>
                </div>
              </div>
              <p>${esc(ticket.message)}</p>
              ${ticket.developer_reply ? `<div class="support-reply"><strong>Reactie developer</strong><p>${esc(ticket.developer_reply)}</p></div>` : ""}
              ${state.isDeveloper ? `
                <div class="support-admin">
                  <label><span>Status</span><select data-ticket-status="${esc(ticket.id)}">${SUPPORT_STATUSES.map((status) => `<option value="${esc(status)}" ${ticket.status === status ? "selected" : ""}>${esc(supportStatusLabel(status))}</option>`).join("")}</select></label>
                  <label><span>Reactie</span><textarea data-ticket-reply="${esc(ticket.id)}">${esc(ticket.developer_reply || "")}</textarea></label>
                  <button class="tool-button primary" data-save-ticket="${esc(ticket.id)}" type="button">Opslaan</button>
                </div>` : ""}
            </article>`).join("") : `<p class="empty-state">Nog geen supporttickets. Stel hierboven je eerste vraag.</p>`}
        </div>
      </section>
    </div>`;
}
function downloadExcelBackup() {
  if (!window.XLSX) {
    state.saveMessage = "Excel-backup niet geladen. Controleer je internetverbinding en probeer opnieuw.";
    render();
    return;
  }

  const recipes = state.recipes.map((recipe) => ({
    Recept: recipe.name || "",
    Categorie: recipe.category || "",
    Rijsmiddel: recipe.leavening || "",
    Favoriet: recipe.favorite ? "Ja" : "Nee",
    Gedeeld: recipe.shared ? "Ja" : "Nee",
    "Bloem totaal (g)": recipe.flourTotal || 0,
    "Deeg totaal (g)": Math.round(getTotalDoughWeight(recipe)),
    "Hydratatie (%)": Math.round(getHydration(recipe) * 1000) / 10,
    "Aantal broden": recipe.loafCount || 1,
    Beschrijving: recipe.description || "",
    Werkwijze: recipe.method || "",
  }));

  const flours = state.recipes.flatMap((recipe) => calculateFlours(recipe)
    .filter((item) => item.name || item.percentage || item.amount)
    .map((item) => ({
      Recept: recipe.name || "",
      Meelsoort: item.name || "",
      "Percentage (%)": item.percentage || 0,
      Hoeveelheid: Math.round((item.amount || 0) * 10) / 10,
      Eenheid: item.unit || "g",
    })));

  const additions = state.recipes.flatMap((recipe) => calculateAdditions(recipe)
    .filter((item) => item.name || item.percentage || item.amount)
    .map((item) => ({
      Recept: recipe.name || "",
      Ingredient: item.name || "",
      "Percentage (%)": item.percentage || 0,
      Hoeveelheid: Math.round((item.amount || 0) * 10) / 10,
      Eenheid: item.unit || "g",
    })));

  const notes = state.recipes.flatMap((recipe) => (recipe.notes || []).map((note) => ({
    Recept: recipe.name || "",
    Datum: note.date || "",
    Beoordeling: ratingLabel(note.rating),
    "Oven (C)": note.ovenTemp || "",
    Notitie: note.text || "",
    "Snapshot bloem totaal (g)": note.snapshot?.flourTotal || "",
    "Snapshot deeg totaal (g)": note.snapshot?.doughWeight || "",
  })));

  const photos = state.recipes
    .filter((recipe) => recipe.photoUrl)
    .map((recipe) => ({ Recept: recipe.name || "", Foto: recipe.photoUrl }));

  const generalNotes = state.notePages.map((page) => ({ Titel: page.title || "", Notities: page.content || "", "Laatst gewijzigd": page.updatedAt || "" }));

  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, makeSheet(recipes), "Recepten");
  window.XLSX.utils.book_append_sheet(wb, makeSheet(flours), "Meelsoorten");
  window.XLSX.utils.book_append_sheet(wb, makeSheet(additions), "Ingredienten");
  window.XLSX.utils.book_append_sheet(wb, makeSheet(notes), "Logboek");
  window.XLSX.utils.book_append_sheet(wb, makeSheet(photos), "Fotos");
  window.XLSX.utils.book_append_sheet(wb, makeSheet(generalNotes), "Notitieblad");
  window.XLSX.writeFile(wb, `mijn-broodboek-backup-${todayValue()}.xlsx`);
  saveAutomaticBackup("handmatig");
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
    refresh: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/>',
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
        <div class="brand-copy">
          <h1>Mijn Broodboek</h1>
          <p>Recepten en baknotities</p>
        </div>
      </div>
      ${showBack ? `
        <nav class="main-nav">
          <button class="nav-btn" data-go-back>${icon("arrowLeft")}${esc(backLabel)}</button>
        </nav>` : `
        <nav class="main-nav">
          <button class="nav-btn ${state.screen === "myrecipes" ? "active" : ""}" data-screen="myrecipes">${icon("grain")}Mijn recepten</button>
          <button class="nav-btn ${state.screen === "library" ? "active" : ""}" data-screen="library">${icon("book")}Bibliotheek</button>
          <button class="nav-btn ${state.screen === "notes" ? "active" : ""}" data-screen="notes">${icon("note")}Notities</button>
        </nav>`}
      <div class="topbar-user">
        <details class="more-options app-options">
          <summary>Opties</summary>
          <div class="more-options-list">
            <button class="tool-button wide" data-export-excel type="button">${icon("save")}Excel-backup</button>
            <button class="tool-button wide" data-online-backup type="button">${icon("save")}Online backup maken</button>
            <button class="tool-button wide" data-open-backup-panel type="button">${icon("plus")}Backup terugzetten</button>
            <button class="tool-button wide" data-open-faq-panel type="button">${icon("book")}Veelgestelde vragen</button>
            <button class="tool-button wide" data-open-support-panel type="button">${icon("note")}Support / vraag stellen</button>
          </div>
        </details>
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
          <div><h1>Mijn Broodboek</h1></div>
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
              ${isForgot ? "" : isLogin ? `
                <label><span>Wachtwoord</span><input id="auth-password" type="password" placeholder="minimaal 6 tekens" autocomplete="current-password" /></label>
              ` : `
                <label><span>Wachtwoord</span><input id="auth-password" type="password" placeholder="minimaal 6 tekens" autocomplete="new-password" /></label>
                <label><span>Herhaal wachtwoord</span><input id="auth-password-repeat" type="password" placeholder="nog een keer" autocomplete="new-password" /></label>
              `}
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
    if (state.authView !== "login" && password.length < 6) { state.saveMessage = "Kies een wachtwoord van minimaal 6 tekens"; renderAuthScreen(); return; }
    if (state.authView !== "login") {
      const repeat = document.getElementById("auth-password-repeat")?.value || "";
      if (password !== repeat) { state.saveMessage = "De wachtwoorden zijn niet gelijk"; renderAuthScreen(); return; }
    }
    const result = state.authView === "login" ? await signIn(email, password) : await signUp(email, password);
    const error = result.error;
    if (!error && state.authView === "register") { state.saveMessage = "Account aangemaakt — controleer je e-mail en log daarna in."; state.authView = "login"; renderAuthScreen(); return; }
    if (error) { state.saveMessage = error; renderAuthScreen(); return; }
    state.user = result.user || state.user;
    state.screen = "myrecipes";
    state.saveMessage = "Gegevens laden...";
    render();
    loadSignedInData().then(render);
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
                <article class="recipe-tile" data-open-recipe-card="${esc(r.id)}" tabindex="0">
                  ${r.photoUrl ? `<img class="recipe-tile-photo" src="${esc(r.photoUrl)}" alt="${esc(r.name)}" loading="lazy" />` : ""}
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
    if (state.libraryLoading) return `<div class="library-state"><strong>Bibliotheek laden...</strong><span>We halen gedeelde recepten op uit Supabase.</span></div>`;
    if (state.libraryError) return `<div class="library-state error"><strong>Bibliotheek laden mislukt</strong><span>${esc(state.libraryError)}</span><button class="tool-button" data-retry-library type="button">${icon("refresh")}Opnieuw proberen</button></div>`;
    const others = state.library.filter((r) => r.userId !== state.user.id && !state.hiddenRecipes.has(r.id));
    if (others.length === 0) return `<div class="library-state"><strong>Geen gedeelde recepten</strong><span>Er zijn nu geen recepten van anderen zichtbaar. Zodra iemand een recept deelt verschijnt het hier.</span></div>`;

    const renderCard = (item) => {
      const profile = state.libraryProfiles[item.userId];
      const naam = profile?.display_name || "Onbekend";
      const avatarUrl = profile?.avatar_url;
      const avatarHtml = avatarUrl
        ? `<img src="${esc(avatarUrl)}" class="avatar-tiny" alt="${esc(naam)}" />`
        : `<div class="avatar-tiny avatar-placeholder">${esc(naam.charAt(0).toUpperCase())}</div>`;

      return `
      <article class="recipe-tile">
        ${item.photoUrl ? `<img class="recipe-tile-photo" src="${esc(item.photoUrl)}" alt="${esc(item.name)}" loading="lazy" />` : ""}
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

// ─── Notitieblad scherm ───────────────────────────────────────────────────────
function renderNotes() {
  const active = getActiveNotePage() || makeNotePage();
  const query = state.noteSearch.trim().toLowerCase();
  const visiblePages = query
    ? state.notePages.filter((page) => `${page.title || ""} ${page.content || ""}`.toLowerCase().includes(query))
    : state.notePages;
  const savedText = active.updatedAt ? `Laatst gewijzigd: ${esc(formatBackupDate(active.updatedAt))}` : "Automatisch opslaan staat aan.";
  return `
    <main class="app-shell">
      ${renderTopbar()}
      <section class="notes-screen">
        <div class="tile-screen-header notes-header">
          <div>
            <h2>Notities</h2>
            <p>Algemene baktips, ovenstanden, deegobservaties en dingen die je later wilt onthouden.</p>
          </div>
          <button class="tool-button primary" data-add-note-page type="button">${icon("plus")}Nieuw blad</button>
        </div>
        ${state.generalNotesError ? `<p class="library-state error"><strong>Online opslaan nog niet actief</strong><span>${esc(state.generalNotesError)}. Je notities worden voorlopig lokaal op dit apparaat bewaard.</span></p>` : ""}
        <div class="notes-layout">
          <aside class="note-pages-sidebar" aria-label="Notitiebladen">
            <label class="note-search-field">
              <span>Zoeken</span>
              <input data-note-search type="search" value="${esc(state.noteSearch)}" placeholder="Zoek in notities" />
            </label>
            <div class="note-page-list">
              ${visiblePages.length ? visiblePages.map((page) => `
                <button class="note-page-tab ${page.id === active.id ? "active" : ""}" data-note-page="${esc(page.id)}" type="button">
                  <strong>${esc(page.title || "Naamloos")}</strong>
                  <span>${esc(preview(page.content || "Nog geen tekst"))}</span>
                </button>`).join("") : `<p class="empty-state">Geen notitiebladen gevonden.</p>`}
            </div>
          </aside>
          <div class="note-page-editor">
            <label class="general-notes-field note-title-field">
              <span>Titel</span>
              <input data-note-title type="text" value="${esc(active.title || "")}" placeholder="Bijv. Oven, Desem, Rijstijden" />
            </label>
            <label class="general-notes-field dictation-field">
              <span class="field-header">Notities
                <button class="dictate-button" data-dictate-target="[data-general-notes]" type="button">${icon("mic")}Inspreken</button>
              </span>
              <textarea data-general-notes rows="16" placeholder="Bijvoorbeeld: oven 20 minuten voorverwarmen op 245 graden, daarna terug naar 220. Desemstarter piekt meestal na 5 uur bij 22 graden...">${esc(active.content || "")}</textarea>
              <small class="dictation-status" data-dictation-status></small>
            </label>
            <div class="note-editor-footer">
              <p class="save-message" data-notes-save-state>${savedText}</p>
              <button class="tool-button danger" data-delete-note-page="${esc(active.id)}" type="button" ${state.notePages.length <= 1 ? "disabled" : ""}>${icon("trash")}Verwijder blad</button>
            </div>
          </div>
        </div>
      </section>
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
                <button class="tool-button danger wide" data-delete-recipe type="button">${icon("trash")}Verwijder recept</button>
              </div>
            </details>
            <p class="save-message" data-save-message>${state.saveMessage}</p>
          </div>
        </div>

        <div class="workbench-body">
          <details class="recipe-photo-panel" ${recipe.photoUrl ? "open" : ""}>
            <summary>
              <span>${recipe.photoUrl ? "Broodfoto" : "Broodfoto toevoegen"}</span>
              ${recipe.photoUrl ? `<img class="recipe-photo-thumb" src="${esc(recipe.photoUrl)}" alt="${esc(recipe.name)}" />` : ""}
            </summary>
            <div class="recipe-photo-content">
              ${recipe.photoUrl ? `<button class="recipe-photo-button" data-open-photo-preview type="button" aria-label="Vergroot broodfoto"><img class="recipe-photo" src="${esc(recipe.photoUrl)}" alt="${esc(recipe.name)}" /></button>` : `<div class="recipe-photo-placeholder">Nog geen broodfoto</div>`}
              <div class="recipe-photo-actions">
                <label class="tool-button file-tool">${icon("plus")}${recipe.photoUrl ? "Nieuwe foto maken" : "Maak foto"}<input data-recipe-photo type="file" accept="image/*" capture="environment" /></label>
                <label class="tool-button file-tool">${icon("book")}Kies uit bibliotheek<input data-recipe-photo type="file" accept="image/*" /></label>
                ${recipe.photoUrl ? `<button class="tool-button danger" data-remove-recipe-photo type="button">${icon("trash")}Verwijder foto</button>` : ""}
              </div>
            </div>
          </details>

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
              <label class="description-field dictation-field">
                <span class="field-header">Beschrijving
                  <button class="dictate-button" data-dictate-target="[data-recipe-description]" type="button">${icon("mic")}Inspreken</button>
                </span>
                <textarea data-recipe-description rows="3" placeholder="Korte omschrijving voor je receptenoverzicht en de bibliotheek.">${esc(recipe.description || "")}</textarea>
                <small class="dictation-status" data-dictation-status></small>
              </label>
            </div>
          </div>

          <div class="tabbar" role="tablist">
            <button class="${state.activeTab === "ingredients" ? "active" : ""}" data-tab="ingredients" type="button">Ingrediënten</button>
            <button class="${state.activeTab === "method" ? "active" : ""}" data-tab="method" type="button">Werkwijze</button>
            <button class="${state.activeTab === "logbook" ? "active" : ""}" data-tab="logbook" type="button">Logboek</button>
          </div>

          <div class="metric-row">
            <div>${icon("grain")}<span>Bloem/meel</span><strong data-flour-display>${fmtW(flourTotal)}</strong></div>
            <div>${icon("flame")}<span>Hydratatie</span><strong data-hydration>${fmtPct(hydration)}</strong></div>
            <div>${icon("scale")}<span>Deeggewicht</span><strong data-dough-weight>${fmtW(totalDoughWeight)}</strong></div>
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
                  ` : `<table class="ingredients-table">
                    <colgroup><col class="col-name"><col class="col-percent"><col class="col-amount"><col class="col-action"></colgroup>
                    <thead><tr><th>Meelsoort</th><th>Percentage</th><th>Hoeveelheid</th><th></th></tr></thead>
                    <tbody>
                      ${flours.map((ing) => `
                        <tr>
                          <td><label class="material-combo"><input class="material-input" list="flour-library" data-flour-index="${ing.index}" data-kind="name" type="text" value="${esc(ing.name)}" placeholder="bijv. Tarwebloem" /></label></td>
                          <td><label class="number-cell"><input data-flour-index="${ing.index}" data-kind="percentage" inputmode="decimal" min="0" max="100" step="0.1" type="number" value="${ing.percentage > 0 ? fmt(ing.percentage, 1) : ""}" /><span>%</span></label></td>
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
                  ` : `<table class="ingredients-table">
                    <colgroup><col class="col-name"><col class="col-percent"><col class="col-amount"><col class="col-action"></colgroup>
                    <thead><tr><th>Ingrediënt</th><th>Percentage</th><th>Hoeveelheid</th><th></th></tr></thead>
                    <tbody>
                      ${additions.map((ing) => `
                        <tr>
                          <td><label class="material-combo"><input class="material-input" list="addition-library" data-addition-index="${ing.index}" data-kind="name" type="text" value="${esc(ing.name)}" placeholder="bijv. Water" /></label></td>
                          <td><label class="number-cell"><input data-addition-index="${ing.index}" data-kind="percentage" inputmode="decimal" min="0" step="0.1" type="number" value="${ing.percentage > 0 ? fmt(ing.percentage, 1) : ""}" /><span>%</span></label></td>
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

function renderPhotoPreview() {
  if (!state.photoPreview) return "";
  return `
    <div class="photo-lightbox" data-photo-lightbox role="dialog" aria-modal="true" aria-label="Broodfoto vergroot">
      <div class="photo-lightbox-card">
        <button class="photo-lightbox-close" data-close-photo-preview type="button" aria-label="Sluit foto">&times;</button>
        <img src="${esc(state.photoPreview.url)}" alt="${esc(state.photoPreview.name)}" />
      </div>
    </div>`;
}

function renderConfirmDialog() {
  const dialog = state.confirmDialog;
  if (!dialog) return "";
  const isDanger = dialog.variant !== "primary";
  return `
    <div class="confirm-backdrop" data-confirm-backdrop role="dialog" aria-modal="true" aria-label="${esc(dialog.title || "Bevestigen")}">
      <section class="confirm-card">
        <div class="confirm-icon ${isDanger ? "danger" : "primary"}">${icon(dialog.icon || "trash")}</div>
        <div class="confirm-copy">
          <h3>${esc(dialog.title || "Weet je het zeker?")}</h3>
          <p>${dialog.message || ""}</p>
        </div>
        <div class="confirm-actions">
          <button class="tool-button" data-cancel-confirm type="button">${esc(dialog.cancelLabel || "Annuleren")}</button>
          <button class="tool-button ${isDanger ? "danger" : "primary"}" data-confirm-action type="button">${esc(dialog.confirmLabel || "Doorgaan")}</button>
        </div>
      </section>
    </div>`;
}

function renderBackupReminder() {
  if (!shouldShowBackupReminder()) return "";
  const backups = getPanelBackups();
  const latestManual = backups.find((backup) => backup.reason === "handmatig" && backup.source === "Supabase");
  const copy = latestManual
    ? `Je laatste handmatige online back-up is van ${esc(formatBackupDate(latestManual.createdAt))}.`
    : "Maak een eerste handmatige online back-up, zodat je recepten veilig terug te zetten zijn.";
  return `
    <aside class="backup-reminder" role="status" aria-label="Backup herinnering">
      <div>
        <strong>Even back-uppen?</strong>
        <span>${copy}</span>
      </div>
      <div class="backup-reminder-actions">
        <button class="tool-button primary" data-reminder-online-backup type="button">${icon("save")}Online backup</button>
        <button class="icon-action" data-dismiss-backup-reminder type="button" aria-label="Herinnering vandaag sluiten">&times;</button>
      </div>
    </aside>`;
}

function renderAppToast() {
  if (!state.saveMessage || state.loading || !state.user || state.authView === "reset") return "";
  return `<div class="app-toast" role="status">${esc(state.saveMessage)}</div>`;
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
  else if (state.screen === "notes") root.innerHTML = renderNotes();
  else if (state.screen === "profile") root.innerHTML = renderProfile();

  root.insertAdjacentHTML("beforeend", renderPhotoPreview() + renderBackupPanel() + renderFaqPanel() + renderSupportPanel() + renderConfirmDialog() + renderBackupReminder() + renderAppToast());
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

function openDeleteRecipeDialog(recipeId) {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) return;
  state.confirmDialog = {
    type: "delete-recipe",
    recipeId,
    icon: "trash",
    title: "Recept verwijderen?",
    message: `Je verwijdert <strong>${esc(recipe.name)}</strong> uit je Broodboek. Dit kun je alleen terughalen met een backup.`,
    confirmLabel: "Verwijderen",
  };
  render();
}

function openConfirmDialog(dialog) {
  state.confirmDialog = dialog;
  render();
}

async function confirmDeleteRecipe(recipeId) {
  const recipe = state.recipes.find((r) => r.id === recipeId);
  if (!recipe) { state.confirmDialog = null; render(); return; }
  const result = await deleteRecipeFromDB(recipe.id);
  if (!result.ok) {
    state.confirmDialog = null;
    state.saveMessage = `Verwijderen mislukt: ${result.error?.message || "geen toestemming of recept niet gevonden"}`;
    render();
    return;
  }
  state.recipes = state.recipes.filter((r) => r.id !== recipe.id);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
  state.screen = "myrecipes";
  state.confirmDialog = null;
  state.saveMessage = `"${recipe.name}" verwijderd`;
  saveAutomaticBackup("auto");
  render();
}

async function restoreNotePagesFromPayload(payload) {
  const pages = Array.isArray(payload?.notePages)
    ? payload.notePages
    : payload?.generalNotes ? [makeNotePage("Algemene tips", payload.generalNotes)] : [];
  if (!pages.length) return;
  const restored = pages.map((page, index) => normaliseNotePage({ ...page, id: makeUuid(), sortOrder: state.notePages.length + index }));
  state.notePages.push(...restored);
  state.selectedNotePageId = restored[0]?.id || state.selectedNotePageId;
  writeLocalNotePages();
  await Promise.all(restored.map((page) => saveNotePage(page)));
}

async function restoreBackupFile(file) {
  const text = await file.text();
  const imp = JSON.parse(text);
  const recipes = Array.isArray(imp) ? imp : imp.recipes;
  if (!Array.isArray(recipes) || recipes.length === 0) throw new Error("Geen recepten gevonden");
  for (const r of recipes) {
    const saved = await insertRecipeToDB(r);
    if (saved) state.recipes.push(saved);
  }
  await restoreNotePagesFromPayload(imp);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
  state.saveMessage = `Backup teruggezet: ${recipes.length} recept${recipes.length === 1 ? "" : "en"} toegevoegd`;
  saveAutomaticBackup("auto");
}

async function restoreStoredBackup(id) {
  const backup = getPanelBackups().find((item) => item.id === id);
  if (!backup) throw new Error("Backup niet gevonden");
  const payload = backup.payload || JSON.parse(backup.serialized);
  const recipes = Array.isArray(payload) ? payload : payload.recipes;
  if (!Array.isArray(recipes)) throw new Error("Ongeldige backup");
  for (const r of recipes) {
    const saved = await insertRecipeToDB(r);
    if (saved) state.recipes.push(saved);
  }
  await restoreNotePagesFromPayload(payload);
  state.selectedRecipeId = state.recipes[0]?.id || "";
  state.categories = getCategoriesFromRecipes(state.recipes);
  state.saveMessage = `Backup van ${formatBackupDate(backup.createdAt)} teruggezet`;
  saveAutomaticBackup("auto");
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

  document.querySelector("[data-open-photo-preview]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    if (!recipe?.photoUrl) return;
    state.photoPreview = { url: recipe.photoUrl, name: recipe.name };
    render();
  });

  document.querySelector("[data-photo-lightbox]")?.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    state.photoPreview = null;
    render();
  });

  document.querySelector("[data-close-photo-preview]")?.addEventListener("click", () => {
    state.photoPreview = null;
    render();
  });

  document.querySelector("[data-reminder-online-backup]")?.addEventListener("click", makeOnlineBackup);

  document.querySelector("[data-dismiss-backup-reminder]")?.addEventListener("click", () => {
    dismissBackupReminder();
    render();
  });

  document.querySelector("[data-open-backup-panel]")?.addEventListener("click", () => {
    state.backupPanelOpen = true;
    render();
  });

  document.querySelector("[data-open-faq-panel]")?.addEventListener("click", () => {
    state.faqPanelOpen = true;
    render();
  });

  document.querySelector("[data-faq-backdrop]")?.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    state.faqPanelOpen = false;
    render();
  });

  document.querySelector("[data-close-faq-panel]")?.addEventListener("click", () => {
    state.faqPanelOpen = false;
    render();
  });

  document.querySelector("[data-open-support-panel]")?.addEventListener("click", async () => {
    state.supportPanelOpen = true;
    await loadSupportTickets();
  });

  document.querySelector("[data-support-backdrop]")?.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    state.supportPanelOpen = false;
    render();
  });

  document.querySelector("[data-close-support-panel]")?.addEventListener("click", () => {
    state.supportPanelOpen = false;
    render();
  });

  document.querySelector("[data-refresh-support]")?.addEventListener("click", loadSupportTickets);

  document.querySelector("[data-support-form]")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    await submitSupportTicket();
  });

  document.querySelectorAll("[data-support-draft]").forEach((field) => {
    field.addEventListener("input", () => {
      state.supportDraft[field.dataset.supportDraft] = field.value;
    });
    field.addEventListener("change", () => {
      state.supportDraft[field.dataset.supportDraft] = field.value;
    });
  });

  document.querySelectorAll("[data-save-ticket]").forEach((btn) => {
    btn.addEventListener("click", () => updateSupportTicket(btn.dataset.saveTicket));
  });

  document.querySelectorAll("[data-delete-support-ticket]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const ticket = state.supportTickets.find((item) => item.id === btn.dataset.deleteSupportTicket);
      if (!ticket) return;
      openConfirmDialog({
        type: "delete-support-ticket",
        ticketId: ticket.id,
        icon: "trash",
        title: "Supportticket verwijderen?",
        message: `Je verwijdert <strong>${esc(ticket.subject)}</strong>. Dit ticket verdwijnt uit je supportoverzicht.`,
        confirmLabel: "Verwijderen",
      });
    });
  });

  document.querySelector("[data-backup-backdrop]")?.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    state.backupPanelOpen = false;
    render();
  });

  document.querySelector("[data-close-backup-panel]")?.addEventListener("click", () => {
    state.backupPanelOpen = false;
    render();
  });

  document.querySelector("[data-make-auto-backup]")?.addEventListener("click", async () => {
    await saveAutomaticBackup("handmatig");
    await loadServerBackups();
    state.saveMessage = "Backup gemaakt";
    render();
  });

  document.querySelectorAll("[data-restore-stored-backup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const backup = getPanelBackups().find((item) => item.id === btn.dataset.restoreStoredBackup);
      if (!backup) return;
      openConfirmDialog({
        type: "restore-stored-backup",
        backupId: backup.id,
        icon: "save",
        title: "Backup terugzetten?",
        message: `Je zet de backup van <strong>${esc(formatBackupDate(backup.createdAt))}</strong> terug. De recepten uit deze backup worden toegevoegd aan je huidige recepten.`,
        confirmLabel: "Terugzetten",
        variant: "primary",
      });
    });
  });

  document.querySelectorAll("[data-recipe-photo]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      const recipe = getSelectedRecipe();
      const file = e.target.files?.[0];
      if (!recipe || !file) return;
      state.saveMessage = "Broodfoto uploaden..."; render();
      const result = await uploadRecipePhoto(recipe, file);
      if (result.url) {
        recipe.photoUrl = result.url;
        await saveRecipeToDB(recipe);
        state.saveMessage = "Broodfoto opgeslagen";
      } else {
        state.saveMessage = `Broodfoto uploaden mislukt: ${result.error || "onbekende fout"}`;
      }
      render();
    });
  });

  document.querySelector("[data-remove-recipe-photo]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    if (!recipe) return;
    openConfirmDialog({
      type: "remove-photo",
      icon: "trash",
      title: "Broodfoto verwijderen?",
      message: "De foto wordt uit dit recept gehaald. Je kunt later weer een nieuwe foto toevoegen.",
      confirmLabel: "Foto verwijderen",
    });
  });

  document.querySelector("[data-confirm-backdrop]")?.addEventListener("click", (e) => {
    if (e.target !== e.currentTarget) return;
    state.confirmDialog = null;
    render();
  });

  document.querySelector("[data-cancel-confirm]")?.addEventListener("click", () => {
    state.confirmDialog = null;
    render();
  });

  document.querySelector("[data-confirm-action]")?.addEventListener("click", async () => {
    const dialog = state.confirmDialog;
    if (!dialog) return;
    if (dialog.type === "delete-recipe") {
      await confirmDeleteRecipe(dialog.recipeId);
      return;
    }
    if (dialog.type === "remove-photo") {
      const recipe = getSelectedRecipe();
      if (recipe) {
        recipe.photoUrl = "";
        await saveRecipeToDB(recipe);
        state.saveMessage = "Broodfoto verwijderd";
      }
    }
    if (dialog.type === "unpublish") {
      const recipe = state.recipes.find((r) => r.id === dialog.recipeId);
      if (recipe) {
        recipe.shared = false;
        await saveRecipeToDB(recipe);
        state.library = state.library.filter((r) => r.id !== recipe.id);
        state.saveMessage = `"${recipe.name}" privé gemaakt`;
      }
    }
    if (dialog.type === "restore-backup") {
      try {
        await restoreBackupFile(dialog.file);
      } catch {
        state.saveMessage = "Backup terugzetten mislukt";
      }
      const input = document.querySelector("[data-import-recipes]");
      if (input) input.value = "";
      state.backupPanelOpen = false;
    }
    if (dialog.type === "restore-stored-backup") {
      try {
        await restoreStoredBackup(dialog.backupId);
      } catch {
        state.saveMessage = "Backup terugzetten mislukt";
      }
      state.backupPanelOpen = false;
    }
    if (dialog.type === "delete-note") {
      const recipe = getSelectedRecipe();
      if (recipe?.notes?.[dialog.noteIndex]) {
        recipe.notes.splice(dialog.noteIndex, 1);
        await saveRecipeToDB(recipe);
        state.saveMessage = "Logboekitem verwijderd";
      }
    }
    if (dialog.type === "delete-support-ticket") {
      await deleteSupportTicket(dialog.ticketId);
    }
    state.confirmDialog = null;
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

  document.querySelector("[data-retry-library]")?.addEventListener("click", loadLibrary);

  document.querySelector("[data-note-search]")?.addEventListener("input", (e) => {
    state.noteSearch = e.target.value;
    render();
    document.querySelector("[data-note-search]")?.focus();
  });

  document.querySelectorAll("[data-note-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedNotePageId = btn.dataset.notePage;
      render();
    });
  });

  document.querySelector("[data-add-note-page]")?.addEventListener("click", () => {
    const page = makeNotePage("Nieuw notitieblad", "");
    state.notePages.push(page);
    state.selectedNotePageId = page.id;
    state.noteSearch = "";
    writeLocalNotePages();
    render();
    document.querySelector("[data-note-title]")?.focus();
    saveNotePage(page);
  });

  document.querySelector("[data-note-title]")?.addEventListener("input", (e) => {
    const page = getActiveNotePage();
    if (!page) return;
    page.title = e.target.value;
    writeLocalNotePages();
    scheduleNotePageSave(page);
  });

  document.querySelector("[data-general-notes]")?.addEventListener("input", (e) => {
    const page = getActiveNotePage();
    if (!page) return;
    page.content = e.target.value;
    writeLocalNotePages();
    scheduleNotePageSave(page);
  });

  document.querySelector("[data-delete-note-page]")?.addEventListener("click", async (e) => {
    await deleteNotePage(e.currentTarget.dataset.deleteNotePage);
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

  function openRecipeFromTile(id) {
    state.selectedRecipeId = id;
    state.screen = "workbench";
    state.activeTab = "ingredients";
    state.saveMessage = "";
    const recipe = getSelectedRecipe();
    if (recipe) { recipe.lastUsedAt = Date.now(); saveRecipeToDB(recipe); }
    render();
  }

  document.querySelectorAll("[data-open-recipe-card]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button, a, input, select, textarea, summary, details, label")) return;
      openRecipeFromTile(card.dataset.openRecipeCard);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (e.target.closest("button, a, input, select, textarea, summary, details, label")) return;
      e.preventDefault();
      openRecipeFromTile(card.dataset.openRecipeCard);
    });
  });

  document.querySelectorAll("[data-open-recipe]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openRecipeFromTile(btn.dataset.openRecipe);
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
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openDeleteRecipeDialog(btn.dataset.deleteTile);
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
    btn.addEventListener("click", () => {
      const recipe = state.recipes.find((r) => r.id === btn.dataset.unpublish);
      if (!recipe) return;
      openConfirmDialog({
        type: "unpublish",
        recipeId: recipe.id,
        icon: "share",
        title: "Recept privé maken?",
        message: `<strong>${esc(recipe.name)}</strong> verdwijnt uit de gedeelde bibliotheek, maar blijft wel in jouw recepten staan.`,
        confirmLabel: "Privé maken",
      });
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

  document.querySelector("[data-export-excel]")?.addEventListener("click", downloadExcelBackup);

  document.querySelector("[data-online-backup]")?.addEventListener("click", makeOnlineBackup);

  document.querySelector("[data-download-json-backup]")?.addEventListener("click", downloadJsonBackup);

  document.querySelector("[data-import-recipes]")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    openConfirmDialog({
      type: "restore-backup",
      file,
      icon: "save",
      title: "Backup terugzetten?",
      message: "De recepten uit dit JSON-bestand worden toegevoegd aan je huidige recepten. Bestaande recepten blijven staan.",
      confirmLabel: "Terugzetten",
      variant: "primary",
    });
  });

  document.querySelector("[data-delete-recipe]")?.addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    if (recipe) openDeleteRecipeDialog(recipe.id);
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
    btn.addEventListener("click", () => {
      const recipe = getSelectedRecipe();
      const idx = Number(btn.dataset.deleteNote);
      if (!recipe?.notes?.[idx]) return;
      openConfirmDialog({
        type: "delete-note",
        noteIndex: idx,
        icon: "trash",
        title: "Logboekitem verwijderen?",
        message: "Deze baknotitie wordt uit het recept gehaald.",
        confirmLabel: "Verwijderen",
      });
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
initAuth().catch((error) => {
  state.loading = false;
  state.user = null;
  state.authView = "login";
  state.saveMessage = error?.message || "De app kon niet opstarten.";
  try { renderAuthScreen(); }
  catch {
    root.innerHTML = '<div class="auth-shell"><div class="auth-card"><div class="auth-form-wrap"><h2>App kon niet laden</h2><p class="auth-error">Ververs de pagina of probeer het later opnieuw.</p></div></div></div>';
  }
});
