import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0DxK1oKMbpC38mH9_fP6XzTOmNwZh-Go",
  authDomain: "roosports-117c3.firebaseapp.com",
  projectId: "roosports-117c3",
  storageBucket: "roosports-117c3.firebasestorage.app",
  messagingSenderId: "894863108698",
  appId: "1:894863108698:web:2e3229b93bca82accc4663",
  measurementId: "G-HH4CJNWWH0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==============================
   Global Data
============================== */
let ALL_PLAYERS = [];
let ALL_COACHES = {};

/* ==============================
   Sport Key Normalizer (fixes case/spacing/punctuation issues)
============================== */
function normalizeSportKey(sport) {
  if (!sport || typeof sport !== "string") return null;
  return sport
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ==============================
   Load All Data
============================== */
async function initializeData() {
  try {
    const [athleteSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    const years = new Set();
    const sports = new Set();

    // === ATHLETES ===
    athleteSnap.forEach(doc => {
      const d = doc.data();
      ALL_PLAYERS.push({
        id: doc.id,
        ...d,
        // Ensure safe fallbacks
        name: d.name || "Unknown Athlete",
        sport: d.sport || "",
        gradYear: d.gradYear || "",
        photoUrl: d.photoUrl || "",
      });

      if (d.gradYear) years.add(d.gradYear);
      if (d.sport) sports.add(d.sport.toLowerCase());
    });

    // === COACHES (with full fields) ===
    coachSnap.forEach(doc => {
      const data = doc.data();
      if (data.sport) {
        const key = normalizeSportKey(data.sport);
        if (key) {
          ALL_COACHES[key] = {
            name: data.name || "",
            title: data.title || "",
            email: data.email || "",
            sport: data.sport,                    // original for display
            twitter: data.twitter || "",
            hudl: data.hudl || "",
            offers: data.offers || "",
            bench: data.bench || "",
            squat: data.squat || "",
            proAgility: data.proAgility || "",
            satAct: data.satAct || "",
            vertical: data.vertical || "",
            recruiterNotes: data.recruiterNotes || ""
          };
        }
      }
    });

    populateFilters(years, sports);

    console.log(`Loaded ${ALL_PLAYERS.length} athletes + ${Object.keys(ALL_COACHES).length} coaches`);

    renderAthletes();
    renderCoaches();

  } catch (err) {
    console.error("Error loading data:", err);
    document.getElementById("athleteContainer").innerHTML = 
      `<div class="error">Failed to load data: ${err.message}</div>`;
  }
}

/* ==============================
   Populate Filters
============================== */
function populateFilters(years, sports) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");

  const sortedYears = [...years].sort((a, b) => b - a);
  gradSelect.innerHTML = sortedYears
    .map(y => `<option value="${y}">Class of ${y}</option>`)
    .join("");

  const sortedSports = [...sports].sort();
  sportSelect.innerHTML = 
    `<option value="all">All Sports</option>` +
    sortedSports.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join("");
}

/* ==============================
   Render Coaches – Hover quick links + Click to expand
============================== */
function renderCoaches() {
  const selectedRaw = document.getElementById("sportSelect").value;
  const container = document.getElementById("coachContainer");

  let coachesToShow = [];
  if (selectedRaw === "all") {
    coachesToShow = Object.values(ALL_COACHES);
  } else {
    const key = normalizeSportKey(selectedRaw);
    const coach = ALL_COACHES[key];
    if (coach) coachesToShow = [coach];
  }

  if (coachesToShow.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <h2>🏆 Coaches</h2>
    <div class="coach-grid">
      ${coachesToShow.map(c => `
        <div class="coach-card">
          <h3>${c.name}</h3>
          ${c.sport ? `<div class="sport-tag">${c.sport}</div>` : ''}
          ${c.title ? `<div class="title">${c.title}</div>` : ''}
          ${c.email ? `<a href="mailto:${c.email}" class="coach-email">${c.email}</a>` : ''}

          <!-- Hover quick links -->
          <div class="quick-links">
            ${c.hudl ? `<a href="${c.hudl}" target="_blank" class="hudl-link">🎥 Hudl</a>` : ''}
            ${c.twitter ? `<a href="${c.twitter}" target="_blank" class="twitter-link">𝕏</a>` : ''}
          </div>

          <!-- Click to expand full details -->
          <div class="coach-details">
            <div class="coach-stats">
              ${c.offers ? `<div class="stat-item"><span class="stat-label">Offers</span><span class="stat-value">${c.offers}</span></div>` : ''}
              ${c.bench ? `<div class="stat-item"><span class="stat-label">Bench</span><span class="stat-value">${c.bench}</span></div>` : ''}
              ${c.squat ? `<div class="stat-item"><span class="stat-label">Squat</span><span class="stat-value">${c.squat}</span></div>` : ''}
              ${c.proAgility ? `<div class="stat-item"><span class="stat-label">Pro Agility</span><span class="stat-value">${c.proAgility}</span></div>` : ''}
              ${c.satAct ? `<div class="stat-item"><span class="stat-label">SAT/ACT</span><span class="stat-value">${c.satAct}</span></div>` : ''}
              ${c.vertical ? `<div class="stat-item"><span class="stat-label">Vertical</span><span class="stat-value">${c.vertical}</span></div>` : ''}
            </div>

            ${c.recruiterNotes ? `
              <div class="coach-notes">
                <strong>Recruiter Notes</strong><br>${c.recruiterNotes}
              </div>
            ` : ''}

            <div class="coach-full-links">
              ${c.hudl ? `<a href="${c.hudl}" target="_blank">Hudl URL</a>` : ''}
              ${c.twitter ? `<a href="${c.twitter}" target="_blank">Twitter / X</a>` : ''}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Click handler
  container.querySelectorAll(".coach-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.tagName === "A") return;
      card.classList.toggle("expanded");
    });
  });
}

/* ==============================
   Player Card (unchanged)
============================== */
function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";

  const stats = [];
  if (player.position) stats.push({ label: "Position", value: player.position });
  if (player.ht) stats.push({ label: "Height", value: player.ht });
  if (player.wt) stats.push({ label: "Weight", value: `${player.wt} lbs` });
  if (player.gpa) stats.push({ label: "GPA", value: player.gpa });

  let statsHTML = stats.length ? '<div class="player-stats">' : '';
  stats.forEach(s => {
    statsHTML += `
      <div class="stat-item">
        <span class="stat-label">${s.label}</span>
        <span class="stat-value">${s.value}</span>
      </div>`;
  });
  if (stats.length) statsHTML += '</div>';

  let linksHTML = '';
  if (player.hudl || player.twitter) {
    linksHTML = '<div class="player-links">';
    if (player.hudl) linksHTML += `<a href="${player.hudl}" target="_blank" class="hudl">🎥 Hudl</a>`;
    if (player.twitter) linksHTML += `<a href="${player.twitter}" target="_blank" class="twitter">𝕏 Twitter/X</a>`;
    linksHTML += '</div>';
  }

  card.innerHTML = `
    <img class="player-photo" 
         src="${player.photoUrl || 'https://via.placeholder.com/300x280/4169E1/ffffff?text=No+Photo'}" 
         alt="${player.name}"
         loading="lazy"
         onerror="this.src='https://via.placeholder.com/300x280/4169E1/ffffff?text=No+Photo'">
    <div class="card-content">
      <h3>
        <span>${player.name}</span>
        ${player.jersey ? `<span class="jersey">#${player.jersey}</span>` : ''}
      </h3>
      ${player.sport ? `<div class="sport-badge">${player.sport}</div>` : ''}
      ${statsHTML}
      ${linksHTML}
    </div>
  `;

  return card;
}

/* ==============================
   Render Athletes
============================== */
function renderAthletes() {
  const gradYearStr = document.getElementById("gradSelect").value;
  const sport = document.getElementById("sportSelect").value.toLowerCase().trim();
  const container = document.getElementById("athleteContainer");

  if (!gradYearStr) {
    container.innerHTML = '<div class="loading">Please select a class year</div>';
    return;
  }

  const filtered = ALL_PLAYERS.filter(p => {
    const gradMatch = String(p.gradYear) === gradYearStr;
    const sportMatch = sport === "all" || (p.sport && p.sport.toLowerCase() === sport);
    return gradMatch && sportMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <h3>No Athletes Found</h3>
        <p>No athletes found for Class of ${gradYearStr} ${sport !== 'all' ? `- ${sport}` : ''}</p>
      </div>
    `;
    return;
  }

  filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  container.innerHTML = "";
  filtered.forEach(p => container.appendChild(createPlayerCard(p)));

  console.log(`Rendered ${filtered.length} athletes`);
}

/* ==============================
   Init
============================== */
(async function init() {
  try {
    await initializeData();

    document.getElementById("gradSelect").addEventListener("change", () => {
      renderAthletes();
      renderCoaches();
    });

    document.getElementById("sportSelect").addEventListener("change", () => {
      renderAthletes();
      renderCoaches();
    });

    console.log("App initialized successfully");
  } catch (err) {
    console.error("Init error:", err);
  }
})();