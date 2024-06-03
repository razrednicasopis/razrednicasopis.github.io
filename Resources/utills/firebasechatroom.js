import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
    // Function to show a popup
    function showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'block';
            document.body.classList.add('popup-open');
        } else {
            console.error(`Popup with ID ${popupId} not found.`);
        }
    }

    // Function to hide a popup
    function hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
            document.body.classList.remove('popup-open');
        } else {
            console.error(`Popup with ID ${popupId} not found.`);
        }
    }

    // Show beta code popup on page load
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
        window.location.href = '../prijava.html?source=chatroom'; // Redirect with source parameter
    });

    // Check login state
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

    // Get user's IP address
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

    // Load messages from Firestore and display them
    function loadMessages() {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        onSnapshot(messagesQuery, (snapshot) => {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML = ''; // Clear existing messages

            snapshot.forEach((doc) => {
                const message = doc.data();
                displayMessage(message.username, message.text, message.timestamp.toDate());
            });
        });
    }

    // Function to display a message in the chat box
    function displayMessage(username, text, timestamp) {
        const messagesDiv = document.getElementById('messages');

        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = new Date(timestamp).toLocaleTimeString();

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
        usernameElement.textContent = username + ': ';

        const textElement = document.createElement('span');
        textElement.classList.add('text');
        textElement.textContent = text;

        messageElement.appendChild(timestampElement);
        messageElement.appendChild(usernameElement);
        messageElement.appendChild(textElement);

        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
    }

    // Send a message
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

            const userIp = await getUserIp();
            await addDoc(collection(db, 'messages'), {
                username: username,
                text: text,
                timestamp: new Date(),
                ip: userIp
            });
            messageInput.value = ''; // Clear the input field
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    document.getElementById('sendMessage').addEventListener('click', handleMessageSend);

    // Handle enter key press
    document.getElementById('messageInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            handleMessageSend();
        }
    });

    // Initial login state check will now be triggered after beta code verification
});
