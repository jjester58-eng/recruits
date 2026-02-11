import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

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

let ALL_PLAYERS = [];
let ALL_COACHES = [];

// The Logo URL - ONLY for the header and broken links
const ROO_LOGO = 'https://3.files.edl.io/ec1d/23/08/08/202417-93245495-76a7-475c-af85-c7a6982d169e.png';

/* ==============================
   IMAGE LOGIC
============================== */
async function getImageUrl(path) {
  // 1. If path is empty, return a generic gray silhouette or blank, NOT the logo
  if (!path || path === "") return "https://via.placeholder.com/400x500?text=No+Photo";
  
  // 2. If it's already a web link, return it
  if (path.startsWith('http')) return path;

  // 3. If it's a Firebase Storage path
  try {
    // Strip "gs://roosports-117c3.firebasestorage.app/" if it exists in the string
    const cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
    const imageRef = ref(storage, cleanPath);
    return await getDownloadURL(imageRef);
  } catch (err) {
    console.error("Storage Error:", err);
    return "https://via.placeholder.com/400x500?text=Photo+Missing";
  }
}

/* ==============================
   DATA LOADING
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
        ...data,
        photoUrl: data.photoUrl || data.photoURL || '' 
      });
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });

    coachSnap.forEach(doc => {
      ALL_COACHES.push(doc.data());
    });

    populateFilters(years, sportsSet);
    await renderAthletes();
    renderCoaches(); // Coaches don't need async images anymore based on your request
  } catch (err) {
    console.error("Init Error:", err);
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
   RENDER COACHES (NO IMAGES)
============================== */
function renderCoaches() {
  const container = document.getElementById('coachContainer');
  const selectedSport = document.getElementById("sportSelect").value;
  const filtered = ALL_COACHES.filter(c => selectedSport === "all" || c.sport === selectedSport);

  if (filtered.length === 0) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <h2 style="margin:20px 0; color:var(--royal-blue); font-weight:800;">Coaching Staff</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
      ${filtered.map(c => `
        <div class="coach-card" style="background:white; padding:15px; border-radius:12px; box-shadow:var(--shadow);">
          <h3 style="font-size:1rem; margin-bottom:5px;">${c.name}</h3>
          <div style="font-size:0.8rem; font-weight:700; color:var(--royal-blue);">${c.sport}</div>
          <div style="font-size:0.75rem; color:var(--dark-gray);">${c.title || ''}</div>
          <a href="mailto:${c.email}" style="display:block; margin-top:10px; font-size:0.75rem; text-decoration:none; color:var(--royal-blue); font-weight:600;">Email Coach</a>
        </div>
      `).join("")}
    </div>
  `;
}

/* ==============================
   RENDER ATHLETES
============================== */
async function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";
  
  // This fetches the image from Firebase Storage
  const finalImgUrl = await getImageUrl(player.photoUrl);

  card.innerHTML = `
    <div class="photo-wrapper">
      <img class="player-photo" src="${finalImgUrl}" alt="${player.name}">
    </div>
    <div class="card-content">
      <span class="sport-badge">${player.sport}</span>
      <h3>
        <span>${player.name}</span>
        ${player.jersey ? `<span class="jersey">#${player.jersey}</span>` : ''}
      </h3>
      <div class="player-stats">
        <div class="stat-item"><span class="stat-label">Pos</span><span class="stat-value">${player.position || player.pos || '-'}</span></div>
        <div class="stat-item"><span class="stat-label">Ht/Wt</span><span class="stat-value">${player.height || player.ht || '-'}/${player.weight || player.wt || '-'}</span></div>
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
    return p.gradYear == gradYear && (selectedSport === "all" || p.sport === selectedSport);
  });

  container.innerHTML = "";
  for (const p of filtered) {
    const card = await createPlayerCard(p);
    container.appendChild(card);
  }
}

/* ==============================
   INIT
============================== */
(async function init() {
  await initializeData();
  const refresh = async () => { await renderAthletes(); renderCoaches(); };
  document.getElementById("gradSelect").addEventListener("change", refresh);
  document.getElementById("sportSelect").addEventListener("change", refresh);
})();