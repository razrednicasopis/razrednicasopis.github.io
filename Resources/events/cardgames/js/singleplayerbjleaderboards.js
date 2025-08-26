// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase config
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

// DOM element for new event leaderboard
const leaderboardBodyNewEvent = document.getElementById("leaderboardBodyNewEvent");

// League icons
const leagueIcons = {
    "Dan 1": "🥉", 
    "Dan 2": "🥉", 
    "Dan 3": "🥉", 
    "Dan 4": "🥉", 
    "Dan 5": "🥉",
    "Dan 6": "🥈", 
    "Dan 7": "🥈", 
    "Dan 8": "🥇", 
    "Dan 9": "🥇", 
    "Dan 10": "💎",
    "Warrior": "⚔️",
    "Champion": "⚔️⚔️⚔️",
    "Master": "🎖️",
    "Legend": "💎💎💎"
};

// Map rating to league
function getLeagueFromRating(rating) {
    if (rating >= 0 && rating < 50) return "Dan 1";
    if (rating >= 50 && rating < 100) return "Dan 2";
    if (rating >= 100 && rating < 150) return "Dan 3";
    if (rating >= 150 && rating < 200) return "Dan 4";
    if (rating >= 200 && rating < 300) return "Dan 5";
    if (rating >= 300 && rating < 400) return "Dan 6";
    if (rating >= 400 && rating < 500) return "Dan 7";
    if (rating >= 500 && rating < 600) return "Dan 8";
    if (rating >= 600 && rating < 750) return "Dan 9";
    if (rating >= 750 && rating < 900) return "Dan 10";
    if (rating >= 900 && rating < 1200) return "Warrior";
    if (rating >= 1200 && rating < 1500) return "Champion";
    if (rating >= 1500 && rating < 2000) return "Master";
    if (rating >= 3000) return "Legend";
    return "Dan 1";
}

// Update league field for each user based on rating
async function syncLeagues() {
    const usersSnapshot = await getDocs(collection(db, "cgEventData"));
    const updates = [];

    for (const userDoc of usersSnapshot.docs) {
        const data = userDoc.data();
        const uid = userDoc.id;
        const rating = data.rating || 0;

        if (rating <= 0) continue;

        const correctLeague = getLeagueFromRating(rating);
        if (data.league !== correctLeague) {
            const userRef = doc(db, "cgEventData", uid);
            updates.push(updateDoc(userRef, { league: correctLeague }));
        }
    }

    await Promise.all(updates);
}

// Display leaderboard
export async function displayNewEventLeaderboard() {
    await syncLeagues(); // ensure leagues are up-to-date

    const usersSnapshot = await getDocs(collection(db, "cgEventData"));

    const usersDataPromises = usersSnapshot.docs.map(async userDoc => {
        const data = userDoc.data();
        const uid = userDoc.id;

        const rating = data.rating || 0;
        if (rating <= 0) return null; // Skip zero-rating users

        const userRef = doc(db, "users", uid);
        const userDocSnapshot = await getDoc(userRef);
        const username = userDocSnapshot.exists() ? userDocSnapshot.data().Username : "Unknown";

        const league = data.league || getLeagueFromRating(rating);

        return { username, rating, league };
    });

    const usersData = (await Promise.all(usersDataPromises))
        .filter(user => user !== null)
        .sort((a, b) => b.rating - a.rating);

    leaderboardBodyNewEvent.innerHTML = "";

    if (usersData.length === 0) {
        const noResultsRow = document.createElement("tr");
        noResultsRow.innerHTML = `<td colspan="5" style="text-align:center; font-size:16px; font-weight:bold;">Ni zadetkov.</td>`;
        leaderboardBodyNewEvent.appendChild(noResultsRow);
    } else {
        usersData.forEach((user, index) => {
            const row = document.createElement("tr");

            // Highlight top 3
            let bgColor = "lightgray";
            if (index === 0) bgColor = "gold";
            else if (index === 1) bgColor = "lightblue";
            else if (index === 2) bgColor = "lightgreen";
            row.style.backgroundColor = bgColor;

            row.innerHTML = `
                <td>${index + 1}</td>
                <td style="text-align:center;">${leagueIcons[user.league] || "❔"}</td>
                <td>${user.username}</td>
                <td>${user.league}</td>
                <td>${user.rating}</td>
            `;
            leaderboardBodyNewEvent.appendChild(row);
        });
    }
}

// -------------------
// cgSeasons Season Reset System
// -------------------

let seasonResetInProgress = false;

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

async function startCgSeasonsCountdown(countdownEl, refreshLeaderboardFunc) {
    const docRef = doc(db, "settings", "cgSeasons");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        console.warn("[SEASON RESET] settings/cgSeasons does not exist");
        if (countdownEl) countdownEl.style.display = "none";
        return;
    }

    const data = docSnap.data();
    const seasonEndTimes = Object.entries(data)
        .filter(([key]) => key.toLowerCase().endsWith("endtime"))
        .map(([key, timestamp]) => ({ key, date: timestamp.toDate() }))
        .sort((a, b) => a.date - b.date);

    let index = 0;

    function getNextSeason() {
        while (index < seasonEndTimes.length && seasonEndTimes[index].date <= new Date()) index++;
        return index < seasonEndTimes.length ? seasonEndTimes[index] : null;
    }

    const lastReset = data.lastSeasonReset?.toDate?.() || new Date(0);
    const missedReset = seasonEndTimes.some(season => season.date < new Date() && season.date > lastReset);

    if (missedReset) {
        console.log("[SEASON RESET] Missed reset - performing silent reset for cgSeasons");
        await updateDoc(docRef, { lastSeasonReset: new Date(), isResetting: false });
        if (refreshLeaderboardFunc) await refreshLeaderboardFunc();
    }

    async function runCountdown() {
        const nextSeason = getNextSeason();
        if (!nextSeason) {
            if (countdownEl) countdownEl.textContent = "Ni trenutno aktivnih sezon.";
            return;
        }

        return new Promise((resolve) => {
            let intervalId;

            async function updateTimer() {
                const now = new Date();
                const diff = nextSeason.date - now;

                if (diff <= 0) {
                    clearInterval(intervalId);
                    if (countdownEl) countdownEl.textContent = "Sezona se trenutno resetira...";

                    await updateDoc(docRef, { isResetting: true, lastSeasonReset: new Date() });
                    seasonResetInProgress = true;

                    if (refreshLeaderboardFunc) await refreshLeaderboardFunc();

                    setTimeout(async () => {
                        await updateDoc(docRef, { isResetting: false });
                        seasonResetInProgress = false;
                        index++;
                        runCountdown().then(resolve);
                    }, 60000);

                    return;
                }

                if (countdownEl) countdownEl.textContent = formatTime(diff);
            }

            updateTimer();
            intervalId = setInterval(updateTimer, 1000);
        });
    }

    await runCountdown();
}

function watchCgSeasonsReset(countdownEl, refreshLeaderboardFunc) {
    const ref = doc(db, "settings", "cgSeasons");

    onSnapshot(ref, async (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data.isResetting) {
            seasonResetInProgress = true;
            if (countdownEl) countdownEl.textContent = "Sezona se trenutno resetira...";

            const resetTime = data.lastSeasonReset?.toDate?.();
            if (resetTime && new Date() - resetTime >= 60000) {
                await updateDoc(ref, { isResetting: false });
                seasonResetInProgress = false;
            }
        } else if (!data.isResetting && !seasonResetInProgress) {
            startCgSeasonsCountdown(countdownEl, refreshLeaderboardFunc);
        }
    });
}

function addCgSeasonsResetListener(refreshLeaderboardFunc) {
    const ref = doc(db, "settings", "cgSeasons");

    onSnapshot(ref, (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        const endTimes = Object.entries(data)
            .filter(([key]) => key.toLowerCase().endsWith("endtime"))
            .map(([_, timestamp]) => timestamp.toDate())
            .sort((a, b) => a - b);

        const now = new Date();
        const isResetNow = endTimes.some(end => now - end >= 0 && now - end < 60000);

        if (isResetNow && refreshLeaderboardFunc) refreshLeaderboardFunc();
    });
}

// -------------------
// Initialize
// -------------------
document.addEventListener("DOMContentLoaded", () => {
    displayNewEventLeaderboard();

    const countdownEl = document.getElementById("seasonTimeLeft");
    startCgSeasonsCountdown(countdownEl, displayNewEventLeaderboard);
    watchCgSeasonsReset(countdownEl, displayNewEventLeaderboard);
    addCgSeasonsResetListener(displayNewEventLeaderboard);
});
