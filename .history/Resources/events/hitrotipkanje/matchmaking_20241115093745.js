import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    getFirestore, setDoc, doc, collection, query, where, getDocs,
    updateDoc, serverTimestamp, arrayUnion, increment, arrayRemove,
    getDoc, deleteDoc, limit, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Firestore reference to matchmaking sessions
const matchmakingSessionsRef = collection(db, 'matchmakingSessions');
let currentSessionId = null; // Variable to track the current session ID


// Text generation logic moved from game.js
async function fetchRandomWikipediaSnippet() {
async function fetchRandomText() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();


async function generateRaceText() {
    const snippet = await fetchRandomWikipediaSnippet();
    let gameText = cleanText(snippet);
    gameText = splitIntoSentences(gameText);
    return gameText;
    let raceText = cleanText(snippet);
    raceText = splitIntoSentences(raceText);
    return raceText;
}

// Function to show the matchmaking popup
@@ -140,140 +140,140 @@
// Function to create a new matchmaking session
async function createMatchmakingSession(playerId, requiredPlayers) {
    const sessionRef = doc(matchmakingSessionsRef); // Create a new document for the session
    const gameText = await fetchRandomText(); // Fetch random Wikipedia text
    const raceText = await fetchRandomText(); // Fetch random Wikipedia text
    const newSession = {
        status: 'waiting',
        totalPlayers: 1,
        players: [playerId], // Add the first player to the session
        requiredPlayers: requiredPlayers,
        racetext: raceText, // Store the fetched text
        startTime: serverTimestamp() // Using serverTimestamp from Firestore
    };

    setDoc(sessionRef, newSession)
        .then(() => {
            console.log(`Matchmaking session created for player ${playerId}`);
            currentSessionId = sessionRef.id; // Store the session ID
            localStorage.setItem('matchmakingStatus', sessionRef.id); // Store session ID in local storage
            listenToMatchmaking(sessionRef.id); // Start listening to the session updates
        })
        .catch((error) => {
            console.error('Error creating matchmaking session:', error);
        });
}

// Function to join an existing matchmaking session
function joinMatchmakingSession(sessionId, playerId, requiredPlayers) {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);

    // Add the player to the session
    updateDoc(sessionRef, {
        players: arrayUnion(playerId), // Using arrayUnion from Firestore v9
        totalPlayers: increment(1) // Using increment from Firestore v9
    })
        .then(() => {
            console.log(`Player ${playerId} joined session ${sessionId}`);
            currentSessionId = sessionId; // Store the session ID
            localStorage.setItem('matchmakingStatus', sessionId); // Store session ID in local storage
            listenToMatchmaking(sessionId); // Start listening to the session updates
        })
        .catch((error) => {
            console.error('Error joining matchmaking session:', error);
        });
}

// Function to check and update the session when leaving
function checkAndUpdateSession(sessionId) {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);

    getDoc(sessionRef)
        .then((doc) => {
            if (doc.exists()) {
                const sessionData = doc.data();
                const totalPlayers = sessionData.totalPlayers;

                // If there are no players left, delete the session
                if (totalPlayers <= 1) { // If totalPlayers is 1 or lower, delete the session
                    deleteDoc(sessionRef)
                        .then(() => {
                            console.log(`Matchmaking session ${sessionRef.id} deleted.`);
                            currentSessionId = null; // Clear current session ID
                        })
                        .catch((error) => {
                            console.error('Error deleting matchmaking session:', error);
                        });
                } else {
                    // If totalPlayers was more than 1, decrement the player count
                    updateDoc(sessionRef, {
                        totalPlayers: increment(-1) // Decrease the total players by 1
                    })
                    .then(() => {
                        console.log(`Player count decreased for session ${sessionId}.`);
                    })
                    .catch((error) => {
                        console.error('Error updating player count:', error);
                    });
                }
            }
        })
        .catch((error) => {
            console.error('Error getting matchmaking session:', error);
        });
}

// Function to listen for changes in the matchmaking session
function listenToMatchmaking(sessionId) {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);

    onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
            const sessionData = doc.data();
            const totalPlayers = sessionData.totalPlayers;
            const requiredPlayers = sessionData.requiredPlayers;

            const matchmakingPopupText = document.querySelector('#matchmakingPopup p');
            if (matchmakingPopupText) {
                // Update the popup with the number of players found
                matchmakingPopupText.textContent = `Igralci: ${totalPlayers}/${requiredPlayers}`;

                // Check if all players are found
                if (totalPlayers === requiredPlayers) {
                    // Change the status to "in-progress"
                    updateDoc(sessionRef, {
                        status: 'in-progress' // Change status
                    }).then(() => {
                        // Remove matchmaking data from local storage
                        localStorage.removeItem('matchmakingStatus');
                        localStorage.setItem('inGameStatus', sessionId); // Store in-game status

                        // Update the popup messages for server connection, game entry and hide the leave button
                        matchmakingPopupText.textContent = 'Povezovanje z serverjem...';
                        const leaveMatchmakingBtn = document.getElementById('closeMatchmakingPopup');
                        leaveMatchmakingBtn.style.display = 'none';

                        setTimeout(() => {
                            matchmakingPopupText.textContent = 'Vstopanje v igro...';

                            setTimeout(() => {
                                hideMatchmakingPopup(); // Close the popup after messages are displayed
                                window.location.href = 'igra.html';
                                console.log('Entering the game...'); // Add game entry logic later
                            }, 1500); // Wait before closing
                        }, 1500); // Wait before displaying the game entry message
                    });
                }
            }
        }
    });
}

// Check for user authentication status
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user.uid);
        // Further logic for user
    } else {
        console.log('No user is logged in');
        // Handle not logged in user
    }
});