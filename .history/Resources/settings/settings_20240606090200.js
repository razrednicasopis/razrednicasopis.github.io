import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, getDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Maintenance clock

async function getNextMaintenanceDate() {
    try {
        const docRef = doc(db, 'settings', 'nextMaintenanceDate');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.date.toDate(); // assuming date is stored as a Firestore Timestamp
        } else {
            console.error('No such document!');
            return null;
        }
    } catch (error) {
        console.error('Error getting document:', error);
        return null;
    }
}

function startCountdown(targetDate) {
    const countdownElement = document.getElementById('nextMaintenance');

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            countdownElement.innerHTML = "Vzdrževanje je v teku!";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', async () => {
    const nextMaintenanceDate = await getNextMaintenanceDate();
    const countdownElement = document.getElementById('nextMaintenance');

    if (!nextMaintenanceDate) {
        countdownElement.innerHTML = "Ni podatkov o naslednjem vzdrževanju.";
    } else {
        const now = new Date().getTime();
        if (nextMaintenanceDate.getTime() <= now) {
            countdownElement.innerHTML = "Trenutno ni podatkov o naslednjem načrtovanem vzdrževanju!";
        } else {
            startCountdown(nextMaintenanceDate.getTime());
        }
    }
});


// Maintenance Popup

document.addEventListener('DOMContentLoaded', function () {
    function toggleMaintenancePopup(show) {
        const maintenancePopup = document.getElementById('maintenancePopup');
        const blurContainer = document.querySelector('.blur-container');
        if (maintenancePopup) {
            console.log('Toggling maintenance popup:', show);
            maintenancePopup.style.display = show ? 'block' : 'none';
            document.body.classList.toggle('popup-open', show);
        } else {
            console.error('maintenancePopup element not found');
        }

        if (blurContainer) {
            blurContainer.style.filter = show ? 'blur(5px)' : 'none';
        } else {
            console.error('blur-container element not found');
        }
    }

    async function checkInitialMaintenanceStatus() {
        try {
            const docRef = doc(db, 'settings', 'maintenanceMode');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log('Maintenance document data:', docSnap.data());
                const data = docSnap.data();
                if (data.maintenanceMode) {
                    console.log('Redirecting to maintenance page');
                    window.location.href = '/Resources/maintenance/popravila.html';
                } else {
                    console.log('Starting to listen for maintenance status changes');
                    listenForMaintenanceStatus();
                }
            } else {
                console.log('No such document!');
            }
        } catch (error) {
            console.error('Error getting document:', error);
        }
    }

    function listenForMaintenanceStatus() {
        const docRef = doc(db, 'settings', 'maintenanceMode');
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const maintenanceMode = data.maintenanceMode;
                console.log('Maintenance status changed:', maintenanceMode);
                toggleMaintenancePopup(maintenanceMode);
            } else {
                console.log('No such document!');
            }
        }, (error) => {
            console.error('Error getting document:', error);
        });
    }

    document.getElementById('closeMaintenancePopupBtn').addEventListener('click', function () {
        window.location.href = '/Resources/maintenance/popravila.html';
    });

    checkInitialMaintenanceStatus();
});

// Maintenance Warning

const warningIntervals = [
    120, 90, 60, 45, 30, 15, 10, 5, 4, 3, 2, 1 // in minutes
];

let warningsShown = new Set();

function showMaintenanceWarning(minutesLeft) {
    const warningDiv = document.getElementById('maintenance-warning');
    const messageP = document.getElementById('maintenance-message');

    let timeText;
    if (minutesLeft >= 60) {
        timeText = `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
    } else {
        timeText = `${minutesLeft}m`;
    }

    messageP.textContent = `OBVESTILO: Strežniki Razrednega Časopisa  ${timeText}.`;
    warningDiv.style.display = 'block';

    setTimeout(() => {
        warningDiv.style.display = 'none';
    }, 60000); // Hide after 1 minute
}

function checkMaintenance() {
    const maintenanceRef = db.collection("settings").doc("nextMaintenance");

    maintenanceRef.get().then((doc) => {
        if (doc.exists) {
            const maintenanceTime = new Date(doc.data().maintenanceStartTime).getTime(); // Assuming the field is named "maintenanceStartTime"
            const currentTime = new Date().getTime();
            const timeDiff = (maintenanceTime - currentTime) / 60000; // in minutes

            for (const interval of warningIntervals) {
                if (timeDiff <= interval && !warningsShown.has(interval)) {
                    showMaintenanceWarning(interval);
                    warningsShown.add(interval);
                }
            }
        }
    }).catch((error) => {
        console.error("Error getting maintenance settings:", error);
    });
}

// Check every minute
setInterval(checkMaintenance, 60000);

// Initial check to ensure it runs immediately on page load
checkMaintenance();