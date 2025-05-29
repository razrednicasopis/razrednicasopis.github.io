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


// Cached global variables
let raceText = '';
let currentInput = '';
let aiProgressPercent = 0;
let aiSpeed = 0.3;
let typingField, textToTypeField, submitButton;

let raceStartTime = null;
let userFinished = false;
let userPlace = 0;
let lowestAccuracy = 100;


function getDifficultyFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('difficulty') || 'medium'; // fallback if missing
}

function getAISpeedForDifficulty(difficulty) {
    switch (difficulty) {
        case 'easy':
            return 0.22;
        case 'medium':
            return 0.44;
        case 'hard':
            return 1.0;
        default:
            return 0.44;
    }
}



async function fetchRandomText() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];
    return firstPage.extract;
}

function cleanText(text) {
    const lines = text.split(/\r?\n/);
    const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (trimmed.length < 15 && !/[.!?]/.test(trimmed)) return false;
        return true;
    });
    let cleaned = filteredLines.join(' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/[^\w\s,.!?čšžČŠŽ]/g, '');
    return cleaned;
}

function splitIntoSentences(text) {
    const abbreviations = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr', 'St', 'vs', 'etc', 'e.g', 'i.e', 'MDXCIV', 'Glej'];
    const regex = /(?<!\b(?:\d|[A-Za-z]{1,5}))([.!?])\s+(?=[A-ZČŠŽ])/g;
    let sentences = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        let sentence = text.slice(lastIndex, match.index + 1).trim();
        let lastWord = sentence.split(' ').pop().replace(/[.,!?]$/, '');
        if (abbreviations.includes(lastWord) || /^\d+$/.test(lastWord)) continue;
        sentences.push(sentence);
        lastIndex = match.index + 2;
    }
    if (lastIndex < text.length) sentences.push(text.slice(lastIndex).trim());
    let result = '';
    for (let s of sentences) {
        if ((result + s).length > 500) break;
        result += s + ' ';
    }
    return result.trim();
}

async function generateRaceText() {
    const snippet = await fetchRandomText();
    let cleaned = cleanText(snippet);
    return splitIntoSentences(cleaned);
}

function colorTextByInput(raceText, inputText) {
    let coloredHTML = '';
    for (let i = 0; i < raceText.length; i++) {
        const char = raceText[i];
        if (i < inputText.length) {
            coloredHTML += `<span style="color:${inputText[i] === char ? 'green' : 'red'}">${char}</span>`;
        } else if (i === inputText.length) {
            coloredHTML += `<span class="current-letter">${char}</span>`;
        } else {
            coloredHTML += `<span>${char}</span>`;
        }
    }
    return coloredHTML;
}

function updateProgressBar(id, percent) {
    const bar = document.getElementById(id);
    if (bar) bar.style.width = percent + '%';
}

function updateProgressDisplay(id, percent) {
    const display = document.getElementById(id);
    if (display) display.textContent = Math.floor(percent) + '%';
}

function simulateAIProgress() {
    if (aiProgressPercent < 100) {
        aiProgressPercent += aiSpeed;
        if (aiProgressPercent > 100) aiProgressPercent = 100;
        updateProgressBar('ai-progress', aiProgressPercent);
        updateProgressDisplay('ai-progress-display', aiProgressPercent);
    }
}

async function updateWinsForUser() {
    const user = auth.currentUser;
    if (!user) {
        console.log("User not logged in, skipping wins update.");
        return;
    }

    const userDocRef = doc(db, "aiTRLeaderboards", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        // Create the document with winsNumber = 1
        await setDoc(userDocRef, { winsNumber: 1 });
        console.log("Created new leaderboard doc for user with 1 win.");
    } else {
        // Increment winsNumber by 1
        await updateDoc(userDocRef, {
            winsNumber: increment(1)
        });
        console.log("Incremented winsNumber for user.");
    }
}


function startRaceTimer() {
    raceStartTime = Date.now();
}

function formatRaceTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
}

function calculateWPM(charsTyped, elapsedMs) {
    const words = charsTyped / 5;
    const minutes = elapsedMs / 60000;
    return Math.round(words / minutes) || 0;
}

function showRaceEndPopup(won, place) {
    const popup = document.getElementById('raceEndDialog');
    const overlay = document.getElementById('matchmakingOverlay');
    const message = document.getElementById('raceEndMessage');
    const details = document.getElementById('raceEndDetails');

    overlay.style.display = 'block';

    const elapsedMs = Date.now() - raceStartTime;
    const timeStr = formatRaceTime(elapsedMs);
    let correctChars = 0;
    for (let i = 0; i < currentInput.length; i++) {
         if (currentInput[i] === raceText[i]) correctChars++;
        else break; // stop at first mistake (optional)
    }
    const wpm = calculateWPM(correctChars, elapsedMs);
const accuracy = lowestAccuracy;




    if (won) {
        message.textContent = "Čestitke! Zmagali ste to tipkovno dirko.";
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0 } });
        }
    } else {
        message.textContent = `Končali ste na #${place} mestu!`;
    }

    details.innerHTML = `
      Vaše mesto: #${place}<br>
      Čas dirke: ${timeStr}<br>
      Vaša hitrost tipkanja: ${wpm} WPM <br>
      Natančnost: ${Math.round(accuracy)}%

    `;

    popup.classList.add('show');
}

function hideRaceEndPopup() {
    document.getElementById('raceEndDialog').classList.remove('show');
    document.getElementById('matchmakingOverlay').style.display = 'none';
}


window.addEventListener('DOMContentLoaded', () => {
    initializeTypingRace();

    const leaveBtn = document.getElementById('leaveRaceBtn');
    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            window.location.reload();
        });
    }
});

async function initializeTypingRace() {
    typingField = document.getElementById('typingField');
    textToTypeField = document.getElementById('textToType');
    submitButton = document.getElementById('submitButton');

    const difficulty = getDifficultyFromURL();
    aiSpeed = getAISpeedForDifficulty(difficulty);


    raceText = await generateRaceText();
    textToTypeField.innerHTML = raceText;
    typingField.addEventListener('copy', (e) => e.preventDefault());
    typingField.addEventListener('cut', (e) => e.preventDefault());
    typingField.addEventListener('paste', (e) => e.preventDefault());


    typingField.value = '';
    typingField.disabled = false;
    aiProgressPercent = 0;
    userFinished = false;
    userPlace = 0;
    lowestAccuracy = 100;


    updateProgressBar('user-progress', 0);
    updateProgressDisplay('user-progress-display', 0);

    updateProgressBar('ai-progress', 0);
    updateProgressDisplay('ai-progress-display', 0);

    const yourNameEl = document.getElementById('yourName');
    if (yourNameEl) yourNameEl.textContent = 'Vi';

    startRaceTimer();

    typingField.addEventListener('input', () => {
        if (userFinished) return;

        currentInput = typingField.value;
        textToTypeField.innerHTML = colorTextByInput(raceText, currentInput);

        let correctChars = 0;
        for (let i = 0; i < currentInput.length; i++) {
            if (currentInput[i] === raceText[i]) correctChars++;
            else break;
        }

        const currentAccuracy = (correctChars / currentInput.length) * 100;
        if (!isNaN(currentAccuracy) && currentAccuracy < lowestAccuracy) {
         lowestAccuracy = currentAccuracy;
        }


        const progressPercent = (correctChars / raceText.length) * 100;
        updateProgressBar('user-progress', progressPercent);
        updateProgressDisplay('user-progress-display', progressPercent);
    });

    const aiInterval = setInterval(() => {
        simulateAIProgress();
        if (aiProgressPercent >= 100) {
            clearInterval(aiInterval);
            if (!userFinished) {
                typingField.disabled = true;
                userFinished = true;
                userPlace = 2;
                showRaceEndPopup(false, userPlace);
            }
        }
    }, 200);

submitButton.onclick = () => {
    if (typingField.disabled) return;

    let correctChars = 0;
    for (let i = 0; i < currentInput.length; i++) {
        if (currentInput[i] === raceText[i]) correctChars++;
        else break;
    }

    if (correctChars === raceText.length) {
        typingField.disabled = true;
        userFinished = true;
        userPlace = 1;
        updateProgressBar('user-progress', 100);
        updateProgressDisplay('user-progress-display', 100);
        clearInterval(aiInterval);
        showRaceEndPopup(true, userPlace);
        updateWinsForUser().catch(console.error);
    } else {
        toastr.error('Prosim popravite napake, preden zaključite.', 'Napaka');
         }
    };
}


window.addEventListener('DOMContentLoaded', () => {

    const leaveBtn = document.getElementById('leaveButton');
    const popupLeaveBtn = document.getElementById('leaveRaceBtn');
    const redirectURL = 'domov.html'; // <-- change this to your desired destination

    if (leaveBtn) {
        leaveBtn.addEventListener('click', () => {
            window.location.href = redirectURL;
        });
    }

    if (popupLeaveBtn) {
        popupLeaveBtn.addEventListener('click', () => {
            window.location.href = redirectURL;
        });
    }
});



