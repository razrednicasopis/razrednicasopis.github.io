import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const db = getFirestore();
const auth = getAuth();

let sessionId; // ID of the current matchmaking session

// Fetch a random Wikipedia snippet (in Slovenian)
async function fetchRandomWikipediaSnippet() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();
    
    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];
    
    return firstPage.extract; // Return the extract of the random Wikipedia page
}

// Function to start the game by loading session data
async function startGame() {
    const sessionRef = db.collection('matchmakingSessions').doc(sessionId);
    
    // Fetch or generate the game text (random snippet)
    let gameText;
    const docSnap = await sessionRef.get();
    if (docSnap.exists()) {
        const sessionData = docSnap.data();
        
        // Check if the text is already in Firestore
        if (sessionData.text) {
            gameText = sessionData.text; // Use the existing text
        } else {
            // If not, fetch a random Wikipedia snippet and store it in Firestore
            gameText = await fetchRandomWikipediaSnippet();
            await sessionRef.update({
                text: gameText // Store the random text in Firestore
            });
        }
        
        // Display the text to type
        document.getElementById('textToType').innerText = gameText;

        // Initialize progress bars for each player
        Object.keys(sessionData.progress || {}).forEach((playerId) => {
            updateProgressBar(playerId, sessionData.progress[playerId]);
        });

        trackTypingProgress(gameText); // Start tracking typing progress
    }
}

// Function to update progress bars for players
function updateProgressBar(playerId, progress) {
    let progressBar = document.getElementById(`${playerId}-progress`);
    
    // Create progress bar if it doesn't exist
    if (!progressBar) {
        const playerName = playerId === auth.currentUser.uid ? 'You' : `Player ${playerId}`;
        
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');
        progressContainer.innerHTML = `
            <span class="player-name">${playerName}</span>
            <div class="progress-bar" id="${playerId}-progress" style="width: ${progress}%"></div>
        `;
        document.getElementById('playersProgress').appendChild(progressContainer);
    } else {
        progressBar.style.width = `${progress}%`;
    }
}

// Function to track typing progress and check for errors
function trackTypingProgress(textToType) {
    const typingField = document.getElementById('typingField');
    
    typingField.addEventListener('input', (e) => {
        const typedText = e.target.value;
        let correctText = '';
        let isCorrect = true;
        
        // Check for spelling errors
        for (let i = 0; i < typedText.length; i++) {
            if (typedText[i] === textToType[i]) {
                correctText += `<span class="correct-char">${textToType[i]}</span>`;
            } else {
                correctText += `<span class="incorrect-char">${textToType[i]}</span>`;
                isCorrect = false;
                break; // Stop checking after the first mistake
            }
        }

        // Update the textToType display to highlight correct/incorrect chars
        document.getElementById('textToType').innerHTML = correctText + textToType.slice(typedText.length);

        // Calculate progress percentage
        const progress = Math.min((typedText.length / textToType.length) * 100, 100);
        
        // Update the player's progress in Firebase
        const sessionRef = db.collection('matchmakingSessions').doc(sessionId);
        sessionRef.update({
            [`progress.${auth.currentUser.uid}`]: progress
        });

        // Disable the input if the user finishes typing
        if (typedText === textToType) {
            typingField.disabled = true;
            alert('Congratulations! You have finished the race.');
        }
    });
}

// Prevent pasting into the typing field to avoid cheating
document.getElementById('typingField').addEventListener('paste', (e) => {
    e.preventDefault();
});

// Leave the game (this will log the user out or redirect)
document.getElementById('leaveButton').addEventListener('click', () => {
    window.location.href = 'domov.html'; // Redirect to a main page or logout
});
