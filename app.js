import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

let ALL_PLAYERS = [];
let ALL_COACHES = [];
const PLACEHOLDER = "https://via.placeholder.com/400x500.png?text=WHS+ATHLETICS";

window.expandImage = (src, e) => {
  e.stopPropagation();
  const modal = document.getElementById("imageModal");
  if (!modal) return;
  document.getElementById("modalImg").src = src;
  modal.style.display = "flex";
};

function createPlayerCard(player) {
  // All visible fields — only show if real data exists
  const pos    = player.pos || player.position || '';
  const ht     = player.ht || '';
  const wt     = player.wt ? `${player.wt} lbs` : '';
  const gpa    = player.gpa || '';
  const jersey = player.jersey ? `#${player.jersey}` : '';
  const hudl   = player.hudl || '';
  const twitter = player.twitter || '';
  const offers  = player.offers || '';
  const bench   = player.bench && player.bench.trim() && player.bench !== 'x' ? player.bench : '';
  const squat   = player.squat && player.squat.trim() && player.squat !== 'x' ? player.squat : '';
  const proAgility = player.proAgility && player.proAgility.trim() && player.proAgility !== 'x' ? player.proAgility : '';
  const satAct  = player.satAct && player.satAct.trim() && player.satAct !== 'x' ? player.satAct : '';
  const vertical = player.vertical && player.vertical.trim() && player.vertical !== 'x' ? player.vertical : '';
  const notes   = player.recruiterNotes && player.recruiterNotes.trim() && player.recruiterNotes !== 'x' ? player.recruiterNotes : '';

  const photo  = player.photoUrl || player.photoURL || PLACEHOLDER;

  let statsHTML = '';
  if (pos || ht || wt || gpa) {
    statsHTML = '<div class="player-stats">';
    if (pos)  statsHTML += `<div class="stat-item"><span class="stat-label">POS</span><span class="stat-value">${pos}</span></div>`;
    if (ht)   statsHTML += `<div class="stat-item"><span class="stat-label">HT</span><span class="stat-value">${ht}</span></div>`;
    if (wt)   statsHTML += `<div class="stat-item"><span class="stat-label">WT</span><span class="stat-value">${wt}</span></div>`;
    if (gpa)  statsHTML += `<div class="stat-item"><span class="stat-label">GPA</span><span class="stat-value">${gpa}</span></div>`;
    statsHTML += '</div>';
  }

  let extraHTML = '';
  if (hudl || twitter || offers || bench || squat || proAgility || satAct || vertical || notes) {
    extraHTML = '<div class="player-extra">';
    if (hudl) extraHTML += `<div><strong>Hudl URL:</strong> <a href="${hudl}" target="_blank">${hudl}</a></div>`;
    if (twitter) extraHTML += `<div><strong>Twitter / X:</strong> <a href="${twitter}" target="_blank">${twitter}</a></div>`;
    if (offers) extraHTML += `<div><strong>Offers:</strong> ${offers}</div>`;
    if (bench) extraHTML += `<div><strong>Bench:</strong> ${bench}</div>`;
    if (squat) extraHTML += `<div><strong>Squat:</strong> ${squat}</div>`;
    if (proAgility) extraHTML += `<div><strong>Pro Agility:</strong> ${proAgility}</div>`;
    if (satAct) extraHTML += `<div><strong>SAT/ACT:</strong> ${satAct}</div>`;
    if (vertical) extraHTML += `<div><strong>Vertical:</strong> ${vertical}</div>`;
    if (notes) extraHTML += `<div class="notes"><strong>Recruiter Notes:</strong><br>${notes}</div>`;
    extraHTML += '</div>';
  }

  const card = document.createElement('div');
  card.className = 'player-card';
  card.innerHTML = `
    <div class="photo-wrapper">
      <img class="player-photo" 
           src="${photo}" 
           alt="${player.name || 'Athlete'}" 
           loading="lazy"
           onclick="expandImage('${photo}', event)">
    </div>
    <div class="card-content">
      <span class="sport-badge">${player.sport || ''}</span>
      <h3>
        <span>${player.name || 'Unknown'}</span>
        ${jersey ? `<span class="jersey">${jersey}</span>` : ''}
      </h3>
      ${statsHTML || '<div style="height:60px;"></div>'}
      ${extraHTML || '<div style="height:20px;"></div>'}
    </div>
  `;

  // Keep card clickable/expandable (visual feedback only)
  card.addEventListener('click', e => {
    if (e.target.tagName === 'A' || e.target.tagName === 'IMG') return;
    card.classList.toggle('expanded');
  });

  return card;
}

async function initializeData() {
  console.log("Starting data load...");
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = 'flex';

  try {
    const [athleteSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    console.log(`Athletes: ${athleteSnap.size} | Coaches: ${coachSnap.size}`);

    const years = new Set();
    const sports = new Set();

    athleteSnap.forEach(doc => {
      ALL_PLAYERS.push(doc.data());
      if (doc.data().gradYear) years.add(doc.data().gradYear);
      if (doc.data().sport) sports.add(doc.data().sport);
    });

    coachSnap.forEach(doc => ALL_COACHES.push(doc.data()));

    populateFilters(years, sports);
    await renderContent();

    if (loading) {
      setTimeout(() => {
        loading.style.opacity = '0';
        setTimeout(() => loading.style.display = 'none', 400);
      }, 800);
    }

  } catch (err) {
    console.error("Load failed:", err);
    if (loading) {
      loading.innerHTML = `<div style="color:red; padding:40px; text-align:center;">Error: ${err.message}</div>`;
    }
  }
}

function populateFilters(years, sports) {
  document.getElementById("gradSelect").innerHTML = 
    `<option value="">Select Year</option>` +
    [...years].sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join("");

  document.getElementById("sportSelect").innerHTML = 
    `<option value="all">All Sports (Coaches Only)</option>` +
    [...sports].sort().map(s=>`<option value="${s}">${s}</option>`).join("");
}

async function renderContent() {
  console.log("renderContent started");
  const year   = document.getElementById("gradSelect").value;
  const sport  = document.getElementById("sportSelect").value;
  const search = (document.getElementById("nameSearch")?.value || "").toLowerCase().trim();

  const athCont = document.getElementById("athleteContainer");
  const coachCont = document.getElementById("coachContainer");

  if (!athCont || !coachCont) return;

  // Coaches
  const coaches = ALL_COACHES.filter(c =>
    (sport === "all" || (c.sport || "").toLowerCase() === sport.toLowerCase()) &&
    (c.name || "").toLowerCase().includes(search)
  );

  coachCont.innerHTML = coaches.length
    ? `<h2 class="section-title">Coaching Staff</h2>` +
      coaches.map(c => `
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

  // Athletes
  athCont.innerHTML = "";

  if (sport === "all" || !year) {
    athCont.innerHTML = `<div class="empty-message">
      ${!year ? "Select a class year" : "Select a sport"} to view athletes
    </div>`;
    return;
  }

  const athletes = ALL_PLAYERS.filter(p =>
    String(p.gradYear) === year &&
    (p.sport || "").toLowerCase() === sport.toLowerCase() &&
    (p.name || "").toLowerCase().includes(search)
  );

  console.log(`Athletes found: ${athletes.length}`);

  if (athletes.length === 0) {
    athCont.innerHTML = `<div class="empty-message">No athletes found</div>`;
  } else {
    athletes.forEach(p => {
      const card = createPlayerCard(p);
      athCont.appendChild(card);
    });
  }

  console.log("renderContent finished");
}

initializeData();

document.getElementById("gradSelect")?.addEventListener("change", renderContent);
document.getElementById("sportSelect")?.addEventListener("change", renderContent);
document.getElementById("nameSearch")?.addEventListener("input", renderContent);