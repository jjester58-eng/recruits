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
let ALL_COACHES = [];

// Fallback image if the URL is broken or missing
const PLACEHOLDER_IMG = 'https://3.files.edl.io/ec1d/23/08/08/202417-93245495-76a7-475c-af85-c7a6982d169e.png';

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
    const sportsSet = new Set();

    athleteSnap.forEach(doc => {
      const data = doc.data();
      ALL_PLAYERS.push({
        id: doc.id,
        name: data.name || 'Athlete',
        gradYear: data.gradYear,
        // RESOLUTION: Checks both photoUrl and photoURL
        photoUrl: data.photoUrl || data.photoURL || '',
        sport: data.sport || '',
        position: data.pos || data.position || '',
        height: data.ht || '',
        weight: data.wt || '',
        jersey: data.jersey || '',
        gpa: data.gpa || '',
        hudl: data.hudl || '',
        twitter: data.twitter || ''
      });

      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });

    coachSnap.forEach(doc => {
      const data = doc.data();
      ALL_COACHES.push({
        ...data,
        photoUrl: data.photoUrl || data.photoURL || ''
      });
    });

    populateFilters(years, sportsSet);
    renderAthletes();
    renderCoaches();

  } catch (err) {
    console.error("Error loading data:", err);
  }
}

function populateFilters(years, sportsSet) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");

  const sortedYears = [...years].sort((a, b) => b - a);
  gradSelect.innerHTML = sortedYears.map(y => `<option value="${y}">${y}</option>`).join("");

  const sortedSports = [...sportsSet].sort();
  sportSelect.innerHTML = `<option value="all">All Sports</option>` +
    sortedSports.map(s => `<option value="${s}">${s}</option>`).join("");
}

/* ==============================
   Render Coaches (Grid)
============================== */
function renderCoaches() {
  const container = document.getElementById('coachContainer');
  const selectedSport = document.getElementById("sportSelect").value;

  const filtered = ALL_COACHES.filter(c =>
    selectedSport === "all" || c.sport === selectedSport
  );

  if (filtered.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <h2 style="margin:20px 0; color:var(--royal-blue); font-weight:800;">Coaching Staff</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
      ${filtered.map(c => `
        <div class="coach-card" style="background:white; padding:15px; border-radius:12px; text-align:center; box-shadow:var(--shadow);">
          <img src="${c.photoUrl || PLACEHOLDER_IMG}" 
               onerror="this.src='${PLACEHOLDER_IMG}'"
               style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:10px;">
          <h3 style="font-size:1rem; margin-bottom:5px;">${c.name}</h3>
          <div style="font-size:0.8rem; font-weight:700; color:var(--royal-blue);">${c.sport}</div>
          <div style="font-size:0.75rem; color:var(--dark-gray); margin-bottom:8px;">${c.title}</div>
          <a href="mailto:${c.email}" style="font-size:0.75rem; text-decoration:none; color:var(--royal-blue); font-weight:600;">Email Coach</a>
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

  // Use the school logo if no photo is available
  const imgToUse = player.photoUrl && player.photoUrl !== "" ? player.photoUrl : PLACEHOLDER_IMG;

  card.innerHTML = `
    <div class="photo-wrapper">
      <img class="player-photo" 
           src="${imgToUse}" 
           alt="${player.name}"
           onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';">
    </div>
    <div class="card-content">
      <span class="sport-badge">${player.sport}</span>
      <h3>
        <span>${player.name}</span>
        ${player.jersey ? `<span class="jersey">#${player.jersey}</span>` : ''}
      </h3>
      <div class="player-stats">
        <div class="stat-item"><span class="stat-label">Pos</span><span class="stat-value">${player.position || '-'}</span></div>
        <div class="stat-item"><span class="stat-label">Ht/Wt</span><span class="stat-value">${player.height}/${player.weight}</span></div>
        <div class="stat-item"><span class="stat-label">GPA</span><span class="stat-value">${player.gpa || '-'}</span></div>
      </div>
      <div class="player-links">
        ${player.hudl ? `<a href="${player.hudl}" target="_blank" class="hudl">Hudl</a>` : ''}
        ${player.twitter ? `<a href="${player.twitter}" target="_blank" class="twitter">Twitter</a>` : ''}
      </div>
    </div>
  `;
  return card;
}

function renderAthletes() {
  const gradYear = document.getElementById("gradSelect").value;
  const selectedSport = document.getElementById("sportSelect").value;
  const container = document.getElementById("athleteContainer");

  const filtered = ALL_PLAYERS.filter(p => {
    const gradMatch = p.gradYear == gradYear;
    const sportMatch = selectedSport === "all" || p.sport === selectedSport;
    return gradMatch && sportMatch;
  });

  container.innerHTML = "";
  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:40px; text-align:center; grid-column:1/-1;">No athletes found for this selection.</div>`;
    return;
  }

  filtered.sort((a, b) => a.name.localeCompare(b.name));
  filtered.forEach(p => container.appendChild(createPlayerCard(p)));
}

/* ==============================
   Initialization
============================== */
(async function init() {
  await initializeData();

  document.getElementById("gradSelect").addEventListener("change", () => { renderAthletes(); renderCoaches(); });
  document.getElementById("sportSelect").addEventListener("change", () => { renderAthletes(); renderCoaches(); });
})();