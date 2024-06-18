import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection, query, orderBy, onSnapshot, where, getDocs, deleteDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
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
const auth = getAuth();
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', function () {
    function showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'block';
            document.body.classList.add('popup-open');
        } else {
            console.error(`Popup with ID ${popupId} not found.`);
        }
    }

    function hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
            document.body.classList.remove('popup-open');
        } else {
            console.error(`Popup with ID ${popupId} not found.`);
        }
    }

    showPopup('betaCodePopup');

    document.getElementById('submitBetaCodeBtn').addEventListener('click', async function (event) {
        event.preventDefault();

        const betaCodeInput = document.getElementById('betaCodeInput');
        const betaCodeError = document.getElementById('betaCodeError');
        const betaCode = betaCodeInput.value.trim();

        if (!betaCode) {
            betaCodeError.textContent = 'Prosimo vnesite kodo za beta testiranje.';
            betaCodeError.style.display = 'block';
            return;
        }

        try {
            const betaCodeRef = doc(db, 'betaCodes', betaCode);
            const betaCodeDoc = await getDoc(betaCodeRef);

            if (betaCodeDoc.exists() && betaCodeDoc.data().valid) {
                betaCodeError.style.display = 'none';
                hidePopup('betaCodePopup');
                checkLoginState();
            } else {
                betaCodeError.textContent = 'Prosimo vnesite veljavno beta kodo in poskusite znova!';
                betaCodeError.style.display = 'block';
            }
        } catch (error) {
            console.error(error);
            betaCodeError.textContent = 'Prišlo je do napake. Prosimo poskusite kasneje.';
            betaCodeError.style.display = 'block';
        }
    });

    document.getElementById('loginRedirectBtn').addEventListener('click', function () {
        window.location.href = '../prijava.html?source=chatroom';
    });

    function checkLoginState() {
        onAuthStateChanged(auth, user => {
            if (user) {
                hidePopup('loginPopup');
                document.getElementById('chatroom').classList.remove('hidden');
                loadMessages();
            } else {
                showPopup('loginPopup');
            }
        });
    }

    async function getUserIp() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to get user IP:', error);
            return 'Unknown';
        }
    }

    let lastLoadedMessageTimestamp = null;

function loadMessages() {
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    onSnapshot(messagesQuery, (snapshot) => {
        const messagesDiv = document.getElementById('messages');

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const message = change.doc.data();
                displayMessage(message.username, message.text, message.timestamp.toDate(), message.role);
            }
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
    });
}

function displayMessage(username, text, timestamp, role) {
    const messagesDiv = document.getElementById('messages');

    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const timestampElement = document.createElement('span');
    timestampElement.classList.add('timestamp');
    timestampElement.textContent = new Date(timestamp).toLocaleTimeString();

    const usernameElement = document.createElement('span');
    usernameElement.classList.add('username');
    usernameElement.textContent = role.charAt(0).toUpperCase() + role.slice(1) + ': ' + username;

    const textElement = document.createElement('span');
    textElement.classList.add('text');
    textElement.textContent = text;

    messageElement.appendChild(timestampElement);
    messageElement.appendChild(usernameElement);
    messageElement.appendChild(textElement);

    messagesDiv.appendChild(messageElement);
}

async function handleMessageSend() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();
    const user = auth.currentUser;

    if (!text || !user) {
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const username = userDoc.exists() ? userDoc.data().Username : 'Unknown';
        const role = userDoc.exists() ? userDoc.data().role : 'member';

        const userIp = await getUserIp();
        await addDoc(collection(db, 'messages'), {
            username: username,
            text: text,
            timestamp: new Date(),
            ip: userIp,
            role: role
        });
        messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

document.getElementById('sendMessage').addEventListener('click', handleMessageSend);

document.getElementById('messageInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        handleMessageSend();
    }
});

async function deleteOldMessages() {
    const messagesRef = collection(db, 'messages');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const midnightTimestamp = Timestamp.fromDate(now);

    const messagesQuery = query(messagesRef, where('timestamp', '<=', midnightTimestamp));
    const querySnapshot = await getDocs(messagesQuery);

    querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
    });

    console.log('Deleted messages older than midnight');
}

function scheduleDeletion() {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const timeToMidnight = midnight.getTime() - now.getTime();

    setTimeout(() => {
        deleteOldMessages();
        scheduleDeletion();
    }, timeToMidnight);
}

scheduleDeletion();