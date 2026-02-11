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

// Generic placeholder so the Roo Logo stays ONLY in the header
const PLACEHOLDER = "https://via.placeholder.com/400x500?text=No+Photo";

async function getImageUrl(path) {
  if (!path || path === "") return PLACEHOLDER;
  if (path.startsWith('http')) return path;
  try {
    const cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
    const imageRef = ref(storage, cleanPath);
    return await getDownloadURL(imageRef);
  } catch (err) {
    return PLACEHOLDER;
  }
}

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
      ALL_PLAYERS.push({ id: doc.id, ...data, photoUrl: data.photoUrl || data.photoURL || '' });
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });

    coachSnap.forEach(doc => { ALL_COACHES.push(doc.data()); });

    populateFilters(years, sportsSet);
    await renderAthletes();
    renderCoaches();
  } catch (err) { console.error(err); }
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

function renderCoaches() {
  const container = document.getElementById('coachContainer');
  const selectedSport = document.getElementById("sportSelect").value;
  const filtered = ALL_COACHES.filter(c => selectedSport === "all" || c.sport === selectedSport);

  if (filtered.length === 0) { container.innerHTML = ""; return; }

  container.innerHTML = `
    <h2 style="margin:20px 0; color:var(--royal-blue); font-weight:800; text-transform:uppercase; letter-spacing:1px;">Coaching Staff</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
      ${filtered.map(c => `
        <div class="coach-card" style="background:white; padding:20px; border-radius:12px; border: 1px solid #eee; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="font-size:0.7rem; font-weight:900; color:var(--royal-blue); text-transform:uppercase; margin-bottom:5px;">${(c.sport || '').toUpperCase()}</div>
          <h3 style="font-size:1.1rem; margin-bottom:5px; color:var(--black);">${c.name}</h3>
          <div style="font-size:0.8rem; color:var(--dark-gray); margin-bottom:10px;">${c.title || ''}</div>
          <a href="mailto:${c.email}" style="font-size:0.85rem; text-decoration:none; color:var(--light-blue); font-weight:600; word-break:break-all;">${c.email}</a>
        </div>
      `).join("")}
    </div>
  `;
}

async function createPlayerCard(player) {
  const card = document.createElement("div");
  card.className = "player-card";
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
  const filtered = ALL_PLAYERS.filter(p => p.gradYear == gradYear && (selectedSport === "all" || p.sport === selectedSport));
  container.innerHTML = "";
  for (const p of filtered) {
    const card = await createPlayerCard(p);
    container.appendChild(card);
  }
}

(async function init() {
  await initializeData();
  const refresh = async () => { await renderAthletes(); renderCoaches(); };
  document.getElementById("gradSelect").addEventListener("change", refresh);
  document.getElementById("sportSelect").addEventListener("change", refresh);
})();