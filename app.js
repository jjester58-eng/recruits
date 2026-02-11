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

/* ==============================
   Global Data Storage
============================== */
let ALL_PLAYERS = [];
let ALL_COACHES = {};

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
    const sportsSet = new Set();
    const players = [];

    athleteSnap.forEach(doc => {
      const data = doc.data();

      players.push({
        id: doc.id,
        name: data.name,
        gradYear: data.gradYear,
        // Resiliency check: handles both photoUrl and photoURL
        photoUrl: data.photoUrl || data.photoURL || '',
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
      if (data.sport) sportsSet.add(data.sport);
    });

    ALL_PLAYERS = players;

    coachSnap.forEach(doc => {
      const data = doc.data();
      if (data.sport) {
        // Store as normalized key to match filter dropdown
        const key = data.sport.toLowerCase().replace(/\s+/g, '-');
        ALL_COACHES[key] = {
          name: data.name,
          title: data.title,
          email: data.email,
          sport: data.sport
        };
      }
    });

    populateFilters(years, sportsSet);

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
function populateFilters(years, sportsSet) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");

  const sortedYears = [...years].sort((a, b) => a - b);
  gradSelect.innerHTML = sortedYears
    .map(y => `<option value="${y}">Class of ${y}</option>`)
    .join("");

  const sortedSports = [...sportsSet].sort();
  sportSelect.innerHTML =
    `<option value="all">All Sports</option>` +
    sortedSports
      .map(s => {
        const val = s.toLowerCase().replace(/\s+/g, '-');
        return `<option value="${val}">${s}</option>`;
      })
      .join("");
}

/* ==============================
   Render Coaches
============================== */
function renderCoaches(coaches) {
  const container = document.getElementById('coachContainer');

  // Create the Grid Header
  let html = '<h2 class="section-title" style="grid-column: 1/-1; margin-bottom: 20px; font-weight:800; color:#0033a0;">Coaching Staff</h2>';

  html += coaches.map(coach => `
    <div class="coach-card">
      <img src="${coach.photoUrl || 'https://via.placeholder.com/150'}" alt="${coach.name}" class="coach-photo">
      <div class="coach-info">
        <h3>${coach.name}</h3>
        <p class="title">${coach.sport} • ${coach.title}</p>
        <a href="mailto:${coach.email}" class="email">${coach.email}</a>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
}

container.innerHTML = `
    <h2>🏆 Coaches</h2>
    <div class="coach-grid">
      ${coachesToShow.map(c => `
        <div class="coach-card">
          <h3>${c.name}</h3>
          ${c.sport ? `<div class="sport-tag">${c.sport}</div>` : ''}
          ${c.title ? `<div class="title">${c.title}</div>` : ''}
          ${c.email ? `<a href="mailto:${c.email}">${c.email}</a>` : ''}
        </div>
      `).join("")}
    </div>
  `;
}

/* ==============================
   Create Player Card
============================== */
function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";

  const stats = [];
  if (player.position) stats.push({ label: "Pos", value: player.position });
  if (player.height) stats.push({ label: "Ht", value: player.height });
  if (player.weight) stats.push({ label: "Wt", value: `${player.weight} lbs` });
  if (player.gpa) stats.push({ label: "GPA", value: player.gpa });

  let statsHTML = stats.length > 0 ?
    `<div class="player-stats">${stats.map(s => `
      <div class="stat-item">
        <span class="stat-label">${s.label}</span>
        <span class="stat-value">${s.value}</span>
      </div>`).join('')}</div>` : '';

  let linksHTML = '';
  if (player.hudl || player.twitter) {
    linksHTML = '<div class="player-links">';
    if (player.hudl) linksHTML += `<a href="${player.hudl}" target="_blank" class="hudl">🎥 Hudl</a>`;
    if (player.twitter) linksHTML += `<a href="${player.twitter}" target="_blank" class="twitter">𝕏 Twitter</a>`;
    linksHTML += '</div>';
  }

  // Use the Blue/Gold Roo color scheme for placeholder
  const placeholder = 'https://via.placeholder.com/300x280/0033a0/ffffff?text=No+Photo';

  card.innerHTML = `
    <div class="photo-wrapper" style="height:280px; overflow:hidden; background:#eee;">
      <img class="player-photo" 
           src="${player.photoUrl || placeholder}" 
           alt="${player.name}"
           style="width:100%; height:100%; object-fit:cover; object-position:top;"
           onerror="this.onerror=null;this.src='${placeholder}';">
    </div>
    <div class="card-content">
      <h3>
        <span>${player.name || 'Athlete'}</span>
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
  const selectedSportVal = document.getElementById("sportSelect").value;
  const container = document.getElementById("athleteContainer");

  if (!gradYearStr) {
    container.innerHTML = '<div class="loading">Please select a class year</div>';
    return;
  }

  const filtered = ALL_PLAYERS.filter(p => {
    const gradMatch = p.gradYear == gradYearStr;
    // Normalize athlete sport to match dropdown value (e.g., "Track & Field" -> "track-and-field")
    const normalizedSport = (p.sport || "").toLowerCase().replace(/\s+/g, '-');
    const sportMatch = selectedSportVal === "all" || normalizedSport === selectedSportVal;
    return gradMatch && sportMatch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <h3>No Athletes Found</h3>
        <p>No athletes found for Class of ${gradYearStr}</p>
      </div>`;
    return;
  }

  filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  container.innerHTML = "";
  filtered.forEach(player => container.appendChild(createPlayerCard(player)));
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

  } catch (err) {
    console.error("Initialization error:", err);
  }
})();