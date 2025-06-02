// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs, deleteDoc, query, limit } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

// Helper to format milliseconds as hh:mm:ss
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
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

            function updateTimer() {
                const now = new Date();
                const diff = nextSeason.date - now;

                if (diff <= 0) {
                    // Season ended
                    clearInterval(intervalId);

                    // Show reset message
                    seasonCountdownEl.textContent = "Sezona se trenutno resetira...";

                    // Delete the aiTRLeaderboards collection
                    clearAiTRLeaderboards().then(() => {
                        // Wait 1 minute before moving to next season countdown
                        setTimeout(() => {
                            index++; // move to next season
                            runCountdown().then(resolve);
                        }, 60000);
                    });

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

// On DOMContentLoaded, start both leaderboard display and season countdown
document.addEventListener("DOMContentLoaded", () => {
    displayLeaderboard();
    startSeasonCountdown();
});