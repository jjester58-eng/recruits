import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

/* ================= Firebase ================= */

const firebaseConfig = {
   apiKey: "AIzaSyB0DxK1oKMbpC38mH9_fP6XzTOmNwZh-Go",
  authDomain: "roosports-117c3.firebaseapp.com",
  projectId: "roosports-117c3",
  storageBucket: "roosports-117c3.firebasestorage.app",
  messagingSenderId: "894863108698",
  appId: "1:894863108698:web:2e3229b93bca82accc4663",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= Global Storage ================= */

let ALL_PLAYERS = [];

/* ================= Load Everything ================= */

async function initBoard() {

  const athleteSnap = await getDocs(collection(db, "athletes"));
  const sportSnap = await getDocs(collection(db, "athleteSports"));

  const athletes = {};
  const sports = new Set();
  const years = new Set();

  athleteSnap.forEach(doc => {
    const data = doc.data();
    athletes[doc.id] = data;
    if (data.gradYear) years.add(data.gradYear);
  });

  const players = [];

  sportSnap.forEach(doc => {
    const sportData = doc.data();
    const athlete = athletes[sportData.athleteId];

    if (!athlete) return;

    players.push({
      ...athlete,
      ...sportData
    });

    if (sportData.sport) sports.add(sportData.sport);
  });

  ALL_PLAYERS = players;

  populateDropdown("sportSelect", [...sports].sort());
  populateDropdown("gradSelect", [...years].sort());

  renderPlayers();
}

/* ================= Dropdown Builder ================= */

function populateDropdown(id, values) {

  const dropdown = document.getElementById(id);

  dropdown.innerHTML = `<option value="all">All</option>`;

  values.forEach(v => {
    dropdown.innerHTML += `<option value="${v}">${v}</option>`;
  });
}

/* ================= Render Players ================= */

function renderPlayers() {

  const sport = document.getElementById("sportSelect").value;
  const grad = document.getElementById("gradSelect").value;

  const container = document.getElementById("athleteContainer");

  const filtered = ALL_PLAYERS.filter(p => {

    const sportMatch = sport === "all" || p.sport === sport;
    const gradMatch = grad === "all" || p.gradYear == grad;

    return sportMatch && gradMatch;
  });

  if (!filtered.length) {
    container.innerHTML = `<div class="loading">No athletes found</div>`;
    return;
  }

  container.innerHTML = "";

  filtered.sort((a,b) => a.name.localeCompare(b.name));

  filtered.forEach(p => {

    const card = document.createElement("div");
    card.className = "player-card";

    card.innerHTML = `
      <img class="player-photo"
        src="${p.photoUrl || 'https://via.placeholder.com/340x240'}">

      <div class="player-info">
        <div class="name">${p.name}</div>
        <div>${p.gradYear} • ${p.sport}</div>
        <div>${p.height || "-"} | ${p.weight || "-"} lbs</div>
        <div>${p.position || "-"}</div>
        <div>GPA: ${p.gpa || "-"}</div>

        ${(p.hudl || p.twitter) ? `
        <div class="player-links">
          ${p.hudl ? `<a href="${p.hudl}" target="_blank">Hudl</a>` : ""}
          ${p.twitter ? `<a href="${p.twitter}" target="_blank">Twitter</a>` : ""}
        </div>` : ""}
      </div>
    `;

    container.appendChild(card);
  });
}

/* ================= Event Listeners ================= */

document.getElementById("sportSelect").addEventListener("change", renderPlayers);
document.getElementById("gradSelect").addEventListener("change", renderPlayers);

/* ================= Start App ================= */

initBoard();
