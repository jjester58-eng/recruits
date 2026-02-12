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

// Updated to show performance metrics modal instead of just image
window.expandImage = (playerData) => {
  const modal = document.getElementById("imageModal");
  const modalContent = document.getElementById("modalContent");

  // Build performance metrics HTML (only show if data exists)
  let metricsHTML = '';

  if (playerData.bench || playerData.squat || playerData.powerClean || playerData.vertical ||
    playerData.proAgility || playerData.satAct || playerData.recruiterNotes) {
    metricsHTML = '<div class="metrics-section">';

    if (playerData.bench) metricsHTML += `<div class="metric-item"><span class="metric-label">Bench Press:</span> <span class="metric-value">${playerData.bench} lbs</span></div>`;
    if (playerData.squat) metricsHTML += `<div class="metric-item"><span class="metric-label">Squat:</span> <span class="metric-value">${playerData.squat} lbs</span></div>`;
    if (playerData.powerClean) metricsHTML += `<div class="metric-item"><span class="metric-label">Power Clean:</span> <span class="metric-value">${playerData.powerClean} lbs</span></div>`;
    if (playerData.vertical) metricsHTML += `<div class="metric-item"><span class="metric-label">Vertical Jump:</span> <span class="metric-value">${playerData.vertical}"</span></div>`;
    if (playerData.proAgility) metricsHTML += `<div class="metric-item"><span class="metric-label">Pro Agility:</span> <span class="metric-value">${playerData.proAgility}s</span></div>`;
    if (playerData.satAct) metricsHTML += `<div class="metric-item"><span class="metric-label">SAT/ACT:</span> <span class="metric-value">${playerData.satAct}</span></div>`;
    if (playerData.recruiterNotes) metricsHTML += `<div class="metric-item notes"><span class="metric-label">Recruiter Notes:</span> <span class="metric-value">${playerData.recruiterNotes}</span></div>`;

    metricsHTML += '</div>';
  } else {
    metricsHTML = '<p style="text-align:center; color:#666; padding:20px;">No additional performance metrics available.</p>';
  }

  modalContent.innerHTML = `
    <div class="modal-player-header">
      <img src="${playerData.photoUrl}" alt="${playerData.name}" class="modal-player-photo">
      <div class="modal-player-info">
        <h2>${playerData.name} <span class="modal-jersey">${playerData.jersey ? '#' + playerData.jersey : ''}</span></h2>
        <p class="modal-sport">${playerData.sport} • Class of ${playerData.gradYear}</p>
      </div>
    </div>
    <h3 style="color: #0033a0; margin: 20px 0 15px; font-size: 1.2rem;">Performance Metrics</h3>
    ${metricsHTML}
  `;

  modal.style.display = "flex";
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
    if (document.getElementById('loadingOverlay')) document.getElementById('loadingOverlay').style.display = 'none';
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

  // 1. Coaches Logic - Show when sport is selected (not "all")
  if (selectedSport !== "all") {
    const filteredCoaches = ALL_COACHES.filter(c =>
      c.sport === selectedSport &&
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
    } else {
      coachContainer.innerHTML = "";
    }
  } else {
    // When "All Sports" is selected, show all coaches
    const filteredCoaches = ALL_COACHES.filter(c =>
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
    } else {
      coachContainer.innerHTML = "";
    }
  }

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
    const heightDisplay = p.ht || p.height || '-';
    const weightDisplay = p.wt || p.weight || '-';
    const position = p.position || p.pos || '-';

    // Create a data object to pass to modal
    const playerDataJson = JSON.stringify({
      name: p.name,
      sport: p.sport,
      gradYear: p.gradYear,
      jersey: p.jersey,
      photoUrl: img,
      bench: p.bench || '',
      squat: p.squat || '',
      powerClean: p.powerClean || '',
      vertical: p.vertical || '',
      proAgility: p.proAgility || '',
      satAct: p.satAct || '',
      recruiterNotes: p.recruiterNotes || ''
    }).replace(/"/g, '&quot;');

    return `
      <div class="player-card">
        <div class="photo-wrapper" onclick='expandImage(${playerDataJson})'>
          <img class="player-photo" src="${img}" alt="${p.name}" loading="lazy">
          <div class="photo-overlay">
            <span class="view-stats">📊 View Stats</span>
          </div>
        </div>
        <div class="card-content">
          <span class="sport-badge">${p.sport}</span>
          <h3><span>${p.name}</span> <span class="jersey">${p.jersey ? '#' + p.jersey : ''}</span></h3>
          <div class="player-info-grid">
            <div class="info-item"><span class="info-label">Class:</span> <span class="info-value">${p.gradYear || '-'}</span></div>
            <div class="info-item"><span class="info-label">Height:</span> <span class="info-value">${heightDisplay}</span></div>
            <div class="info-item"><span class="info-label">Weight:</span> <span class="info-value">${weightDisplay}</span></div>
            <div class="info-item"><span class="info-label">Position:</span> <span class="info-value">${position}</span></div>
            <div class="info-item"><span class="info-label">Jersey:</span> <span class="info-value">${p.jersey || '-'}</span></div>
            <div class="info-item"><span class="info-label">GPA:</span> <span class="info-value">${p.gpa || '-'}</span></div>
          </div>
          ${p.hudl ? `<a href="${p.hudl}" target="_blank" class="hudl-link">🎥 HUDL Highlights</a>` : ''}
        </div>
      </div>`;
  }));
  athleteContainer.innerHTML = cards.length > 0 ? cards.join("") : `<div style="grid-column: 1/-1; text-align:center; padding:50px;">No recruits found for this criteria.</div>`;
}

initializeData();
document.getElementById("gradSelect").addEventListener("change", renderContent);
document.getElementById("sportSelect").addEventListener("change", renderContent);
document.getElementById("nameSearch").addEventListener("input", renderContent);

// Close modal when clicking outside content
document.getElementById("imageModal").addEventListener("click", function (e) {
  if (e.target === this) {
    this.style.display = "none";
  }
});