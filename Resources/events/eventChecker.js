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
            const isPermanent = eventData.isPermanent === true;
            const isReleased = eventData.isReleased === true;

            // Skip if popup already shown
            if (popupDisplayed) return;

            // === RULES ===

            // 1. If not released → always show popup
            if (!isReleased) {
                if (eventUrls[eventTitle]?.some(url => window.location.href.includes(url))) {
                    logEvent(eventTitle, "unreleased");
                    showEventEndedPopup(eventTitle, "unreleased");
                    popupDisplayed = true;
                    clearInterval(checkInterval);
                }
                return;
            }

            // 2. If permanent & released → never show popup
            if (isPermanent && isReleased) {
                return;
            }

            // 3. If released, not permanent, but NOT STARTED YET → show popup
            if (!isPermanent && currentTime < startTime) {
                if (eventUrls[eventTitle]?.some(url => window.location.href.includes(url))) {
                    logEvent(eventTitle, "notStarted");
                    showEventEndedPopup(eventTitle, "notStarted");
                    popupDisplayed = true;
                    clearInterval(checkInterval);
                }
                return;
            }

            // 4. If released, not permanent, and already ended → show popup
            if (!isPermanent && currentTime >= endTime) {
                if (eventUrls[eventTitle]?.some(url => window.location.href.includes(url))) {
                    logEvent(eventTitle, "ended");
                    showEventEndedPopup(eventTitle, "ended");
                    popupDisplayed = true;
                    clearInterval(checkInterval);
                }
            }

            // 5. Ongoing (between start/end) → do nothing
        });

    } catch (error) {
        console.error("Error fetching event data:", error);
    }
}

function logEvent(eventTitle, reason) {
    if (!hasLogged[eventTitle]) {
        console.log(`Popup triggered for "${eventTitle}" (reason: ${reason}) → URLs:`, eventUrls[eventTitle]);
        hasLogged[eventTitle] = true;
    }
}

function showEventEndedPopup(eventTitle, reason) {
    const popupContainer = document.getElementById('eventEndedPopupContainer');
    const overlay = document.getElementById('matchmakingOverlay'); 
    const eventNameElement = document.getElementById('endedEventName');
    const popupText = popupContainer?.querySelector("p");

    if (!popupContainer || !overlay || !eventNameElement) {
        console.warn('Popup elements not found in DOM!');
        return;
    }

    eventNameElement.textContent = eventTitle;

    // Change text depending on reason
    if (popupText) {
        if (reason === "unreleased") {
            popupText.innerHTML = `Event <strong>${eventTitle}</strong> še ni bil objavljen.`;
        } else if (reason === "notStarted") {
            popupText.innerHTML = `Event <strong>${eventTitle}</strong> se še ni začel.`;
        } else if (reason === "ended") {
            popupText.innerHTML = `Event <strong>${eventTitle}</strong> se je končal.`;
        }
    }

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
