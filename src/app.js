const seedRecipes = [
  {
    id: "wit",
    name: "Wit",
    flourTotal: 400,
    category: "Wit brood",
    description: "Luchtig wit brood met T65 label rouge, boter en een zachte kruim.",
    method: "Meng de ingrediënten, kneed tot een soepel deeg, laat rijzen, vorm het brood en bak heet af.",
    ingredients: [
      { name: "T65 label rouge", percentage: 1, unit: "g" },
      { name: "Water", percentage: 0.65, unit: "g" },
      { name: "Gedroogde gist", percentage: 0.015, unit: "g" },
      { name: "Basterdsuiker", percentage: 0.015, unit: "g" },
      { name: "Boter", percentage: 0.015, unit: "g" },
      { name: "Zout", percentage: 0.018, unit: "g" },
    ],
    notes: [
      {
        date: "20 okt 2024",
        rating: "goed",
        text:
          "Deeg opgebold en laten rijzen in de oven op 30 graden. Lekker van smaak; volgende keer de eerste rijs iets korter houden.",
      },
      {
        date: "27 okt 2024",
        rating: "ok",
        text:
          "500 gram bloem gebruikt. Kort doorgekneed, opgebold en in een broodbakblik laten narijzen.",
      },
      {
        date: "10 nov 2024",
        rating: "goed",
        text:
          "400 gram bloem. Gebakken in gietijzeren braadpan met deksel na rijs in rijsmandje.",
      },
      {
        date: "5 okt 2025",
        rating: "ok",
        text: "Zelfde werkwijze aangehouden.",
      },
    ],
  },
  {
    id: "bruin-35",
    name: "Bruin 35",
    flourTotal: 700,
    category: "Bruin brood",
    description: "Bruin brood met 35% volkorenmeel, extra broodpoeder en zonnebloemolie.",
    method: "Kneed het deeg goed door, laat rijzen tot dubbel volume, vorm en bak in blik of op steen.",
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
    notes: [
      {
        date: "14 mei 2024",
        rating: "ok",
        text:
          "Recept met 500 gram bloem. 10 minuten gekneed met de machine en laten rijzen tot dubbel volume.",
      },
    ],
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

const STORAGE_KEY = "broodboek-recipes-v1";
const EMPTY_ROWS = 6;
const CATEGORY_OPTIONS = ["Wit brood", "Bruin brood", "Volkoren", "Desem", "Zoet", "Pizza", "Overig"];
const RATING_OPTIONS = [
  { value: "mislukt", label: "Mislukt" },
  { value: "ok", label: "Oké" },
  { value: "goed", label: "Goed" },
  { value: "favoriet", label: "Favoriet" },
];

const state = {
  recipes: loadRecipes(),
  selectedRecipeId: "",
  saveMessage: "",
  recipeDrawerOpen: false,
  activeTab: "ingredients",
  categories: [],
};

state.selectedRecipeId = state.recipes[0]?.id || "";
state.categories = getCategoriesFromRecipes(state.recipes);

const root = document.querySelector("#root");
let activeDictation = null;

function icon(name) {
  const paths = {
    book:
      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
    calendar:
      '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    chef:
      '<path d="M6.5 14.5h11"/><path d="M6.5 18.5h11"/><path d="M8 22h8"/><path d="M5.5 14.5A4.5 4.5 0 0 1 8 6a4 4 0 0 1 8 0 4.5 4.5 0 0 1 2.5 8.5"/><path d="M8 14.5V22"/><path d="M16 14.5V22"/>',
    flame:
      '<path d="M8.5 14.5A4.5 4.5 0 0 0 12 22a4.5 4.5 0 0 0 3.5-7.5c-1.7-1.9-2.2-3.7-1.5-6.5-2.8 1.4-5.4 3.5-5.5 6.5z"/><path d="M12 22c1.3-1.2 1.7-2.7 1.1-4.4-.4-1.1-1.3-2.1-1.1-3.6-1.5 1-2.8 2.6-2.4 4.5.2 1.2 1 2.5 2.4 3.5z"/>',
    grain:
      '<path d="M12 2v20"/><path d="M12 8c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 14c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 20c-2.8 0-5-1.8-5-4 2.8 0 5 1.8 5 4z"/><path d="M12 8c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 14c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/><path d="M12 20c2.8 0 5-1.8 5-4-2.8 0-5 1.8-5 4z"/>',
    mic:
      '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/><path d="M8 22h8"/>',
    note:
      '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
    plus:
      '<path d="M5 12h14"/><path d="M12 5v14"/>',
    save:
      '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    scale:
      '<path d="M16 16h6"/><path d="M19 13v6"/><path d="M6 16h6"/><path d="M9 13v6"/><path d="M12 3v18"/><path d="M5 6h14"/><path d="M6 6l-3 7h6L6 6z"/><path d="M18 6l-3 7h6l-3-7z"/>',
    star:
      '<path d="M11.5 2.8 14.4 8.7l6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-.9 2.9-5.9z"/>',
    trash:
      '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5"/><path d="M14 11v5"/>',
  };

  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

function formatNumber(value, decimals = 1) {
  const rounded = Number(value.toFixed(decimals));
  return String(rounded);
}

function formatPercent(value) {
  return `${formatNumber(value * 100, 1)}%`;
}

function formatWeight(value) {
  return `${Math.round(value)} g`;
}

function createBlankIngredient() {
  return { name: "", percentage: 0, unit: "g" };
}

function createBlankRecipe() {
  const index = state.recipes.length + 1;
  return {
    id: `recept-${Date.now()}`,
    name: `Nieuw recept ${index}`,
    flourTotal: 500,
    targetDoughWeight: 1000,
    loafCount: 1,
    category: "Overig",
    description: "Eigen broodrecept.",
    favorite: false,
    lastUsedAt: Date.now(),
    ingredients: [
      { name: "Bloem", percentage: 1, unit: "g" },
      ...Array.from({ length: EMPTY_ROWS }, createBlankIngredient),
    ],
    notes: [],
  };
}

function cloneRecipe(recipe) {
  return {
    ...structuredClone(recipe),
    id: `recept-${Date.now()}`,
    name: `${recipe.name} kopie`,
    favorite: false,
    lastUsedAt: Date.now(),
  };
}

function ensureEditableRows(recipe) {
  recipe.favorite = Boolean(recipe.favorite);
  recipe.lastUsedAt = Number(recipe.lastUsedAt) || 0;
  recipe.category = recipe.category || "Overig";
  recipe.method = recipe.method || "";
  recipe.targetDoughWeight = Number(recipe.targetDoughWeight) || 0;
  recipe.loafCount = Math.max(1, Number(recipe.loafCount) || 1);
  recipe.notes = Array.isArray(recipe.notes) ? recipe.notes : [];
  recipe.notes.forEach((note) => {
    note.rating = note.rating || "ok";
  });

  const blankRows = recipe.ingredients.filter(
    (ingredient) => !ingredient.name && ingredient.percentage === 0 && ingredient.unit === "g",
  ).length;
  const missingRows = Math.max(0, EMPTY_ROWS - blankRows);

  if (missingRows > 0) {
    recipe.ingredients.push(...Array.from({ length: missingRows }, createBlankIngredient));
  }
}

function loadRecipes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(ensureEditableRows);
        return parsed;
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  const cloned = structuredClone(seedRecipes);
  cloned.forEach(ensureEditableRows);
  return cloned;
}

function saveRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
  state.saveMessage = "Opgeslagen";
}

function persistRecipes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
}

function getSelectedRecipe() {
  return state.recipes.find((recipe) => recipe.id === state.selectedRecipeId) || state.recipes[0];
}

function selectRecipe(recipeId) {
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return;

  state.selectedRecipeId = recipe.id;
  recipe.lastUsedAt = Date.now();
  state.saveMessage = "";
  persistRecipes();
  render();
}

function getRecentRecipes() {
  const recent = [...state.recipes]
    .sort((a, b) => (b.lastUsedAt || 0) - (a.lastUsedAt || 0))
    .slice(0, 2);

  return recent.some((recipe) => recipe.lastUsedAt) ? recent : state.recipes.slice(0, 2);
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
      .filter((ingredient) => ingredient.name || ingredient.percentage > 0)
      .map((ingredient) => ({
        name: ingredient.name || "Naamloos",
        amount: Math.round(ingredient.amount * 10) / 10,
        unit: ingredient.unit || "g",
        percentage: Math.round(ingredient.percentage * 1000) / 10,
      })),
  };
}

function renderCategoryOptions(selectedCategory) {
  return state.categories.map(
    (category) => `<option value="${escapeHtml(category)}" ${category === selectedCategory ? "selected" : ""}>${escapeHtml(category)}</option>`,
  ).join("");
}

function getCategoriesFromRecipes(recipes) {
  return [...new Set([...CATEGORY_OPTIONS, ...recipes.map((recipe) => recipe.category).filter(Boolean)])].sort((a, b) =>
    a.localeCompare(b, "nl", { sensitivity: "base" }),
  );
}

function renderRatingOptions(selectedRating) {
  return RATING_OPTIONS.map(
    (rating) => `<option value="${rating.value}" ${rating.value === selectedRating ? "selected" : ""}>${rating.label}</option>`,
  ).join("");
}

function render() {
  const recipe = getSelectedRecipe();
  ensureEditableRows(recipe);
  const flourTotal = recipe.flourTotal || 0;
  const calculatedIngredients = calculateIngredients(recipe, flourTotal);
  const hydration = calculatedIngredients.find((ingredient) => ingredient.name === "Water");
  const recentRecipes = getRecentRecipes();
  const sortedRecipes = getSortedRecipes();
  const ratioTotal = getRecipeRatioTotal(recipe);
  const totalDoughWeight = calculatedIngredients.reduce((sum, ingredient) => {
    const hasValue = ingredient.name || ingredient.percentage > 0;
    return hasValue ? sum + ingredient.amount : sum;
  }, 0);
  if (!recipe.targetDoughWeight) {
    recipe.targetDoughWeight = Math.round(totalDoughWeight);
  }
  const loafWeight = recipe.loafCount > 0 ? Math.round(totalDoughWeight / recipe.loafCount) : Math.round(totalDoughWeight);

  root.innerHTML = `
    <main class="app-shell">
      <section class="topbar" aria-label="Broodboek overzicht">
        <div class="brand-lockup">
          <div class="brand-mark">${icon("chef")}</div>
          <div>
            <p class="eyebrow">Bakkerij dashboard</p>
            <h1>Broodboek</h1>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <aside class="recipe-panel" aria-label="Recepten">
          <div class="panel-heading">${icon("book")}<h2>Recepten</h2></div>
          <div class="sidebar-actions">
            <button class="tool-button" data-new-recipe type="button">${icon("plus")}Nieuw</button>
            <button class="tool-button primary" data-save-recipes type="button">${icon("save")}Opslaan</button>
            <button class="tool-button wide" data-save-as type="button">${icon("save")}Opslaan als</button>
            <button class="tool-button wide" data-export-recipes type="button">${icon("save")}Export</button>
            <label class="tool-button wide file-tool">${icon("plus")}Import<input data-import-recipes type="file" accept="application/json,.json" /></label>
            <button class="tool-button danger wide" data-delete-recipe type="button">${icon("trash")}Verwijder recept</button>
          </div>
          <p class="save-message" data-save-message>${state.saveMessage}</p>

          <section class="recent-recipes" aria-label="Laatste gebruikte recepten">
            <p class="sidebar-label">Laatste gebruikt</p>
            <div class="recent-grid">
              ${recentRecipes
                .map(
                  (item) => `
                    <article
                      class="recipe-card recent-card ${item.id === recipe.id ? "active" : ""}"
                      data-select-recipe="${item.id}"
                      role="button"
                      tabindex="0"
                    >
                      <button
                        class="star-button ${item.favorite ? "active" : ""}"
                        data-star-recipe="${item.id}"
                        type="button"
                        aria-label="${item.favorite ? "Ster verwijderen" : "Recept met ster aanmerken"}"
                      >${icon("star")}</button>
                      <div class="recipe-card-content">
                        <span data-recipe-name-label="${item.id}">${escapeHtml(item.name)}</span>
                        <small>${escapeHtml(item.category || "Overig")}</small>
                        <strong data-recipe-flour="${item.id}">${formatWeight(item.flourTotal || 0)} bloem</strong>
                      </div>
                    </article>
                  `,
                )
                .join("")}
            </div>
          </section>

          <details class="recipe-drawer" data-recipe-drawer ${state.recipeDrawerOpen ? "open" : ""}>
            <summary>Alle recepten</summary>
            <div class="recipe-list">
            ${sortedRecipes
              .map(
                (item) => `
                  <article
                    class="recipe-card list-card ${item.id === recipe.id ? "active" : ""}"
                    data-select-recipe="${item.id}"
                    role="button"
                    tabindex="0"
                  >
                    <button
                      class="star-button ${item.favorite ? "active" : ""}"
                      data-star-recipe="${item.id}"
                      type="button"
                      aria-label="${item.favorite ? "Ster verwijderen" : "Recept met ster aanmerken"}"
                    >${icon("star")}</button>
                    <div class="recipe-card-content">
                      <span data-recipe-name-label="${item.id}">${escapeHtml(item.name)}</span>
                      <small>${escapeHtml(item.category || "Overig")}</small>
                      <strong data-recipe-flour="${item.id}">${formatWeight(item.flourTotal || 0)} bloem</strong>
                    </div>
                  </article>
                `,
              )
              .join("")}
            </div>
          </details>
        </aside>

        <section class="workbench" aria-label="Recept calculator">
          <div class="recipe-header">
            <div>
              <p class="eyebrow">${icon("grain")}Bakkerspercentages</p>
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
              <p class="formula-hint">Alle getallen zijn gekoppeld: pas bloem, procent of gram aan en de rest rekent direct mee.</p>
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

          <div class="tabbar" role="tablist" aria-label="Recept onderdelen">
            <button class="${state.activeTab === "ingredients" ? "active" : ""}" data-tab="ingredients" type="button">Ingrediënten</button>
            <button class="${state.activeTab === "method" ? "active" : ""}" data-tab="method" type="button">Werkwijze</button>
            <button class="${state.activeTab === "logbook" ? "active" : ""}" data-tab="logbook" type="button">Logboek</button>
          </div>

          ${
            state.activeTab === "ingredients"
              ? `
                <div class="table-wrap">
                  <table>
                    <caption>Ingrediënten</caption>
                    <thead>
                      <tr>
                        <th>Gebruikt materiaal</th>
                        <th>Percentage</th>
                        <th>Hoeveelheid</th>
                        <th>Eenheid</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${calculatedIngredients
                        .map(
                          (ingredient, index) => `
                            <tr>
                              <td>
                                <input
                                  class="material-input"
                                  aria-label="Gebruikt materiaal"
                                  data-ingredient-index="${index}"
                                  data-kind="name"
                                  type="text"
                                  value="${escapeHtml(ingredient.name)}"
                                  placeholder="bijv. water"
                                />
                              </td>
                              <td>
                                <label class="number-cell">
                                  <input
                                    aria-label="${ingredient.name} percentage"
                                    data-ingredient-index="${index}"
                                    data-kind="percentage"
                                    inputmode="decimal"
                                    min="0"
                                    step="0.1"
                                    type="number"
                                    value="${formatNumber(ingredient.percentage * 100, 3)}"
                                  />
                                  <span>%</span>
                                </label>
                              </td>
                              <td>
                                <label class="number-cell amount-cell">
                                  <input
                                    aria-label="${ingredient.name} gram"
                                    data-ingredient-index="${index}"
                                    data-kind="amount"
                                    inputmode="decimal"
                                    min="0"
                                    step="1"
                                    type="number"
                                    value="${formatNumber(ingredient.amount, 1)}"
                                  />
                                  <span>${escapeHtml(ingredient.unit || "")}</span>
                                </label>
                              </td>
                              <td>
                                <input
                                  class="unit-input"
                                  aria-label="${ingredient.name || "regel"} eenheid"
                                  data-ingredient-index="${index}"
                                  data-kind="unit"
                                  type="text"
                                  value="${escapeHtml(ingredient.unit || "")}"
                                  placeholder="g"
                                />
                              </td>
                            </tr>
                          `,
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `
              : state.activeTab === "method"
                ? `
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
                `
              : `
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
                    ${
                      recipe.notes.length
                        ? recipe.notes
                            .map(
                              (note, index) => `
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
                              `,
                            )
                            .join("")
                        : `<p class="empty-state">Nog geen logboekitems voor dit recept.</p>`
                    }
                  </div>
                </section>
              `
          }
        </section>

      </section>

      <details class="style-board" aria-label="Stijlblad">
        <summary>Stijlblad bekijken</summary>
        <div class="style-intro">
          <p class="eyebrow">Stijlblad</p>
          <h2>Ambachtelijk warm, rustig en bruikbaar</h2>
        </div>
        <div class="swatches">
          ${colorTokens
            .map(
              (token) => `
                <div class="swatch">
                  <span style="background-color:${token.value}"></span>
                  <strong>${token.name}</strong>
                  <small>${token.value} · ${token.usage}</small>
                </div>
              `,
            )
            .join("")}
        </div>
      </details>
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelector("[data-new-recipe]").addEventListener("click", () => {
    const recipe = createBlankRecipe();
    state.recipes.push(recipe);
    state.selectedRecipeId = recipe.id;
    saveRecipes();
    renderAndRestoreFocus("[data-recipe-name]");
  });

  document.querySelector("[data-save-recipes]").addEventListener("click", () => {
    saveRecipes();
    render();
  });

  document.querySelector("[data-save-as]").addEventListener("click", () => {
    const copy = cloneRecipe(getSelectedRecipe());
    state.recipes.push(copy);
    state.selectedRecipeId = copy.id;
    saveRecipes();
    renderAndRestoreFocus("[data-recipe-name]");
  });

  document.querySelector("[data-export-recipes]").addEventListener("click", () => {
    const data = {
      exportedAt: new Date().toISOString(),
      app: "Broodboek",
      recipes: state.recipes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `broodboek-${getTodayInputValue()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.querySelector("[data-import-recipes]").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const imported = JSON.parse(String(reader.result));
        const recipes = Array.isArray(imported) ? imported : imported.recipes;
        if (!Array.isArray(recipes) || recipes.length === 0) throw new Error("Geen recepten gevonden");
        recipes.forEach(ensureEditableRows);
        state.recipes = recipes;
        state.selectedRecipeId = recipes[0].id;
        state.categories = getCategoriesFromRecipes(recipes);
        state.saveMessage = "Import opgeslagen";
        saveRecipes();
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
    button.addEventListener("click", () => {
      startDictation(button);
    });
  });

  document.querySelector("[data-delete-recipe]").addEventListener("click", () => {
    const recipe = getSelectedRecipe();
    if (state.recipes.length <= 1) {
      state.saveMessage = "Laatste recept kan niet weg";
      render();
      return;
    }

    if (!confirm(`Recept "${recipe.name}" verwijderen?`)) return;

    state.recipes = state.recipes.filter((item) => item.id !== recipe.id);
    state.selectedRecipeId = state.recipes[0].id;
    saveRecipes();
    render();
  });

  document.querySelector("[data-note-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const recipe = getSelectedRecipe();
    const dateInput = document.querySelector("[data-note-date]");
    const ratingInput = document.querySelector("[data-note-rating]");
    const textInput = document.querySelector("[data-note-text]");
    const text = textInput.value.trim();
    const calculatedIngredients = calculateIngredients(recipe, recipe.flourTotal || 0);
    const totalDoughWeight = calculatedIngredients.reduce((sum, ingredient) => {
      const hasValue = ingredient.name || ingredient.percentage > 0;
      return hasValue ? sum + ingredient.amount : sum;
    }, 0);

    if (!text) {
      textInput.focus();
      return;
    }

    recipe.notes.unshift({
      date: formatDateForLog(dateInput.value || getTodayInputValue()),
      rating: ratingInput.value || "ok",
      snapshot: createBakeSnapshot(recipe, calculatedIngredients, totalDoughWeight),
      text,
    });

    dateInput.value = getTodayInputValue();
    textInput.value = "";
    state.saveMessage = "Niet opgeslagen";
    renderAndRestoreFocus("[data-note-text]");
  });

  document.querySelectorAll("[data-select-recipe]").forEach((button) => {
    button.addEventListener("click", () => {
      selectRecipe(button.dataset.selectRecipe);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRecipe(button.dataset.selectRecipe);
      }
    });
  });

  document.querySelectorAll("[data-star-recipe]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const recipe = state.recipes.find((item) => item.id === button.dataset.starRecipe);
      if (!recipe) return;

      recipe.favorite = !recipe.favorite;
      state.saveMessage = "Niet opgeslagen";
      persistRecipes();
      render();
    });
  });

  document.querySelectorAll("[data-delete-note]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const recipe = getSelectedRecipe();
      const noteIndex = Number(button.dataset.deleteNote);
      if (!Number.isInteger(noteIndex) || !recipe.notes[noteIndex]) return;
      if (!confirm("Logboekitem verwijderen?")) return;

      recipe.notes.splice(noteIndex, 1);
      state.saveMessage = "Niet opgeslagen";
      render();
    });
  });

  document.querySelectorAll("[data-note-rating-update]").forEach((select) => {
    select.addEventListener("change", () => {
      const recipe = getSelectedRecipe();
      const noteIndex = Number(select.dataset.noteRatingUpdate);
      if (!Number.isInteger(noteIndex) || !recipe.notes[noteIndex]) return;
      recipe.notes[noteIndex].rating = select.value;
      state.saveMessage = "Niet opgeslagen";
      render();
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
    document.querySelectorAll(`[data-select-recipe="${recipe.id}"] small`).forEach((label) => {
      label.textContent = recipe.category;
    });
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
    if (!category) {
      input.focus();
      return;
    }

    if (!state.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
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

      if (event.target.dataset.kind === "name") {
        ingredient.name = event.target.value;
      }

      if (event.target.dataset.kind === "percentage") {
        ingredient.percentage = Number.isFinite(parsed) && parsed >= 0 ? parsed / 100 : 0;
      }

      if (event.target.dataset.kind === "amount") {
        ingredient.percentage = Number.isFinite(parsed) && parsed >= 0 && flourTotal > 0 ? parsed / flourTotal : 0;
      }

      if (event.target.dataset.kind === "unit") {
        ingredient.unit = event.target.value;
        const unitLabel = document
          .querySelector(`[data-ingredient-index="${ingredientIndex}"][data-kind="amount"]`)
          ?.closest(".amount-cell")
          ?.querySelector("span");
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
    const percentageInput = document.querySelector(
      `[data-ingredient-index="${index}"][data-kind="percentage"]`,
    );
    const amountInput = document.querySelector(`[data-ingredient-index="${index}"][data-kind="amount"]`);

    if (percentageInput && percentageInput !== activeElement) {
      percentageInput.value = formatNumber(ingredient.percentage * 100, 3);
    }

    if (amountInput && amountInput !== activeElement) {
      amountInput.value = formatNumber(ingredient.amount, 1);
    }
  });

  const hydration = calculatedIngredients.find((ingredient) => ingredient.name === "Water");
  const totalDoughWeight = calculatedIngredients.reduce((sum, ingredient) => {
    const hasValue = ingredient.name || ingredient.percentage > 0;
    return hasValue ? sum + ingredient.amount : sum;
  }, 0);
  document.querySelectorAll(`[data-recipe-flour="${recipe.id}"]`).forEach((label) => {
    label.textContent = `${formatWeight(flourTotal)} bloem`;
  });
  document.querySelector("[data-dough-weight]").textContent = formatWeight(totalDoughWeight);
  document.querySelector("[data-hydration]").textContent = formatPercent(hydration?.percentage || 0);
  document.querySelector("[data-loaf-weight]").textContent = formatWeight(totalDoughWeight / (recipe.loafCount || 1));
}

function markUnsaved() {
  state.saveMessage = "Niet opgeslagen";
  const saveMessage = document.querySelector("[data-save-message]");
  if (saveMessage) saveMessage.textContent = state.saveMessage;
}

function startDictation(button) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const target = document.querySelector(button.dataset.dictateTarget);
  const status = button.closest(".method-panel, .dictation-field")?.querySelector("[data-dictation-status]");

  if (!target) return;

  if (activeDictation?.button === button) {
    activeDictation.recognition.stop();
    return;
  }

  if (activeDictation) {
    activeDictation.recognition.stop();
  }

  if (!SpeechRecognition) {
    state.saveMessage = "Spraakherkenning wordt niet ondersteund in deze browser";
    const saveMessage = document.querySelector("[data-save-message]");
    if (saveMessage) saveMessage.textContent = state.saveMessage;
    if (status) status.textContent = "Spraakherkenning wordt niet ondersteund in deze browser.";
    target.focus();
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "nl-NL";
  recognition.interimResults = true;
  recognition.continuous = true;
  const baseValue = target.value.trimEnd();
  button.classList.add("listening");
  button.innerHTML = `${icon("mic")}Stop`;
  if (status) status.textContent = "Luisteren... spreek duidelijk en klik op Stop als je klaar bent.";
  activeDictation = { button, recognition };

  recognition.addEventListener("result", (event) => {
    const transcript = Array.from(event.results)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    if (!transcript) return;

    target.value = appendDictatedText(baseValue, transcript);
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.focus();
    if (status) status.textContent = "Tekst ontvangen. Klik op Stop als je klaar bent.";
  });

  recognition.addEventListener("end", () => {
    button.classList.remove("listening");
    button.innerHTML = `${icon("mic")}Inspreken`;
    if (activeDictation?.recognition === recognition) activeDictation = null;
    if (status) {
      status.textContent = target.value.trim() === baseValue.trim()
        ? "Geen tekst ontvangen. Probeer nog eens, of open de pagina in Chrome/Safari."
        : "Inspreken gestopt. Controleer de tekst en sla op.";
    }
  });

  recognition.addEventListener("error", (event) => {
    button.classList.remove("listening");
    button.innerHTML = `${icon("mic")}Inspreken`;
    if (activeDictation?.recognition === recognition) activeDictation = null;
    if (status) status.textContent = getDictationErrorMessage(event.error);
    target.focus();
  });

  recognition.start();
}

function appendDictatedText(currentValue, transcript) {
  const trimmed = currentValue.trimEnd();
  if (!trimmed) return transcript;
  const separator = /[.!?]\s*$/.test(trimmed) ? "\n" : " ";
  return `${trimmed}${separator}${transcript}`;
}

function getDictationErrorMessage(error) {
  const messages = {
    "not-allowed": "Microfoontoegang is geweigerd.",
    "no-speech": "Geen spraak herkend. Probeer iets dichter bij de microfoon.",
    "audio-capture": "Geen werkende microfoon gevonden.",
    network: "Spraakherkenning heeft netwerktoegang nodig en kreeg geen resultaat.",
  };

  return messages[error] || "Inspreken is gestopt zonder tekst. Probeer Chrome of Safari als dit blijft gebeuren.";
}

function renderAndRestoreFocus(selector) {
  render();
  const input = document.querySelector(selector);
  input?.focus();
  input?.setSelectionRange(input.value.length, input.value.length);
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
  return RATING_OPTIONS.find((rating) => rating.value === value)?.label || "Oké";
}

function renderSnapshot(snapshot) {
  if (!snapshot) return "";

  return `
    <details class="snapshot">
      <summary>Bakbeurt: ${formatWeight(snapshot.doughWeight || 0)} deeg · ${formatWeight(snapshot.flourTotal || 0)} bloem</summary>
      <div class="snapshot-grid">
        ${(snapshot.ingredients || [])
          .slice(0, 10)
          .map(
            (ingredient) => `
              <span>${escapeHtml(ingredient.name)}</span>
              <strong>${formatNumber(Number(ingredient.amount) || 0, 1)} ${escapeHtml(ingredient.unit || "g")}</strong>
            `,
          )
          .join("")}
      </div>
    </details>
  `;
}

function getTodayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

function formatDateForLog(inputValue) {
  const [year, month, day] = inputValue.split("-").map(Number);
  if (!year || !month || !day) {
    return new Intl.DateTimeFormat("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date());
  }

  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

render();
