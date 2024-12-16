// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

// Spin the Wheel
document.getElementById("spinButton").addEventListener("click", startSpinAnimation);

async function startSpinAnimation() {
    const wheel = document.getElementById("wheel");
    const degrees = Math.floor(Math.random() * 360) + 1440; // Random spin with multiple rotations

    // Start the spinning animation
    wheel.style.transition = "transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)";
    wheel.style.transform = `rotate(${degrees}deg)`;

    document.getElementById("spinButton").disabled = true; // Disable button during spin

    setTimeout(async () => {
        const rewardIndex = Math.floor((degrees % 360) / 72); // Calculate reward index based on final rotation
        const rewards = [10, 20, 50, 100, 200];
        const reward = rewards[rewardIndex];

        await processDailyRewards(reward);

        document.getElementById("spinMessage").textContent = `You won ${reward} tokens!`;
        document.getElementById("spinButton").disabled = false; // Re-enable button after spin
    }, 6000); // Match timeout to animation duration
}

async function processDailyRewards(reward) {
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in to spin the wheel!");
        return;
    }

    const userId = user.uid;
    const userEventRef = doc(db, "lbEventData", userId);
    const userSnapshot = await getDoc(userEventRef);

    // Initialize user data if it doesn't exist
    if (!userSnapshot.exists()) {
        await setDoc(userEventRef, {
            eventTokens: 0,
            free_spins: 1,
            lastSpinDate: new Date().toISOString().split("T")[0],
            dailyMultiplier: 1
        });
    }

    const userData = userSnapshot.data();
    const today = new Date().toISOString().split("T")[0];

    let dailyMultiplier = userData.dailyMultiplier || 1;

    if (userData.lastSpinDate === today) {
        document.getElementById("spinMessage").textContent = "You have already spun the wheel today!";
        return;
    }

    // Check for consecutive days to increase the multiplier
    if (userData.lastSpinDate && new Date(userData.lastSpinDate).getTime() === new Date(today).getTime() - 86400000) {
        dailyMultiplier++;
    } else {
        dailyMultiplier = 1; // Reset multiplier if not consecutive
    }

    await updateDoc(userEventRef, {
        eventTokens: increment(reward * dailyMultiplier),
        lastSpinDate: today,
        dailyMultiplier
    });
}

// Firebase Authentication State
onAuthStateChanged(auth, user => {
    if (!user) {
        alert("Please log in to use the Lucky Wheel!");
        window.location.href = "/login.html"; // Redirect to login page
    }
});
