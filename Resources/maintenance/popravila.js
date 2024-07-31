import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {
    const maintenanceDocRef = doc(db, 'settings', 'maintenanceMode');
    const nextMaintenanceDocRef = doc(db, 'settings', 'nextMaintenance');

    async function fetchMaintenanceSettings() {
        try {
            const maintenanceDoc = await getDoc(maintenanceDocRef);
            const nextMaintenanceDoc = await getDoc(nextMaintenanceDocRef);

            if (maintenanceDoc.exists() && nextMaintenanceDoc.exists()) {
                const maintenanceData = maintenanceDoc.data();
                const nextMaintenanceData = nextMaintenanceDoc.data();

                const countdownElement = document.getElementById('countdown');
                const maintenanceObvestiloElement = document.getElementById("maintenanceobvestilo");

                if (maintenanceData.maintenanceMode) {
                    const startTime = new Date(nextMaintenanceData.maintenanceStartTime.seconds * 1000);
                    const endTime = new Date(maintenanceData.maintenanceEndTime.seconds * 1000);

                    showCountdown(startTime, endTime);
                } else {
                    maintenanceObvestiloElement.innerHTML = "Trenutno ne poteka vzdrževanje. Dostop do strani bo kmalu omogočen.";
                    if (countdownElement) countdownElement.style.display = 'none'; // Hide countdown
                }
            } else {
                console.error("Maintenance settings not found");
            }
        } catch (error) {
            console.error("Error fetching maintenance settings:", error);
        }
    }

    function showCountdown(startTime, endTime) {
        const now = new Date().getTime();
        const distance = endTime.getTime() - now;

        if (distance <= 0) {
            const maintenanceObvestiloElement = document.getElementById("maintenanceobvestilo");
            if (maintenanceObvestiloElement) {
                maintenanceObvestiloElement.innerHTML = "Trenutno ne poteka vzdrževanje! <p>Dostop do strani bo kmalu omogočen.</p>";
                const countdownElement = document.getElementById('countdown');
                if (countdownElement) countdownElement.style.display = 'none'; // Hide countdown
            }
            return;
        }

        const countdown = setInterval(function () {
            const now = new Date().getTime();
            const distance = endTime.getTime() - now;

            if (distance <= 0) {
                clearInterval(countdown);
                const maintenanceObvestiloElement = document.getElementById("maintenanceobvestilo");
                if (maintenanceObvestiloElement) {
                    maintenanceObvestiloElement.innerHTML = "Trenutno ne poteka vzdrževanje! <p>Dostop do strani bo kmalu omogočen.</p>";
                    const countdownElement = document.getElementById('countdown');
                    if (countdownElement) countdownElement.style.display = 'none'; // Hide countdown
                }
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const countdownElement = document.getElementById('countdown');
            if (countdownElement) countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }, 1000);
    }

    fetchMaintenanceSettings();
});
