// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

        // Set up real-time listener
        onSnapshot(userEventRef, async (userSnapshot) => {
            if (!userSnapshot.exists()) {
                // Initialize data if doesn't exist
                await setDoc(userEventRef, { free_spins: 1, tokens: 0 });
            }

            const userData = userSnapshot.data();
            if (userData.free_spins <= 0) {
                displayCountdownUntilNextSpin();
            } else {
                // Update UI based on the available spins
                document.getElementById("spinButton").style.display = "block"; // Show button if spins are available
                document.querySelector('.countdown-message').style.display = "none";
            }
        });
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

// Start Spin Animation
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
    ]; // Rewards: 10, 20, 30, 40, 50, 60, 70, 80

    const totalSectors = sectors.length;
    const sectorAngle = 360 / totalSectors;

    // Generate a random sector index
    const randomIndex = Math.floor(Math.random() * totalSectors);

    // Calculate the angle to land in the center of the chosen sector
    const stopAngle = (randomIndex * sectorAngle) + (sectorAngle / 2);

    // Calculate the total spin degrees, including extra full rotations for visual effect
    const spinDegrees = 360 * 5 + stopAngle; // 5 full rotations + the stop angle

    // Apply the CSS transformation to the wheel to make it spin
    wheel.style.transition = "transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)";
    wheel.style.transform = `rotate(${spinDegrees}deg)`;

    // Disable the spin button during the spin
    document.getElementById("spinButton").disabled = true;

    setTimeout(async () => {
        // Determine the reward based on the final position (randomIndex)
        const reward = parseInt(sectors[randomIndex].label, 10);

        // Update Firestore with the reward and decrement free spins
        await updateDoc(userEventRef, {
            tokens: increment(reward),
            free_spins: increment(-1)
        });

        // Display the reward message
        document.getElementById("spinMessage").innerHTML = `
            <div class="reward-message">
                <p>Čestitke! 🎉 Zmagali ste <span class="reward-amount">${reward} kovancev</span>.</p>
                <button id="confirmButton" class="confirm-button">Potrdi</button>
            </div>
        `;

        // Add event listener to "Potrdi" button to refresh the page
        document.getElementById("confirmButton").addEventListener("click", () => {
            location.reload();
        });

        // Hide the spin button
        document.getElementById("spinButton").style.display = "none";
    }, 6000); // Match the animation duration
}

function displayCountdownUntilNextSpin() {
    const spinMessage = document.getElementById("spinMessage");

    // Display the formatted countdown message
    spinMessage.innerHTML = `
        <div class="countdown-message">
            <p>Ponovno lahko zavrtite čez <span id="nextSpinCountdown" class="countdown-timer"></span> </p>
        </div>
    `;

    startCountdownTimer(); // Start the countdown
    document.getElementById("spinButton").style.display = "none"; // Hide the spin button
}


// Start Countdown Timer Function from Old Code
function startCountdownTimer() {
    const countdownElement = document.getElementById("nextSpinCountdown");
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0); // Reset time set to midnight

    const interval = setInterval(() => {
        const now = new Date();
        const diff = resetTime - now;

        if (diff <= 0) {
            clearInterval(interval);
            countdownElement.textContent = "0s";
            document.getElementById("spinButton").style.display = "block"; // Show button when countdown ends
        } else {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            if (hours > 0) {
                countdownElement.textContent = `${hours}h ${minutes}m`;
            } else if (minutes > 0) {
                countdownElement.textContent = `${minutes}m ${seconds}s`;
            } else {
                countdownElement.textContent = `${seconds}s`;
            }
        }
    }, 1000);
}


// Reset Free Spins at Midnight
async function resetFreeSpins() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(2, 35, 0, 0); // Set to next midnight

    const timeUntilMidnight = midnight - now;

    // Set the timeout to run reset at midnight
    setTimeout(async () => {
        // Query all users and set their free spins to 1
        const usersSnapshot = await getDocs(collection(db, "lbEventData"));
        usersSnapshot.forEach(async (userDoc) => {
            const userRef = userDoc.ref;
            await updateDoc(userRef, { free_spins: 1 });
        });

        // Reinitialize the midnight reset to ensure it runs every day
        resetFreeSpins(); // Call again after midnight for next day
    }, timeUntilMidnight);
}

// Start the reset process immediately on page load
resetFreeSpins();
