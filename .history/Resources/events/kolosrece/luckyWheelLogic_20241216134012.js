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

async function spinWheel() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in to spin the wheel!");
        return;
    }

    const userId = user.uid;
    const userEventRef = doc(db, "lbEventData", userId);

    // Check if the user data exists, if not create it
    const userSnapshot = await getDoc(userEventRef);
    if (!userSnapshot.exists()) {
        await setDoc(userEventRef, {
            eventTokens: 0,
            free_spins: 1
        });
    }

    const userData = (await getDoc(userEventRef)).data();

    // Check free spins
    if (userData.free_spins <= 0) {
        document.getElementById("spinMessage").textContent = "No spins available! Try again tomorrow.";
        return;
    }

    // Rewards and spinning logic
    const rewards = [10, 20, 50, 100, 200];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    await updateDoc(userEventRef, {
        eventTokens: increment(reward),
        free_spins: increment(-1)
    });

    // Show the reward message
    document.getElementById("spinMessage").textContent = `You won ${reward} tokens!`;
}

function startSpinAnimation() {
    const wheel = document.getElementById("wheel");
    const degrees = Math.floor(Math.random() * 360) + 1440; // Random spin
    wheel.style.transform = `rotate(${degrees}deg)`;

    document.getElementById("spinButton").disabled = true;
    setTimeout(() => {
        spinWheel(); // Trigger spin logic after animation
        document.getElementById("spinButton").disabled = false;
    }, 4000);
}

// Firebase Authentication
onAuthStateChanged(auth, user => {
    if (!user) {
        alert("Please log in to use the Lucky Wheel!");
        window.location.href = "/login.html"; // Redirect to login page
    }
});
