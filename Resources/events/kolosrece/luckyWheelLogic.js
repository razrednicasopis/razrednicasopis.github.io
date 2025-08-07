import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Firebase init
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sectors
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

let isSpinning = false;

// On user auth
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        const userEventRef = doc(db, "lbEventData", userId);

        onSnapshot(userEventRef, async (userSnapshot) => {
            if (!userSnapshot.exists()) {
                await setDoc(userEventRef, {
                    free_spins: 1,
                    tokens: 0,
                    lastSpinDate: null,
                    hasSpunToday: false
                });
            }

            const userData = userSnapshot.data();
            const userSpinsElement = document.getElementById("userSpins");
            const today = new Date();
            const lastSpinDate = userData.lastSpinDate ? userData.lastSpinDate.toDate() : null;

            const isSameDay =
                lastSpinDate &&
                lastSpinDate.getDate() === today.getDate() &&
                lastSpinDate.getMonth() === today.getMonth() &&
                lastSpinDate.getFullYear() === today.getFullYear();

            if (!isSameDay) {
                await updateDoc(userEventRef, {
                    free_spins: 1,
                    hasSpunToday: false,
                    lastSpinDate: new Date()
                });
            }

            if (userData.free_spins > 0) {
                userSpinsElement.style.display = "block";
                userSpinsElement.textContent = `Preostali vrtljaji: ${userData.free_spins}`;
                document.getElementById("spinButton").style.display = "block";
            } else {
                userSpinsElement.style.display = "none";
                displayCountdownUntilNextSpin();
            }
        });
    }
});

// Spin button handler
document.getElementById("spinButton").addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
        alert("Prosimo, prijavite se za uporabo funkcije vrtenja kolesa!");
        return;
    }

    const userEventRef = doc(db, "lbEventData", user.uid);
    const userSnapshot = await getDoc(userEventRef);
    if (!userSnapshot.exists()) return;

    const userData = userSnapshot.data();
    if (userData.free_spins > 0 && !isSpinning) {
        isSpinning = true;
        disableNavigationDuringSpin(6000);
        startSpin(userEventRef);
    } else {
        displayCountdownUntilNextSpin();
    }
});

// Main spin logic
async function startSpin(userEventRef) {
    const wheel = document.getElementById("wheel");
    const totalSectors = sectors.length;
    const sectorAngle = 360 / totalSectors;

    const randomIndex = Math.floor(Math.random() * totalSectors);
    const reward = parseInt(sectors[randomIndex].label, 10);
    const stopAngle = (randomIndex * sectorAngle) + (sectorAngle / 2);
    const spinDegrees = 360 * 5 + stopAngle;

    // Immediately store the result
    await updateDoc(userEventRef, {
        tokens: increment(reward),
        free_spins: increment(-1),
        hasSpunToday: true,
        lastSpinDate: new Date(),
        lastSpinResult: { value: reward, timestamp: Date.now() }
    });

    // Animate the wheel
    wheel.style.transition = "transform 6s cubic-bezier(0.25, 0.1, 0.25, 1)";
    wheel.style.transform = `rotate(${spinDegrees}deg)`;
    document.getElementById("spinButton").disabled = true;

    setTimeout(() => {
        isSpinning = false;

        document.getElementById("spinMessage").innerHTML = `
            <div class="reward-message">
                <p>Čestitke! 🎉 Zmagali ste <span class="reward-amount">${reward} kovancev</span>.</p>
                <button id="confirmButton" class="confirm-button">Potrdi</button>
            </div>
        `;

        document.getElementById("confirmButton").addEventListener("click", () => location.reload());
        document.getElementById("spinButton").style.display = "none";
    }, 6000);
}

// Disable nav buttons during spin
function disableNavigationDuringSpin(duration) {
    const links = document.querySelectorAll('.lbEventHeader a');
    links.forEach(link => {
        link.dataset.href = link.href;
        link.removeAttribute('href');
        link.style.pointerEvents = 'none';
        link.style.opacity = 0.5;
    });

    setTimeout(() => {
        links.forEach(link => {
            link.setAttribute('href', link.dataset.href);
            link.style.pointerEvents = 'auto';
            link.style.opacity = 1;
        });
    }, duration);
}

// Page refresh protection
window.addEventListener('beforeunload', (e) => {
    if (isSpinning) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Show countdown
function displayCountdownUntilNextSpin() {
    const spinMessage = document.getElementById("spinMessage");
    spinMessage.innerHTML = `
        <div class="countdown-message">
            <p>Ponovno lahko zavrtite čez <span id="nextSpinCountdown" class="countdown-timer"></span></p>
        </div>
    `;
    startCountdownTimer();
    document.getElementById("spinButton").style.display = "none";
}

// Countdown logic
function startCountdownTimer() {
    const countdownElement = document.getElementById("nextSpinCountdown");
    const resetTime = new Date();
    resetTime.setHours(24, 0, 0, 0);

    const interval = setInterval(() => {
        const now = new Date();
        const diff = resetTime - now;

        if (diff <= 0) {
            clearInterval(interval);
            countdownElement.textContent = "0s";
            document.getElementById("spinButton").style.display = "block";
        } else {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            countdownElement.textContent =
                hours > 0 ? `${hours}h ${minutes}m` :
                minutes > 0 ? `${minutes}m ${seconds}s` :
                `${seconds}s`;
        }
    }, 1000);
}

// Reset spins at midnight
async function resetFreeSpins() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const timeUntilMidnight = midnight - now;

    setTimeout(async () => {
        const usersSnapshot = await getDocs(collection(db, "lbEventData"));
        const updates = usersSnapshot.docs.map(userDoc =>
            updateDoc(userDoc.ref, { free_spins: 1, hasSpunToday: false })
        );
        await Promise.all(updates);
        resetFreeSpins(); // Schedule again for next day
    }, timeUntilMidnight > 0 ? timeUntilMidnight : 86400000);
}

resetFreeSpins();
