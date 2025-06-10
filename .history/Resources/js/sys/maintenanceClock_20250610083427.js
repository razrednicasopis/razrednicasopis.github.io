// Firebase SDK imports
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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


const settingsDoc = doc(db, 'settings', 'nextMaintenance');
const maintenanceDoc = doc(db, 'settings', 'maintenanceMode');

async function fetchMaintenanceData() {
  const [settingsSnap, maintenanceSnap] = await Promise.all([
    getDoc(settingsDoc),
    getDoc(maintenanceDoc)
  ]);

  if (!settingsSnap.exists() || !maintenanceSnap.exists()) {
    showNoDataMessage();
    return;
  }

  const startTime = settingsSnap.data().maintenanceStartTime?.toDate?.();
  const maintenanceMode = maintenanceSnap.data().maintenanceMode;

  if (!startTime) {
    showNoDataMessage();
    return;
  }

  const now = new Date();

  if (startTime < now) {
    if (maintenanceMode) {
      showActiveMaintenanceMessage();
    } else {
      showUpcomingMaintenanceWarning();
    }
  } else {
    startCountdown(startTime, maintenanceMode);
  }
}
