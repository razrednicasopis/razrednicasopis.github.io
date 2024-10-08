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

// Function to create the unavailable overlay
function createUnavailableOverlay() {
    const darkOverlay = document.createElement("div");
    darkOverlay.className = "unavailable-overlay";

    // Create a container for the padlock and text
    const overlayContent = document.createElement("div");
    overlayContent.className = "overlay-content";

    // Create the Font Awesome padlock icon
    const padlockIcon = document.createElement("i");
    padlockIcon.className = "fas fa-lock";
    padlockIcon.style.color = "red"; // Make the padlock red
    padlockIcon.style.fontSize = "32px"; // Adjust the size of the padlock icon

    // Create the text
    const overlayText = document.createElement("span");

    // Append the padlock icon and text to the overlay content
    overlayContent.appendChild(padlockIcon);
    overlayContent.appendChild(overlayText);

    // Append the overlay content to the dark overlay
    darkOverlay.appendChild(overlayContent);

    return darkOverlay;
}

// Function to handle event end
async function handleEventEnd(availableEventBox) {
    const unavailableEventBox = document.querySelector(`.event-box[data-event-name="${availableEventBox.dataset.eventName}"].unavailable`);

    // Hide the join button
    const joinButton = availableEventBox.querySelector(".join-button");
    if (joinButton) {
        joinButton.style.display = "none"; // Hide the join button
    }

    // Change the countdown text
    const countdownElement = availableEventBox.querySelector(".event-countdown");
    if (countdownElement) {
        countdownElement.innerHTML = "Event končan.";
        countdownElement.style.color = "red"; // Change text color to red
    }

    // Wait for 1 minute before moving to the unavailable section
    await new Promise(resolve => setTimeout(resolve, 60000)); // 60000 milliseconds = 1 minute

    // Hide the available event box
    availableEventBox.style.display = "none";

    // Show the unavailable event box
    unavailableEventBox.style.display = "block";

    // Create and append the unavailable overlay
    const darkOverlay = createUnavailableOverlay();
    unavailableEventBox.appendChild(darkOverlay);
}

// Function to update the event status
async function updateEventStatus() {
    const now = new Date().getTime();
    const eventsRef = collection(db, "eventSettings");
    let activeEventFound = false;
    let availableEventFound = false; // Track if at least one available event is found

    // Get all event settings from Firebase
    const querySnapshot = await getDocs(eventsRef);
    querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        const eventName = eventData.eventName; // Event name from the database
        const startTime = eventData.startTime.toMillis();
        const endTime = eventData.endTime.toMillis();

        // Select the correct event box based on eventName
        const availableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].available`);
        const unavailableEventBox = document.querySelector(`.event-box[data-event-name="${eventName}"].unavailable`);
        const countdownElement = availableEventBox?.querySelector(".event-countdown");

        if (availableEventBox && unavailableEventBox) {
            availableEventFound = true; // At least one event box exists

            if (now >= startTime && now <= endTime) {
                // Event is ongoing, show the countdown
                activeEventFound = true;
                unavailableEventBox.style.display = "none"; // Hide the unavailable event box
                const timeLeft = endTime - now;
                countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(timeLeft)}`;
                updateCountdownColor(countdownElement, timeLeft); // Update countdown color

                // Continue updating the countdown every second
                const interval = setInterval(() => {
                    const updatedTimeLeft = endTime - new Date().getTime();
                    if (updatedTimeLeft <= 0) {
                        clearInterval(interval);
                        handleEventEnd(availableEventBox); // Trigger the event end handling
                    } else {
                        countdownElement.innerHTML = `Event bo potekel čez: ${formatTime(updatedTimeLeft)}`;
                        updateCountdownColor(countdownElement, updatedTimeLeft); // Update countdown color
                    }
                }, 1000);
            } else if (now > endTime) {
                // Event has ended, check if 5 minutes have passed
                const fiveMinutesInMillis = 5 * 60 * 1000;
                if (now - endTime >= fiveMinutesInMillis) {
                    handleEventEnd(availableEventBox); // Show the unavailable event with dark overlay
                } else {
                    unavailableEventBox.style.display = "none"; // Keep unavailable box hidden until 5 minutes have passed
                    availableEventBox.style.display = "none"; // Ensure available box is hidden
                }
            }
        }
    });

    // Check if any active events were found
    if (!activeEventFound && availableEventFound) {
        // Hide all available event boxes if no active event is found
        const availableEventBoxes = document.querySelectorAll(".event-box.available");
        availableEventBoxes.forEach((box) => {
            box.style.display = "none";
        });

        // Show the message in the available section
        const messageElement = document.createElement("div");
        messageElement.className = "no-events-message";
        messageElement.innerHTML = "Ni trenutno dosegljivih eventov.";
        document.getElementById("available-container").appendChild(messageElement);
    } else if (!availableEventFound) {
        // Hide all available event boxes if no events are found
        const availableEventBoxes = document.querySelectorAll(".event-box.available");
        availableEventBoxes.forEach((box) => {
            box.style.display = "none";
        });

        // Show the message in the available section
        const messageElement = document.createElement("div");
        messageElement.className = "no-events-message";
        messageElement.innerHTML = "Ni trenutno dosegljivih eventov.";
        document.getElementById("available-container").appendChild(messageElement);
    }

    // Check for unavailable events and ensure they are displayed correctly
    const allEventBoxes = document.querySelectorAll(".event-box");
    allEventBoxes.forEach(box => {
        const eventName = box.dataset.eventName;
        const isAvailable = box.classList.contains("available");
        
        // If the current event doesn't match, show it as unavailable
        if (!activeEventFound && isAvailable) {
            box.style.display = "none"; // Hide the available event box
            const correspondingUnavailableBox = document.querySelector(`.event-box[data-event-name="${eventName}"].unavailable`);
            if (correspondingUnavailableBox) {
                correspondingUnavailableBox.style.display = "block"; // Show the unavailable event box
                // Create and append the unavailable overlay
                const darkOverlay = createUnavailableOverlay();
                correspondingUnavailableBox.appendChild(darkOverlay);
            }
        }
    });
}

// Call the function on page load to check event statuses
updateEventStatus();
