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

window.expandImage = (player) => {
  const modal = document.getElementById("imageModal");
  const modalContent = document.getElementById("modalContent");

  let metricsHTML = '';

  const hasData = player.bench || player.squat || player.powerClean || player.vertical ||
                  player.proAgility || player.satAct || player.recruiterNotes;

  if (hasData) {
    metricsHTML = '<div class="metrics-section">';
    if (player.bench)        metricsHTML += `<div class="metric-item"><span class="metric-label">Bench Press</span><span class="metric-value">${player.bench}</span></div>`;
    if (player.squat)        metricsHTML += `<div class="metric-item"><span class="metric-label">Squat</span><span class="metric-value">${player.squat}</span></div>`;
    if (player.powerClean)   metricsHTML += `<div class="metric-item"><span class="metric-label">Power Clean</span><span class="metric-value">${player.powerClean}</span></div>`;
    if (player.vertical)     metricsHTML += `<div class="metric-item"><span class="metric-label">Vertical Jump</span><span class="metric-value">${player.vertical}</span></div>`;
    if (player.proAgility)   metricsHTML += `<div class="metric-item"><span class="metric-label">Pro Agility</span><span class="metric-value">${player.proAgility}</span></div>`;
    if (player.satAct)       metricsHTML += `<div class="metric-item"><span class="metric-label">SAT/ACT</span><span class="metric-value">${player.satAct}</span></div>`;
    if (player.recruiterNotes) metricsHTML += `<div class="metric-item notes"><span class="metric-label">Recruiter Notes</span><span class="metric-value">${player.recruiterNotes}</span></div>`;
    metricsHTML += '</div>';
  } else {
    metricsHTML = '<p style="text-align:center; color:#777; font-style:italic; padding:20px 0;">No performance metrics or notes available.</p>';
  }

  modalContent.innerHTML = `
    <div class="modal-player-header">
      <img src="${player.img}" alt="${player.name}" class="modal-player-photo">
      <div class="modal-player-info">
        <h2>${player.name} <span class="modal-jersey">${player.jersey ? '#' + player.jersey : ''}</span></h2>
        <p class="modal-sport">${player.sport} • Class of ${player.gradYear}</p>
      </div>
    </div>
    <h3>Performance Metrics</h3>
    ${metricsHTML}
  `;

  modal.style.display = "flex";
};

async function getImageUrl(path) {
  if (!path) return PLACEHOLDER;
  if (path.startsWith('http')) return path;
  try {
    let cleanPath = path.replace('gs://roosports-117c3.firebasestorage.app/', '');
    if (!cleanPath.includes('.')) cleanPath += '.jpg';
    return await getDownloadURL(ref(storage, cleanPath));
  } catch {
    return PLACEHOLDER;
  }
}

async function initializeData() {
  try {
    const [athletesSnap, coachesSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    const years = new Set();
    const sports = new Set();

    athletesSnap.forEach(doc => {
      const d = doc.data();
      ALL_PLAYERS.push({ id: doc.id, ...d });
      if (d.gradYear) years.add(d.gradYear);
      if (d.sport) sports.add(d.sport);
    });

    coachesSnap.forEach(doc => ALL_COACHES.push({ id: doc.id, ...doc.data() }));

    // Populate filters
    const gradSelect = document.getElementById("gradSelect");
    gradSelect.innerHTML = [...years].sort((a,b)=>b-a).map(y => `<option value="${y}">${y}</option>`).join("");

    const sportSelect = document.getElementById("sportSelect");
    sportSelect.innerHTML = `<option value="all">All Sports (Coaches Only)</option>` +
      [...sports].sort().map(s => `<option value="${s}">${s}</option>`).join("");

    await renderContent();
    document.getElementById("loadingOverlay").style.display = "none";
  } catch (err) {
    console.error("Data load error:", err);
  }
}

const norm = s => (s || "").trim().toLowerCase();

async function renderContent() {
  const grad = document.getElementById("gradSelect").value;
  const sport = document.getElementById("sportSelect").value;
  const search = document.getElementById("nameSearch").value.trim().toLowerCase();

  const coachCont = document.getElementById("coachContainer");
  const athleteCont = document.getElementById("athleteContainer");

  // Coaches
  let coachHtml = "";

  if (sport === "all") {
    const filtered = ALL_COACHES.filter(c => (c.name||"").toLowerCase().includes(search));
    if (filtered.length) {
      coachHtml = `<h2 class="section-title">Coaching Staff</h2>` +
        filtered.map(c => `
          <div class="coach-card">
            <div>
              <div class="coach-sport-tag">${(c.sport||"").toUpperCase()}</div>
              <h3>${c.name||""}</h3>
              <div class="coach-title">${c.title||""}</div>
            </div>
            <a href="mailto:${c.email}" class="coach-email-link">${c.email||""}</a>
          </div>
        `).join("");
    }
  } else {
    const head = ALL_COACHES.find(c => norm(c.sport) === norm(sport) && /head|hc/i.test(c.title||""));
    if (head) {
      coachHtml = `
        <h2 class="section-title">Head Coach – ${sport}</h2>
        <div class="coach-card head-coach-card">
          <div>
            <div class="coach-sport-tag">${(head.sport||"").toUpperCase()}</div>
            <h3>${head.name||""}</h3>
            <div class="coach-title">${head.title||"Head Coach"}</div>
          </div>
          <a href="mailto:${head.email}" class="coach-email-link">${head.email||""}</a>
        </div>
      `;
    } else {
      coachHtml = `<p style="text-align:center; padding:30px; color:#666;">No head coach found for ${sport}</p>`;
    }
  }

  coachCont.innerHTML = coachHtml;

  // Athletes
  if (sport === "all") {
    athleteCont.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--dark-gray);border:2px dashed var(--medium-gray);border-radius:12px;">
      Select a sport to view athletes
    </div>`;
    return;
  }

  if (!grad) {
    athleteCont.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">Select a class year</div>`;
    return;
  }

  const athletes = ALL_PLAYERS.filter(p =>
    String(p.gradYear) === grad &&
    norm(p.sport) === norm(sport) &&
    (p.name||"").toLowerCase().includes(search)
  );

  const cards = await Promise.all(athletes.map(async p => {
    const img = await getImageUrl(p.photoUrl);

    const playerData = {
      name: p.name || "",
      sport: p.sport || "",
      gradYear: p.gradYear || "",
      jersey: p.jersey || "",
      img,
      bench: p.bench || "",
      squat: p.squat || "",
      powerClean: p.powerClean || "",
      vertical: p.vertical || "",
      proAgility: p.proAgility || "",
      satAct: p.satAct || "",
      recruiterNotes: p.recruiterNotes || ""
    };

    return `
      <div class="player-card">
        <div class="photo-wrapper" onclick='expandImage(${JSON.stringify(playerData)})'>
          <img class="player-photo" src="${img}" alt="${p.name || 'Athlete'}" loading="lazy">
          <div class="photo-overlay">
            <span class="view-stats">View Stats</span>
          </div>
        </div>
        <div class="card-content">
          <span class="sport-badge">${p.sport || ""}</span>
          <h3>
            <span>${p.name || ""}</span>
            <span class="jersey">${p.jersey ? '#' + p.jersey : ''}</span>
          </h3>
          <div class="player-info-grid">
            <div class="info-item"><span class="info-label">Class:</span><span class="info-value">${p.gradYear || '-'}</span></div>
            <div class="info-item"><span class="info-label">Height:</span><span class="info-value">${p.ht || '-'}</span></div>
            <div class="info-item"><span class="info-label">Weight:</span><span class="info-value">${p.wt || '-'}</span></div>
            <div class="info-item"><span class="info-label">Position:</span><span class="info-value">${p.pos || '-'}</span></div>
            <div class="info-item"><span class="info-label">Jersey:</span><span class="info-value">${p.jersey || '-'}</span></div>
            <div class="info-item"><span class="info-label">GPA:</span><span class="info-value">${p.gpa || '-'}</span></div>
          </div>
          ${p.hudl ? `<a href="${p.hudl}" target="_blank" class="hudl-link">🎥 HUDL Highlights</a>` : ''}
        </div>
      </div>
    `;
  }));

  athleteCont.innerHTML = cards.length ? cards.join("") : 
    `<div style="grid-column:1/-1;text-align:center;padding:50px;color:#666;">No athletes found</div>`;
}

initializeData();

["gradSelect", "sportSelect", "nameSearch"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener(id === "nameSearch" ? "input" : "change", renderContent);
});

document.getElementById("imageModal")?.addEventListener("click", e => {
  if (e.target === e.currentTarget) e.target.style.display = "none";
});