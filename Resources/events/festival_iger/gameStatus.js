import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, doc, updateDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore();

const gamesCollection = collection(db, "gamesFestival");

// Initialize an empty array for the games with their target dates and order
let games = [];

const countdownTimerElement = document.getElementById("countdownTimer");
const timeLeftElement = document.getElementById("timeLeft");

const targetDates = [
    { date: new Date("2024-12-04T16:00:00"), id: "dec4" }, // December 4th
    { date: new Date("2024-12-11T16:00:00"), id: "dec11" }, // December 11th
    { date: new Date("2024-12-18T16:00:00"), id: "dec18" }, // December 18th
    { date: new Date("2024-12-25T16:00:00"), id: "dec25" }, // December 25th
    { date: new Date("2025-01-01T16:00:00"), id: "jan1" }   // January 1st
];

// Function to format time difference into a readable string (d h m s format)
function formatTimeDiff(timeDiff) {
    const seconds = Math.floor((timeDiff / 1000) % 60);
    const minutes = Math.floor((timeDiff / 1000 / 60) % 60);
    let hours = Math.floor(timeDiff / 1000 / 60 / 60);
    let days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    hours %= 24; // Remainder after extracting full days
    return `${days}d ${hours}h ${minutes}m ${seconds}s`; // Include seconds
}

// Function to calculate time difference until the target date
function calculateTimeDiff(targetDate) {
    const currentDate = new Date();
    const timeDiff = targetDate - currentDate; // Difference in milliseconds
    return timeDiff; // Return difference in milliseconds
}

// Function to display the countdown text
function displayCountdownText(timeLeft) {
    timeLeftElement.textContent = `${timeLeft}`;
}

// Function to update the countdown and cycle through games
function updateCountdown() {
    if (games.length === 0) return;

    let nextGame = null;

    // Find the closest upcoming game (the smallest positive time difference)
    const closestGame = targetDates.reduce((closest, current) => {
        const currentTimeDiff = calculateTimeDiff(current.date);
        if (currentTimeDiff > 0 && (closest === null || currentTimeDiff < closest.timeDiff)) {
            closest = { ...current, timeDiff: currentTimeDiff }; // Include the id in the result
        }
        return closest;
    }, null);

    if (closestGame !== null) {
        // Display countdown for the closest game
        const timeString = formatTimeDiff(closestGame.timeDiff);
        displayCountdownText(timeString);

        // If the countdown has finished, enable the game and trigger the event for the game
        if (closestGame.timeDiff <= 0) {
            handleCountdownEnd(closestGame.id);
        }
    }
}

// Function to handle what happens when a countdown ends
async function handleCountdownEnd(countdownId) {
    let gameId;

    // Assign gameId based on the countdown ID
    switch (countdownId) {
        case "dec4":
            gameId = "agario";
            break;
        case "dec11":
            gameId = "shellshock";
            break;
        case "dec18":
            gameId = "krunkerio";
            break;
        case "dec25":
            gameId = "happywheels";
            break;
        case "jan1":
            gameId = "crossyroad";
            break;
        default:
            console.error("Unknown countdownId:", countdownId);
            return;
    }

    // Call the function to update the corresponding game's availability in Firestore
    await makeGameAvailable(gameId);

    // Trigger the next countdown event, if any (you can set a next step here if needed)

}

// Function to set a game as available in Firestore
async function makeGameAvailable(gameId) {
    const gameRef = doc(db, "gamesFestival", gameId);
    console.log(`Updating game with ID: ${gameId}`); // Debugging line to verify gameId

    try {
        // Log the document reference
        console.log(`Document reference: ${gameRef.path}`);
        await updateDoc(gameRef, { available: true });
        console.log(`${gameId} is now available.`);
    } catch (error) {
        console.error("Error updating game availability: ", error);
    }
}

// Function to fetch games from Firestore and sort by the availability order
async function fetchGamesFromFirestore() {
    const querySnapshot = await getDocs(gamesCollection);
    games = [];

    querySnapshot.forEach(doc => {
        const gameData = doc.data();
        const targetDate = new Date(gameData.targetDate); // Ensure the target date is correctly parsed

        games.push({
            id: doc.id,
            targetDate: targetDate,
            available: gameData.available || false, // Add the availability field, defaulting to false if not present
            number: gameData.number  // Assuming there is a field that specifies the game's order number
        });
    });

    // Sort games by the order number (assuming games have a "number" field to determine order)
    games.sort((a, b) => a.number - b.number);

    // After games are fetched, initialize the countdown and toggle game visibility
    initializeCountdown();
    toggleGameVisibility(); // Ensure visibility is set after fetching games
}

// Function to initialize the countdown (once games are fetched)
function initializeCountdown() {
    // Show the countdown timer section
    countdownTimerElement.style.display = 'block';
    updateCountdown();
    setInterval(updateCountdown, 1000);  // Update every second
}

// Function to toggle game visibility based on availability
function toggleGameVisibility() {
    // Ensure that visibility is updated based on the `available` field
    games.forEach(game => {
        const gameDiv = document.getElementById(`game-${game.id}`);
        if (gameDiv) {
            if (game.available) {
                console.log(`Showing game: ${game.id}`); // Debugging line
                gameDiv.style.display = 'block';  // Show the game if it's available
            } else {
                gameDiv.style.display = 'none';   // Hide if not available
            }
        }
    });
}

// Real-time Firestore listener to dynamically update the visibility when availability changes
onSnapshot(gamesCollection, (snapshot) => {
    // Whenever there's a change in the Firestore data, fetch the games and update the countdown
    fetchGamesFromFirestore();
    console.log("Firestore data changed: ", snapshot.docs.map(doc => doc.data())); // Log snapshot data

    // Update the game visibility based on their availability status
    toggleGameVisibility();
});

// Fetch games from Firestore when the page loads
fetchGamesFromFirestore();
