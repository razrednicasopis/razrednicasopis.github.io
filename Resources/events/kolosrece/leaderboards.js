// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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

// DOM Elements
const seasonCountdownEl = document.getElementById("seasonTimeLeft");
const seasonCountdownContainer = document.getElementById("seasonCountdown");

let seasonResetInProgress = false;

// Display Leaderboard
async function displayLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");
    const usersSnapshot = await getDocs(collection(db, "lbEventData"));

    const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const uid = userDoc.id;

        if (data.tokens <= 0) return null;

        const userRef = doc(db, "users", uid);
        const userDocSnapshot = await getDoc(userRef);
        const username = userDocSnapshot.exists() ? userDocSnapshot.data().Username : "Unknown";

        return {
            username: username,
            tokens: data.tokens || 0
        };
    });

    const usersData = (await Promise.all(usersDataPromises)).filter(user => user !== null);
    usersData.sort((a, b) => b.tokens - a.tokens);
    leaderboardBody.innerHTML = "";

    if (usersData.length === 0) {
        const noResultsRow = document.createElement("tr");
        noResultsRow.innerHTML = `<td colspan="3" style="text-align:center; font-size:16px; font-weight: bold; font-style: italic;">Ni rezultatov.</td>`;
        leaderboardBody.appendChild(noResultsRow);
    } else {
        usersData.forEach((user, index) => {
            const row = document.createElement("tr");
            row.style.backgroundColor = ["gold", "lightblue", "lightgreen"][index] || "lightgray";

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>${user.tokens}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    }
}

// Clear lbEventData leaderboard
async function clearLbEventData() {
    const snapshot = await getDocs(collection(db, "lbEventData"));
    const deletions = snapshot.docs.map(docSnap => deleteDoc(doc(db, "lbEventData", docSnap.id)));
    await Promise.all(deletions);
}

// Format countdown time
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
}

// Season Countdown Logic
async function startSeasonCountdown() {
    const seasonsDocRef = doc(db, "settings", "lbSeasons");
    const seasonsDocSnap = await getDoc(seasonsDocRef);

    if (!seasonsDocSnap.exists()) {
        console.warn("lbSeasons document does not exist.");
        seasonCountdownContainer.style.display = "none";
        return;
    }

    const seasonsData = seasonsDocSnap.data();
    const seasonEndTimes = Object.entries(seasonsData)
        .filter(([key]) => key.toLowerCase().endsWith("endtime"))
        .map(([key, timestamp]) => ({ key, date: timestamp.toDate() }))
        .sort((a, b) => a.date - b.date);

    const now = new Date();
    let index = 0;

    function getNextSeason() {
        while (index < seasonEndTimes.length && seasonEndTimes[index].date <= new Date()) index++;
        return index < seasonEndTimes.length ? seasonEndTimes[index] : null;
    }

    const lastReset = seasonsData.lastSeasonReset?.toDate?.() || new Date(0);
    const missedReset = seasonEndTimes.some(season => season.date < now && season.date > lastReset);

    if (missedReset) {
        console.log("[SEASON RESET] Missed reset - performing silent reset.");
        await clearLbEventData();
        await updateDoc(seasonsDocRef, {
            lastSeasonReset: new Date(),
            isResetting: false
        });
        await displayLeaderboard();
    }

    async function runCountdown() {
        const nextSeason = getNextSeason();
        if (!nextSeason) {
            seasonCountdownEl.textContent = "Ni trenutno aktivnih sezon.";
            return;
        }

        return new Promise((resolve) => {
            let intervalId;

            async function updateTimer() {
                const now = new Date();
                const diff = nextSeason.date - now;

                if (diff <= 0) {
                    clearInterval(intervalId);
                    seasonCountdownEl.textContent = "Sezona se trenutno resetira...";

                    const statusRef = doc(db, "settings", "lbSeasons");
                    await updateDoc(statusRef, {
                        isResetting: true,
                        lastSeasonReset: new Date()
                    });

                    seasonResetInProgress = true;
                    await clearLbEventData();
                    await displayLeaderboard();

                    setTimeout(async () => {
                        await updateDoc(statusRef, { isResetting: false });
                        seasonResetInProgress = false;
                        index++;
                        runCountdown().then(resolve);
                    }, 60000);

                    return;
                }

                seasonCountdownEl.textContent = formatTime(diff);
            }

            updateTimer();
            intervalId = setInterval(updateTimer, 1000);
        });
    }

    await runCountdown();
}

// Listen for external resets and re-init countdown
function watchResetTimeout() {
    const ref = doc(db, "settings", "lbSeasons");

    onSnapshot(ref, async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data.isResetting) {
            seasonResetInProgress = true;
            seasonCountdownEl.textContent = "Sezona se trenutno resetira...";

            const resetTime = data.lastSeasonReset?.toDate?.();
            if (resetTime && new Date() - resetTime >= 60000) {
                await updateDoc(ref, { isResetting: false });
                seasonResetInProgress = false;
                console.log("[SEASON RESET] Auto-disabled after 1 min.");
            }
        } else if (!data.isResetting && !seasonResetInProgress) {
            startSeasonCountdown();
        }
    });
}

// Optional: Listen to season resets and refresh leaderboard immediately
function addSeasonResetListener() {
    const ref = doc(db, "settings", "lbSeasons");

    onSnapshot(ref, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const endTimes = Object.entries(data)
            .filter(([key]) => key.toLowerCase().endsWith("endtime"))
            .map(([_, timestamp]) => timestamp.toDate())
            .sort((a, b) => a - b);

        const now = new Date();
        const isResetNow = endTimes.some(end => now - end >= 0 && now - end < 60000);

        if (isResetNow) displayLeaderboard();
    });
}

// Run everything on page load
document.addEventListener("DOMContentLoaded", () => {
    displayLeaderboard();
    startSeasonCountdown();
    watchResetTimeout();
    addSeasonResetListener();
});
