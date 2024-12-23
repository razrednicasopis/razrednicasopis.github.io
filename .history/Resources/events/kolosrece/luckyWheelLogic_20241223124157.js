// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Check User Data on Page Load
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        const userEventRef = doc(db, "lbEventData", userId);
        const userSnapshot = await getDoc(userEventRef);

        if (!userSnapshot.exists()) {
            await setDoc(userEventRef, { free_spins: 1, tokens: 0 });
        }

        const userData = userSnapshot.data();
        if (userData.free_spins <= 0) {
            displayCountdownUntilNextSpin();
        }
    }
});

// Handle Spin Button Click
document.getElementById("spinButton").addEventListener("click", async () => {
    const user = auth.currentUser;

    if (!user) {
        alert("Prosimo, prijavite se za uporabo funkcije vrtenja kolesa!");
        return;
    }

    const userId = user.uid;
    const userEventRef = doc(db, "lbEventData", userId);
    const userSnapshot = await getDoc(userEventRef);

    if (!userSnapshot.exists()) {
        await setDoc(userEventRef, { free_spins: 1, tokens: 0 });
    }

    const userData = userSnapshot.data();

    if (userData.free_spins > 0) {
        startSpinAnimation(userEventRef);
    } else {
        displayCountdownUntilNextSpin();
    }
});

async function startSpinAnimation(userEventRef) {
    const wheel = document.getElementById("wheel");
    const sectors = [
        { color: "#f82", label: "10" },
        { color: "#0bf", label: "20" },
        { color: "#fb0", label: "30" },
        { color: "#0fb", label: "40" },
        { color: "#b0f", label: "50" },
        { color: "#f0b", label: "60" },
        { color: "#bf0", label: "70" },
        { color: "#0f0", label: "80" }
    ];

    const totalSectors = sectors.length;
    const sectorAngle = 360 / totalSectors;

    // Generate a random sector
    const randomIndex = Math.floor(Math.random() * totalSectors);

    // Calculate the exact angle to stop at the center of the sector
    const targetAngle = randomIndex * sectorAngle + sectorAngle / 2;

    // Add extra rotations for the spinning effect
    const fullRotations = 5; // Number of full spins
    const spinDegrees = 360 * fullRotations + targetAngle;

    // Apply the CSS transformation to the wheel
    wheel.style.transition = "transform 3s ease-out"; // Faster spin, smooth stop
    wheel.style.transform = `rotate(${spinDegrees}deg)`;

    // Disable the spin button during the spin
    document.getElementById("spinButton").disabled = true;

    setTimeout(async () => {
        // Determine the reward
        const reward = parseInt(sectors[randomIndex].label, 10);

        // Update Firestore with the reward and decrement free spins
        await updateDoc(userEventRef, {
            tokens: increment(reward),
            free_spins: increment(-1)
        });

        // Display the reward message
        document.getElementById("spinMessage").innerHTML = `
            Čestitke! Zmagali ste ${reward} kovancev. 
            Prosimo vrnite se čez <span id="nextSpinCountdown"></span> za vaš naslednji vrtljaj.
        `;

        // Start the countdown timer
        startCountdownTimer();

        // Re-enable the spin button after processing
        document.getElementById("spinButton").disabled = false;
    }, 3000); // Match the animation duration
}

// Display Countdown Until Next Spin
function displayCountdownUntilNextSpin() {
    const spinMessage = document.getElementById("spinMessage");
    spinMessage.innerHTML = "Čestitke! Prosimo vrnite se čez <span id='nextSpinCountdown'></span> za naslednji vrtljaj.";
    startCountdownTimer();
    document.getElementById("spinButton").style.display = "none";
}

// Start Countdown Timer
function startCountdownTimer() {
    const countdownElement = document.getElementById("nextSpinCountdown");
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0);

    const interval = setInterval(() => {
        const now = new Date();
        const diff = resetTime - now;

        if (diff <= 0) {
            clearInterval(interval);
            countdownElement.textContent = "0:00:00";
            document.getElementById("spinButton").style.display = "block";
        } else {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            countdownElement.textContent = `${hours}:${minutes}:${seconds}`;
        }
    }, 1000);
}

// Reset Free Spins at Midnight
async function resetFreeSpins() {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const timeUntilMidnight = midnight - Date.now();

    setTimeout(async () => {
        const usersSnapshot = await getDocs(collection(db, "lbEventData"));
        usersSnapshot.forEach(async (doc) => {
            await updateDoc(doc.ref, { free_spins: 1 });
        });

        resetFreeSpins(); // Reinitialize the midnight reset
    }, timeUntilMidnight);
}

// Initialize Midnight Reset
resetFreeSpins();
