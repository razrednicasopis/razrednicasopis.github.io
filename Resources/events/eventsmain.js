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
  
  // Function to update the event status
  async function updateEventStatus() {
    const now = new Date().getTime();
    const eventsRef = collection(db, "eventSettings");
  
    // Get all event settings from Firebase
    const querySnapshot = await getDocs(eventsRef);
    querySnapshot.forEach((doc) => {
      const eventData = doc.data();
      const eventName = eventData.eventName; // Add the event name to the database
      const startTime = eventData.startTime.toMillis();
      const endTime = eventData.endTime.toMillis();
  
      // Select the correct event box based on eventName
      const eventBox = document.querySelector(`.event-box[data-event-name="${eventName}"]`);
      const countdownElement = eventBox.querySelector(".event-countdown");
      const joinButton = eventBox.querySelector(".join-event-btn");
  
      if (now >= startTime && now <= endTime) {
        // Event is ongoing, show the countdown
        const timeLeft = endTime - now;
        countdownElement.innerHTML = formatTime(timeLeft);
        
        // Continue updating the countdown every second
        const interval = setInterval(() => {
          const updatedTimeLeft = endTime - new Date().getTime();
          if (updatedTimeLeft <= 0) {
            clearInterval(interval);
            countdownElement.remove();
            joinButton.replaceWith(document.createTextNode("Event je končan"));
  
            // Apply the dark overlay and stop hover effect
            eventBox.classList.add("unavailable-overlay");
            eventBox.style.pointerEvents = "none";
          } else {
            countdownElement.innerHTML = formatTime(updatedTimeLeft);
          }
        }, 1000);
      } else {
        // Event has ended or not started yet, mark as unavailable
        countdownElement.remove();
        joinButton.replaceWith(document.createTextNode("Event je končan"));
  
        // Apply the dark overlay and stop hover effect
        eventBox.classList.add("unavailable-overlay");
        eventBox.style.pointerEvents = "none";
      }
    });
  }
  
  // Call the function on page load to check event statuses
  updateEventStatus();
