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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Colors for lights
const lightColors = ["orange", "yellow", "red", "blue", "green"];

// Create Christmas lights setup
function createChristmasLights() {
    // Create container
    const lightsContainer = document.createElement('div');
    lightsContainer.classList.add('christmas-lights');

    // Add the wire
    const wire = document.createElement('div');
    wire.classList.add('wire');

    // Add wire pieces (sideways C shapes) to the wire
    for (let i = 0; i < 10; i++) { // Adjust number of pieces as needed
        const wirePiece = document.createElement('div');
        wirePiece.classList.add('wire-piece');
        wire.appendChild(wirePiece);
    }

    // Add the wire with lights
    lightsContainer.appendChild(wire);

    // Add random lights along the wire
    for (let i = 0; i < 20; i++) { // Adjust number of lights as needed
        const light = document.createElement('div');
        light.classList.add('light');
        light.style.left = `${(i / 20) * 100}%`; // Evenly space the lights
        wire.appendChild(light);
    }

    document.body.appendChild(lightsContainer);
}

// Remove Christmas lights setup
function removeChristmasLights() {
    const lightsContainer = document.querySelector('.christmas-lights');
    if (lightsContainer) {
        lightsContainer.remove();
    }
}

// Animate lights
function animateLights() {
    const lights = document.querySelectorAll('.light');

    setInterval(() => {
        // Pick a random light
        const randomLight = lights[Math.floor(Math.random() * lights.length)];

        // Turn it on with a random color
        const randomColor = lightColors[Math.floor(Math.random() * lightColors.length)];
        randomLight.style.backgroundColor = randomColor;
        randomLight.style.boxShadow = `0 0 15px ${randomColor}`;
        randomLight.classList.add('on');

        // Turn it off after a random duration
        setTimeout(() => {
            randomLight.style.backgroundColor = 'transparent';
            randomLight.style.boxShadow = 'none';
            randomLight.classList.remove('on');
        }, Math.random() * 2000 + 500); // Random duration between 0.5s and 2.5s
    }, 500); // Adjust frequency of light changes
}

// Monitor Firestore for Christmas lights status
function monitorChristmasLights() {
    const lightsRef = doc(db, 'christmasDecorations', 'christmasLights');

    // Listen for real-time updates
    onSnapshot(lightsRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.isActive) {
                // Create lights and start animation
                createChristmasLights();
                animateLights();
            } else {
                // Remove lights
                removeChristmasLights();
            }
        } else {
            console.error('Document does not exist!');
        }
    });
}

// Start monitoring Christmas lights status
monitorChristmasLights();
