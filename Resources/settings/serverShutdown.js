import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

function monitorShutdownStatus() {
  const shutdownRef = doc(db, "settings", "shutdown");

  onSnapshot(shutdownRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.isShutdown === true) {
        triggerShutdownSequence();
      }
    }
  }, (error) => {
    console.error("Snapshot error:", error);
  });
}

function triggerShutdownSequence() {
  if (document.getElementById("shutdownOverlay")) return;

  // Overlay
  const overlay = document.createElement("div");
  overlay.id = "shutdownOverlay";
  Object.assign(overlay.style, {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.92)", zIndex: 9998,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
  });
  document.body.appendChild(overlay);

  // Spinner
  const spinner = document.createElement("div");
  spinner.id = "shutdownSpinner";
  Object.assign(spinner.style, {
    width: "60px", height: "60px", border: "8px solid #eee",
    borderTop: "8px solid #ff6f61", borderRadius: "50%",
    animation: "spin 1.2s linear infinite", marginBottom: "20px"
  });

  // Loading text
  const loadingText = document.createElement("div");
  loadingText.innerText = "Povezovanje s strežnikom...";
  Object.assign(loadingText.style, {
    color: "white", fontSize: "16px", fontWeight: "500"
  });

  overlay.appendChild(spinner);
  overlay.appendChild(loadingText);

  // Spinner animation
  const style = document.createElement("style");
  style.textContent = `@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`;
  document.head.appendChild(style);

  // Simulate delay, then show popup
  setTimeout(() => {
    overlay.style.transition = "opacity 0.3s";
    overlay.style.opacity = 0;

    setTimeout(() => {
      overlay.remove();
      showShutdownPopup();
    }, 300);
  }, 3500);
}

function showShutdownPopup() {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.92)", zIndex: 9998
  });
  document.body.appendChild(overlay);

  const popup = document.createElement("div");
  popup.id = "shutdownPopup";
  Object.assign(popup.style, {
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
    backgroundColor: "#fff", padding: "30px 25px", borderRadius: "12px",
    boxShadow: "0 0 20px rgba(0,0,0,0.3)", zIndex: 10000,
    textAlign: "center", maxWidth: "400px", width: "90%"
  });

  popup.innerHTML = `
<h2 style="margin-bottom: 15px; font-size: 25px; line-height: 1.4;">
  <b><span style="margin-right: -15px;">📡Povezava z&nbsp;<span>strežnikom izgubljena</b>
</h2>
    <p style="margin-bottom: 30px; line-height: 1.8; font-size: 15px;">
      Strežniki <b>Razrednega Časopisa</b> so bili zaustavljeni.<br>
      Hvala za vso vašo podporo, sodelovanje in soustvarjanje izjemne zgodbe 💙
    </p>
    <button style="
      padding: 10px 22px; background: #3498db; color: white;
      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;
    " onclick="location.href='/Resources/thankyou.html'">Nadaljuj</button>
  `;

  document.body.appendChild(popup);
}

window.addEventListener("load", () => {
  monitorShutdownStatus();
});
