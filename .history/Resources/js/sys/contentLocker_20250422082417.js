<div id="maintenancePopup" style="display: none; position: fixed; top: 0; left: 0; 
    width: 100%; height: 100%; background: rgba(0,0,0,0.85); color: white; 
    display: flex; justify-content: center; align-items: center; z-index: 9999;">
  <div style="background: #222; padding: 30px; border-radius: 12px; text-align: center;">
    <h2>Stran je trenutno v vzdrževanju</h2>
    <p>Ta stran ni na voljo. Poskusite kasneje.</p>
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


  // Mapping page filenames to Firestore field names
  const pageNames = {
    "ura.html": "Ura",
    "o-nas.html": "oNas",
    "vsebine.html": "Vsebine",
    "obvestila.html": "Obvestila",
    "klepet.html": "Klepet",
    "eventi.html": "Eventi",
    "kontakt.html": "Kontakt"
  };

  // Get current page name (e.g., "ura.html")
  const path = window.location.pathname;
  const pageFile = path.substring(path.lastIndexOf("/") + 1);
  const pageKey = pageNames[pageFile];

  const docRef = doc(db, "settings", "pageAccess");

  onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();

      // Loop through each known key (anchor ID) and toggle visibility
      Object.entries(pageNames).forEach(([filename, key]) => {
        const anchor = document.querySelector(`a#${key}`);
        if (anchor) {
          anchor.style.display = data[key] ? "inline-block" : "none";
        }
      });

      // Show maintenance popup if current page is disabled
      if (pageKey && data[pageKey] === false) {
        document.getElementById("maintenancePopup").style.display = "flex";
      }
    } else {
      console.error("No such document: settings/pageAccess");
    }
  });
