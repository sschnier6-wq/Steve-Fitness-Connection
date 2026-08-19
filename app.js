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
    { id: "ab-crunch", name: "Abdominal Crunch Machine", brand: "Life Fitness", img: "ab-crunch.jpg", notes: "May be uncomfortable at 6'7\" – prefer alternatives" },
    { id: "bird-dog", name: "Bird-Dog", brand: "Bodyweight", img: "ab-crunch.jpg", notes: "Core stability + balance" },
    { id: "single-leg-balance", name: "Single-Leg Balance", brand: "Bodyweight", img: "ab-crunch.jpg", notes: "30s holds, progress to eyes closed" },
    { id: "single-leg-rdl", name: "Single-Leg RDL", brand: "Bodyweight", img: "ab-crunch.jpg", notes: "Slow & controlled" },
    { id: "worlds-greatest", name: "World's Greatest Stretch", brand: "Mobility", img: "ab-crunch.jpg", notes: "Hip + thoracic mobility" },
    { id: "hip-flexor", name: "Half-Kneeling Hip Flexor Stretch", brand: "Mobility", img: "ab-crunch.jpg", notes: "30-40s per side" }
  ],
  aerobic: [
    { id: "cycling", name: "Stationary Cycling", brand: "Cardio", img: "exercise-bike.jpg", notes: "Steady aerobic 45-60 min preferred" }
  ]
};

// ===== State =====
let currentLogExercise = null;
let currentSets = [];
let activeWorkout = null; // { started: timestamp, exercises: [] }

// ===== LocalStorage Helpers =====
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

function getLastWorkout() {
  const hist = getHistory();
  return hist.length ? hist[hist.length - 1] : null;
}

function getLastForExercise(exerciseId) {
  const hist = getHistory();
  for (let i = hist.length - 1; i >= 0; i--) {
    const found = hist[i].exercises.find(e => e.id === exerciseId);
    if (found) return found;
  }
  return null;
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
    { name: "Single-Leg Balance", detail: "3 × 30s each leg" },
    { name: "Single-Leg RDL", detail: "2 × 10 each leg" },
    { name: "World's Greatest Stretch", detail: "2 sets per side" },
    { name: "Hip Flexor Stretch", detail: "2 × 30-40s each side" },
    { name: "Bird-Dog", detail: "2 sets of 8-10/side" }
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
function renderExercises() {
  ["upper", "lower", "core", "aerobic"].forEach(cat => {
    const container = document.getElementById(`${cat}-exercises`);
    container.innerHTML = "";
    EQUIPMENT[cat].forEach(ex => {
      const last = getLastForExercise(ex.id);
      let lastText = "No previous log";
      if (last && last.sets.length) {
        lastText = "Last: " + last.sets.map(s => `${s.reps}@${s.weight}`).join(", ");
      }

      const card = document.createElement("div");
      card.className = "exercise-card";
      card.innerHTML = `
        <img src="${ex.img}" alt="${ex.name}" loading="lazy" onerror="this.src='ab-crunch.jpg'">
        <div class="exercise-info">
          <h3>${ex.name}</h3>
          <div class="meta">${ex.brand}${ex.notes ? " • " + ex.notes : ""}</div>
          <div class="last-log">${lastText}</div>
          <button class="log-btn" data-id="${ex.id}" data-cat="${cat}">Log Sets</button>
        </div>
      `;
      container.appendChild(card);
    });
  });

  // Attach log buttons
  document.querySelectorAll(".log-btn").forEach(btn => {
    btn.addEventListener("click", () => openLogModal(btn.dataset.id, btn.dataset.cat));
  });
}

// ===== Modal Logic =====
function openLogModal(exId, cat) {
  const ex = EQUIPMENT[cat].find(e => e.id === exId);
  if (!ex) return;
  currentLogExercise = { ...ex, category: cat };
  currentSets = [{ weight: "", reps: "" }, { weight: "", reps: "" }, { weight: "", reps: "" }];

  // Prefill from last if available
  const last = getLastForExercise(exId);
  if (last && last.sets.length) {
    currentSets = last.sets.map(s => ({ weight: s.weight, reps: s.reps }));
    while (currentSets.length < 3) currentSets.push({ weight: "", reps: "" });
  }

  document.getElementById("modal-title").textContent = `Log: ${ex.name}`;
  document.getElementById("modal-img").src = ex.img;
  renderSetInputs();
  document.getElementById("log-modal").classList.remove("hidden");
}

function renderSetInputs() {
  const container = document.getElementById("sets-container");
  container.innerHTML = "";
  currentSets.forEach((set, i) => {
    const row = document.createElement("div");
    row.className = "set-row";
    row.innerHTML = `
      <label>Set ${i + 1}</label>
      <input type="number" placeholder="lbs" value="${set.weight}" data-idx="${i}" data-field="weight" inputmode="numeric">
      <input type="number" placeholder="reps" value="${set.reps}" data-idx="${i}" data-field="reps" inputmode="numeric">
    `;
    container.appendChild(row);
  });

  // Live update
  container.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", e => {
      const idx = +e.target.dataset.idx;
      const field = e.target.dataset.field;
      currentSets[idx][field] = e.target.value;
    });
  });
}

document.getElementById("add-set-btn").addEventListener("click", () => {
  currentSets.push({ weight: "", reps: "" });
  renderSetInputs();
});

document.getElementById("save-log-btn").addEventListener("click", () => {
  const validSets = currentSets
    .filter(s => s.weight !== "" && s.reps !== "")
    .map(s => ({ weight: +s.weight, reps: +s.reps }));

  if (!validSets.length) {
    showToast("Enter at least one set");
    return;
  }

  // Add to today's active workout or create new
  if (!activeWorkout) {
    activeWorkout = {
      date: new Date().toISOString(),
      exercises: []
    };
  }

  // Replace if already logged this exercise today
  const existingIdx = activeWorkout.exercises.findIndex(e => e.id === currentLogExercise.id);
  const entry = {
    id: currentLogExercise.id,
    name: currentLogExercise.name,
    category: currentLogExercise.category,
    sets: validSets
  };
  if (existingIdx >= 0) {
    activeWorkout.exercises[existingIdx] = entry;
  } else {
    activeWorkout.exercises.push(entry);
  }

  // Also push a temporary entry into history for last-log display (will be finalized on complete)
  // For simplicity we update a "draft" and also keep history clean until mark complete

  showToast(`Saved ${currentLogExercise.name}`);
  document.getElementById("log-modal").classList.add("hidden");
  renderExercises(); // refresh last log text
  document.getElementById("mark-complete-btn").style.display = "inline-block";
});

document.querySelector(".close-modal").addEventListener("click", () => {
  document.getElementById("log-modal").classList.add("hidden");
});

// ===== Mark Complete =====
document.getElementById("mark-complete-btn").addEventListener("click", () => {
  if (!activeWorkout || !activeWorkout.exercises.length) {
    showToast("No exercises logged yet");
    return;
  }
  const hist = getHistory();
  hist.push(activeWorkout);
  saveHistory(hist);
  activeWorkout = null;
  document.getElementById("mark-complete-btn").style.display = "none";
  showToast("Workout saved to history!");
  renderSuggestion();
  renderExercises();
  renderHistory();
});

document.getElementById("start-suggested-btn").addEventListener("click", () => {
  activeWorkout = {
    date: new Date().toISOString(),
    exercises: []
  };
  showToast("Workout started – log your sets as you go");
  document.getElementById("mark-complete-btn").style.display = "inline-block";
  // Switch to Upper tab
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
          const setsStr = e.sets.map(s => `${s.reps} reps @ ${s.weight} lbs`).join("<br>");
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

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2200);
}

// ===== Init =====
function init() {
  renderSuggestion();
  renderExercises();
  renderHistory();
}

init();
