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
  if (!modal) return;
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
    const url = await getDownloadURL(imageRef);
    console.log("Loaded image:", url);
    return url;
  } catch (err) {
    console.warn("Storage error for path:", path, err.message);
    return PLACEHOLDER;
  }
}

async function initializeData() {
  console.log("Starting data load...");
  const loadingOverlay = document.getElementById('loadingOverlay');
  try {
    const [athleteSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    console.log(`Athletes: ${athleteSnap.size} docs | Coaches: ${coachSnap.size} docs`);

    const years = new Set();
    const sportsSet = new Set();

    athleteSnap.forEach(doc => {
      const data = doc.data();
      ALL_PLAYERS.push({ id: doc.id, ...data });
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sportsSet.add(data.sport);
    });

    coachSnap.forEach(doc => {
      ALL_COACHES.push(doc.data());
    });

    populateFilters(years, sportsSet);

    // Force render even if filters empty
    await renderContent();

    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
      console.log("Loading overlay hidden");
    }

  } catch (err) {
    console.error("Initialize failed:", err.code, err.message);
    if (loadingOverlay) {
      loadingOverlay.innerHTML = `<div style="color:red; padding:40px; text-align:center;">
        Failed to load data<br>${err.message}<br>Check console (F12)
      </div>`;
    }
  }
}

function populateFilters(years, sportsSet) {
  const gradSelect = document.getElementById("gradSelect");
  const sportSelect = document.getElementById("sportSelect");

  const sortedYears = [...years].sort((a, b) => b - a);
  gradSelect.innerHTML = `<option value="">Select Year</option>` +
    sortedYears.map(y => `<option value="${y}">${y}</option>`).join("");

  const sortedSports = [...sportsSet].sort();
  sportSelect.innerHTML = `<option value="all">All Sports (Coaches Only)</option>` +
    sortedSports.map(s => `<option value="${s}">${s}</option>`).join("");
}

async function renderContent() {
  console.log("Rendering content...");
  const gradYear = document.getElementById("gradSelect").value;
  const selectedSport = document.getElementById("sportSelect").value;
  const searchTerm = (document.getElementById("nameSearch")?.value || "").toLowerCase();
  const athleteContainer = document.getElementById("athleteContainer");
  const coachContainer = document.getElementById("coachContainer");

  if (!athleteContainer || !coachContainer) {
    console.error("Missing container elements");
    return;
  }

  // Coaches – always show when "all" or matching sport
  const filteredCoaches = ALL_COACHES.filter(c => 
    (selectedSport === "all" || c.sport === selectedSport) &&
    (c.name || "").toLowerCase().includes(searchTerm)
  );

  coachContainer.innerHTML = filteredCoaches.length > 0 
    ? `<h2 class="section-title">Coaching Staff</h2>` + 
      filteredCoaches.map(c => `
        <div class="coach-card">
          <div>
            <div class="coach-sport-tag">${(c.sport || '').toUpperCase()}</div>
            <h3>${c.name}</h3>
            <div class="coach-title">${c.title || ''}</div>
          </div>
          <a href="mailto:${c.email}" class="coach-email-link">${c.email}</a>
        </div>
      `).join("")
    : "";

  // Athletes – only show if specific sport selected AND year picked
  if (selectedSport === "all" || !gradYear) {
    athleteContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--dark-gray); border: 2px dashed var(--medium-gray); border-radius:12px;">
      ${!gradYear ? "Select a class year" : "Select a specific sport"} to view athletes
    </div>`;
    return;
  }

  const filteredAthletes = ALL_PLAYERS.filter(p => 
    String(p.gradYear) === gradYear &&
    p.sport === selectedSport &&
    (p.name || "").toLowerCase().includes(searchTerm)
  );

  console.log(`Athletes to render: ${filteredAthletes.length}`);

  athleteContainer.innerHTML = "Loading photos...";

  const cards = await Promise.all(
    filteredAthletes.map(async (p) => {
      const img = await getImageUrl(p.photoUrl || p.photoURL || "");
      return `
        <div class="player-card">
          <div class="photo-wrapper" onclick="expandImage('${img}')">
            <img class="player-photo" src="${img}" alt="${p.name}" loading="lazy">
          </div>
          <div class="card-content">
            <span class="sport-badge">${p.sport || ''}</span>
            <h3><span>${p.name || 'Unknown'}</span> <span class="jersey">${p.jersey ? '#' + p.jersey : ''}</span></h3>
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
    })
  );

  athleteContainer.innerHTML = cards.length > 0 
    ? cards.join("") 
    : `<div style="grid-column: 1/-1; text-align:center; padding:50px;">No recruits found.</div>`;
}

initializeData();

document.getElementById("gradSelect")?.addEventListener("change", renderContent);
document.getElementById("sportSelect")?.addEventListener("change", renderContent);
document.getElementById("nameSearch")?.addEventListener("input", renderContent);