import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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


let sessionId;
let startTime;
let typingInterval;

// Fetch a random Wikipedia snippet (in Slovenian)
async function fetchRandomWikipediaSnippet() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];
    return firstPage.extract;
}

// Clean the text
function cleanText(text) {
    return text
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[^\w\s,.!?čšžČŠŽ]/g, '');
}

// Split text into sentences
function splitIntoSentences(text) {
    const sentences = text.match(/[^.!?]*[.!?]/g) || [];
    return sentences.slice(0, 5).join(' ');
}

// Fetch random text
async function fetchRandomTextAndTranslate() {
    const snippet = await fetchRandomWikipediaSnippet();
    let gameText = cleanText(snippet);
    gameText = splitIntoSentences(gameText);
    return gameText;
}

// Find or create matchmaking session
async function findOrCreateSession() {
    // Check if there is an existing session that isn't full or completed
    const q = query(collection(db, 'matchmakingSessions'), where("playersCount", "<", 2));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        // Join the first available session
        const firstAvailableSession = querySnapshot.docs[0];
        sessionId = firstAvailableSession.id;
        await joinExistingSession(firstAvailableSession);
    } else {
        // Create a new session
        await createNewSession();
    }
}

// Create a new session
async function createNewSession() {
    const newSessionRef = doc(collection(db, 'matchmakingSessions'));
    sessionId = newSessionRef.id;

    const gameText = await fetchRandomTextAndTranslate();

    await setDoc(newSessionRef, {
        text: gameText,
        players: {},
        playersCount: 1  // First player joining
    });

    await joinExistingSession(newSessionRef);
}

// Join an existing session and start the game
async function joinExistingSession(sessionDoc) {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    const sessionData = (await getDoc(sessionRef)).data();

    // Add current player to session
    const playerId = auth.currentUser.uid;
    const playerName = auth.currentUser.displayName || 'Player';

    await updateDoc(sessionRef, {
        [`players.${playerId}`]: {
            progress: 0,
            wpm: 0,
            name: playerName
        },
        playersCount: sessionData.playersCount + 1  // Update player count
    });

    // Load the text for the typing game
    const gameText = sessionData.text;
    document.getElementById('textToType').innerText = gameText;

    limitTextToField(gameText);

    // Display all player progress
    Object.keys(sessionData.players || {}).forEach((playerId) => {
        const playerStats = sessionData.players[playerId];
        updateProgressBar(playerId, playerStats.progress, playerStats.wpm);
    });

    // Start tracking typing progress for the current user
    trackTypingProgress(gameText);
}

// Limit text to the field size
function limitTextToField(text) {
    const textField = document.getElementById('textToType');
    const fieldHeight = textField.clientHeight;
    const sentences = text.split('.').filter(Boolean);

    let truncatedText = '';

    for (let sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        const newText = truncatedText + (truncatedText ? '. ' : '') + trimmedSentence;

        textField.innerText = newText;

        if (textField.clientHeight > fieldHeight) {
            break;
        }
        truncatedText = newText;
    }

    textField.innerText = truncatedText.trim();
}

// Update progress bars for players
function updateProgressBar(playerId, progress, wpm) {
    let progressBar = document.getElementById(`${playerId}-progress`);

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
    }

    if (progress !== undefined) {
        progressBar.style.width = `${progress}%`;
    }

    document.querySelector(`#${playerId}-wpm`).textContent = `${progress !== undefined ? progress.toFixed(0) : 0}% (${wpm} WPM)`;
}

// Track typing progress
function trackTypingProgress(textToType) {
    const typingField = document.getElementById('typingField');
    typingField.value = '';
    startTime = new Date().getTime();

    clearInterval(typingInterval);
    typingInterval = setInterval(updateWPM, 1000);

    typingField.addEventListener('input', async (e) => {
        const typedText = e.target.value;
        let correctCount = 0;

        const wordsToType = textToType.split(' ');
        const typedWords = typedText.split(' ');

        if (typedText.length === 0) {
            updateProgressBar(auth.currentUser.uid, 0, 0);
            return;
        }

        for (let i = 0; i < wordsToType.length; i++) {
            if (i < typedWords.length && typedWords[i] === wordsToType[i]) {
                correctCount++;
            }
        }

        const progress = (correctCount / wordsToType.length) * 100;
        const currentWPM = calculateWPM(typedText);

        await savePlayerStats(auth.currentUser.uid, progress, currentWPM);

        updateProgressBar(auth.currentUser.uid, progress, currentWPM);
    });
}

// Calculate WPM
function calculateWPM(text) {
    const elapsedMinutes = (new Date().getTime() - startTime) / 1000 / 60;
    const totalWordsTyped = text.trim().split(/\s+/).length;
    return Math.floor(totalWordsTyped / elapsedMinutes);
}

// Save player stats to Firestore
async function savePlayerStats(playerId, progress, wpm) {
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);

    await updateDoc(sessionRef, {
        [`players.${playerId}.progress`]: Math.min(progress, 100),
        [`players.${playerId}.wpm`]: wpm
    });
}

// Submit button functionality
document.getElementById('submitButton').addEventListener('click', async () => {
    const typedText = document.getElementById('typingField').value;
    const sessionRef = doc(db, 'matchmakingSessions', sessionId);
    const docSnap = await getDoc(sessionRef);

    if (docSnap.exists()) {
        const sessionData = docSnap.data();
        const originalText = sessionData.text;

        if (typedText === originalText) {
            const finalWPM = calculateWPM(typedText);
            alert(`Bravo! Končali ste! Vaša končna WPM je ${finalWPM}.`);
            document.getElementById('typingField').disabled = true;
            clearInterval(typingInterval);
        } else {
            alert("Imate napake v tipkanju. Poskusite znova.");
        }
    }
});

// Initialize session and start game
document.addEventListener('DOMContentLoaded', async () => {
    await findOrCreateSession();
    await startGame();
});
