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

const chatBox = document.getElementById('messageInput');
const messageSendBtn = document.getElementById('sendMessage');
const overlay = document.getElementById('loginPopupOverlay');

document.addEventListener('DOMContentLoaded', function () {
    function showPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'block';
            document.body.classList.add('popup-open');
+           document.body.classList.add('popupInvulnerable');
            overlay.style.display = 'block';
            console.log(`Showing popup: ${popupId}`);
            console.log('Overlay display:', overlay.style.display);
        } else {
            console.error(`Popup with ID ${popupId} not found.`);
            overlay.style.display = 'none';
            
        }
    }

    function hidePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) {
            popup.style.display = 'none';
            document.body.classList.remove('popup-open');
            overlay.style.display = 'none';
            document.body.classList.remove('popupInvulnerable');
            } else {
            console.error(`Popup with ID ${popupId} not found.`);
           
        }
    }


    checkLoginState();
  

    document.getElementById('loginRedirectBtn').addEventListener('click', function () {
        localStorage.setItem('loginRedirect', 'true');
        window.location.href = '../prijava.html?source=chatroom';
    });

    function checkLoginState() {
        onAuthStateChanged(auth, user => {
            if (user) {
                hidePopup('loginPopup');
                document.getElementById('chatroom').classList.remove('hidden');
                chatBox.style.visibility = 'visible';
                messageSendBtn.style.visibility = 'visible';
                loadMessages();
            } else {
                document.body.classList.add('popup-open');
                showPopup('loginPopup');
                overlay.style.display = 'block';
                document.body.classList.add('popupInvulnerable');

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

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const days = ['Nedelja', 'Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota'];
        const day = days[date.getDay()];

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        return `${day}, ${hours}:${minutes}:${seconds} ${ampm}`;
    }

    function displayMessage(username, text, timestamp, role) {
        const messagesDiv = document.getElementById('messages');
    
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
    
        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = formatTimestamp(timestamp);
    
        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
    
        // Check role first for owner
        if (role === 'owner') {
            usernameElement.textContent = '[Lastnik] ' + username + ': ';
            usernameElement.classList.add('owner');
        } else if (role === 'admin') {
            usernameElement.textContent = '[Admin] ' + username + ': ';
            usernameElement.classList.add('admin');
        } else {
            usernameElement.textContent = username + ': ';
        }
    
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
            const username = userDoc.exists ? userDoc.data().Username : 'Unknown';
            const role = userDoc.exists ? userDoc.data().role : 'member';

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
        const lastWeek = new Date(now);
        lastWeek.setDate(now.getDate() - 7);
        const lastWeekTimestamp = Timestamp.fromDate(lastWeek);

        const messagesQuery = query(messagesRef, where('timestamp', '<=', lastWeekTimestamp));
        const querySnapshot = await getDocs(messagesQuery);

        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

        console.log('Deleted messages older than a week');
    }

    function scheduleDeletion() {
        const now = new Date();
        const nextMonday = new Date();
        nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7));
        nextMonday.setHours(0, 0, 0, 0);

        const timeToNextMonday = nextMonday.getTime() - now.getTime();

        setTimeout(() => {
            deleteOldMessages();
            setInterval(deleteOldMessages, 7 * 24 * 60 * 60 * 1000); // every 7 days
        }, timeToNextMonday);
    }

    scheduleDeletion();
});
