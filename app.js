// ============================= FIREBASE IMPORTS =============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ============================= FIREBASE CONFIG =============================
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

// ============================= GLOBAL STORAGE =============================
let ALL_PLAYERS = [];
let COACHES = {};

// ============================= LOAD EVERYTHING =============================
async function initBoard() {
  try {
    const athleteSnap = await getDocs(collection(db, "athletes"));
    const sportSnap = await getDocs(collection(db, "athleteSports"));
    const coachSnap = await getDocs(collection(db, "coaches"));

    // ----------------------------- Build Athletes -----------------------------
    const athletes = {};
    const years = new Set();
    athleteSnap.forEach(doc => {
      const data = doc.data();
      athletes[doc.id] = data;
      if (data.gradYear) years.add(data.gradYear);
    });

    // ----------------------------- Build Players -----------------------------
    const sports = new Set();
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

    // ----------------------------- Build Coaches -----------------------------
    coachSnap.forEach(doc => {
      const data = doc.data();
      if (data.sport) COACHES[data.sport] = data.name;
    });

    // ----------------------------- Populate Filters -----------------------------
    populateDropdown("gradeFilter", [...years].sort());
    populateDropdown("sportFilter", [...sports].sort());

    // ----------------------------- Render -----------------------------
    renderPlayers();
    updateCoachRibbon();

    // ----------------------------- Event Listeners -----------------------------
    document.getElementById("gradeFilter").addEventListener("change", () => {
      renderPlayers();
      updateCoachRibbon();
    });
    document.getElementById("sportFilter").addEventListener("change", () => {
      renderPlayers();
      updateCoachRibbon();
    });

  } catch (err) {
    console.error("Error loading data:", err);
    document.getElementById("profileGrid").innerHTML = `<div class="error">Error loading players. Check console.</div>`;
  }
}

// ============================= POPULATE DROPDOWN =============================
function populateDropdown(id, values) {
  const dropdown = document.getElementById(id);
  dropdown.innerHTML = `<option value="all">All</option>`;
  values.forEach(v => {
    dropdown.innerHTML += `<option value="${v}">${v}</option>`;
  });
}

// ============================= RENDER PLAYER CARDS =============================
function renderPlayers() {
  const sport = document.getElementById("sportFilter").value;
  const grad = document.getElementById("gradeFilter").value;
  const container = document.getElementById("profileGrid");

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
  filtered.sort((a, b) => a.name.localeCompare(b.name));

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
      <img class="player-photo"
           src="${p.photoUrl || 'https://via.placeholder.com/340x240/667eea/ffffff?text=No+Photo'}"
           alt="${p.name}">

      <div class="player-info">
        <div class="name">${p.name}</div>
        <div>${p.gradYear} • ${p.sport || "-"}</div>
        <div>${p.ht || "-"} | ${p.wt || "-"} lbs</div>
        <div>${p.pos || "-"}</div>
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

// ============================= HEAD COACH RIBBON =============================
function updateCoachRibbon() {
  const sport = document.getElementById("sportFilter").value;
  const ribbon = document.getElementById("coachRibbon");
  if (sport === "all") {
    ribbon.textContent = "";
  } else {
    const coachName = COACHES[sport] || "TBD";
    ribbon.textContent = `Head Coach: ${coachName}`;
  }
}

// ============================= START APP =============================
initBoard();
