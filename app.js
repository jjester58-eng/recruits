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

/**
 * Enhanced Image Fetcher
 * Handles full gs:// links and missing file extensions
 */
async function getImageUrl(path) {
  if (!path || path === "") return PLACEHOLDER;
  if (path.startsWith('http')) return path;

  // Clean the Firestore path string
  let cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
  
  try {
    // Attempt 1: As provided
    return await getDownloadURL(ref(storage, cleanPath));
  } catch (err) {
    // Attempt 2: Auto-append .jpg if extension is missing
    if (!cleanPath.includes('.')) {
      try {
        return await getDownloadURL(ref(storage, cleanPath + ".jpg"));
      } catch (e) {
        console.warn("Image not found after retry:", cleanPath);
        return PLACEHOLDER;
      }
    }
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
      ALL_PLAYERS.push({ 
        id: doc.id, 
        ...data, 
        photoUrl: data.photoUrl || data.photoURL || '' 
      });
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });

    coachSnap.forEach(doc => { ALL_COACHES.push(doc.data()); });

    populateFilters(years, sportsSet);
    await renderContent();

    // Remove spinner
    if(document.getElementById('loadingOverlay')) {
      document.getElementById('loadingOverlay').style.display = 'none';
    }
  } catch (err) {
    console.error("Critical Load Error:", err);
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

async function renderContent() {
  const gradYear = document.getElementById("gradSelect").value;
  const selectedSport = document.getElementById("sportSelect").value;
  
  const athleteContainer = document.getElementById("athleteContainer");
  const coachContainer = document.getElementById("coachContainer");

  // 1. Render Athletes
  const filteredAthletes = ALL_PLAYERS.filter(p => 
    p.gradYear == gradYear && (selectedSport === "all" || p.sport === selectedSport)
  );
  
  athleteContainer.innerHTML = "";
  for (const p of filteredAthletes) {
    const img = await getImageUrl(p.photoUrl);
    athleteContainer.innerHTML += `
      <div class="player-card">
        <div class="photo-wrapper">
          <img class="player-photo" src="${img}" alt="${p.name}" loading="lazy">
        </div>
        <div class="card-content">
          <span class="sport-badge">${p.sport}</span>
          <h3>
            <span>${p.name}</span>
            <span class="jersey">${p.jersey ? '#' + p.jersey : ''}</span>
          </h3>
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
      </div>
    `;
  }

  // 2. Render Coaches
  const filteredCoaches = ALL_COACHES.filter(c => 
    selectedSport === "all" || c.sport === selectedSport
  );

  if (filteredCoaches.length > 0) {
    coachContainer.innerHTML = `<h2 style="margin:20px 0; color:var(--royal-blue); font-weight:900; text-transform:uppercase;">Coaching Staff</h2>`;
    filteredCoaches.forEach(c => {
      coachContainer.innerHTML += `
        <div class="coach-card">
          <div class="coach-sport-tag">${(c.sport || '').toUpperCase()}</div>
          <h3 style="font-size:1.2rem; margin-bottom:5px;">${c.name}</h3>
          <div style="font-size:0.85rem; color:var(--dark-gray); margin-bottom:12px;">${c.title || ''}</div>
          <a href="mailto:${c.email}" class="coach-email-link">${c.email}</a>
        </div>
      `;
    });
  } else {
    coachContainer.innerHTML = "";
  }
}

// Start
(async function init() {
  await initializeData();
  document.getElementById("gradSelect").addEventListener("change", renderContent);
  document.getElementById("sportSelect").addEventListener("change", renderContent);
})();