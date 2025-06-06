// Firebase SDK imports
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// Page name mapping (filename only)
const pageNames = {
  "ura.html": { field: "Ura", display: "Ura" },
  "o-nas.html": { field: "oNas", display: "O nas" },
  "vsebine.html": { field: "Vsebine", display: "Vsebine" },
  "obvestila.html": { field: "Obvestila", display: "Obvestila" },
  "klepet.html": { field: "Klepet", display: "Klepet" },
  "eventi.html": { field: "Eventi", display: "Eventi" },
  "kontakt.html": { field: "Kontakt", display: "Kontakt" }
};

// Extract the filename only (ignore folder structure)
const path = window.location.pathname;
const fileName = window.location.pathname.split("/").pop().split("?")[0].split("#")[0];
const pageInfo = pageNames[fileName];
const docRef = doc(db, "settings", "pageAccess");
console.log("Detected path:", window.location.pathname);
console.log("Extracted filename:", fileName);
console.log("pageInfo:", pageInfo);


// Function to show maintenance popup
function showNoAccessPopup() {
  const popup = document.getElementById("noAccessPagePopup");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");

  if (popup && popupTitle && popupMessage) {
    popupTitle.textContent = "Stran je trenutno v vzdrževanju!";
    popupMessage.textContent = `Stran "${pageInfo?.display || "Ta stran"}" je nedosegljiva.`;
    popup.style.display = "flex";
  } else {
    console.error("Popup elements not found");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      console.error("No such document: settings/pageAccess");
      return;
    }

    const data = docSnap.data();

    // Hide or show disabled links and fix spacing
    Object.keys(pageNames).forEach((filename) => {
      const { field } = pageNames[filename];
      const links = document.querySelectorAll(`a[href$="${filename}"]`);
links.forEach(link => {
  // Find closest parent container that affects layout — adjust the selector as needed
  const container = link.closest("li") || link.closest("div") || link.parentElement;

  if (data[field] === false) {
    // Hide the container, not just the link, to remove space
    if (container) {
      container.style.display = "none";
    } else {
      // fallback to hiding the link only if no container found
      link.style.display = "none";
      link.style.margin = "0";
      link.style.padding = "0";
    }
  } else {
    // Show container or link again
    if (container) {
      container.style.display = "";
    } else {
      link.style.display = "";
      link.style.margin = "";
      link.style.padding = "";
    }
  }
      });
    });

    // Show popup if current page disabled
    if (pageInfo && data[pageInfo.field] === false) {
      setTimeout(showNoAccessPopup, 100);
    }
  });
});


