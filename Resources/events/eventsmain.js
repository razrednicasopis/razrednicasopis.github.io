import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Event section divs
const availableEventsDiv = document.getElementById('available-container');
const unavailableEventsDiv = document.getElementById('unavailable-container');

// Function to check event availability based on current time
async function checkEventAvailability() {
    const now = Timestamp.now().toDate();  // Get the current time

    // Get all event documents from the eventSettings collection
    const eventSettingsSnapshot = await getDocs(collection(db, 'eventSettings'));

    let availableCount = 0;

    // Loop through each event document
    eventSettingsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();  // Start time of the event
        const endTime = eventData.endTime.toDate();      // End time of the event
        const title = eventData.title;                   // Event title

        // Determine if the event is currently active
        if (now >= startTime && now <= endTime) {
            // Event is available
            availableCount++;
            createEventBox(title, startTime, endTime, true, doc.id);
        } else {
            // Event is unavailable
            createEventBox(title, startTime, endTime, false, doc.id);
        }
    });

    // If no events are available, show the "No currently available events" message
    if (availableCount === 0) {
        const noAvailableEventsMessage = document.createElement('p');
        noAvailableEventsMessage.textContent = "No currently available events.";
        availableEventsDiv.appendChild(noAvailableEventsMessage);
    }
}

// Function to create event boxes dynamically
function createEventBox(title, startTime, endTime, isAvailable, eventId) {
    const eventBox = document.createElement('div');
    eventBox.classList.add('event-box');
    eventBox.setAttribute('id', eventId);

    // Event title
    const titleElement = document.createElement('span');
    titleElement.classList.add('event-title');
    titleElement.textContent = title;
    eventBox.appendChild(titleElement);

    // Countdown or event unavailable status
    const countdownElement = document.createElement('span');
    countdownElement.classList.add('event-countdown');

    if (isAvailable) {
        // Available event countdown
        updateCountdown(countdownElement, endTime, eventId);
        const joinButton = document.createElement('button');
        joinButton.textContent = 'Join event';
        joinButton.classList.add('join-button');
        eventBox.appendChild(joinButton);
        
        // Append to available events
        availableEventsDiv.appendChild(eventBox);
    } else {
        // Unavailable event overlay
        const unavailableOverlay = document.createElement('div');
        unavailableOverlay.classList.add('unavailable-overlay');
        unavailableOverlay.textContent = 'Event unavailable';
        eventBox.appendChild(unavailableOverlay);
        
        // Append to unavailable events
        unavailableEventsDiv.appendChild(eventBox);
    }

    // Append countdown to the event box
    eventBox.appendChild(countdownElement);

    // Popup effect on hover
    eventBox.addEventListener('mouseover', () => {
        eventBox.classList.add('popup');
    });

    eventBox.addEventListener('mouseout', () => {
        eventBox.classList.remove('popup');
    });
}

// Function to update the countdown dynamically
function updateCountdown(countdownElement, endTime, eventId) {
    const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = endTime - now;

        if (timeDiff > 0) {
            const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            countdownElement.textContent = `${hours}h ${minutes}m remaining`;
        } else {
            // Event has ended
            clearInterval(interval);
            countdownElement.textContent = 'Event ended';

            // After 5 minutes, mark as unavailable
            setTimeout(() => {
                markEventAsUnavailable(eventId);
            }, 5 * 60 * 1000); // 5 minutes delay
        }
    }, 1000);
}

// Mark an event as unavailable after it ends
function markEventAsUnavailable(eventId) {
    const eventBox = document.getElementById(eventId);

    if (eventBox) {
        // Remove the countdown and join button
        eventBox.querySelector('.event-countdown').remove();
        const joinButton = eventBox.querySelector('.join-button');
        if (joinButton) joinButton.remove();

        // Add overlay and padlock
        const unavailableOverlay = document.createElement('div');
        unavailableOverlay.classList.add('unavailable-overlay');
        unavailableOverlay.innerHTML = `<span class="padlock">🔒</span> <span>Event unavailable</span>`;
        eventBox.appendChild(unavailableOverlay);

        // Move the event box to the unavailable section
        unavailableEventsDiv.appendChild(eventBox);
        availableEventsDiv.removeChild(eventBox);
    }
}

// Initial call to check event availability
checkEventAvailability();
