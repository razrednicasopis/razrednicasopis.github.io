import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};


const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore();

// No events notification element
const noAvailableEventsMsg = document.getElementById('noEventsNotif');

// Function to create the unavailable overlay
function createUnavailableOverlay() {
    const darkOverlay = document.createElement("div");
    darkOverlay.className = "unavailable-overlay";

    const overlayContent = document.createElement("div");
    overlayContent.className = "overlay-content";

    const padlockIcon = document.createElement("i");
    padlockIcon.className = "fas fa-lock"; 
    padlockIcon.style.color = "red"; 
    padlockIcon.style.fontSize = "32px";
    padlockIcon.style.marginBottom = "5px"; 

    overlayContent.appendChild(padlockIcon);
    darkOverlay.appendChild(overlayContent);

    return darkOverlay;
}

// Function to format the countdown time dynamically
function formatTime(timeLeft) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m ${seconds}s`;
    }
}

// Function to update the countdown color
function updateCountdownColor(countdownElement, timeLeft) {
    countdownElement.style.color = timeLeft <= 3600000 ? 'red' : ''; // Red if less than 1 hour
}

// Function to update the event status
async function updateEventStatus() {
    const now = new Date().getTime();
    const eventsRef = collection(db, "eventSettings");
    const querySnapshot = await getDocs(eventsRef);

    let anyAvailableEvents = false;

    querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const eventName = eventData.eventName;
        const startTime = eventData.startTime.toMillis();
        const endTime = eventData.endTime.toMillis();

        const availableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].available`);
        const unavailableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].unavailable`);

        if (availableEventBox && unavailableEventBox) {
            if (now >= startTime && now <= endTime) {
                // Event is ongoing
                availableEventBox.style.display = "block";
                unavailableEventBox.style.display = "none";

                // Countdown display logic
                const countdownElement = availableEventBox.querySelector(".event-countdown");
                const timeLeft = endTime - now;
                countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(timeLeft)}`;
                updateCountdownColor(countdownElement, timeLeft);
                anyAvailableEvents = true;

                // Update countdown every second
                const interval = setInterval(() => {
                    const updatedTimeLeft = endTime - new Date().getTime();
                    if (updatedTimeLeft <= 0) {
                        clearInterval(interval);
                        countdownElement.innerHTML = "Event je končan.";
                        availableEventBox.querySelector(".join-event-btn").style.display = "none";

                        // Wait for 1 minute before hiding the event and moving it to unavailable section
                        setTimeout(() => {
                            availableEventBox.style.display = "none";
                            unavailableEventBox.style.display = "block";
                            if (!unavailableEventBox.querySelector(".unavailable-overlay")) {
                                const overlay = createUnavailableOverlay();
                                unavailableEventBox.appendChild(overlay);
                            }
                        }, 60000);  // Wait 1 minute (60,000 milliseconds)

                    } else {
                        countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(updatedTimeLeft)}`;
                        updateCountdownColor(countdownElement, updatedTimeLeft);
                    }
                }, 1000);

            } else {
                // Event is not ongoing
                availableEventBox.style.display = "none";
                unavailableEventBox.style.display = "block";

                if (!unavailableEventBox.querySelector(".unavailable-overlay")) {
                    const overlay = createUnavailableOverlay();
                    unavailableEventBox.appendChild(overlay);
                }
            }
        }
    });

    // If no available events, display message
    noAvailableEventsMsg.style.display = anyAvailableEvents ? "none" : "block";
}

// Firebase `onSnapshot` listener to monitor changes in event data
function listenForEventChanges() {
    const eventsRef = collection(db, "eventSettings");

    onSnapshot(eventsRef, async (snapshot) => {
        let anyAvailableEvents = false;

        snapshot.forEach((doc) => {
            const eventData = doc.data();
            const eventName = eventData.eventName;
            const startTime = eventData.startTime.toMillis();
            const endTime = eventData.endTime.toMillis();

            const availableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].available`);
            const unavailableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].unavailable`);

            if (availableEventBox && unavailableEventBox) {
                if (new Date().getTime() >= startTime && new Date().getTime() <= endTime) {
                    availableEventBox.style.display = "block";
                    unavailableEventBox.style.display = "none";
                    anyAvailableEvents = true;
                } else {
                    availableEventBox.style.display = "none";
                    unavailableEventBox.style.display = "block";
                    if (!unavailableEventBox.querySelector(".unavailable-overlay")) {
                        const overlay = createUnavailableOverlay();
                        unavailableEventBox.appendChild(overlay);
                    }
                }
            }
        });

        // If no available events, show the notification
        noAvailableEventsMsg.style.display = anyAvailableEvents ? "none" : "block";
    });
}

// Call the function on page load to check event statuses
updateEventStatus();

// Start listening for event changes in real-time
listenForEventChanges();
