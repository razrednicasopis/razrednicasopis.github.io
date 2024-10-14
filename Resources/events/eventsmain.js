import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const db = getFirestore();

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

    const overlayText = document.createElement("span");
    overlayContent.appendChild(padlockIcon);
    overlayContent.appendChild(overlayText);
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
    if (timeLeft <= 3600000) { // Less than or equal to 1 hour in milliseconds
        countdownElement.style.color = 'red';
    } else {
        countdownElement.style.color = ''; // Reset to default
    }
}

// Function to update the event status
async function updateEventStatus() {
    const now = new Date().getTime();
    const eventsRef = collection(db, "eventSettings");
    const querySnapshot = await getDocs(eventsRef);

    let anyAvailableEvents = false; // Track if there are any available events

    querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const eventName = eventData.eventName; 
        const startTime = eventData.startTime.toMillis();
        const endTime = eventData.endTime.toMillis();

        const availableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].available`);
        const unavailableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].unavailable`);
        const eventJoinBtn = availableEventBox.querySelector('.join-event-btn'); // Adjusted to target specific button

        if (availableEventBox && unavailableEventBox) {
            if (now >= startTime && now <= endTime) {
                // Event is ongoing
                availableEventBox.style.display = "block";
                unavailableEventBox.style.display = "none"; 
                const countdownElement = availableEventBox.querySelector(".event-countdown");
                const timeLeft = endTime - now;
                countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(timeLeft)}`;
                updateCountdownColor(countdownElement, timeLeft);
                anyAvailableEvents = true; // Mark as available

                // Update countdown every second
                const interval = setInterval(() => {
                    const updatedTimeLeft = endTime - new Date().getTime();
                    if (updatedTimeLeft <= 0) {
                        clearInterval(interval);
                        countdownElement.innerHTML = "Event končan."; // Change to "Event končan."
                        eventJoinBtn.style.display = 'none'; // Hide the specific event button
                        countdownElement.style.color = 'red'; // Set text color to red

                        // Keep the event in the available section for 1 minute
                        setTimeout(() => {
                            unavailableEventBox.style.display = "block"; // Show the unavailable event box
                            availableEventBox.style.display = "none"; // Hide the available event box
                            noAvailableEventsMsg.style.display = "block"; // Show no events message
                            const overlay = createUnavailableOverlay();
                            unavailableEventBox.appendChild(overlay);
                        }, 60000); // 1 minute in milliseconds
                    } else {
                        countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(updatedTimeLeft)}`;
                        updateCountdownColor(countdownElement, updatedTimeLeft);
                    }
                }, 1000);

            } else {
                // Event is not ongoing
                availableEventBox.style.display = "none"; 
                unavailableEventBox.style.display = "block"; 
                const overlay = createUnavailableOverlay();
                unavailableEventBox.appendChild(overlay);
            }
        }
    });

    // Display no events message if no available events
    if (!anyAvailableEvents) {
        noAvailableEventsMsg.style.display = "block"; // Show the no available events message
    } else {
        noAvailableEventsMsg.style.display = "none"; // Hide the no events message if events are available
    }
}

// Call the function on page load to check event statuses
updateEventStatus();
