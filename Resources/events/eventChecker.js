import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { eventUrls } from './eventurls.js'; // Import eventUrls

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore();

// Track popups & logs
let popupDisplayed = false;
let hasLogged = {}; // stores per event title

async function checkEventEndTime() {
    const eventsRef = collection(db, "eventSettings");

    try {
        const querySnapshot = await getDocs(eventsRef);
        const currentTime = new Date();

        querySnapshot.forEach(docSnap => {
            const eventData = docSnap.data();
            const eventTitle = eventData.eventTitle;
            const startTime = eventData.startTime.toDate();
            const endTime = eventData.endTime.toDate();

            // Only check non-permanent events that ended
            if (!eventData.isPermanent && currentTime >= endTime && !popupDisplayed) {
                if (eventUrls[eventTitle]) {

                    // Log once per event
                    if (!hasLogged[eventTitle]) {
                        console.log(`Checking event URLs for "${eventTitle}":`, eventUrls[eventTitle]);
                        hasLogged[eventTitle] = true;
                    }

                    if (eventUrls[eventTitle].some(url => window.location.href.includes(url))) {
                        console.log(`URL match found for "${eventTitle}"`);
                        showEventEndedPopup(eventTitle);
                        popupDisplayed = true;
                        clearInterval(checkInterval); // stop checking after showing popup
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error fetching event data:", error);
    }
}

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

// Close popup
const closeButton = document.getElementById('closeEventEndedPopup');
if (closeButton) {
    closeButton.onclick = () => {
        document.getElementById('eventEndedPopupContainer').style.display = 'none';
        document.getElementById('matchmakingOverlay').style.display = 'none';
        window.location.href = "/Resources/events/eventi.html";
    };
}

// Constantly check, but logs only once per event
let checkInterval;
window.addEventListener("load", () => {
    checkInterval = setInterval(checkEventEndTime, 1000);
});
