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
const PLACEHOLDER = "https://via.placeholder.com/400x500.png?text=WHS+ATHLETICS";

window.expandImage = (src) => {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  modal.style.display = "flex";
  modalImg.src = src;
};

async function getImageUrl(path) {
  if (!path || path === "") return PLACEHOLDER;
  if (path.startsWith('http')) return path;
  try {
    let cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
    if (!cleanPath.includes('.')) cleanPath += '.jpg';
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
      ALL_PLAYERS.push({ id: doc.id, ...data });
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });
    coachSnap.forEach(doc => { ALL_COACHES.push(doc.data()); });
    populateFilters(years, sportsSet);
    await renderContent();
    if(document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').style.display = 'none';
  } catch (err) {
    console.error("Load Error:", err);
  }
}

function populateFilters(years, sportsSet) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");
  const sortedYears = [...years].sort((a, b) => b - a);
  gradSelect.innerHTML = sortedYears.map(y => `<option value="${y}">${y}</option>`).join("");
  const sortedSports = [...sportsSet].sort();
  sportSelect.innerHTML = `<option value="all">All Sports (Coaches Only)</option>` +
    sortedSports.map(s => `<option value="${s}">${s}</option>`).join("");
}

async function renderContent() {
  const gradYear = document.getElementById("gradSelect").value;
  const selectedSport = document.getElementById("sportSelect").value;
  const searchTerm = document.getElementById("nameSearch").value.toLowerCase();
  const athleteContainer = document.getElementById("athleteContainer");
  const coachContainer = document.getElementById("coachContainer");

  // 1. Coaches Logic (Shown by default, filtered by sport if selected)
  const filteredCoaches = ALL_COACHES.filter(c => 
    (selectedSport === "all" || c.sport === selectedSport) &&
    (c.name || "").toLowerCase().includes(searchTerm)
  );

  if (filteredCoaches.length > 0) {
    coachContainer.innerHTML = `<h2 class="section-title">Coaching Staff</h2>` + 
      filteredCoaches.map(c => `
      <div class="coach-card">
        <div>
          <div class="coach-sport-tag">${(c.sport || '').toUpperCase()}</div>
          <h3>${c.name}</h3>
          <div class="coach-title">${c.title || ''}</div>
        </div>
        <a href="mailto:${c.email}" class="coach-email-link">${c.email}</a>
      </div>`).join("");
  } else { coachContainer.innerHTML = ""; }

  // 2. Athletes Logic (Hidden until a sport is chosen)
  if (selectedSport === "all") {
    athleteContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--dark-gray); border: 2px dashed var(--medium-gray); border-radius:12px;">Select a specific sport above to view athlete recruits.</div>`;
    return;
  }

  const filteredAthletes = ALL_PLAYERS.filter(p => 
    p.gradYear == gradYear && p.sport === selectedSport && (p.name || "").toLowerCase().includes(searchTerm)
  );

  athleteContainer.innerHTML = "";
  const cards = await Promise.all(filteredAthletes.map(async (p) => {
    const img = await getImageUrl(p.photoUrl || p.photoURL);
    return `
      <div class="player-card">
        <div class="photo-wrapper" onclick="expandImage('${img}')">
          <img class="player-photo" src="${img}" alt="${p.name}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="sport-badge">${p.sport}</span>
          <h3><span>${p.name}</span> <span class="jersey">${p.jersey ? '#' + p.jersey : ''}</span></h3>
          <div class="player-stats">
            <div class="stat-item"><span class="stat-label">POS</span><span class="stat-value">${p.position || p.pos || '-'}</span></div>
            <div class="stat-item"><span class="stat-label">HT/WT</span><span class="stat-value">${p.height || '-'}/${p.weight || '-'}</span></div>
            <div class="stat-item"><span class="stat-label">GPA</span><span class="stat-value">${p.gpa || '-'}</span></div>
          </div>
          <div class="player-links">
            ${p.hudl ? `<a href="${p.hudl}" target="_blank" class="hudl">HUDL</a>` : ''}
            ${p.twitter ? `<a href="${p.twitter}" target="_blank" class="twitter">TWITTER</a>` : ''}
          </div>
        </div>
      </div>`;
  }));
  athleteContainer.innerHTML = cards.length > 0 ? cards.join("") : `<div style="grid-column: 1/-1; text-align:center; padding:50px;">No recruits found for this criteria.</div>`;
}

initializeData();
document.getElementById("gradSelect").addEventListener("change", renderContent);
document.getElementById("sportSelect").addEventListener("change", renderContent);
document.getElementById("nameSearch").addEventListener("input", renderContent);