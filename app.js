import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

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
const storage = getStorage(app);

/* ==============================
   Global Data Storage & Constants
============================== */
let ALL_PLAYERS = [];
let ALL_COACHES = [];

// Fallback image (Weatherford Logo) for header only logic is handled via index.html
// This is used for profile cards ONLY when no specific photo exists.
const PLACEHOLDER_IMG = 'https://3.files.edl.io/ec1d/23/08/08/202417-93245495-76a7-475c-af85-c7a6982d169e.png';

/* ==============================
   Helper: Fetch Real Image URL
============================== */
async function getImageUrl(path) {
  if (!path || path === "" || path === PLACEHOLDER_IMG) return PLACEHOLDER_IMG;
  
  // If the path is a Firebase Storage reference (gs://)
  if (path.startsWith('gs://') || (!path.startsWith('http') && path.length > 5)) {
    try {
      // Clean path if it includes the full gs:// bucket prefix
      const cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
      const imageRef = ref(storage, cleanPath);
      return await getDownloadURL(imageRef);
    } catch (err) {
      console.warn("Could not find image in storage, using placeholder:", path);
      return PLACEHOLDER_IMG;
    }
  }
  
  // If it's already a public https URL
  return path;
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
    const sportsSet = new Set();

    athleteSnap.forEach(doc => {
      const data = doc.data();
      ALL_PLAYERS.push({
        id: doc.id,
        name: data.name || 'Athlete',
        gradYear: data.gradYear,
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
    // Initial render
    await renderAthletes();
    await renderCoaches();

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
   Render Coaches
============================== */
async function renderCoaches() {
  const container = document.getElementById('coachContainer');
  const selectedSport = document.getElementById("sportSelect").value;

  const filtered = ALL_COACHES.filter(c =>
    selectedSport === "all" || c.sport === selectedSport
  );

  if (filtered.length === 0) {
    container.innerHTML = "";
    return;
  }

  // Build header
  container.innerHTML = `<h2 style="margin:20px 0; color:#0033a0; font-weight:800;">Coaching Staff</h2>`;
  const grid = document.createElement('div');
  grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;";

  for (const c of filtered) {
    const finalImg = await getImageUrl(c.photoUrl);
    grid.innerHTML += `
      <div class="coach-card" style="background:white; padding:15px; border-radius:12px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <img src="${finalImg}" 
             onerror="this.src='${PLACEHOLDER_IMG}'"
             style="width:80px; height:80px; border-radius:50%; object-fit:cover; margin-bottom:10px;">
        <h3 style="font-size:1rem; margin-bottom:5px;">${c.name}</h3>
        <div style="font-size:0.8rem; font-weight:700; color:#0033a0;">${c.sport}</div>
        <div style="font-size:0.75rem; color:#666; margin-bottom:8px;">${c.title || ''}</div>
        <a href="mailto:${c.email}" style="font-size:0.75rem; text-decoration:none; color:#0033a0; font-weight:600;">Email Coach</a>
      </div>
    `;
  }
  container.appendChild(grid);
}

/* ==============================
   Render Athletes
============================== */
async function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";

  const finalImgUrl = await getImageUrl(player.photoUrl);

  card.innerHTML = `
    <div class="photo-wrapper">
      <img class="player-photo" 
           src="${finalImgUrl}" 
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

async function renderAthletes() {
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
  
  for (const p of filtered) {
    const card = await createPlayerCard(p);
    container.appendChild(card);
  }
}

/* ==============================
   Initialization & Events
============================== */
(async function init() {
  await initializeData();

  const handleFilterChange = async () => {
    // Show a small loading state if needed
    await renderAthletes();
    await renderCoaches();
  };

  document.getElementById("gradSelect").addEventListener("change", handleFilterChange);
  document.getElementById("sportSelect").addEventListener("change", handleFilterChange);
})();