import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

// Function to fetch random text and translate it into Slovenian
async function fetchRandomTextAndTranslate() {
    const gameText = await fetchRandomWikipediaSnippet();

    // Store in Firestore
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    await updateDoc(sessionRef, {
        text: gameText // Store the random text in Firestore
    });

    return gameText; // Return the fetched text
}

// Function to start the game by loading session data
async function startGame() {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    
    // Fetch or generate the game text
    let gameText;
    const docSnap = await getDoc(sessionRef);
    if (docSnap.exists()) {
        const sessionData = docSnap.data();
        
        // Check if the text is already in Firestore
        if (sessionData.text) {
            gameText = sessionData.text; // Use the existing text
        } else {
            // If not, fetch a random Wikipedia snippet and store it in Firestore
            gameText = await fetchRandomTextAndTranslate();
        }
        
        // Display the text to type
        document.getElementById('textToType').innerText = gameText;

        // Initialize progress bars for each player
        Object.keys(sessionData.progress || {}).forEach((playerId) => {
            updateProgressBar(playerId, sessionData.progress[playerId], sessionData.wpm[playerId]);
        });

        trackTypingProgress(gameText); // Start tracking typing progress
    }
}

// Function to update progress bars for players
function updateProgressBar(playerId, progress, wpm) {
    let progressBar = document.getElementById(`${playerId}-progress`);
    
    // Create progress bar if it doesn't exist
    if (!progressBar) {
        const playerName = playerId === auth.currentUser.uid ? 'You' : `Player ${playerId}`;
        
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');
        progressContainer.innerHTML = `
            <span class="player-name">${playerName}</span>
            <div class="progress-bar-container">
                <div class="progress-bar" id="${playerId}-progress" style="width: ${progress}%"></div>
                <div class="moving-lines"></div> <!-- Add moving lines -->
            </div>
            <span class="wpm">${progress}% (${wpm} WPM)</span>
        `;
        if (playerId === auth.currentUser.uid) {
            progressContainer.classList.add('current-user'); // Highlight the current user
            document.getElementById('playersProgress').prepend(progressContainer); // Always place user's bar at the top
        } else {
            document.getElementById('playersProgress').appendChild(progressContainer);
        }
    } else {
        progressBar.style.width = `${progress}%`;
        document.querySelector(`#${playerId}-container .wpm`).textContent = `${progress}% (${wpm} WPM)`;
    }
}

// Function to track typing progress and check for errors
function trackTypingProgress(textToType) {
    const typingField = document.getElementById('typingField');
    const startTime = new Date().getTime(); // Start time for WPM calculation

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
        
        // Calculate Words Per Minute (WPM)
        const currentTime = new Date().getTime();
        const elapsedTimeInMinutes = (currentTime - startTime) / (1000 * 60);
        const wordCount = typedText.split(' ').length; // Estimate word count based on spaces
        const wpm = Math.round(wordCount / elapsedTimeInMinutes);

        // Update the player's progress in Firebase
        const sessionRef = doc(db, 'matchmakingSessions', sessionId);
        updateDoc(sessionRef, {
            [`progress.${auth.currentUser.uid}`]: progress,
            [`wpm.${auth.currentUser.uid}`]: wpm,
        });

        // Update UI progress bar
        updateProgressBar(auth.currentUser.uid, progress, wpm);

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

// Call startGame function when ready to initialize the game
startGame();
