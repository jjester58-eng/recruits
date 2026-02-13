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
  console.log("Starting data load...");
  const loading = document.getElementById('loadingOverlay');
  if (loading) loading.style.display = 'flex'; // ensure it's visible

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

    // Render content (this adds cards to the page)
    await renderContent();

    // Only hide loading **after cards are in the DOM**
    if (loading) {
      setTimeout(() => {
        loading.style.opacity = '0';
        setTimeout(() => { loading.style.display = 'none'; }, 400);
      }, 600); // small delay so user sees something
      console.log("Loading overlay hidden after content render");
    }

  } catch (err) {
    console.error("Initialize failed:", err.code, err.message);
    if (loading) {
      loading.innerHTML = `<div style="color:red; padding:40px; text-align:center;">
        Failed to load data<br>${err.message}<br>Check console (F12)
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
  console.log("Rendering content...");
  const gradYear = document.getElementById("gradSelect").value;
  const selectedSport = document.getElementById("sportSelect").value;
  const searchTerm = (document.getElementById("nameSearch")?.value || "").toLowerCase().trim();
  const athleteContainer = document.getElementById("athleteContainer");
  const coachContainer = document.getElementById("coachContainer");

  if (!athleteContainer || !coachContainer) {
    console.error("Missing container elements");
    return;
  }

  // Coaches – always show when "all" or matching sport
  const filteredCoaches = ALL_COACHES.filter(c => 
    (selectedSport === "all" || (c.sport || "").toLowerCase() === selectedSport.toLowerCase()) &&
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
    (p.sport || "").toLowerCase() === selectedSport.toLowerCase() &&
    (p.name || "").toLowerCase().includes(searchTerm)
  );

  console.log(`Athletes to render: ${filteredAthletes.length}`);

  athleteContainer.innerHTML = "";

  if (filteredAthletes.length === 0) {
    athleteContainer.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px;">
      No recruits found for this criteria.
    </div>`;
    return;
  }

  // Build cards with expandable content
  filteredAthletes.forEach(p => {
    // Front content (always visible)
    const pos    = p.pos || p.position || '-';
    const ht     = p.ht || '-';
    const wt     = p.wt ? `${p.wt} lbs` : '-';
    const gpa    = p.gpa || '-';
    const jersey = p.jersey ? `#${p.jersey}` : '';
    const hudl   = p.hudl || '';
    const photo  = p.photoUrl || p.photoURL || PLACEHOLDER;

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
      <div class="photo-wrapper" onclick="expandImage('${photo}', event)">
        <img class="player-photo" src="${photo}" alt="${p.name || 'Athlete'}" loading="lazy">
      </div>
      <div class="card-content">
        <span class="sport-badge">${p.sport || ''}</span>
        <h3>
          <span>${p.name || 'Unknown'}</span>
          ${jersey ? `<span class="jersey">${jersey}</span>` : ''}
        </h3>
        ${statsHTML || '<div style="height:60px;"></div>'}
        ${hudl ? `
          <div class="player-links">
            <a href="${hudl}" target="_blank" class="hudl">HUDL</a>
          </div>
        ` : ''}
      </div>
    `;

    // Expanded content - only show fields with real data
    let detailRows = [];

    if (p.twitter && p.twitter.trim() && p.twitter !== 'x') {
      detailRows.push(`<div><strong>Twitter / X:</strong> <a href="${p.twitter}" target="_blank">${p.twitter}</a></div>`);
    }
    if (p.hudl && p.hudl.trim() && p.hudl !== 'x') {
      detailRows.push(`<div><strong>Hudl URL:</strong> <a href="${p.hudl}" target="_blank">${p.hudl}</a></div>`);
    }
    if (p.offers && p.offers.trim() && p.offers !== 'x') {
      detailRows.push(`<div><strong>Offers:</strong> ${p.offers}</div>`);
    }
    if (p.bench && p.bench.trim() && p.bench !== 'x') {
      detailRows.push(`<div><strong>Bench:</strong> ${p.bench}</div>`);
    }
    if (p.squat && p.squat.trim() && p.squat !== 'x') {
      detailRows.push(`<div><strong>Squat:</strong> ${p.squat}</div>`);
    }
    if (p.proAgility && p.proAgility.trim() && p.proAgility !== 'x') {
      detailRows.push(`<div><strong>Pro Agility:</strong> ${p.proAgility}</div>`);
    }
    if (p.satAct && p.satAct.trim() && p.satAct !== 'x') {
      detailRows.push(`<div><strong>SAT/ACT:</strong> ${p.satAct}</div>`);
    }
    if (p.vertical && p.vertical.trim() && p.vertical !== 'x') {
      detailRows.push(`<div><strong>Vertical:</strong> ${p.vertical}</div>`);
    }
    if (p.recruiterNotes && p.recruiterNotes.trim() && p.recruiterNotes !== 'x') {
      detailRows.push(`<div class="notes"><strong>Recruiter Notes:</strong><br>${p.recruiterNotes}</div>`);
    }

    const detailsSection = detailRows.length > 0 ? `
      <div class="player-details hidden">
        <div class="detail-grid">
          ${detailRows.join('')}
        </div>
      </div>
    ` : '';

    const cardHTML = `
      <div class="player-card">
        ${front}
        ${detailsSection}
      </div>
    `;

    athleteContainer.innerHTML += cardHTML;
  });

  // Add click handler to all cards after they're added
  document.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' || e.target.tagName === 'IMG') return;
      card.classList.toggle('expanded');
    });
  });
}

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


initializeData();

document.getElementById("gradSelect")?.addEventListener("change", renderContent);
document.getElementById("sportSelect")?.addEventListener("change", renderContent);
document.getElementById("nameSearch")?.addEventListener("input", renderContent);