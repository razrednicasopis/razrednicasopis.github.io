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


// Prikaži Leaderboard
async function displayLeaderboard() {
    const leaderboardBody = document.getElementById("leaderboardBody");

    // Pridobi vse uporabnike iz Firestore (lbEventData collection)
    const usersSnapshot = await getDocs(collection(db, "lbEventData"));

    // Create an array of promises to fetch usernames in parallel
    const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const data = userDoc.data();
        const uid = userDoc.id;

        // Check if the user has tokens (ignore if tokens are 0)
        if (data.tokens <= 0) {
            return null; // Don't include this user in the leaderboard if no tokens
        }

        // Fetch the username from the 'users' collection using the UID
        const userRef = doc(db, "users", uid); // Correcting the reference to the 'users' collection
        const userDocSnapshot = await getDoc(userRef); // Fetch the document snapshot from 'users' collection
        const username = userDocSnapshot.exists() ? userDocSnapshot.data().Username : "Unknown"; // Default to "Unknown" if no username is found

        return {
            username: username,
            tokens: data.tokens || 0 // Default to 0 if no tokens exist
        };
    });

    // Wait for all promises to resolve and remove null values (users without tokens)
    const usersData = (await Promise.all(usersDataPromises)).filter(user => user !== null);

    // Sortiraj po kovancih (padajoče)
    usersData.sort((a, b) => b.tokens - a.tokens);

    // Počisti trenutno vsebino Leaderboard-a
    leaderboardBody.innerHTML = "";

    if (usersData.length === 0) {
        // If no valid users with tokens exist, display the "Ni rezultatov" message
        const noResultsRow = document.createElement("tr");
        noResultsRow.innerHTML = `<td colspan="3" style="text-align:center; font-size:16px; font-weight: bold; font-style: italic;">Ni rezultatov.</td>`;
        leaderboardBody.appendChild(noResultsRow);
    } else {
        // Add the sorted users to the table
        usersData.forEach((user, index) => {
            const row = document.createElement("tr");

            // Adding special styling for the first three ranks
            if (index === 0) {
                row.style.backgroundColor = "gold"; // First place
            } else if (index === 1) {
                row.style.backgroundColor = "lightblue"; // Second place
            } else if (index === 2) {
                row.style.backgroundColor = "lightgreen"; // Third place
            } else {
                row.style.backgroundColor = "lightgray"; // Rest of the places
            }

            row.innerHTML = `
                <td>${index + 1}</td> <!-- Mesto v Leaderboard-u -->
                <td>${user.username}</td> <!-- Uporabniško ime -->
                <td>${user.tokens}</td> <!-- Število kovancev -->
            `;

            leaderboardBody.appendChild(row);
        });
    }
}

// Pokliči funkcijo za prikaz Leaderboard-a ob nalaganju strani
document.addEventListener("DOMContentLoaded", displayLeaderboard);
