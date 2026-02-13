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
  e.stopPropagation(); // ← Prevents card expand when clicking photo
  const modal = document.getElementById("imageModal");
  if (!modal) return;
  document.getElementById("modalImg").src = src;
  modal.style.display = "flex";
};

function createPlayerCard(player) {
  const pos    = player.pos || player.position || '';
  const ht     = player.ht || '';
  const wt     = player.wt ? `${player.wt} lbs` : '';
  const gpa    = player.gpa || '';
  const jersey = player.jersey ? `#${player.jersey}` : '';
  const hudl   = player.hudl || '';
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

  const front = `
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
      ${hudl ? `
        <div class="player-links">
          <a href="${hudl}" target="_blank" class="hudl">Hudl</a>
        </div>
      ` : ''}
    </div>
  `;

  // Only build expandable section if there's actual data
  let rows = [];

  if (player.bench && player.bench.trim() && player.bench !== 'x') {
    rows.push(`<div><strong>Bench:</strong> ${player.bench}</div>`);
  }
  if (player.squat && player.squat.trim() && player.squat !== 'x') {
    rows.push(`<div><strong>Squat:</strong> ${player.squat}</div>`);
  }
  if (player.proAgility && player.proAgility.trim() && player.proAgility !== 'x') {
    rows.push(`<div><strong>Pro Agility:</strong> ${player.proAgility}</div>`);
  }
  if (player.vertical && player.vertical.trim()) {
    rows.push(`<div><strong>Vertical:</strong> ${player.vertical}</div>`);
  }
  if (player.satAct && player.satAct.trim() && player.satAct !== 'x') {
    rows.push(`<div><strong>SAT/ACT:</strong> ${player.satAct}</div>`);
  }
  if (player.offers && player.offers.trim()) {
    rows.push(`<div><strong>Offers:</strong> ${player.offers}</div>`);
  }
  if (player.twitter && player.twitter.trim()) {
    rows.push(`<div><strong>Twitter/X:</strong> <a href="${player.twitter}" target="_blank">${player.twitter}</a></div>`);
  }
  if (player.recruiterNotes && player.recruiterNotes.trim()) {
    rows.push(`<div class="notes"><strong>Recruiter Notes:</strong><br>${player.recruiterNotes}</div>`);
  }

  const details = rows.length ? `
    <div class="player-details hidden">
      <div class="detail-grid">${rows.join('')}</div>
    </div>
  ` : '';

  const card = document.createElement('div');
  card.className = 'player-card';
  card.innerHTML = front + details;

  if (details) {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'A' || e.target.tagName === 'IMG') return;
      card.classList.toggle('expanded');
    });
  } else {
    card.style.cursor = 'default';
  }

  return card;
}

async function initializeData() {
  console.log("Loading data...");
  const loading = document.getElementById('loadingOverlay');
  try {
    const [athSnap, coachSnap] = await Promise.all([
      getDocs(collection(db, "athletes")),
      getDocs(collection(db, "coaches"))
    ]);

    console.log(`Athletes: ${athSnap.size} | Coaches: ${coachSnap.size}`);

    const years = new Set();
    const sports = new Set();

    athSnap.forEach(doc => {
      const data = doc.data();
      ALL_PLAYERS.push(data);
      if (data.gradYear) years.add(data.gradYear);
      if (data.sport) sports.add(data.sport);
    });

    coachSnap.forEach(doc => ALL_COACHES.push(doc.data()));

    populateFilters(years, sports);

    // Keep loading visible until content is rendered
    await renderContent();

    // Only hide after cards are actually in the DOM
    if (loading) {
      setTimeout(() => { loading.style.display = 'none'; }, 300);
      console.log("Loading overlay hidden");
    }

  } catch (err) {
    console.error("Load failed:", err);
    if (loading) {
      loading.innerHTML = `<div style="color:red;padding:40px;text-align:center;">
        Error loading data<br>${err.message}
      </div>`;
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
  const year   = document.getElementById("gradSelect").value;
  const sport  = document.getElementById("sportSelect").value;
  const search = (document.getElementById("nameSearch")?.value || "").toLowerCase().trim();

  const athCont = document.getElementById("athleteContainer");
  const coachCont = document.getElementById("coachContainer");

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
}

initializeData();

document.getElementById("gradSelect")?.addEventListener("change", renderContent);
document.getElementById("sportSelect")?.addEventListener("change", renderContent);
document.getElementById("nameSearch")?.addEventListener("input", renderContent);