import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
    let maintenanceNotified = false;

    // Local state to cache the maintenance data
    let cachedMaintenanceMode = null;
    let cachedMaintenanceEndTime = null;

    // Cache for checking the maintenance status
    let lastChecked = 0;

    // Optimized check for maintenance status with debounce
    async function checkMaintenanceStatus() {
        const now = Date.now();
        if (now - lastChecked < 60000) return; // Avoid checking more than once every minute

        try {
            const maintenanceRef = doc(db, 'settings', 'maintenanceMode');
            const nextMaintenanceRef = doc(db, 'settings', 'nextMaintenance');

            // Fetch both documents in parallel
            const [maintenanceSnap, nextMaintenanceSnap] = await Promise.all([
                getDoc(maintenanceRef),
                getDoc(nextMaintenanceRef)
            ]);

            if (maintenanceSnap.exists() && nextMaintenanceSnap.exists()) {
                const maintenanceData = maintenanceSnap.data();
                const nextMaintenanceData = nextMaintenanceSnap.data();

                const maintenanceStartTime = nextMaintenanceData.maintenanceStartTime.toDate();
                const maintenanceEndTime = maintenanceData.maintenanceEndTime.toDate();
                const manualOverride = maintenanceData.manualOverride || false;

                // If the status has changed, update the UI
                if (cachedMaintenanceMode !== maintenanceData.maintenanceMode || cachedMaintenanceEndTime !== maintenanceEndTime) {
                    cachedMaintenanceMode = maintenanceData.maintenanceMode;
                    cachedMaintenanceEndTime = maintenanceEndTime;

                    if (!manualOverride) {
                        const now = new Date();
                        if (now >= maintenanceStartTime && now <= maintenanceEndTime) {
                            if (!maintenanceNotified) {
                                notifyMaintenanceStart(maintenanceEndTime);
                                maintenanceNotified = true;
                            }
                            toggleMaintenancePopup(true, formatEndTime(maintenanceEndTime));
                        } else {
                            if (maintenanceNotified) {
                                maintenanceNotified = false;
                            }
                            toggleMaintenancePopup(false);
                        }
                    }
                }
            } else {
                console.log('One or both documents are missing.');
            }

            lastChecked = now;
        } catch (error) {
            console.error('Error checking maintenance status:', error);
        }
    }

    function listenForMaintenanceUpdates() {
    const maintenanceRef = doc(db, 'settings', 'maintenanceMode');
    const nextMaintenanceRef = doc(db, 'settings', 'nextMaintenance');

    let maintenanceStartTime = null;
    let maintenanceEndTime = null;

    // Fetch and cache start/end times initially
    getDoc(nextMaintenanceRef).then((snap) => {
        if (snap.exists()) {
            maintenanceStartTime = snap.data().maintenanceStartTime.toDate();
        }
    });

    // Listen for changes in maintenanceMode
    onSnapshot(maintenanceRef, async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const maintenanceMode = data.maintenanceMode;
        const autoMaintenance = data.autoMaintenance || false;
        maintenanceEndTime = data.maintenanceEndTime?.toDate();

        const now = new Date();

        let shouldShowMaintenance = false;

        if (autoMaintenance) {
            // Fetch latest start time in case it changed
            const nextMaintenanceSnap = await getDoc(nextMaintenanceRef);
            if (nextMaintenanceSnap.exists()) {
                maintenanceStartTime = nextMaintenanceSnap.data().maintenanceStartTime.toDate();
            }

            // If we're inside the maintenance window, enable it
            if (maintenanceStartTime && maintenanceEndTime) {
                if (now >= maintenanceStartTime && now <= maintenanceEndTime) {
                    shouldShowMaintenance = true;
                }
            }

            // If manual override is still true, force maintenance on
            if (maintenanceMode) {
                shouldShowMaintenance = true;
            }
        } else {
            // No auto maintenance – just follow manual switch
            shouldShowMaintenance = maintenanceMode;
        }

        // Update popup visibility
        toggleMaintenancePopup(shouldShowMaintenance, formatEndTime(maintenanceEndTime));

        // Optional: notify once
        if (shouldShowMaintenance && !maintenanceNotified) {
            notifyMaintenanceStart(maintenanceEndTime);
            maintenanceNotified = true;
        }

        if (!shouldShowMaintenance && maintenanceNotified) {
            maintenanceNotified = false;
        }
    });
}


    function toggleMaintenancePopup(show, endTime) {
        const maintenancePopup = document.getElementById('maintenancePopup');
        const endTimeP = document.getElementById('maintenanceEndTime');
        const overlay = document.querySelector('.overlay');
        if (maintenancePopup) {
            maintenancePopup.style.display = show ? 'block' : 'none';
            overlay.style.display = show ? 'block' : 'none';
            document.body.style.overflow = show ? 'hidden' : '';
            if (show && endTime && endTimeP) {
                endTimeP.textContent = endTime;
            }
        } else {
            console.error('maintenancePopup element not found');
        }
    }

    function formatEndTime(endTime) {
        if (!endTime) return '';
        return new Date(endTime).toLocaleString('sl-SI', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(/\.\s?/g, '/').replace('dop', '');
    }

    function notifyMaintenanceStart(endTime) {
        const formattedEndTime = formatEndTime(endTime);
        console.log(`The servers are currently down for maintenance until ${formattedEndTime}. Please come back later.`);
    }

    document.getElementById('closeMaintenancePopupBtn').addEventListener('click', function () {
        window.location.href = '/Resources/maintenance/popravila.html';
    });

    // Initial call to check maintenance status
    checkMaintenanceStatus();
    listenForMaintenanceUpdates();
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

    messageP.textContent = `OBVESTILO: Strežniki Razrednega Časopisa bodo čez ${timeText} nedosegljivi zaradi vzdrževanja. Prosimo načrtujte uporabo strani v skladu s tem. `;
    warningDiv.style.display = 'block';

    // Set a timeout to hide the warning once the text has fully scrolled through the left side of the screen
    const animationDuration = 10 * 1500; // 10 seconds
    setTimeout(() => {
        warningDiv.style.display = 'none';
    }, animationDuration);
}

async function checkMaintenance() {
    const maintenanceRef = doc(collection(db, "settings"), "nextMaintenance");

    try {
        const docSnap = await getDoc(maintenanceRef);
        if (docSnap.exists()) {
            const maintenanceTimestamp = docSnap.data().maintenanceStartTime;
            console.log("Maintenance start time:", maintenanceTimestamp);

            // Check if maintenanceTimestamp is null or undefined
            if (!maintenanceTimestamp) {
                console.error("Maintenance start time is null or undefined.");
                return;
            }

            const maintenanceTime = maintenanceTimestamp.toDate().getTime();
            console.log("Maintenance time (milliseconds):", maintenanceTime);
            const currentTime = new Date().getTime();
            console.log("Current time (milliseconds):", currentTime);

            // Check if maintenanceTime is a valid number
            if (isNaN(maintenanceTime)) {
                console.error("Maintenance time is not a valid number.");
                return;
            }

            // Check if the maintenance time is in the past
            if (maintenanceTime <= currentTime) {
                console.log("Maintenance time is in the past. No warnings will be shown.");
                return;
            }

            const timeDiff = (maintenanceTime - currentTime) / 60000; // in minutes
            console.log("Time difference (minutes):", timeDiff);

            for (const interval of warningIntervals) {
                if (timeDiff <= interval && !warningsShown.has(interval)) {
                    showMaintenanceWarning(interval);
                    warningsShown.add(interval);
                }
            }
        } else {
            console.error("No such document!");
        }
    } catch (error) {
        console.error("Error getting maintenance settings:", error);
    }
}

// Check every minute
setInterval(checkMaintenance, 60000);

// Initial check to ensure it runs immediately on page load
checkMaintenance();
