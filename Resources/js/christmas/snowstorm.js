import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase app
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

let snowflakesActive = false; // Track if snowflakes are active

// Create snowflake elements
function createSnowflakes() {
    if (snowflakesActive) return; // Prevent duplication

    // Set the active flag
    snowflakesActive = true;

    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        document.body.appendChild(snowflake);
    }
}

// Smoothly fade out and remove snowflakes
// Smoothly fade out and remove snowflakes
function fadeOutSnowflakes() {
    const snowflakes = document.querySelectorAll('.snowflake');
    snowflakes.forEach(snowflake => {
        // Add a fading-out transition
        snowflake.style.transition = 'opacity 5s ease';
        snowflake.style.opacity = '0';

        // Remove the snowflake after the transition
        setTimeout(() => {
            snowflake.remove();
        }, 2000); // Match the duration of the opacity transition
    });


    // Reset the active flag
    snowflakesActive = false;
}

// Monitor Firestore for snowstorm status
function monitorSnowstorm() {
    const snowstormRef = doc(db, 'christmasDecorations', 'snowStorm');

    // Listen for real-time updates
    onSnapshot(snowstormRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.isActive) {
                createSnowflakes(); // Start snowstorm
                console.log('A snowstorm has started! It will cease on the 25th of January, 2025.');
                console.log('Pričela se je snežna nevihta! Končana bo 25 Januarja, 2025.');
            } else {
                fadeOutSnowflakes(); // Fade out snowflakes smoothly
            }
        } else {
            console.error('Document does not exist!');
        }
    });
}

// Start monitoring snowstorm status
monitorSnowstorm();
