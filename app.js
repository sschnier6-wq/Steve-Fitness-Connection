// ===== Equipment Library =====
const EQUIPMENT = {
  upper: [
    { id: "chest-press", name: "Chest Press", brand: "Life Fitness", img: "chest-press.jpg", notes: "Progressive loading preferred" },
    { id: "seated-row", name: "Seated Cable Row", brand: "Cable Station", img: "seated-row.jpg", notes: "Focus on scapular retraction" },
    { id: "shoulder-press", name: "Shoulder Press", brand: "Life Fitness", img: "shoulder-press.jpg", notes: "Controlled tempo" },
    { id: "fixed-pulldown", name: "Fixed Pulldown", brand: "Life Fitness", img: "fixed-pulldown.jpg", notes: "Wide or neutral grip" },
    { id: "triceps-extension", name: "Triceps Extension", brand: "Precor", img: "triceps-extension.jpg", notes: "" },
    { id: "triceps-pushdown", name: "Triceps Pushdown", brand: "Hoist Cable", img: "seated-row.jpg", notes: "Use rope or bar" },
    { id: "biceps-curl", name: "Biceps Curl", brand: "Life Fitness", img: "biceps-curl.jpg", notes: "" },
    { id: "db-curls", name: "Standing Dumbbell Curls", brand: "Free Weights", img: "dumbbell-rack.jpg", notes: "Alternate or simultaneous" },
    { id: "seated-dip", name: "Seated Dip", brand: "Precor", img: "seated-dip.jpg", notes: "Chest/triceps focus" }
  ],
  lower: [
    { id: "leg-press", name: "Seated Leg Press", brand: "Life Fitness", img: "seated-leg-press.jpg", notes: "Full range, controlled" },
    { id: "leg-curl", name: "Seated Leg Curl", brand: "Life Fitness / Hoist", img: "seated-leg-curl.jpg", notes: "Hamstring isolation" },
    { id: "leg-extension", name: "Leg Extension", brand: "Life Fitness", img: "leg-extension.jpg", notes: "Quad focus" }
  ],
  core: [
    { id: "ab-crunch", name: "Abdominal Crunch Machine", brand: "Life Fitness", img: "ab-crunch.jpg", notes: "May be uncomfortable at 6'7\" – prefer alternatives", logType: "strength" },
    { id: "single-leg-balance", name: "Single-Leg Balance", brand: "Bodyweight", img: "single-leg-balance.jpg", notes: "3 × 30s holds per leg", logType: "time", defaultSets: [{ duration: 30, label: "each leg" }, { duration: 30, label: "each leg" }, { duration: 30, label: "each leg" }] },
    { id: "single-leg-rdl", name: "Single-Leg Romanian Deadlift", brand: "Bodyweight", img: "single-leg-rdl.jpg", notes: "2 × 8-10 slow reps per leg", logType: "reps", defaultSets: [{ reps: 10, label: "each leg" }, { reps: 10, label: "each leg" }] },
    { id: "heel-to-toe", name: "Heel-to-Toe Walk", brand: "Balance", img: "heel-to-toe.jpg", notes: "2 × 10 steps", logType: "steps", defaultSets: [{ steps: 10 }, { steps: 10 }] },
    { id: "worlds-greatest", name: "World's Greatest Stretch", brand: "Mobility", img: "worlds-greatest-stretch.jpg", notes: "2 sets of 5-6 per side", logType: "reps", defaultSets: [{ reps: 6, label: "per side" }, { reps: 6, label: "per side" }] },
    { id: "hip-flexor", name: "Half-Kneeling Hip Flexor Stretch", brand: "Mobility", img: "hip-flexor-stretch.jpg", notes: "2 × 30-40s per side", logType: "time", defaultSets: [{ duration: 35, label: "each side" }, { duration: 35, label: "each side" }] },
    { id: "bird-dog", name: "Bird-Dog", brand: "Bodyweight", img: "bird-dog.jpg", notes: "2 × 8-10 per side", logType: "reps", defaultSets: [{ reps: 10, label: "per side" }, { reps: 10, label: "per side" }] },
    { id: "thoracic-rotation", name: "Thoracic Rotations (Quadruped)", brand: "Mobility", img: "thoracic-rotation.jpg", notes: "2 × 8-10 per side", logType: "reps", defaultSets: [{ reps: 10, label: "per side" }, { reps: 10, label: "per side" }] }
  ],
  aerobic: [
    { id: "cycling", name: "Stationary Cycling", brand: "Cardio", img: "exercise-bike.jpg", notes: "Steady aerobic 45-60 min preferred", logType: "cardio", defaultSets: [{ duration: 60, unit: "min" }] }
  ]
};

// ===== State =====
let currentLogExercise = null;
let currentSets = [];
let activeWorkout = null; // { started: timestamp, exercises: [] }

// ===== Custom Exercises (persisted separately – does NOT touch workout history) =====
function getCustomExercises() {
  try {
    return JSON.parse(localStorage.getItem("customExercises") || "[]");
  } catch {
    return [];
  }
}

function saveCustomExercises(list) {
  localStorage.setItem("customExercises", JSON.stringify(list));
}

function getAllEquipment(cat) {
  const builtIn = EQUIPMENT[cat] || [];
  const custom = getCustomExercises().filter(e => e.category === cat);
  return [...builtIn, ...custom];
}

function findExercise(exId, cat) {
  return getAllEquipment(cat).find(e => e.id === exId) || null;
}

// ===== LocalStorage Helpers =====
// IMPORTANT: fitnessHistory and fitnessDraft keys are never renamed so existing logs are preserved.
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("fitnessHistory") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem("fitnessHistory", JSON.stringify(history));
}

/** Two workouts are duplicates if they fall on the same calendar day
 *  and contain the same set of exercise IDs (order-independent).
 *  Exact ISO date match also counts as duplicate.
 */
function isDuplicateWorkout(a, b) {
  if (!a || !b) return false;
  if (a.date && b.date && a.date === b.date) return true;
  try {
    const dayA = new Date(a.date).toDateString();
    const dayB = new Date(b.date).toDateString();
    if (dayA !== dayB) return false;
    const idsA = (a.exercises || []).map(e => e.id).filter(Boolean).sort().join("|");
    const idsB = (b.exercises || []).map(e => e.id).filter(Boolean).sort().join("|");
    return idsA.length > 0 && idsA === idsB;
  } catch {
    return false;
  }
}

function workoutAlreadyInHistory(workout, history) {
  return history.some(existing => isDuplicateWorkout(existing, workout));
}

function getLastWorkout() {
  const hist = getHistory();
  return hist.length ? hist[hist.length - 1] : null;
}

function getLastForExercise(exerciseId) {
  // Prefer the current in-progress workout so the card updates immediately after Save Log
  if (activeWorkout && activeWorkout.exercises) {
    const found = activeWorkout.exercises.find(e => e.id === exerciseId);
    if (found) return found;
  }
  // Fall back to permanent history
  const hist = getHistory();
  for (let i = hist.length - 1; i >= 0; i--) {
    const found = hist[i].exercises.find(e => e.id === exerciseId);
    if (found) return found;
  }
  return null;
}

function saveDraft() {
  if (activeWorkout) {
    localStorage.setItem("fitnessDraft", JSON.stringify(activeWorkout));
  } else {
    localStorage.removeItem("fitnessDraft");
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem("fitnessDraft");
    if (raw) {
      activeWorkout = JSON.parse(raw);
      return true;
    }
  } catch {}
  return false;
}

// ===== Suggestion Engine =====
function generateSuggestion() {
  const last = getLastWorkout();
  const suggestion = {
    title: "Balanced Full-Body Session",
    focus: "Progressive strength + balance/mobility + cycling",
    upper: [],
    lower: [],
    core: [],
    aerobic: "60 min steady cycling"
  };

  // Simple progression: take last top set and suggest small increase or same volume
  function suggestProgress(exId, defaultSets) {
    const lastEx = getLastForExercise(exId);
    if (!lastEx || !lastEx.sets.length) {
      return defaultSets;
    }
    // Take the heaviest set and suggest +5-10 lbs or more reps
    const heaviest = lastEx.sets.reduce((a, b) => (b.weight > a.weight ? b : a), lastEx.sets[0]);
    const suggestedWeight = Math.round((heaviest.weight + 5) / 5) * 5; // round to 5
    return [
      { reps: 10, weight: Math.max(heaviest.weight - 20, 40) },
      { reps: 8, weight: heaviest.weight },
      { reps: 6, weight: suggestedWeight }
    ];
  }

  suggestion.upper = [
    { id: "chest-press", name: "Chest Press", sets: suggestProgress("chest-press", [{reps:10,weight:110},{reps:8,weight:130},{reps:6,weight:150}]) },
    { id: "seated-row", name: "Seated Row", sets: suggestProgress("seated-row", [{reps:10,weight:130},{reps:8,weight:130},{reps:6,weight:145}]) },
    { id: "shoulder-press", name: "Shoulder Press", sets: suggestProgress("shoulder-press", [{reps:12,weight:50},{reps:8,weight:65},{reps:6,weight:65}]) },
    { id: "triceps-pushdown", name: "Triceps Pushdown", sets: [{reps:12,weight:50},{reps:10,weight:60},{reps:8,weight:60}] },
    { id: "db-curls", name: "Dumbbell Curls", sets: [{reps:12,weight:35},{reps:8,weight:40},{reps:6,weight:40}] }
  ];

  suggestion.lower = [
    { id: "leg-press", name: "Seated Leg Press", sets: suggestProgress("leg-press", [{reps:10,weight:250},{reps:10,weight:270},{reps:10,weight:290}]) },
    { id: "leg-curl", name: "Seated Leg Curl", sets: suggestProgress("leg-curl", [{reps:12,weight:160},{reps:10,weight:190},{reps:8,weight:205}]) },
    { id: "leg-extension", name: "Leg Extension", sets: suggestProgress("leg-extension", [{reps:12,weight:175},{reps:10,weight:190},{reps:10,weight:205}]) }
  ];

  suggestion.core = [
    { id: "single-leg-balance", name: "Single-Leg Balance", detail: "3 × 30s each leg", sets: [{ duration: 30, label: "each leg" }, { duration: 30, label: "each leg" }, { duration: 30, label: "each leg" }] },
    { id: "single-leg-rdl", name: "Single-Leg RDL", detail: "2 × 10 each leg", sets: [{ reps: 10, label: "each leg" }, { reps: 10, label: "each leg" }] },
    { id: "heel-to-toe", name: "Heel-to-Toe Walk", detail: "2 × 10 steps", sets: [{ steps: 10 }, { steps: 10 }] },
    { id: "worlds-greatest", name: "World's Greatest Stretch", detail: "2 × 6 per side", sets: [{ reps: 6, label: "per side" }, { reps: 6, label: "per side" }] },
    { id: "hip-flexor", name: "Hip Flexor Stretch", detail: "2 × 35s each side", sets: [{ duration: 35, label: "each side" }, { duration: 35, label: "each side" }] },
    { id: "bird-dog", name: "Bird-Dog", detail: "2 × 10 per side", sets: [{ reps: 10, label: "per side" }, { reps: 10, label: "per side" }] },
    { id: "thoracic-rotation", name: "Thoracic Rotations", detail: "2 × 10 per side", sets: [{ reps: 10, label: "per side" }, { reps: 10, label: "per side" }] }
  ];

  return suggestion;
}

function renderSuggestion() {
  const s = generateSuggestion();
  const el = document.getElementById("suggestion-content");
  let html = `<p><strong>${s.title}</strong><br><span style="color:var(--muted)">${s.focus}</span></p>`;
  html += `<p style="margin-top:8px"><strong>Upper</strong></p><ul>`;
  s.upper.forEach(e => {
    const setsStr = e.sets.map(st => `${st.reps}×${st.weight}`).join(" → ");
    html += `<li>${e.name}: ${setsStr}</li>`;
  });
  html += `</ul><p><strong>Lower</strong></p><ul>`;
  s.lower.forEach(e => {
    const setsStr = e.sets.map(st => `${st.reps}×${st.weight}`).join(" → ");
    html += `<li>${e.name}: ${setsStr}</li>`;
  });
  html += `</ul><p><strong>Core / Mobility</strong></p><ul>`;
  s.core.forEach(e => {
    html += `<li>${e.name}: ${e.detail}</li>`;
  });
  html += `</ul><p><strong>Aerobic</strong>: ${s.aerobic}</p>`;
  el.innerHTML = html;
}

// ===== Render Equipment Cards =====
function getSuggestedIds() {
  const s = generateSuggestion();
  const ids = new Set();
  (s.upper || []).forEach(e => ids.add(e.id));
  (s.lower || []).forEach(e => ids.add(e.id));
  // Core/mobility in suggestion are name-based; map common ones
  const coreMap = {
    "Single-Leg Balance": "single-leg-balance",
    "Single-Leg RDL": "single-leg-rdl",
    "Heel-to-Toe Walk": "heel-to-toe",
    "World's Greatest Stretch": "worlds-greatest",
    "Hip Flexor Stretch": "hip-flexor",
    "Bird-Dog": "bird-dog",
    "Thoracic Rotations": "thoracic-rotation"
  };
  (s.core || []).forEach(e => {
    if (coreMap[e.name]) ids.add(coreMap[e.name]);
  });
  ids.add("cycling");
  return ids;
}

function renderExercises() {
  const suggestedIds = getSuggestedIds();

  ["upper", "lower", "core", "aerobic"].forEach(cat => {
    const container = document.getElementById(`${cat}-exercises`);
    container.innerHTML = "";

    // Add Exercise button at top of each tab
    const addBar = document.createElement("div");
    addBar.className = "add-exercise-bar";
    addBar.innerHTML = `<button class="btn secondary add-ex-btn" data-cat="${cat}">+ Add Exercise</button>`;
    container.appendChild(addBar);

    const allEx = getAllEquipment(cat);
    // Suggested first, then others
    const suggested = allEx.filter(ex => suggestedIds.has(ex.id));
    const others = allEx.filter(ex => !suggestedIds.has(ex.id));

    if (suggested.length) {
      const label = document.createElement("div");
      label.className = "section-label";
      label.textContent = "In today's suggestion";
      container.appendChild(label);
    }

    suggested.forEach(ex => container.appendChild(buildExerciseCard(ex, cat, false)));

    if (others.length) {
      const label = document.createElement("div");
      label.className = "section-label muted";
      label.textContent = "Other exercises (tap to expand)";
      container.appendChild(label);

      others.forEach(ex => container.appendChild(buildExerciseCard(ex, cat, true)));
    }
  });

  // Attach log buttons
  document.querySelectorAll(".log-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openLogModal(btn.dataset.id, btn.dataset.cat);
    });
  });

  // Expand/collapse for minimized cards (event delegation so it keeps working after toggle)
  document.querySelectorAll(".exercise-grid").forEach(grid => {
    grid.onclick = (e) => {
      const hdr = e.target.closest(".collapsed-header");
      if (!hdr) return;
      const card = hdr.closest(".exercise-card");
      if (!card) return;
      card.classList.toggle("collapsed");
      card.classList.toggle("expanded");
    };
  });

  // Add exercise buttons
  document.querySelectorAll(".add-ex-btn").forEach(btn => {
    btn.addEventListener("click", () => openAddExerciseModal(btn.dataset.cat));
  });
}

function buildExerciseCard(ex, cat, startCollapsed) {
  const last = getLastForExercise(ex.id);
  let lastText = "No previous log";
  if (last && last.sets && last.sets.length) {
    const lt = ex.logType || "strength";
    lastText = "Last: " + last.sets.map(s => formatSetDisplay(s, lt)).filter(Boolean).join(", ");
  }

  const card = document.createElement("div");
  card.className = "exercise-card" + (startCollapsed ? " collapsed" : "");
  card.dataset.id = ex.id;

  if (startCollapsed) {
    card.innerHTML = `
      <div class="collapsed-header">
        <span class="collapsed-name">${ex.name}</span>
        <span class="expand-chevron">›</span>
      </div>
      <div class="collapsed-body">
        <img src="${ex.img || "ab-crunch.jpg"}" alt="${ex.name}" loading="lazy" onerror="this.src='ab-crunch.jpg'">
        <div class="exercise-info">
          <h3>${ex.name}</h3>
          <div class="meta">${ex.brand || "Custom"}${ex.notes ? " • " + ex.notes : ""}</div>
          <div class="last-log">${lastText}</div>
          <button class="log-btn" data-id="${ex.id}" data-cat="${cat}">Log Sets</button>
        </div>
      </div>
    `;
  } else {
    card.innerHTML = `
      <img src="${ex.img || "ab-crunch.jpg"}" alt="${ex.name}" loading="lazy" onerror="this.src='ab-crunch.jpg'">
      <div class="exercise-info">
        <h3>${ex.name}</h3>
        <div class="meta">${ex.brand || "Custom"}${ex.notes ? " • " + ex.notes : ""}</div>
        <div class="last-log">${lastText}</div>
        <button class="log-btn" data-id="${ex.id}" data-cat="${cat}">Log Sets</button>
      </div>
    `;
  }
  return card;
}

// ===== Modal Logic =====
function formatSetDisplay(set, logType) {
  if (!set) return "";
  logType = logType || "strength";
  if (logType === "time" || logType === "cardio") {
    const unit = set.unit || (logType === "cardio" ? "min" : "sec");
    const d = set.duration != null ? set.duration : set.reps;
    const label = set.label ? " " + set.label : "";
    return d + unit + label;
  }
  if (logType === "steps") {
    return (set.steps != null ? set.steps : set.reps) + " steps";
  }
  if (logType === "reps") {
    const label = set.label ? " " + set.label : "";
    return (set.reps != null ? set.reps : "") + " reps" + label;
  }
  // strength
  if (set.weight != null && set.reps != null) return set.reps + "@" + set.weight;
  return "";
}

function openLogModal(exId, cat) {
  const ex = findExercise(exId, cat);
  if (!ex) {
    showToast("Exercise not found");
    return;
  }
  currentLogExercise = { ...ex, category: cat };
  const logType = ex.logType || "strength";

  // Empty defaults by type
  const emptySet = () => {
    if (logType === "time" || logType === "cardio") return { duration: "", label: "", unit: logType === "cardio" ? "min" : "sec" };
    if (logType === "steps") return { steps: "" };
    if (logType === "reps") return { reps: "", label: "" };
    return { weight: "", reps: "" };
  };
  currentSets = [emptySet(), emptySet(), emptySet()];

  // 1. Prefer suggested sets (including core)
  const suggestion = generateSuggestion();
  let suggestedSets = null;
  const allSuggested = [
    ...(suggestion.upper || []),
    ...(suggestion.lower || []),
    ...(suggestion.core || [])
  ];
  // aerobic suggestion is a string; use equipment defaults
  const match = allSuggested.find(s => s.id === exId);
  if (match && match.sets && match.sets.length) {
    suggestedSets = match.sets;
  } else if (ex.defaultSets && ex.defaultSets.length) {
    suggestedSets = ex.defaultSets;
  }

  // 2. Fall back to last logged
  const last = getLastForExercise(exId);

  if (suggestedSets) {
    currentSets = suggestedSets.map(s => ({ ...emptySet(), ...s }));
  } else if (last && last.sets && last.sets.length) {
    currentSets = last.sets.map(s => ({ ...emptySet(), ...s }));
  }

  // Keep suggested count (don't force 3 for time/reps holds)
  if (logType === "strength" && currentSets.length < 3) {
    while (currentSets.length < 3) currentSets.push(emptySet());
  }

  document.getElementById("modal-title").textContent = `Log: ${ex.name}`;
  document.getElementById("modal-img").src = ex.img || "ab-crunch.jpg";
  document.getElementById("modal-img").onerror = function() { this.src = "ab-crunch.jpg"; };
  renderSetInputs();
  document.getElementById("log-modal").classList.remove("hidden");
}

function renderSetInputs() {
  const container = document.getElementById("sets-container");
  container.innerHTML = "";
  const logType = (currentLogExercise && currentLogExercise.logType) || "strength";

  currentSets.forEach((set, i) => {
    const row = document.createElement("div");
    row.className = "set-row";
    let fields = "";
    if (logType === "time") {
      fields = `
        <input type="number" placeholder="sec" value="${set.duration != null ? set.duration : ""}" data-idx="${i}" data-field="duration" inputmode="numeric">
        <input type="text" placeholder="label (e.g. each leg)" value="${set.label || ""}" data-idx="${i}" data-field="label">
      `;
    } else if (logType === "cardio") {
      fields = `
        <input type="number" placeholder="minutes" value="${set.duration != null ? set.duration : ""}" data-idx="${i}" data-field="duration" inputmode="numeric">
        <span style="color:var(--muted);font-size:0.85rem;">min</span>
      `;
    } else if (logType === "steps") {
      fields = `
        <input type="number" placeholder="steps" value="${set.steps != null ? set.steps : ""}" data-idx="${i}" data-field="steps" inputmode="numeric">
      `;
    } else if (logType === "reps") {
      fields = `
        <input type="number" placeholder="reps" value="${set.reps != null ? set.reps : ""}" data-idx="${i}" data-field="reps" inputmode="numeric">
        <input type="text" placeholder="label (e.g. per side)" value="${set.label || ""}" data-idx="${i}" data-field="label">
      `;
    } else {
      fields = `
        <input type="number" placeholder="lbs" value="${set.weight != null ? set.weight : ""}" data-idx="${i}" data-field="weight" inputmode="numeric">
        <input type="number" placeholder="reps" value="${set.reps != null ? set.reps : ""}" data-idx="${i}" data-field="reps" inputmode="numeric">
      `;
    }
    row.innerHTML = `<label>Set ${i + 1}</label>${fields}`;
    container.appendChild(row);
  });

  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", e => {
      const idx = +e.target.dataset.idx;
      const field = e.target.dataset.field;
      currentSets[idx][field] = e.target.value;
    });
  });
}

document.getElementById("add-set-btn").addEventListener("click", () => {
  const logType = (currentLogExercise && currentLogExercise.logType) || "strength";
  if (logType === "time" || logType === "cardio") currentSets.push({ duration: "", label: "", unit: logType === "cardio" ? "min" : "sec" });
  else if (logType === "steps") currentSets.push({ steps: "" });
  else if (logType === "reps") currentSets.push({ reps: "", label: "" });
  else currentSets.push({ weight: "", reps: "" });
  renderSetInputs();
});

document.getElementById("save-log-btn").addEventListener("click", () => {
  const logType = (currentLogExercise && currentLogExercise.logType) || "strength";
  const rows = document.querySelectorAll("#sets-container .set-row");
  const tempSets = [];

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (logType === "time" || logType === "cardio") {
      const d = inputs[0] ? inputs[0].value.trim() : "";
      const label = inputs[1] ? inputs[1].value.trim() : "";
      if (d !== "") {
        tempSets.push({
          duration: Number(d),
          unit: logType === "cardio" ? "min" : "sec",
          label: label || undefined
        });
      }
    } else if (logType === "steps") {
      const s = inputs[0] ? inputs[0].value.trim() : "";
      if (s !== "") tempSets.push({ steps: Number(s) });
    } else if (logType === "reps") {
      const r = inputs[0] ? inputs[0].value.trim() : "";
      const label = inputs[1] ? inputs[1].value.trim() : "";
      if (r !== "") tempSets.push({ reps: Number(r), label: label || undefined });
    } else {
      const w = inputs[0] ? inputs[0].value.trim() : "";
      const r = inputs[1] ? inputs[1].value.trim() : "";
      if (r !== "") tempSets.push({ weight: w !== "" ? Number(w) : 0, reps: Number(r) });
      else if (w !== "") tempSets.push({ weight: Number(w), reps: 1 });
    }
  });

  if (!tempSets.length) {
    showToast("Enter at least one set");
    return;
  }

  // Auto-start workout if user forgot to hit Start – nothing is lost
  if (!activeWorkout) {
    const startIso = new Date().toISOString();
    activeWorkout = {
      date: startIso,
      exercises: []
    };
    setWorkoutActiveUI(startIso);
  }

  const entry = {
    id: currentLogExercise.id,
    name: currentLogExercise.name,
    category: currentLogExercise.category,
    sets: tempSets
  };

  const existingIdx = activeWorkout.exercises.findIndex(e => e.id === currentLogExercise.id);
  if (existingIdx >= 0) {
    activeWorkout.exercises[existingIdx] = entry;
  } else {
    activeWorkout.exercises.push(entry);
  }

  // Always persist draft so a refresh or forgotten "Start" never loses logs
  saveDraft();

  showToast(`Saved ${currentLogExercise.name} (${tempSets.length} set${tempSets.length > 1 ? "s" : ""}) – workout auto-saved`);
  document.getElementById("log-modal").classList.add("hidden");
  renderExercises();
  document.getElementById("mark-complete-btn").style.display = "inline-block";
});

document.querySelector(".close-modal").addEventListener("click", () => {
  document.getElementById("log-modal").classList.add("hidden");
});

// ===== Workout active UI =====
function formatDateTime(iso) {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return dateStr + " · " + timeStr;
}

function setWorkoutActiveUI(startIso) {
  const panel = document.getElementById("suggestion-panel");
  const status = document.getElementById("workout-status");
  const startBtn = document.getElementById("start-suggested-btn");
  const completeBtn = document.getElementById("mark-complete-btn");

  panel.classList.add("workout-active");
  startBtn.classList.add("workout-running");
  startBtn.textContent = "Workout In Progress";
  startBtn.disabled = true;
  completeBtn.style.display = "inline-block";
  completeBtn.classList.add("btn-active-complete");
  status.className = "workout-status active";
  status.textContent = "Started: " + formatDateTime(startIso);
}

function setWorkoutCompletedUI(startIso, endIso) {
  const panel = document.getElementById("suggestion-panel");
  const status = document.getElementById("workout-status");
  const startBtn = document.getElementById("start-suggested-btn");
  const completeBtn = document.getElementById("mark-complete-btn");

  panel.classList.remove("workout-active");
  startBtn.classList.remove("workout-running");
  startBtn.textContent = "Start This Workout";
  startBtn.disabled = false;
  completeBtn.style.display = "none";
  completeBtn.classList.remove("btn-active-complete");
  status.className = "workout-status completed";
  let text = "Last completed: " + formatDateTime(endIso);
  if (startIso) text = "Started: " + formatDateTime(startIso) + "  →  Ended: " + formatDateTime(endIso);
  status.textContent = text;
}

function setWorkoutIdleUI() {
  const panel = document.getElementById("suggestion-panel");
  const status = document.getElementById("workout-status");
  const startBtn = document.getElementById("start-suggested-btn");
  const completeBtn = document.getElementById("mark-complete-btn");

  panel.classList.remove("workout-active");
  startBtn.classList.remove("workout-running");
  startBtn.textContent = "Start This Workout";
  startBtn.disabled = false;
  completeBtn.style.display = "none";
  completeBtn.classList.remove("btn-active-complete");
  // leave any completed message; clear only if empty
  if (!status.textContent || status.classList.contains("active")) {
    status.className = "workout-status";
    status.textContent = "";
  }
}

// ===== Mark Complete =====
document.getElementById("mark-complete-btn").addEventListener("click", () => {
  if (!activeWorkout || !activeWorkout.exercises.length) {
    showToast("No exercises logged yet");
    return;
  }
  const endIso = new Date().toISOString();
  const startIso = activeWorkout.date;
  activeWorkout.endedAt = endIso;

  const hist = getHistory();
  if (workoutAlreadyInHistory(activeWorkout, hist)) {
    showToast("This workout is already in history – skipped duplicate");
  } else {
    hist.push(activeWorkout);
    saveHistory(hist);
    showToast("Workout saved to history!");
  }
  activeWorkout = null;
  saveDraft(); // clears the draft
  setWorkoutCompletedUI(startIso, endIso);
  renderSuggestion();
  renderExercises();
  renderHistory();
});

document.getElementById("start-suggested-btn").addEventListener("click", () => {
  // If a workout is already in progress with logged sets, keep it – don't wipe
  if (activeWorkout && activeWorkout.exercises && activeWorkout.exercises.length) {
    setWorkoutActiveUI(activeWorkout.date || new Date().toISOString());
    showToast("Workout already in progress – your logs are saved");
    document.querySelector('.tab[data-tab="upper"]').click();
    return;
  }

  // If there's a leftover empty shell, or none, start fresh
  const startIso = new Date().toISOString();
  activeWorkout = {
    date: startIso,
    exercises: activeWorkout && activeWorkout.exercises ? activeWorkout.exercises : []
  };
  saveDraft();
  setWorkoutActiveUI(startIso);
  showToast("Workout started – log your sets as you go");
  document.querySelector('.tab[data-tab="upper"]').click();
});

// ===== History =====
function renderHistory() {
  const hist = getHistory().slice().reverse(); // newest first
  const container = document.getElementById("history-list");
  if (!hist.length) {
    container.innerHTML = "<p style='color:var(--muted)'>No workouts logged yet.</p>";
    return;
  }

  // Build list of selectable workouts by date
  let html = '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:10px;">Tap a date to view that workout in detail.</p>';
  html += hist.map((w, idx) => {
    const d = new Date(w.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const exerciseCount = w.exercises.length;
    const summary = w.exercises.slice(0, 3).map(e => e.name).join(", ") + (exerciseCount > 3 ? "…" : "");
    return `
      <div class="history-item" data-idx="${idx}">
        <div class="history-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h4 style="margin:0;">${dateStr}</h4>
            <div style="font-size:0.8rem;color:var(--muted);">${timeStr} • ${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}</div>
            <div style="font-size:0.8rem;color:var(--muted);margin-top:2px;">${summary}</div>
          </div>
          <span class="expand-icon" style="font-size:1.2rem;color:var(--accent);">›</span>
        </div>
        <div class="history-detail" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:10px;"></div>
      </div>`;
  }).join("");

  container.innerHTML = html;

  // Click handlers to expand/collapse individual workouts
  container.querySelectorAll(".history-item").forEach(item => {
    item.querySelector(".history-header").addEventListener("click", () => {
      const detail = item.querySelector(".history-detail");
      const icon = item.querySelector(".expand-icon");
      const isOpen = detail.style.display === "block";

      // Close all others
      container.querySelectorAll(".history-detail").forEach(d => d.style.display = "none");
      container.querySelectorAll(".expand-icon").forEach(i => i.textContent = "›");

      if (!isOpen) {
        const idx = +item.dataset.idx;
        const w = hist[idx];
        let detailHtml = w.exercises.map(e => {
          const lt = (findExercise(e.id, e.category) || {}).logType || "strength";
          const setsStr = e.sets.map(s => formatSetDisplay(s, lt) || `${s.reps || ""}@${s.weight || ""}`).join("<br>");
          return `<div class="ex" style="margin-bottom:10px;">
            <strong>${e.name}</strong>
            <div class="sets" style="margin-top:2px;">${setsStr}</div>
          </div>`;
        }).join("");
        detail.innerHTML = detailHtml || "<em>No exercises recorded</em>";
        detail.style.display = "block";
        icon.textContent = "∨";
      }
    });
  });
}

// ===== Export / Import History =====
document.getElementById("export-history-btn").addEventListener("click", () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    fitnessHistory: getHistory(),
    customExercises: getCustomExercises(),
    // Optional: include draft if present
    fitnessDraft: null
  };
  try {
    const raw = localStorage.getItem("fitnessDraft");
    if (raw) payload.fitnessDraft = JSON.parse(raw);
  } catch {}

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `fitness-history-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("History exported");
});

document.getElementById("import-history-btn").addEventListener("click", () => {
  document.getElementById("import-history-file").click();
});

document.getElementById("import-history-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      let history = [];
      let customs = [];
      let draft = null;

      // Support both our export format and a bare array of workouts
      if (Array.isArray(data)) {
        history = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.fitnessHistory)) history = data.fitnessHistory;
        else if (Array.isArray(data.history)) history = data.history;
        if (Array.isArray(data.customExercises)) customs = data.customExercises;
        if (data.fitnessDraft) draft = data.fitnessDraft;
      }

      if (!history.length && !customs.length && !draft) {
        showToast("No valid history found in file");
        return;
      }

      // Always merge – never replace; skip duplicates
      const existing = getHistory();
      let added = 0;
      let skipped = 0;
      history.forEach(w => {
        if (!w || !w.date) return;
        if (workoutAlreadyInHistory(w, existing)) {
          skipped++;
          return;
        }
        existing.push(w);
        added++;
      });
      existing.sort((a, b) => new Date(a.date) - new Date(b.date));
      saveHistory(existing);

      if (customs.length) {
        const cur = getCustomExercises();
        const ids = new Set(cur.map(c => c.id));
        customs.forEach(c => {
          if (c && c.id && !ids.has(c.id)) cur.push(c);
        });
        saveCustomExercises(cur);
      }

      if (draft && !activeWorkout) {
        localStorage.setItem("fitnessDraft", JSON.stringify(draft));
        activeWorkout = draft;
        setWorkoutActiveUI(draft.date || new Date().toISOString());
      }

      const msg = skipped
        ? `Merged ${added} new workout(s), skipped ${skipped} duplicate(s)`
        : `Merged ${added} new workout(s)`;
      showToast(msg);

      renderHistory();
      renderSuggestion();
      renderExercises();
    } catch (err) {
      console.error(err);
      showToast("Import failed – invalid file");
    }
    // Reset file input so same file can be chosen again
    e.target.value = "";
  };
  reader.readAsText(file);
});

document.getElementById("clear-history-btn").addEventListener("click", () => {
  if (confirm("Clear all workout history? This cannot be undone.")) {
    localStorage.removeItem("fitnessHistory");
    renderHistory();
    renderSuggestion();
    renderExercises();
    showToast("History cleared");
  }
});

// ===== Tabs =====
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// ===== Add Custom Exercise =====
function openAddExerciseModal(defaultCat) {
  document.getElementById("add-ex-name").value = "";
  document.getElementById("add-ex-brand").value = "";
  document.getElementById("add-ex-notes").value = "";
  document.getElementById("add-ex-category").value = defaultCat || "upper";
  document.getElementById("add-ex-preview").src = "";
  document.getElementById("add-ex-preview").style.display = "none";
  document.getElementById("add-ex-file").value = "";
  window._pendingExImage = null;
  document.getElementById("add-exercise-modal").classList.remove("hidden");
}

document.getElementById("add-ex-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2.5 * 1024 * 1024) {
    showToast("Image too large (max ~2.5 MB)");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    window._pendingExImage = ev.target.result; // data URL
    const preview = document.getElementById("add-ex-preview");
    preview.src = window._pendingExImage;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});

document.getElementById("save-new-exercise-btn").addEventListener("click", () => {
  const name = document.getElementById("add-ex-name").value.trim();
  const cat = document.getElementById("add-ex-category").value;
  const brand = document.getElementById("add-ex-brand").value.trim() || "Custom";
  const notes = document.getElementById("add-ex-notes").value.trim();
  if (!name) {
    showToast("Please enter an exercise name");
    return;
  }
  const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
  const list = getCustomExercises();
  list.push({
    id,
    name,
    brand,
    notes,
    category: cat,
    img: window._pendingExImage || "ab-crunch.jpg",
    custom: true
  });
  saveCustomExercises(list);
  document.getElementById("add-exercise-modal").classList.add("hidden");
  showToast(`Added "${name}"`);
  renderExercises();
});

document.querySelector("#add-exercise-modal .close-modal").addEventListener("click", () => {
  document.getElementById("add-exercise-modal").classList.add("hidden");
});

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2200);
}

// ===== Init =====
function init() {
  // Restore any in-progress workout from a previous session (logs kept even without Start)
  if (loadDraft() && activeWorkout) {
    setWorkoutActiveUI(activeWorkout.date || new Date().toISOString());
    if (activeWorkout.exercises && activeWorkout.exercises.length) {
      // Ensure Mark Complete is available so user can finish later
      document.getElementById("mark-complete-btn").style.display = "inline-block";
    }
  }
  renderSuggestion();
  renderExercises();
  renderHistory();
}

// Save draft whenever the page is backgrounded or closed so nothing is lost
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden" && activeWorkout) {
    saveDraft();
  }
});
window.addEventListener("pagehide", () => {
  if (activeWorkout) saveDraft();
});

init();
