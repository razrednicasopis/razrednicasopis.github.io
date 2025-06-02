// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, deleteDoc, query, updateDoc, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

const seasonCountdownEl = document.getElementById("seasonTimeLeft");
const seasonCountdownContainer = document.getElementById("seasonCountdown");

let seasonResetInProgress = false; // <-- ADDED: flag to block submissions during reset

async function displayLeaderboard() {
    const leaderboardBody = document.getElementById("aiLeaderboardBody");
    const seasonStatusDocRef = doc(db, "settings", "seasonStatus");

    // Fetch all users from Firestore collection "aiTRLeaderboards"
    const usersSnapshot = await getDocs(collection(db, "aiTRLeaderboards"));

    // Fetch usernames and filter users with winsNumber > 0
    const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const uid = userDoc.id;

        if (!data.winsNumber || data.winsNumber <= 0) return null;

        // Fetch username from "users" collection using UID
        const userRef = doc(db, "users", uid);
        const userDocSnapshot = await getDoc(userRef);
        const username = userDocSnapshot.exists() ? userDocSnapshot.data().Username : "Unknown";

        return { username, wins: data.winsNumber || 0 };
    });

    const usersData = (await Promise.all(usersDataPromises)).filter(user => user !== null);

    // Sort descending by winsNumber
    usersData.sort((a, b) => b.wins - a.wins);

    // Clear leaderboard content
    leaderboardBody.innerHTML = "";

    if (usersData.length === 0) {
        const noResultsRow = document.createElement("tr");
        noResultsRow.innerHTML = `<td colspan="3" style="text-align:center; font-size:16px; font-weight: bold; font-style: italic;">Ni rezultatov.</td>`;
        leaderboardBody.appendChild(noResultsRow);
    } else {
        usersData.forEach((user, index) => {
            const row = document.createElement("tr");

            if (index === 0) row.style.backgroundColor = "gold";
            else if (index === 1) row.style.backgroundColor = "lightblue";
            else if (index === 2) row.style.backgroundColor = "lightgreen";
            else row.style.backgroundColor = "lightgray";

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.username}</td>
                <td>${user.wins}</td>
            `;

            leaderboardBody.appendChild(row);
        });
    }
}


/**
 * Deletes all documents in aiTRLeaderboards collection
 */
async function clearAiTRLeaderboards() {
    const collectionRef = collection(db, "aiTRLeaderboards");
    const snapshot = await getDocs(collectionRef);

    const batchDeletes = snapshot.docs.map(docSnap => deleteDoc(doc(db, "aiTRLeaderboards", docSnap.id)));

    await Promise.all(batchDeletes);
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m ${seconds}s`;
    }
}


async function startSeasonCountdown() {
    // Get the document "trSeasons" from "settings" collection
    const seasonsDocRef = doc(db, "settings", "trSeasons");
    const seasonsDocSnap = await getDoc(seasonsDocRef);

    if (!seasonsDocSnap.exists()) {
        console.warn("trSeasons document does not exist in settings collection");
        seasonCountdownContainer.style.display = "none";
        return;
    }

    const seasonsData = seasonsDocSnap.data();

    // Extract season keys that end with "EndTime" and parse timestamps to Date
    const seasonEndTimes = Object.entries(seasonsData)
        .filter(([key]) => key.toLowerCase().endsWith("endtime"))
        .map(([key, timestamp]) => ({ key, date: timestamp.toDate() }))
        .sort((a, b) => a.date - b.date); // sort ascending by date

    // Filter only future season end times
    const now = new Date();

    let index = 0;

    function getNextFutureSeason() {
        while(index < seasonEndTimes.length && seasonEndTimes[index].date <= new Date()) {
            index++;
        }
        return index < seasonEndTimes.length ? seasonEndTimes[index] : null;
    }


    // Check for missed reset
const lastReset = seasonsData.lastSeasonReset?.toDate?.() || new Date(0); // fallback to epoch

const missedReset = seasonEndTimes.some(season => season.date < now && season.date > lastReset);

if (missedReset) {
    // Missed a reset, so clear leaderboard and update timestamp
    console.log("[SEASON RESET] Missed reset detected. Performing it now silently.");

    await clearAiTRLeaderboards();
    await updateDoc(seasonsDocRef, {
        lastSeasonReset: new Date(),
        isResetting: false
    });
    await displayLeaderboard();
}



    async function runCountdown() {
        const nextSeason = getNextFutureSeason();

        if (!nextSeason) {
            // No future seasons
            seasonCountdownEl.textContent = "Ni trenutno aktivnih sezon.";
            return;
        }

        // Countdown loop
        return new Promise((resolve) => {
            let intervalId;

           async function updateTimer() {
                const now = new Date();
                const diff = nextSeason.date - now;

if (diff <= 0) {
    clearInterval(intervalId);

    // 1. Show reset message
    seasonCountdownEl.textContent = "Sezona se trenutno resetira...";
    
    // 2. Set isResetting = true in Firestore
    const statusDocRef = doc(db, "settings", "trSeasons");
    await updateDoc(statusDocRef, {
    isResetting: true,
    lastSeasonReset: new Date() // Firestore Timestamp will be inferred automatically
});

    // 3. Clear leaderboard
    seasonResetInProgress = true;
    await clearAiTRLeaderboards();
    await displayLeaderboard();

    // 4. Wait 1 minute, then set isResetting = false
    setTimeout(async () => {
        await updateDoc(statusDocRef, { isResetting: false });
        seasonResetInProgress = false;

        index++; // move to next season
        runCountdown().then(resolve);
    }, 60000);

    return;
}


                // Update countdown display
                seasonCountdownEl.textContent = formatTime(diff);
            }

            // Initial call
            updateTimer();

            intervalId = setInterval(updateTimer, 1000);
        });
    }

    await runCountdown();
}

function watchResetTimeout() {
    const seasonsDocRef = doc(db, "settings", "trSeasons");

    onSnapshot(seasonsDocRef, async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data.isResetting) {
            seasonResetInProgress = true;
            seasonCountdownEl.textContent = "Sezona se trenutno resetira...";

            // Auto-disable reset if more than 1 minute passed
            if (data.lastSeasonReset?.toDate) {
                const resetTime = data.lastSeasonReset.toDate();
                const now = new Date();
                const diffMs = now - resetTime;

                if (diffMs >= 60000) {
                    await updateDoc(seasonsDocRef, { isResetting: false });
                    seasonResetInProgress = false;
                    console.log("[SEASON RESET] Auto-disabled after 1 minute.");
                }
            }

        } else if (!data.isResetting && !seasonResetInProgress) {
            // Only re-enable countdown display if not currently resetting
            // This prevents overwriting the "resetting" message while in reset
            startSeasonCountdown(); // Restart countdown after manual or auto reset ends
        }
    });
}




// --- NEW: Listen for changes in season end times to update leaderboard immediately ---
function addSeasonResetListener() {
    const seasonsDocRef = doc(db, "settings", "trSeasons");

    onSnapshot(seasonsDocRef, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        // Extract season end times, sorted ascending
        const seasonEndTimes = Object.entries(data)
            .filter(([key]) => key.toLowerCase().endsWith("endtime"))
            .map(([key, timestamp]) => timestamp.toDate())
            .sort((a, b) => a - b);

        const now = new Date();

        // If currently in the reset period (within 1 minute after any endTime in the past), update immediately
        const isResetNow = seasonEndTimes.some(endTime => {
            const diff = now - endTime; // ms
            return diff >= 0 && diff < 60000; // less than 1 min after season end
        });

        if (isResetNow) {
            displayLeaderboard();
        }
    });
}




// On DOMContentLoaded, start both leaderboard display, season countdown, and reset listener
document.addEventListener("DOMContentLoaded", () => {
    displayLeaderboard();
    startSeasonCountdown();
    addSeasonResetListener();
    watchResetTimeout();
});
