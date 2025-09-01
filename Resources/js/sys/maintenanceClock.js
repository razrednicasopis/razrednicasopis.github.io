import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js"; 
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Init Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const settingsDoc = doc(db, "settings", "nextMaintenance");
const maintenanceDoc = doc(db, "settings", "maintenanceMode");

// --- utility to get or create #maintenanceStatus ---
function getMaintenanceStatusEl() {
  let el = document.getElementById("maintenanceStatus");
  if (!el) {
    const wrapper = document.getElementById("maintenanceWrapper");
    el = document.createElement("div");
    el.id = "maintenanceStatus";
    wrapper.prepend(el);
  }
  return el;
}

// Flip clock logic
function updateDigit(digitEl, newNumber) {
  const currentEl = digitEl.querySelector(".current");
  const nextEl = digitEl.querySelector(".next");

  if (currentEl.textContent === newNumber) return;

  nextEl.textContent = newNumber;

  currentEl.style.transition = "none";
  nextEl.style.transition = "none";
  currentEl.style.transform = "translateY(0)";
  nextEl.style.transform = "translateY(-140px)";

  requestAnimationFrame(() => {
    currentEl.style.transition = "transform 0.5s ease";
    nextEl.style.transition = "transform 0.5s ease";
    currentEl.style.transform = "translateY(140px)";
    nextEl.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    currentEl.textContent = newNumber;
    currentEl.style.transition = "none";
    nextEl.style.transition = "none";
    currentEl.style.transform = "translateY(0)";
    nextEl.style.transform = "translateY(-140px)";
  }, 500);
}

// Countdown update logic
function runCountdown(targetDate, maintenanceMode) {
  const now = new Date();
  const diff = targetDate - now;

  if (diff <= 0) {
    if (maintenanceMode) {
      showActiveMaintenanceMessage();
    } else {
      showUpcomingMaintenanceWarning();
    }
    return false;
  }

  const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, "0");
  const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

  const timeStr = hours + minutes + seconds;
  const ids = ["hourTens", "hourOnes", "minuteTens", "minuteOnes", "secondTens", "secondOnes"];

  ids.forEach((id, i) => {
    const digitEl = document.getElementById(id);
    const newNumber = timeStr[i];
    updateDigit(digitEl, newNumber);
  });

  return true;
}

// Countdown setup
function startCountdown(targetDate, maintenanceMode) {
  if (!runCountdown(targetDate, maintenanceMode)) return;

  const interval = setInterval(() => {
    const keepRunning = runCountdown(targetDate, maintenanceMode);
    if (!keepRunning) clearInterval(interval);
  }, 1000);
}

// --- UI helpers ---
function clearUI() {
  const statusEl = getMaintenanceStatusEl();
  statusEl.innerHTML = "";
  document.querySelector(".flip-clock").style.display = "none";
}

function showNoDataMessage() {
  clearUI();
  getMaintenanceStatusEl().innerHTML = `
    <h1 style="color:black;text-align:center;font-size:35px;">
      Ni trenutnih podatkov o naslednjem vzdrževanju.
    </h1>`;
}

function showActiveMaintenanceMessage() {
  clearUI();
  getMaintenanceStatusEl().innerHTML = `
    <h1 style="color:#ff5c5c;text-align:center;font-size:35px;">
      Vzdrževanje je trenutno aktivno.
    </h1>
    <p style="color:black;text-align:center;font-size:20px;">
      Spletna stran je lahko začasno nedosegljiva ali nepopolno delujoča.
    </p>`;
}

function showUpcomingMaintenanceWarning() {
  clearUI();
  getMaintenanceStatusEl().innerHTML = `
    <h1 style="color:black;text-align:center;font-size:35px;">
      VZDRŽEVANJE SE BO KMALU PRIČELO
    </h1>
    <p style="color:black;text-align:center;font-size:20px;">
      Spletna stran se pripravlja na začetek vzdrževalnega obdobja.
    </p>`;
}

function showCountdown(targetDate, maintenanceMode) {
  clearUI();
  document.querySelector(".flip-clock").style.display = "flex";
  startCountdown(targetDate, maintenanceMode);
}

// Fetch & Init
async function fetchMaintenanceData() {
  try {
    const [settingsSnap, maintenanceSnap] = await Promise.all([
      getDoc(settingsDoc),
      getDoc(maintenanceDoc),
    ]);

    if (!settingsSnap.exists() || !maintenanceSnap.exists()) {
      showNoDataMessage();
      return;
    }

    const settingsData = settingsSnap.data();
    const startTime = settingsData.maintenanceStartTime
      ? settingsData.maintenanceStartTime.toDate()
      : null;
    const expectingMaintenance = settingsData.expectingMaintenance;
    const maintenanceMode = maintenanceSnap.data().maintenanceMode;

    if (!startTime) {
      showNoDataMessage();
      return;
    }

    const now = new Date();

    if (startTime < now) {
      if (maintenanceMode) {
        showActiveMaintenanceMessage();
      } else if (expectingMaintenance) {
        showUpcomingMaintenanceWarning();
      } else {
        showNoDataMessage();
      }
    } else {
      showCountdown(startTime, maintenanceMode);
    }
  } catch (err) {
    console.error("Error fetching maintenance data:", err);
    showNoDataMessage();
  }
}

fetchMaintenanceData();
