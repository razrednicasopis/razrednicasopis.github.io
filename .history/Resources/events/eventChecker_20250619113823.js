import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { eventUrls } from './eventurls.js'; // Import eventUrls

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


// Initialize Firebase Firestore
const db = getFirestore();

// Variable to store whether the popup is already displayed
let popupDisplayed = false; 

// Function to check if any event has ended
async function checkEventEndTime() {
    const eventsRef = collection(db, "eventSettings");
    try {
        const querySnapshot = await getDocs(eventsRef);
        const currentTime = new Date(); // Get the current time

        querySnapshot.forEach(docSnap => {
            const eventData = docSnap.data();
            const eventTitle = eventData.eventTitle; // Get event title
            const startTime = eventData.startTime.toDate(); // Get Firebase Timestamp and convert to Date
            const endTime = eventData.endTime.toDate(); // Get Firebase Timestamp and convert to Date

            // Check if the event is past the end time or before the start time
            if (currentTime >= endTime && !popupDisplayed) {
                // Check if the current URL matches the event URL
                if (eventUrls[eventTitle]) {
                    console.log("URLs for", eventTitle, eventUrls[eventTitle]);
                    if (eventUrls[eventTitle].some(url => window.location.href.includes(url))) {
                        console.log("URL match found for", eventTitle);
                        showEventEndedPopup(eventTitle); // Show popup if the event has ended and the URL matches
                        popupDisplayed = true; // Set the flag to prevent multiple popups
                        clearInterval(checkInterval); // Stop checking once a popup is displayed
                    }
                }
            } 
        });

    } catch (error) {
        console.error("Error fetching event data: ", error);
    }
}

// Function to show the event ended popup
function showEventEndedPopup(eventTitle) {
    const popupContainer = document.getElementById('eventEndedPopupContainer');
    const overlay = document.getElementById('matchmakingOverlay'); 
    const eventNameElement = document.getElementById('endedEventName');

    if (!popupContainer || !overlay || !eventNameElement) {
        console.warn('Popup elements not found in DOM!');
        return;
    }

    eventNameElement.textContent = eventTitle; 
    popupContainer.style.display = 'block'; 
    overlay.style.display = 'block'; 
}

// Add onclick function for closing the popup
const closeButton = document.getElementById('closeEventEndedPopup');
if (closeButton) {
    closeButton.onclick = function() {
        document.getElementById('eventEndedPopupContainer').style.display = 'none'; // Hide the popup
        document.getElementById('matchmakingOverlay').style.display = 'none'; // Hide the overlay
        window.location.href = "/Resources/events/eventi.html"; // Redirect to the specified URL
    };
}

// Set an interval to check the end time every second
window.addEventListener("load", () => {
    const checkInterval = setInterval(checkEventEndTime, 1000);
});
