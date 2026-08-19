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
// Muscle-group tags used to avoid redundant overlap in one session
const EXERCISE_GROUPS = {
  "chest-press": ["push-h", "chest"],
  "seated-dip": ["push-h", "triceps", "chest"],
  "shoulder-press": ["push-v", "shoulders"],
  "seated-row": ["pull-h", "back"],
  "fixed-pulldown": ["pull-v", "back"],
  "triceps-extension": ["triceps"],
  "triceps-pushdown": ["triceps"],
  "biceps-curl": ["biceps"],
  "db-curls": ["biceps"],
  "leg-press": ["quads", "legs"],
  "leg-extension": ["quads", "legs"],
  "leg-curl": ["hams", "legs"],
  "ab-crunch": ["abs"],
  "single-leg-balance": ["balance"],
  "single-leg-rdl": ["hinge", "balance"],
  "heel-to-toe": ["balance"],
  "worlds-greatest": ["mobility"],
  "hip-flexor": ["mobility"],
  "bird-dog": ["stability"],
  "thoracic-rotation": ["mobility"],
  "cycling": ["cardio"]
};

function groupsFor(ex) {
  if (EXERCISE_GROUPS[ex.id]) return EXERCISE_GROUPS[ex.id];
  // Custom exercises: infer from logType / name
  const name = (ex.name || "").toLowerCase();
  const tags = [];
  if (/curl|bicep/.test(name)) tags.push("biceps");
  if (/tricep|pushdown|extension/.test(name) && !/leg/.test(name)) tags.push("triceps");
  if (/press|bench|chest|fly/.test(name)) tags.push("push-h", "chest");
  if (/shoulder|overhead/.test(name)) tags.push("push-v", "shoulders");
  if (/row/.test(name)) tags.push("pull-h", "back");
  if (/pulldown|pull-down|lat/.test(name)) tags.push("pull-v", "back");
  if (/leg press|squat/.test(name)) tags.push("quads", "legs");
  if (/leg curl|hamstring/.test(name)) tags.push("hams", "legs");
  if (/leg extension|quad/.test(name)) tags.push("quads", "legs");
  if (/balance|single-leg/.test(name)) tags.push("balance");
  if (/stretch|mobility|flexor|thoracic/.test(name)) tags.push("mobility");
  if (/bird|plank|dead bug|stability/.test(name)) tags.push("stability");
  if (/cycle|bike|cardio|run/.test(name)) tags.push("cardio");
  if (!tags.length) {
    if (ex.logType === "cardio") tags.push("cardio");
    else if (ex.logType === "time" || ex.logType === "steps") tags.push("mobility");
    else if (ex.category === "lower") tags.push("legs");
    else if (ex.category === "core") tags.push("stability");
    else tags.push("misc-" + (ex.id || "x"));
  }
  return tags;
}

function getRecentExerciseIds(limitWorkouts) {
  const hist = getHistory();
  const ids = new Set();
  const start = Math.max(0, hist.length - (limitWorkouts || 2));
  for (let i = start; i < hist.length; i++) {
    (hist[i].exercises || []).forEach(e => { if (e.id) ids.add(e.id); });
  }
  return ids;
}

function progressStrengthSets(lastEx, defaults) {
  if (!lastEx || !lastEx.sets || !lastEx.sets.length) return defaults.map(s => ({ ...s }));
  const strengthSets = lastEx.sets.filter(s => s.weight != null || s.reps != null);
  if (!strengthSets.length) return defaults.map(s => ({ ...s }));
  const heaviest = strengthSets.reduce((a, b) => ((b.weight || 0) > (a.weight || 0) ? b : a), strengthSets[0]);
  const topW = Number(heaviest.weight) || 0;
  const topR = Number(heaviest.reps) || 6;
  // Progressive overload: +5 lbs on top set if you hit at least 6 reps, else keep weight and nudge reps
  let newTop = topW;
  let newTopReps = topR;
  if (topR >= 6) {
    newTop = Math.round((topW + 5) / 5) * 5;
    newTopReps = Math.max(6, Math.min(8, topR));
  } else {
    newTopReps = topR + 1;
  }
  const warm = Math.max(40, Math.round((newTop - 20) / 5) * 5);
  const mid = Math.max(warm, Math.round((newTop - 10) / 5) * 5);
  return [
    { reps: 10, weight: warm },
    { reps: 8, weight: mid },
    { reps: newTopReps, weight: newTop }
  ];
}

function progressTimeSets(lastEx, defaults) {
  if (!lastEx || !lastEx.sets || !lastEx.sets.length) return defaults.map(s => ({ ...s }));
  return lastEx.sets.map((s, i) => {
    const base = defaults[i] || defaults[defaults.length - 1] || { duration: 30, label: "" };
    const d = Number(s.duration != null ? s.duration : base.duration) || 30;
    return {
      duration: Math.min(90, d + 5),
      label: s.label || base.label,
      unit: s.unit || base.unit || "sec"
    };
  });
}

function progressRepsSets(lastEx, defaults) {
  if (!lastEx || !lastEx.sets || !lastEx.sets.length) return defaults.map(s => ({ ...s }));
  return lastEx.sets.map((s, i) => {
    const base = defaults[i] || defaults[defaults.length - 1] || { reps: 10, label: "" };
    const r = Number(s.reps != null ? s.reps : base.reps) || 10;
    return { reps: Math.min(20, r + 1), label: s.label || base.label };
  });
}

function progressStepsSets(lastEx, defaults) {
  if (!lastEx || !lastEx.sets || !lastEx.sets.length) return defaults.map(s => ({ ...s }));
  return lastEx.sets.map((s, i) => {
    const base = defaults[i] || { steps: 10 };
    const st = Number(s.steps != null ? s.steps : base.steps) || 10;
    return { steps: Math.min(30, st + 2) };
  });
}

function progressCustomSets(lastEx, defaults, ex) {
  if (!lastEx || !lastEx.sets || !lastEx.sets.length) return defaults;
  // Nudge numeric fields up slightly
  return lastEx.sets.map(s => {
    const out = { ...s };
    if (out.v1 !== "" && out.v1 != null && !isNaN(Number(out.v1))) out.v1 = Number(out.v1) + 1;
    if (out.weight != null) out.weight = Math.round((Number(out.weight) + 5) / 5) * 5;
    if (out.reps != null) out.reps = Number(out.reps) + 1;
    if (out.duration != null) out.duration = Number(out.duration) + 5;
    return out;
  });
}

function defaultSetsFor(ex) {
  if (ex.defaultSets && ex.defaultSets.length) return ex.defaultSets.map(s => ({ ...s }));
  const lt = ex.logType || "strength";
  if (lt === "time") return [{ duration: 30, label: "", unit: "sec" }, { duration: 30, label: "", unit: "sec" }];
  if (lt === "cardio") return [{ duration: 60, unit: "min" }];
  if (lt === "steps") return [{ steps: 10 }, { steps: 10 }];
  if (lt === "reps") return [{ reps: 10, label: "" }, { reps: 10, label: "" }];
  if (lt === "custom") {
    const cu = ex.customUnits || {};
    return [{ v1: 10, v2: "", u1: cu.field1 || "", u2: cu.field2 || "" }, { v1: 10, v2: "", u1: cu.field1 || "", u2: cu.field2 || "" }];
  }
  return [{ reps: 10, weight: 50 }, { reps: 8, weight: 60 }, { reps: 6, weight: 70 }];
}

function progressedSetsFor(ex) {
  const lastEx = getLastForExercise(ex.id);
  const defaults = defaultSetsFor(ex);
  const lt = ex.logType || "strength";
  if (lt === "time" || lt === "cardio") return progressTimeSets(lastEx, defaults);
  if (lt === "reps") return progressRepsSets(lastEx, defaults);
  if (lt === "steps") return progressStepsSets(lastEx, defaults);
  if (lt === "custom") return progressCustomSets(lastEx, defaults, ex);
  return progressStrengthSets(lastEx, defaults);
}

function detailFromSets(ex, sets) {
  const lt = ex.logType || "strength";
  if (!sets || !sets.length) return "";
  if (lt === "time" || lt === "cardio") {
    const unit = sets[0].unit || (lt === "cardio" ? "min" : "sec");
    return sets.length + " × " + sets[0].duration + unit + (sets[0].label ? " " + sets[0].label : "");
  }
  if (lt === "steps") return sets.length + " × " + sets[0].steps + " steps";
  if (lt === "reps") return sets.length + " × " + sets[0].reps + " reps" + (sets[0].label ? " " + sets[0].label : "");
  if (lt === "custom") return sets.map(s => formatSetDisplay(s, "custom", ex.customUnits)).filter(Boolean).join(" → ");
  return sets.map(s => s.reps + "×" + s.weight).join(" → ");
}

// Pairs that should not appear together in one session (redundant or overlapping fatigue)
const CONFLICT_PAIRS = [
  ["fixed-pulldown", "triceps-extension"],
  ["fixed-pulldown", "triceps-pushdown"],
  ["triceps-extension", "triceps-pushdown"],
  ["biceps-curl", "db-curls"],
  ["chest-press", "seated-dip"],
  ["leg-press", "leg-extension"] // both heavy quad bias in same session
];

function conflictsWithPicked(exId, pickedIds) {
  for (const [a, b] of CONFLICT_PAIRS) {
    if (exId === a && pickedIds.has(b)) return true;
    if (exId === b && pickedIds.has(a)) return true;
  }
  return false;
}

function pickVaried(pool, count, recentIds, usedGroups) {
  const scored = pool.map((ex, idx) => {
    const tags = groupsFor(ex);
    const conflict = tags.some(t => usedGroups.has(t));
    const recent = recentIds.has(ex.id) ? 1 : 0;
    const histLen = getHistory().length;
    const rotate = (histLen + idx) % Math.max(pool.length, 1);
    return { ex, conflict, recent, rotate, tags };
  });
  scored.sort((a, b) => {
    if (a.conflict !== b.conflict) return a.conflict - b.conflict;
    if (a.recent !== b.recent) return a.recent - b.recent;
    return a.rotate - b.rotate;
  });
  const picked = [];
  const pickedIds = new Set();
  for (const item of scored) {
    if (picked.length >= count) break;
    if (item.conflict && picked.length > 0) continue;
    if (conflictsWithPicked(item.ex.id, pickedIds)) continue;
    picked.push(item);
    pickedIds.add(item.ex.id);
    item.tags.forEach(t => usedGroups.add(t));
  }
  if (picked.length < count) {
    for (const item of scored) {
      if (picked.length >= count) break;
      if (pickedIds.has(item.ex.id)) continue;
      if (item.tags.some(t => usedGroups.has(t))) continue;
      if (conflictsWithPicked(item.ex.id, pickedIds)) continue;
      picked.push(item);
      pickedIds.add(item.ex.id);
      item.tags.forEach(t => usedGroups.add(t));
    }
  }
  return picked.map(p => p.ex);
}

function generateSuggestion() {
  const last = getLastWorkout();
  const recentIds = getRecentExerciseIds(2);
  const usedGroups = new Set();
  const suggestion = {
    title: "Balanced Full-Body Session",
    focus: last
      ? "Progressed from your most recent workout · varied exercises for continued gains"
      : "Progressive strength + balance/mobility + cycling",
    upper: [],
    lower: [],
    core: [],
    aerobic: "60 min steady cycling"
  };

  const upperPool = getAllEquipment("upper");
  const lowerPool = getAllEquipment("lower");
  const corePool = getAllEquipment("core").filter(e => e.id !== "ab-crunch"); // prefer bodyweight unless only option
  const aerobicPool = getAllEquipment("aerobic");

  // Upper: aim for 4 exercises covering different patterns (push-h, pull-h, push-v or pull-v, arm accessory)
  const upperPicked = pickVaried(upperPool, 4, recentIds, usedGroups);
  suggestion.upper = upperPicked.map(ex => {
    const sets = progressedSetsFor(ex);
    return { id: ex.id, name: ex.name, sets, detail: detailFromSets(ex, sets) };
  });

  // Lower: 2–3 exercises, avoid double-loading same group hard
  const lowerPicked = pickVaried(lowerPool, Math.min(3, lowerPool.length), recentIds, usedGroups);
  suggestion.lower = lowerPicked.map(ex => {
    const sets = progressedSetsFor(ex);
    return { id: ex.id, name: ex.name, sets, detail: detailFromSets(ex, sets) };
  });

  // Core/mobility: 3–4 varied (balance + hinge/stability + mobility)
  const corePicked = pickVaried(corePool.length ? corePool : getAllEquipment("core"), 4, recentIds, usedGroups);
  suggestion.core = corePicked.map(ex => {
    const sets = progressedSetsFor(ex);
    return {
      id: ex.id,
      name: ex.name,
      sets,
      detail: detailFromSets(ex, sets)
    };
  });

  // Aerobic
  if (aerobicPool.length) {
    const cardio = pickVaried(aerobicPool, 1, recentIds, usedGroups)[0] || aerobicPool[0];
    const sets = progressedSetsFor(cardio);
    const mins = (sets[0] && sets[0].duration) || 60;
    suggestion.aerobic = mins + " min " + (cardio.name || "steady cycling");
    suggestion.aerobicId = cardio.id;
  }

  return suggestion;
}

function renderSuggestion() {
  const s = generateSuggestion();
  const el = document.getElementById("suggestion-content");
  let html = `<p><strong>${s.title}</strong><br><span style="color:var(--muted)">${s.focus}</span></p>`;
  html += `<p style="margin-top:8px"><strong>Upper</strong></p><ul>`;
  s.upper.forEach(e => {
    const setsStr = e.detail || (e.sets || []).map(st => (st.reps != null ? st.reps + "×" + (st.weight != null ? st.weight : "") : "")).filter(Boolean).join(" → ");
    html += `<li>${e.name}: ${setsStr}</li>`;
  });
  html += `</ul><p><strong>Lower</strong></p><ul>`;
  s.lower.forEach(e => {
    const setsStr = e.detail || (e.sets || []).map(st => (st.reps != null ? st.reps + "×" + (st.weight != null ? st.weight : "") : "")).filter(Boolean).join(" → ");
    html += `<li>${e.name}: ${setsStr}</li>`;
  });
  html += `</ul><p><strong>Core / Mobility</strong></p><ul>`;
  s.core.forEach(e => {
    html += `<li>${e.name}: ${e.detail || ""}</li>`;
  });
  html += `</ul><p><strong>Aerobic</strong>: ${s.aerobic}</p>`;
  el.innerHTML = html;
}

// ===== Render Equipment Cards =====
function getSuggestedIds() {
  const s = generateSuggestion();
  const ids = new Set();
  (s.upper || []).forEach(e => { if (e.id) ids.add(e.id); });
  (s.lower || []).forEach(e => { if (e.id) ids.add(e.id); });
  (s.core || []).forEach(e => { if (e.id) ids.add(e.id); });
  if (s.aerobicId) ids.add(s.aerobicId);
  else ids.add("cycling");
  return ids;
}

function renderExercises() {
  const suggestedIds = getSuggestedIds();

  ["upper", "lower", "core", "aerobic"].forEach(cat => {
    const container = document.getElementById(`${cat}-exercises`);
    container.innerHTML = "";

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

  // Delete custom exercise (with confirmation)
  document.querySelectorAll(".delete-ex-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const list = getCustomExercises();
      const found = list.find(x => x.id === id);
      const label = found ? found.name : "this exercise";
      if (!confirmClear(`Delete "${label}"?\nIt will be removed from your exercise list. Past workout history is not changed.`)) {
        showToast("Delete cancelled");
        return;
      }
      saveCustomExercises(list.filter(x => x.id !== id));
      renderExercises();
      showToast(`Deleted "${label}"`);
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

}


function buildExerciseCard(ex, cat, startCollapsed) {
  const last = getLastForExercise(ex.id);
  let lastText = "No previous log";
  if (last && last.sets && last.sets.length) {
    const lt = ex.logType || "strength";
    lastText = "Last: " + last.sets.map(s => formatSetDisplay(s, lt, ex.customUnits)).filter(Boolean).join(", ");
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
          ${ex.custom ? `<button class="btn danger delete-ex-btn" data-id="${ex.id}" style="margin-top:6px;width:100%;">Delete Exercise</button>` : ""}
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
        ${ex.custom ? `<button class="btn danger delete-ex-btn" data-id="${ex.id}" style="margin-top:6px;width:100%;">Delete Exercise</button>` : ""}
      </div>
    `;
  }
  return card;
}

// ===== Modal Logic =====
function formatSetDisplay(set, logType, customUnits) {
  if (!set) return "";
  logType = logType || "strength";
  if (logType === "time" || logType === "cardio") {
    const unit = set.unit || (logType === "cardio" ? "min" : "sec");
    const d = set.duration != null ? set.duration : set.reps;
    const label = set.label ? " " + set.label : "";
    return d + " " + unit + label;
  }
  if (logType === "steps") {
    return (set.steps != null ? set.steps : set.reps) + " steps";
  }
  if (logType === "reps") {
    const label = set.label ? " " + set.label : "";
    return (set.reps != null ? set.reps : "") + " reps" + label;
  }
  if (logType === "custom") {
    const u1 = (customUnits && customUnits.field1) || set.u1 || "";
    const u2 = (customUnits && customUnits.field2) || set.u2 || "";
    const v1 = set.v1 != null ? set.v1 : "";
    const v2 = set.v2 != null ? set.v2 : "";
    if (v1 === "" && v2 === "") return "";
    // Prefer "10 reps @ 130 lbs" style when second unit looks like weight
    if (v2 !== "" && u2 && /lb|kg|pound|kilo/i.test(u2)) {
      return v1 + (u1 ? " " + u1 : "") + " @ " + v2 + " " + u2;
    }
    if (v2 !== "") {
      return v1 + (u1 ? " " + u1 : "") + " · " + v2 + (u2 ? " " + u2 : "");
    }
    return v1 + (u1 ? " " + u1 : "");
  }
  // strength: 10@130 or 10 reps @ 130 lbs
  if (set.weight != null && set.reps != null) return set.reps + " reps @ " + set.weight + " lbs";
  if (set.reps != null) return set.reps + " reps";
  if (set.weight != null) return set.weight + " lbs";
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
  const customUnits = ex.customUnits || null;
  const defaultCount = Math.max(1, Math.min(10, ex.defaultSetCount || 3));

  // Empty defaults by type
  const emptySet = () => {
    if (logType === "time" || logType === "cardio") return { duration: "", label: "", unit: logType === "cardio" ? "min" : "sec" };
    if (logType === "steps") return { steps: "" };
    if (logType === "reps") return { reps: "", label: "" };
    if (logType === "custom") return { v1: "", v2: "", u1: (customUnits && customUnits.field1) || "", u2: (customUnits && customUnits.field2) || "" };
    return { weight: "", reps: "" };
  };
  currentSets = [];
  for (let i = 0; i < defaultCount; i++) currentSets.push(emptySet());

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

  // Pad to at least defaultCount for strength; keep suggested length otherwise
  if (logType === "strength") {
    while (currentSets.length < defaultCount) currentSets.push(emptySet());
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
    } else if (logType === "custom") {
      const cu = currentLogExercise.customUnits || {};
      const p1 = cu.field1 || "value 1";
      const p2 = cu.field2 || "";
      fields = `
        <input type="number" placeholder="${p1}" value="${set.v1 != null ? set.v1 : ""}" data-idx="${i}" data-field="v1" inputmode="numeric">
        ${p2 ? `<input type="number" placeholder="${p2}" value="${set.v2 != null ? set.v2 : ""}" data-idx="${i}" data-field="v2" inputmode="numeric">` : ""}
      `;
    } else {
      // strength: reps @ weight combination
      fields = `
        <input type="number" placeholder="reps" value="${set.reps != null ? set.reps : ""}" data-idx="${i}" data-field="reps" inputmode="numeric">
        <input type="number" placeholder="lbs" value="${set.weight != null ? set.weight : ""}" data-idx="${i}" data-field="weight" inputmode="numeric">
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
  const cu = (currentLogExercise && currentLogExercise.customUnits) || {};
  if (logType === "time" || logType === "cardio") currentSets.push({ duration: "", label: "", unit: logType === "cardio" ? "min" : "sec" });
  else if (logType === "steps") currentSets.push({ steps: "" });
  else if (logType === "reps") currentSets.push({ reps: "", label: "" });
  else if (logType === "custom") currentSets.push({ v1: "", v2: "", u1: cu.field1 || "", u2: cu.field2 || "" });
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
    } else if (logType === "custom") {
      const cu = (currentLogExercise && currentLogExercise.customUnits) || {};
      const v1 = inputs[0] ? inputs[0].value.trim() : "";
      const v2 = inputs[1] ? inputs[1].value.trim() : "";
      if (v1 !== "" || v2 !== "") {
        tempSets.push({
          v1: v1 !== "" ? Number(v1) : "",
          v2: v2 !== "" ? Number(v2) : "",
          u1: cu.field1 || "",
          u2: cu.field2 || ""
        });
      }
    } else {
      // strength: first input is reps, second is lbs
      const r = inputs[0] ? inputs[0].value.trim() : "";
      const w = inputs[1] ? inputs[1].value.trim() : "";
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
  const cancelBtn = document.getElementById("cancel-workout-btn");

  panel.classList.add("workout-active");
  startBtn.classList.add("workout-running");
  startBtn.textContent = "Workout In Progress";
  startBtn.disabled = true;
  completeBtn.style.display = "inline-block";
  completeBtn.classList.add("btn-active-complete");
  if (cancelBtn) cancelBtn.style.display = "inline-block";
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
  const cancelBtn = document.getElementById("cancel-workout-btn");

  panel.classList.remove("workout-active");
  startBtn.classList.remove("workout-running");
  startBtn.textContent = "Start This Workout";
  startBtn.disabled = false;
  completeBtn.style.display = "none";
  completeBtn.classList.remove("btn-active-complete");
  if (cancelBtn) cancelBtn.style.display = "none";
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

document.getElementById("cancel-workout-btn").addEventListener("click", () => {
  const hasLogs = activeWorkout && activeWorkout.exercises && activeWorkout.exercises.length;
  const msg = hasLogs
    ? "Cancel this workout and discard all sets logged so far?\nThis cannot be undone."
    : "Cancel this workout? Nothing has been logged yet.";
  if (!confirmClear(msg)) {
    showToast("Cancel aborted – workout still active");
    return;
  }
  activeWorkout = null;
  saveDraft();
  setWorkoutIdleUI();
  const status = document.getElementById("workout-status");
  status.className = "workout-status";
  status.textContent = "";
  renderExercises();
  showToast("In-progress workout cleared");
});

// ===== History =====
function renderHistory() {
  const fullHist = getHistory();
  const hist = fullHist.slice().reverse(); // newest first (display only)
  const container = document.getElementById("history-list");
  if (!hist.length) {
    container.innerHTML = "<p style='color:var(--muted)'>No workouts logged yet.</p>";
    return;
  }

  let html = '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:10px;">Tap a date to view details. Use Delete to remove one workout.</p>';
  html += hist.map((w, idx) => {
    const d = new Date(w.date);
    const dateStr = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const exerciseCount = (w.exercises || []).length;
    const summary = (w.exercises || []).slice(0, 3).map(e => e.name).join(", ") + (exerciseCount > 3 ? "…" : "");
    // Encode date for safe attribute use
    const dateKey = encodeURIComponent(w.date || "");
    return `
      <div class="history-item" data-idx="${idx}" data-date="${dateKey}">
        <div class="history-header" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div style="flex:1;min-width:0;">
            <h4 style="margin:0;">${dateStr}</h4>
            <div style="font-size:0.8rem;color:var(--muted);">${timeStr} • ${exerciseCount} exercise${exerciseCount !== 1 ? "s" : ""}</div>
            <div style="font-size:0.8rem;color:var(--muted);margin-top:2px;">${summary}</div>
          </div>
          <button type="button" class="btn danger delete-workout-btn" data-date="${dateKey}" style="flex-shrink:0;padding:6px 10px;font-size:0.8rem;">Delete</button>
          <span class="expand-icon" style="font-size:1.2rem;color:var(--accent);">›</span>
        </div>
        <div class="history-detail" style="display:none;margin-top:12px;border-top:1px solid var(--border);padding-top:10px;"></div>
      </div>`;
  }).join("");

  container.innerHTML = html;

  // Expand / collapse
  container.querySelectorAll(".history-item").forEach(item => {
    item.querySelector(".history-header").addEventListener("click", (e) => {
      // Don't expand when Delete was clicked
      if (e.target.closest(".delete-workout-btn")) return;

      const detail = item.querySelector(".history-detail");
      const icon = item.querySelector(".expand-icon");
      const isOpen = detail.style.display === "block";

      container.querySelectorAll(".history-detail").forEach(d => d.style.display = "none");
      container.querySelectorAll(".expand-icon").forEach(i => i.textContent = "›");

      if (!isOpen) {
        const idx = +item.dataset.idx;
        const w = hist[idx];
        let detailHtml = (w.exercises || []).map(e => {
          const found = findExercise(e.id, e.category) || {};
          const lt = found.logType || "strength";
          const setsStr = (e.sets || []).map(s => formatSetDisplay(s, lt, found.customUnits) || `${s.reps || ""}@${s.weight || ""}`).join("<br>");
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

  // Delete individual workout (with confirmation)
  container.querySelectorAll(".delete-workout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dateKey = decodeURIComponent(btn.dataset.date || "");
      const match = fullHist.find(w => w.date === dateKey);
      let label = "this workout";
      if (match && match.date) {
        const d = new Date(match.date);
        label = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
          + " " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      }
      if (!confirmClear(`Delete the workout from ${label}?\nThis cannot be undone.`)) {
        showToast("Delete cancelled");
        return;
      }
      const next = fullHist.filter(w => w.date !== dateKey);
      saveHistory(next);
      renderHistory();
      renderSuggestion();
      renderExercises();
      showToast("Workout deleted");
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

/** Confirm before any irreversible data clear. Returns true if user chose Yes. */
function confirmClear(message) {
  return window.confirm(message + "\n\nTap OK for Yes, Cancel for No.");
}

document.getElementById("clear-history-btn").addEventListener("click", () => {
  if (!confirmClear("Clear ALL workout history?\nThis permanently deletes every saved workout and cannot be undone.")) {
    showToast("Clear cancelled");
    return;
  }
  localStorage.removeItem("fitnessHistory");
  renderHistory();
  renderSuggestion();
  renderExercises();
  showToast("History cleared");
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
  const defaultLog = defaultCat === "aerobic" ? "cardio" : (defaultCat === "core" ? "time" : "strength");
  document.getElementById("add-ex-logtype").value = defaultLog;
  document.getElementById("add-ex-field1").value = "";
  document.getElementById("add-ex-field2").value = "";
  document.getElementById("add-ex-custom-fields").style.display = defaultLog === "custom" ? "block" : "none";
  document.getElementById("add-ex-default-sets").value = "3";
  document.getElementById("add-ex-preview").src = "";
  document.getElementById("add-ex-preview").style.display = "none";
  document.getElementById("add-ex-file").value = "";
  window._pendingExImage = null;
  document.getElementById("add-exercise-modal").classList.remove("hidden");
}

// Show custom unit fields when "Custom" is selected
document.getElementById("add-ex-logtype").addEventListener("change", (e) => {
  document.getElementById("add-ex-custom-fields").style.display =
    e.target.value === "custom" ? "block" : "none";
});

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
  const logType = document.getElementById("add-ex-logtype").value || "strength";
  const field1 = document.getElementById("add-ex-field1").value.trim();
  const field2 = document.getElementById("add-ex-field2").value.trim();
  let defaultSetCount = parseInt(document.getElementById("add-ex-default-sets").value, 10);
  if (!defaultSetCount || defaultSetCount < 1) defaultSetCount = 3;
  if (defaultSetCount > 10) defaultSetCount = 10;

  if (!name) {
    showToast("Please enter an exercise name");
    return;
  }
  if (logType === "custom" && !field1) {
    showToast("Enter at least Field 1 unit label for custom tracking");
    return;
  }

  const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);
  const list = getCustomExercises();
  const entry = {
    id,
    name,
    brand,
    notes,
    category: cat,
    img: window._pendingExImage || "ab-crunch.jpg",
    logType,
    defaultSetCount,
    custom: true
  };
  if (logType === "custom") {
    entry.customUnits = { field1: field1, field2: field2 || "" };
  }
  list.push(entry);
  saveCustomExercises(list);
  document.getElementById("add-exercise-modal").classList.add("hidden");
  showToast(`Added "${name}" (${logType})`);
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

  // Wire Add Exercise buttons (static in tab headers) – once
  document.querySelectorAll(".add-ex-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAddExerciseModal(btn.dataset.cat || "upper");
    });
  });
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
