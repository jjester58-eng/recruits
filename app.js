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
   Load All Data (One-time)
============================== */
async function initializeData() {
  try {
    // Load all collections in parallel
    const [athleteSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    // Build players array and collect unique years/sports
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

    // Build coaches map
    coachSnap.forEach(doc => {
      const data = doc.data();
      if (data.sport) {
        ALL_COACHES[data.sport.toLowerCase()] = {
          name: data.name,
          title: data.title,
          email: data.email,
          sport: data.sport
        };
      }
    });

    // Populate filter dropdowns
    populateFilters(years, sports);
    
    console.log(`Loaded ${players.length} players, ${years.size} years, ${sports.size} sports`);
    
    // Initial render
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

  // Populate grad years
  const sortedYears = [...years].sort();
  gradSelect.innerHTML = sortedYears
    .map(y => `<option value="${y}">Class of ${y}</option>`)
    .join("");

  // Populate sports
  const sortedSports = [...sports].sort();
  sportSelect.innerHTML = 
    `<option value="all">All Sports</option>` +
    sortedSports
      .map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)
      .join("");
}

/* ==============================
   Render Coaches
============================== */
function renderCoaches() {
  const selectedSport = document.getElementById("sportSelect").value;
  const container = document.getElementById("coachContainer");

  // Filter coaches based on sport selection
  let coachesToShow = [];
  if (selectedSport === "all") {
    coachesToShow = Object.values(ALL_COACHES);
  } else {
    const coach = ALL_COACHES[selectedSport];
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
   Render Athletes
============================== */
function renderAthletes() {
  const gradYearStr = document.getElementById("gradSelect").value;
  const sport = document.getElementById("sportSelect").value;
  const container = document.getElementById("athleteContainer");

  if (!gradYearStr) {
    container.innerHTML = '<div class="loading">Please select a class year</div>';
    return;
  }

  // Filter players
  const filtered = ALL_PLAYERS.filter(p => {
    const gradMatch = p.gradYear == gradYearStr;
    const sportMatch = sport === "all" || p.sport?.toLowerCase() === sport;
    return gradMatch && sportMatch;
  });

  // Handle empty results
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-data">
        <h3>No Athletes Found</h3>
        <p>No athletes found for Class of ${gradYearStr} ${sport === 'all' ? '' : '- ' + sport}</p>
      </div>
    `;
    return;
  }

  // Sort by name
  filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  // Render cards
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
    // Load all data once
    await initializeData();

    // Set up event listeners
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