// Import Firebase modules
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

// Show Typing Race Leaderboard
async function displayLeaderboard() {
const leaderboardBody = document.getElementById("aiLeaderboardBody");

    // Fetch all users from Firestore collection "aiTRLeaderboards"
    const usersSnapshot = await getDocs(collection(db, "aiTRLeaderboards"));

    // Fetch usernames and filter users with winsNumber > 0
    const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const uid = userDoc.id;

        // Skip users without wins
        if (!data.winsNumber || data.winsNumber <= 0) {
            return null;
        }

        // Fetch username from "users" collection using UID
        const userRef = doc(db, "users", uid);
        const userDocSnapshot = await getDoc(userRef);
        const username = userDocSnapshot.exists() ? userDocSnapshot.data().Username : "Unknown";

        return {
            username: username,
            wins: data.winsNumber || 0
        };
    });

    // Resolve promises and filter out nulls
    const usersData = (await Promise.all(usersDataPromises)).filter(user => user !== null);

    // Sort descending by winsNumber
    usersData.sort((a, b) => b.wins - a.wins);

    // Clear leaderboard content
    leaderboardBody.innerHTML = "";

    if (usersData.length === 0) {
        // No results message
        const noResultsRow = document.createElement("tr");
        noResultsRow.innerHTML = `<td colspan="3" style="text-align:center; font-size:16px; font-weight: bold; font-style: italic;">Ni rezultatov.</td>`;
        leaderboardBody.appendChild(noResultsRow);
    } else {
        // Populate leaderboard rows
        usersData.forEach((user, index) => {
            const row = document.createElement("tr");

            // Special styling for top 3
            if (index === 0) {
                row.style.backgroundColor = "gold"; // First place
            } else if (index === 1) {
                row.style.backgroundColor = "lightblue"; // Second place
            } else if (index === 2) {
                row.style.backgroundColor = "lightgreen"; // Third place
            } else {
                row.style.backgroundColor = "lightgray"; // Others
            }

            row.innerHTML = `
                <td>${index + 1}</td> <!-- Place -->
                <td>${user.username}</td> <!-- Username -->
                <td>${user.wins}</td> <!-- Wins -->
            `;

            leaderboardBody.appendChild(row);
        });
    }
}

// Call leaderboard display on page load
document.addEventListener("DOMContentLoaded", displayLeaderboard);
