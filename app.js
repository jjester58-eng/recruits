import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ==============================
   Firebase Configuration
============================== */
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
console.log("Firebase Project ID:", db.app.options.projectId);

/* ==============================
   Global Data Storage
============================== */
let ALL_PLAYERS = [];
let ALL_COACHES = {};

/* ==============================
   Sport Key Normalizer (fixes case, spacing, punctuation issues)
============================== */
function normalizeSportKey(sport) {
  if (!sport || typeof sport !== "string") return null;
  return sport
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")           // collapse multiple spaces
    .replace(/[^a-z0-9 ]/g, "")     // remove punctuation/symbols
    .replace(/\s+/g, "-")           // spaces → hyphens for consistency
    .replace(/-+/g, "-");           // no double hyphens
}

/* ==============================
   Load All Data (One-time)
============================== */
async function initializeData() {
  try {
    const [athleteSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    const years = new Set();
    const sports = new Set();
    const players = [];
    
    athleteSnap.forEach(doc => {
      const data = doc.data();
      
      players.push({
        id: doc.id,
        name: data.name,
        gradYear: data.gradYear,
        photoUrl: data.photoUrl,
        email: data.email,
        sport: data.sport,
        position: data.pos,
        height: data.ht,
        weight: data.wt,
        jersey: data.jersey,
        gpa: data.gpa,
        hudl: data.hudl,
        twitter: data.twitter,
        offers: data.offers
      });

      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sports.add(data.sport.toLowerCase());
    });

    ALL_PLAYERS = players;

    // Build coaches map with normalized keys
    coachSnap.forEach(doc => {
      const data = doc.data();
      if (data.sport) {
        const key = normalizeSportKey(data.sport);
        if (key) {
          ALL_COACHES[key] = {
            name: data.name,
            title: data.title,
            email: data.email,
            sport: data.sport,           // original for display
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
    
    console.log(`Loaded ${players.length} players, ${Object.keys(ALL_COACHES).length} coaches`);
    
    renderAthletes();
    renderCoaches();

  } catch (err) {
    console.error("Error loading data:", err);
    document.getElementById("athleteContainer").innerHTML = 
      `<div class="error">Failed to load data: ${err.message}</div>`;
  }
}

/* ==============================
   Populate Filter Dropdowns
============================== */
function populateFilters(years, sports) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");

  const sortedYears = [...years].sort();
  gradSelect.innerHTML = sortedYears
    .map(y => `<option value="${y}">Class of ${y}</option>`)
    .join("");

  const sortedSports = [...sports].sort();
  sportSelect.innerHTML = 
    `<option value="all">All Sports</option>` +
    sortedSports
      .map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)
      .join("");
}

/* ==============================
   Render Coaches – hover quick links + click to expand full info
============================== */
function renderCoaches() {
  const selectedSportRaw = document.getElementById("sportSelect").value;
  const container = document.getElementById("coachContainer");

  let coachesToShow = [];

  if (selectedSportRaw === "all") {
    coachesToShow = Object.values(ALL_COACHES);
  } else {
    const normalized = normalizeSportKey(selectedSportRaw);
    const coach = ALL_COACHES[normalized];
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

          <!-- Quick links – appear on hover -->
          <div class="quick-links">
            ${c.hudl ? `<a href="${c.hudl}" target="_blank" rel="noopener noreferrer" class="hudl-link">🎥 Hudl</a>` : ''}
            ${c.twitter ? `<a href="${c.twitter}" target="_blank" rel="noopener noreferrer" class="twitter-link">𝕏</a>` : ''}
          </div>

          <!-- Expanded section – shown on click -->
          <div class="coach-details">
            <div class="coach-stats">
              ${c.offers     ? `<div class="stat-item"><span class="stat-label">Offers</span><span class="stat-value">${c.offers}</span></div>` : ''}
              ${c.bench      ? `<div class="stat-item"><span class="stat-label">Bench</span><span class="stat-value">${c.bench}</span></div>` : ''}
              ${c.squat      ? `<div class="stat-item"><span class="stat-label">Squat</span><span class="stat-value">${c.squat}</span></div>` : ''}
              ${c.proAgility ? `<div class="stat-item"><span class="stat-label">Pro Agility</span><span class="stat-value">${c.proAgility}</span></div>` : ''}
              ${c.satAct     ? `<div class="stat-item"><span class="stat-label">SAT/ACT</span><span class="stat-value">${c.satAct}</span></div>` : ''}
              ${c.vertical   ? `<div class="stat-item"><span class="stat-label">Vertical</span><span class="stat-value">${c.vertical}</span></div>` : ''}
            </div>

            ${c.recruiterNotes ? `
              <div class="coach-notes">
                <strong>Recruiter Notes</strong><br>${c.recruiterNotes}
              </div>
            ` : ''}

            <div class="coach-full-links">
              ${c.hudl   ? `<a href="${c.hudl}"   target="_blank" rel="noopener noreferrer">Hudl URL</a>` : ''}
              ${c.twitter ? `<a href="${c.twitter}" target="_blank" rel="noopener noreferrer">Twitter / X</a>` : ''}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Click handler – expand/collapse, but ignore link clicks
  container.querySelectorAll(".coach-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.tagName === "A") return; // don't toggle when clicking links
      card.classList.toggle("expanded");
    });
  });
}

/* ==============================
   Create Player Card (unchanged)
============================== */
function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";
  
  const stats = [];
  if (player.position) stats.push({ label: "Position", value: player.position });
  if (player.height) stats.push({ label: "Height", value: player.height });
  if (player.weight) stats.push({ label: "Weight", value: `${player.weight} lbs` });
  if (player.gpa) stats.push({ label: "GPA", value: player.gpa });

  let statsHTML = '';
  if (stats.length > 0) {
    statsHTML = '<div class="player-stats">';
    stats.forEach(stat => {
      statsHTML += `
        <div class="stat-item">
          <span class="stat-label">${stat.label}</span>
          <span class="stat-value">${stat.value}</span>
        </div>
      `;
    });
    statsHTML += '</div>';
  }

  let linksHTML = '';
  if (player.hudl || player.twitter) {
    linksHTML = '<div class="player-links">';
    if (player.hudl) linksHTML += `<a href="${player.hudl}" target="_blank" rel="noopener noreferrer" class="hudl">🎥 Hudl</a>`;
    if (player.twitter) linksHTML += `<a href="${player.twitter}" target="_blank" rel="noopener noreferrer" class="twitter">𝕏 Twitter/X</a>`;
    linksHTML += '</div>';
  }

  card.innerHTML = `
    <img class="player-photo" 
         src="${player.photoUrl || 'https://via.placeholder.com/300x280/4169E1/ffffff?text=No+Photo'}" 
         alt="${player.name || 'Athlete'}"
         loading="lazy"
         onerror="this.src='https://via.placeholder.com/300x280/4169E1/ffffff?text=No+Photo'">
    <div class="card-content">
      <h3>
        <span>${player.name || 'Unknown Athlete'}</span>
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
   Render Athletes (unchanged)
============================== */
function renderAthletes() {
  const gradYearStr = document.getElementById("gradSelect").value;
  const sport = document.getElementById("sportSelect").value;
  const container = document.getElementById("athleteContainer");

  if (!gradYearStr) {
    container.innerHTML = '<div class="loading">Please select a class year</div>';
    return;
  }

  const filtered = ALL_PLAYERS.filter(p => {
    const gradMatch = p.gradYear == gradYearStr;
    const sportMatch = sport === "all" || p.sport?.toLowerCase() === sport;
    return gradMatch && sportMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <h3>No Athletes Found</h3>
        <p>No athletes found for Class of ${gradYearStr} ${sport === 'all' ? '' : '- ' + sport}</p>
      </div>
    `;
    return;
  }

  filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  container.innerHTML = "";
  filtered.forEach(player => {
    container.appendChild(createPlayerCard(player));
  });

  console.log(`Rendered ${filtered.length} athletes`);
}

/* ==============================
   Initialize Application
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
    console.error("Initialization error:", err);
    document.getElementById("athleteContainer").innerHTML = 
      `<div class="error">Failed to initialize application: ${err.message}</div>`;
  }
})();