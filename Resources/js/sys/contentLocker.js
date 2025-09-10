// ====================== Firebase SDK imports ======================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// ====================== Firebase config ======================
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// ====================== Firebase init ======================
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// ====================== Page mapping ======================
const pageNames = {
  "ura.html": { field: "Ura", display: "Ura" },
  "o-nas.html": { field: "oNas", display: "O nas" },
  "vsebine.html": { field: "Vsebine", display: "Vsebine" },
  "obvestila.html": { field: "Obvestila", display: "Obvestila" },
  "klepet.html": { field: "Klepet", display: "Klepet" },
  "eventi.html": { field: "Eventi", display: "Eventi" },
  "kontakt.html": { field: "Kontakt", display: "Kontakt" }
};

const path = window.location.pathname;
const fileName = path.split("/").pop().split("?")[0].split("#")[0];
const pageInfo = pageNames[fileName];
const docRef = doc(db, "settings", "pageAccess");

console.log("Detected path:", path);
console.log("Extracted filename:", fileName);
console.log("pageInfo:", pageInfo);

// ====================== Popup system ======================
function createPopup() {
  if (document.getElementById("noAccessPagePopup")) return;

  // Dark overlay
  const overlay = document.createElement("div");
  overlay.id = "noAccessOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
  overlay.style.display = "none";
  overlay.style.zIndex = "9998";
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 0.3s ease";

  // Popup container
  const popup = document.createElement("div");
  popup.id = "noAccessPagePopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.padding = "20px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
  popup.style.zIndex = "9999";
  popup.style.display = "none";
  popup.style.textAlign = "center";
  popup.style.maxWidth = "400px";
  popup.style.width = "90%";
  popup.style.opacity = "0";
  popup.style.transition = "opacity 0.3s ease";

  // Title
  const title = document.createElement("h2");
  title.id = "popupTitle";
  title.textContent = "Stran je trenutno v vzdrževanju!";

  // Message
  const message = document.createElement("p");
  message.id = "popupMessage";
  message.textContent = "Ta stran je trenutno nedosegljiva.";

  // Redirect button
  const btn = document.createElement("button");
  btn.textContent = "↩️ Nazaj";
  btn.style.marginTop = "15px";
  btn.style.padding = "10px 20px";
  btn.style.background = "#007BFF";
  btn.style.color = "#fff";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.fontWeight = "bold";

  btn.addEventListener("click", () => {
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.location.href = "/";
    }
  });

  popup.appendChild(title);
  popup.appendChild(message);
  popup.appendChild(btn);

  document.body.appendChild(overlay);
  document.body.appendChild(popup);
}

function showNoAccessPopup(displayName) {
  createPopup();
  const overlay = document.getElementById("noAccessOverlay");
  const popup = document.getElementById("noAccessPagePopup");
  const title = document.getElementById("popupTitle");
  const message = document.getElementById("popupMessage");

  if (popup && overlay && title && message) {
    title.textContent = "Stran je trenutno v vzdrževanju!";
    message.textContent = `Stran "${displayName}" je nedosegljiva.`;

    overlay.style.display = "block";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";

    // Trigger fade-in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      popup.style.opacity = "1";
    });

    document.body.style.overflow = "hidden"; // disable scrolling
  }
}

function hideNoAccessPopup() {
  const overlay = document.getElementById("noAccessOverlay");
  const popup = document.getElementById("noAccessPagePopup");

  if (popup && overlay) {
    overlay.style.opacity = "0";
    popup.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
      popup.style.display = "none";
      document.body.style.overflow = ""; // restore scrolling
    }, 300);
  }
}

// ====================== Firestore listener ======================
document.addEventListener("DOMContentLoaded", () => {
  onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      console.error("No such document: settings/pageAccess");
      return;
    }

    const data = docSnap.data();

    // Hide or show navbar items in real time
    Object.keys(pageNames).forEach((filename) => {
      const { field } = pageNames[filename];
      const links = document.querySelectorAll(`a[href$="${filename}"]`);
      links.forEach(link => {
        const container = link.closest("li") || link.closest("div") || link.parentElement;
        if (data[field] === false) {
          if (container) container.style.display = "none";
          else link.style.display = "none";
        } else {
          if (container) container.style.display = "";
          else link.style.display = "";
        }
      });
    });

    // Show popup if current page disabled
    if (pageInfo && data[pageInfo.field] === false) {
      setTimeout(() => showNoAccessPopup(pageInfo.display), 100);
    } else {
      hideNoAccessPopup();
    }
  });
});
