import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
const noAvailableEventsMessage = document.getElementById('no-available-events');

// Function to load and render events
async function loadEvents() {
    console.log('Loading events...');
    const eventSettingsSnapshot = await getDocs(collection(db, 'eventSettings'));
    console.log('Event settings snapshot size:', eventSettingsSnapshot.size);  // Check the number of documents retrieved
    console.log('Loaded event settings:', eventSettingsSnapshot.docs.map(doc => doc.data())); // Log the event data
    let availableEventCount = 0; // Track number of available events

    // Render all events into the UI, regardless of their availability
    eventSettingsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        const title = eventData.title;
        const startTime = eventData.startTime.toDate();
        const endTime = eventData.endTime.toDate();
        console.log('Processing event:', eventData.title, 'Start time:', startTime, 'End time:', endTime);
        createEventBox(title, startTime, endTime, doc.id);

        // Check if the event is currently available
        if (isEventAvailable(startTime, endTime)) {
            console.log(eventData.title, 'is available');
            availableEventCount++;
        } else {
            console.log(eventData.title, 'is unavailable');
        }
    });

    // If there are available events, hide the 'no-available-events' message
    if (availableEventCount > 0) {
        noAvailableEventsMessage.style.display = 'none';
    } else {
        noAvailableEventsMessage.style.display = 'block';
    }

    // Start real-time status update
    setInterval(checkEventStatus, 1000);
}

// Helper function to check if the event is available based on start and end time
function isEventAvailable(startTime, endTime) {
    const now = new Date();
    return now >= startTime && now <= endTime;
}

// Function to create event boxes dynamically
function createEventBox(title, startTime, endTime, eventId) {
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
    eventBox.appendChild(countdownElement);

    // Add event box to the unavailable section by default
    unavailableEventsDiv.appendChild(eventBox);

    // Popup effect on hover
    eventBox.addEventListener('mouseover', () => {
        eventBox.classList.add('popup');
    });

    eventBox.addEventListener('mouseout', () => {
        eventBox.classList.remove('popup');
    });
}

// Function to check event status and update UI accordingly
async function checkEventStatus() {
    const now = Timestamp.now().toDate();
    const eventSettingsSnapshot = await getDocs(collection(db, 'eventSettings'));
    let availableEventCount = 0;

    eventSettingsSnapshot.forEach((doc) => {
        const eventData = doc.data();
        const startTime = eventData.startTime.toDate();
        const endTime = eventData.endTime.toDate();
        const eventId = doc.id;

        const eventBox = document.getElementById(eventId);
        const countdownElement = eventBox.querySelector('.event-countdown');

        // Check if the event is currently available
        if (isEventAvailable(startTime, endTime)) {
            updateCountdown(countdownElement, endTime);
            moveToAvailable(eventBox);
            availableEventCount++;
        } else {
            countdownElement.textContent = 'Event unavailable';
            moveToUnavailable(eventBox);
        }
    });

    // Update the 'no-available-events' message visibility based on available events
    if (availableEventCount > 0) {
        noAvailableEventsMessage.style.display = 'none';
    } else {
        noAvailableEventsMessage.style.display = 'block';
    }
}

// Function to move event to available section
function moveToAvailable(eventBox) {
    if (availableEventsDiv.contains(eventBox)) return; // If already in available section, skip

    availableEventsDiv.appendChild(eventBox);
    if (unavailableEventsDiv.contains(eventBox)) {
        unavailableEventsDiv.removeChild(eventBox);
    }
}

// Function to move event to unavailable section
function moveToUnavailable(eventBox) {
    if (unavailableEventsDiv.contains(eventBox)) return; // If already in unavailable section, skip

    unavailableEventsDiv.appendChild(eventBox);
    if (availableEventsDiv.contains(eventBox)) {
        availableEventsDiv.removeChild(eventBox);
    }
}

// Function to update the countdown dynamically
function updateCountdown(countdownElement, endTime) {
    const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = endTime - now;

        if (timeDiff > 0) {
            const minutes = Math.floor(timeDiff / (1000 * 60) % 60);
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            countdownElement.textContent = `${hours}h ${minutes}m remaining`;
        } else {
            // Event has ended
            clearInterval(interval);
            countdownElement.textContent = 'Event ended';
        }
    }, 1000);
}

// Initial call to load events
loadEvents();
