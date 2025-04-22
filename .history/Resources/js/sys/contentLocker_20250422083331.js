<div id="maintenancePopup" style="display: none; position: fixed; top: 0; left: 0; 
    width: 100%; height: 100%; background: rgba(0,0,0,0.85); color: white; 
    justify-content: center; align-items: center; z-index: 9999;">
  <div style="background: #222; padding: 30px; border-radius: 12px; text-align: center;">
    <h2 id="popupTitle">Stran je trenutno v vzdrževanju</h2>
    <p id="popupMessage">Ta stran ni na voljo. Poskusite kasneje.</p>
    <button onclick="history.back()" style="margin-top: 15px; padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">V redu</button>
  </div>
</div>

  import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Mapping page filenames to Firestore fields and display names
  const pageNames = {
    "ura.html": { field: "Ura", display: "Ura" },
    "o-nas.html": { field: "oNas", display: "O nas" },
    "vsebine.html": { field: "Vsebine", display: "Vsebine" },
    "obvestila.html": { field: "Obvestila", display: "Obvestila" },
    "klepet.html": { field: "Klepet", display: "Klepet" },
    "eventi.html": { field: "eventi", display: "Eventi" },
    "kontakt.html": { field: "kontakt", display: "Kontakt" }
  };

  const path = window.location.pathname;
  const pageFile = path.substring(path.lastIndexOf("/") + 1);
  const pageInfo = pageNames[pageFile];

  const docRef = doc(db, "settings", "pageAccess");

  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Hide nav anchors if that page is locked
      Object.values(pageNames).forEach(({ field }) => {
        const anchor = document.querySelector(`a#${field}`);
        if (anchor) {
          anchor.style.display = data[field] ? "inline-block" : "none";
        }
      });

      // Show maintenance popup if current page is locked
      if (pageInfo && data[pageInfo.field] === false) {
        const popup = document.getElementById("maintenancePopup");
        const popupTitle = document.getElementById("popupTitle");
        const popupMessage = document.getElementById("popupMessage");

        popupTitle.textContent = `${pageInfo.display} je trenutno v vzdrževanju!`;
        popupMessage.textContent = `Ta stran je nedosegljiva.`;
        popup.style.display = "flex";
      }
    } else {
      console.error("No such document: settings/pageAccess");
    }
  });
