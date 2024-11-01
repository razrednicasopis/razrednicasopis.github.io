import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc, collection } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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
const db = getFirestore();
const auth = getAuth();

let sessionId; // ID of the current matchmaking session
let startTime; // Start time for WPM calculation
let typingInterval; // Interval for updating WPM and percentage

// Fetch a random Wikipedia snippet (in Slovenian)
async function fetchRandomWikipediaSnippet() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();
    
    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];
    
    return firstPage.extract; // Return the extract of the random Wikipedia page
}

// Clean the text by removing unusual characters and excessive spaces
function cleanText(text) {
    return text
        .replace(/[\r\n]+/g, ' ') // Remove newlines
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim() // Remove leading and trailing spaces
        .replace(/[^\w\s,.!?čšžČŠŽ]/g, ''); // Allow Slovenian special characters
}

// Function to split text into sentences
function splitIntoSentences(text) {
    const sentences = text.match(/[^.!?]*[.!?]/g) || []; // Split into sentences
    return sentences.slice(0, 5).join(' '); // Limit to 5 sentences
}

// Function to fetch random text and translate it into Slovenian
async function fetchRandomTextAndTranslate() {
    let gameText = '';

    // Fetch a random Wikipedia snippet
    const snippet = await fetchRandomWikipediaSnippet();
    gameText = cleanText(snippet); // Clean the text

    // Limit to 5 sentences
    gameText = splitIntoSentences(gameText);

    // Store in Firestore
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    await updateDoc(sessionRef, {
        text: gameText // Store the random text in Firestore
    });

    return gameText; // Return the cleaned fetched text
}

// Function to create or retrieve a matchmaking session
async function initializeSession() {
    const newSessionRef = doc(collection(db, 'matchmakingSessions')); // Create a new document reference
    sessionId = newSessionRef.id; // Assign the new session ID to sessionId

    // Create a new session in Firestore with initial data
    await setDoc(newSessionRef, {
        progress: {},
        wpm: {},
        text: ''
    });
}

// Function to start the game by loading session data
async function startGame() {
    if (!sessionId) {
        console.error("Session ID is not defined. Please create or join a session first.");
        return; // Exit the function if sessionId is not defined
    }

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

        // Ensure text is within field
        limitTextToField(gameText);

        // Initialize progress bars for each player
        Object.keys(sessionData.progress || {}).forEach((playerId) => {
            updateProgressBar(playerId, sessionData.progress[playerId], sessionData.wpm[playerId]);
        });

        trackTypingProgress(gameText); // Start tracking typing progress
    }
}

// Function to limit the text to fit within a designated field
function limitTextToField(text) {
    const textField = document.getElementById('textToType');
    const fieldHeight = textField.clientHeight;
    const sentences = text.split('.').filter(Boolean); // Split into sentences

    let truncatedText = '';

    for (let sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length === 0) continue; // Skip empty sentences

        const newText = truncatedText + (truncatedText ? '. ' : '') + trimmedSentence;

        textField.innerText = newText;

        if (textField.clientHeight > fieldHeight) {
            break; // If exceeds the field height, stop adding
        }
        truncatedText = newText; // Update truncated text
    }

    textField.innerText = truncatedText.trim(); // Set the final truncated text
}

// Function to update progress bars for players
function updateProgressBar(playerId, progress, wpm) {
    let progressBar = document.getElementById(`${playerId}-progress`);
    
    // Create progress bar if it doesn't exist
    if (!progressBar) {
        const playerName = playerId === auth.currentUser.uid ? `${auth.currentUser.displayName || 'Player'}` : `Player ${playerId}`; 
        
        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');
        progressContainer.innerHTML = `
            <span class="player-name">${playerName}</span>
            <div class="progress-bar-container">
                <div class="progress-bar" id="${playerId}-progress" style="width: 0%"></div>
                <div class="moving-lines"></div>
            </div>
            <span class="wpm" id="${playerId}-wpm">0% (0 WPM)</span>
        `;
        if (playerId === auth.currentUser.uid) {
            progressContainer.classList.add('current-user');
            document.getElementById('playersProgress').prepend(progressContainer);
        } else {
            document.getElementById('playersProgress').appendChild(progressContainer);
        }
    } else {
        // Update progress only if a valid progress value is provided
        if (progress !== undefined) {
            progressBar.style.width = `${progress}%`;
        }
    }
    
    // Update WPM display
    document.querySelector(`#${playerId}-wpm`).textContent = `${progress !== undefined ? progress.toFixed(0) : 0}% (${wpm} WPM)`;
}

// Function to track typing progress and check for errors
function trackTypingProgress(textToType) {
    const typingField = document.getElementById('typingField');
    typingField.value = ''; // Clear the typing field initially
    startTime = new Date().getTime(); // Start time for WPM calculation

    // Clear previous interval
    clearInterval(typingInterval);
    typingInterval = setInterval(updateWPM, 1000); // Update WPM every second

    typingField.addEventListener('input', (e) => {
        const typedText = e.target.value;
        let correctCount = 0;

        // Split the text and typedText into words for error checking
        const wordsToType = textToType.split(' ');
        const typedWords = typedText.split(' ');

        // Check if the user has cleared the input
        if (typedText.length === 0) {
            updateProgressBar(auth.currentUser.uid, 0, 0); // Reset progress bar
            return; // Exit the function early if input is empty
        }

        // Check for errors and prepare display text
        for (let i = 0; i < wordsToType.length; i++) {
            if (i < typedWords.length) {
                if (typedWords[i] === wordsToType[i]) {
                    correctCount++; // Count correct words
                }
            }
        }

        // Check if reached the end of the race with no errors
        if (typedWords.length >= wordsToType.length) {
            const finalWPM = calculateWPM(typedText);
            alert(`Bravo! Končali ste! Vaša končna WPM je ${finalWPM}.`);
            typingField.disabled = true; // Disable typing field
            clearInterval(typingInterval); // Stop WPM update
        }

        // Calculate and update progress
        const progress = Math.min((correctCount / wordsToType.length) * 100, 100);
        updateProgressBar(auth.currentUser.uid, progress, calculateWPM(typedText)); // Update progress bar
    });
}

// Function to calculate words per minute
function calculateWPM(typedText) {
    const wordsTyped = typedText.split(' ').length; // Count the number of words typed
    const minutesPassed = (new Date().getTime() - startTime) / 60000; // Convert time to minutes
    return Math.floor(wordsTyped / minutesPassed); // Calculate WPM
}

// Function to update WPM on the display
function updateWPM() {
    const typedText = document.getElementById('typingField').value;
    const finalWPM = calculateWPM(typedText);
    updateProgressBar(auth.currentUser.uid, null, finalWPM); // Update only WPM without progress
}

// Submit button functionality
document.getElementById('submitButton').addEventListener('click', async () => {
    const typedText = document.getElementById('typingField').value;
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    const docSnap = await getDoc(sessionRef);
    
    if (docSnap.exists()) {
        const sessionData = docSnap.data();
        const originalText = sessionData.text;

        // Check if the typed text matches the original text
        if (typedText === originalText) {
            const finalWPM = calculateWPM(typedText);
            alert(`Congratulations! Your final WPM is ${finalWPM}.`);
            document.getElementById('typingField').disabled = true; // Disable the typing field after submission
            clearInterval(typingInterval); // Stop the WPM update
        } else {
            alert("There are errors in your typing. Please try again."); // Show error message
        }
    }
});

// Event listener to initialize the session
document.addEventListener('DOMContentLoaded', async () => {
    await initializeSession(); // Initialize the session
    await startGame(); // Start the game
});
