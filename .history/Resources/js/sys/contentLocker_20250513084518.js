import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";



// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase App
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();


// Mapping page filenames to Firestore fields and display names
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
const pageFile = path.substring(path.lastIndexOf("/") + 1);
const pageInfo = pageNames[pageFile]; // Mapping the page to its corresponding field in Firestore
const docRef = doc(db, "settings", "pageAccess");

function showNoAccessPopup() {
  const popup = document.getElementById("noAccessPagePopup");
  const popupTitle = document.getElementById("popupTitle");
  const popupMessage = document.getElementById("popupMessage");

  if (popup && popupTitle && popupMessage) {
    // Set the title text for the popup
    popupTitle.textContent = "Stran je trenutno v vzdrževanju!";

    // Set the specific page name dynamically in the message
    const pageName = pageInfo.display || "Ta stran"; // Use the display name from the pageNames mapping
    popupMessage.textContent = `Stran "${pageName}" je nedosegljiva.`;

    // Show the popup by setting its display to flex
    popup.style.display = "flex";
  } else {
    console.error("Popup elements not found");
  }
}


// Ensure the DOM is fully loaded before accessing the popup
document.addEventListener("DOMContentLoaded", () => {
  // Check if pageInfo exists
  if (pageInfo) {
    // Now, access the document reference for checking maintenance status
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Debugging: log the current page and its status
        console.log("Current page:", pageInfo);
        console.log("Page status:", data[pageInfo.field]);

        // Show maintenance popup if current page is locked
        if (data[pageInfo.field] === false) {
          // Delay showing the popup to allow DOM updates
          setTimeout(() => {
            showNoAccessPopup(); // Show the popup
          }, 100); // Delay for a short time to ensure DOM updates first
        }
      } else {
        console.error("No such document: settings/pageAccess");
      }
    });
  } else {
    console.error("Page not found in pageNames mapping");
  }
});



/* Login Check for the Settings tab

const navList = document.querySelector("nav ul");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Check if already exists to prevent duplicates
    if (!document.getElementById("nastavitveLink")) {
      const settingsLi = document.createElement("li");
      const settingsAnchor = document.createElement("a");

      settingsAnchor.href = "../Resources/utills/nastavitve.html";
      settingsAnchor.textContent = "Nastavitve";
      settingsAnchor.id = "nastavitveLink";

      settingsLi.appendChild(settingsAnchor);
      navList.insertBefore(settingsLi, document.getElementById("loginHref")); // Insert before login
    }
  } else {
    // Remove settings link on logout if it exists
    const existingSettingsLink = document.getElementById("nastavitveLink");
    if (existingSettingsLink && existingSettingsLink.parentElement) {
      existingSettingsLink.parentElement.remove();
    }
  }
});
