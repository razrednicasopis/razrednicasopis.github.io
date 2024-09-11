import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection, query, orderBy, onSnapshot, where, getDocs, deleteDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
            document.body.classList.add('popupInvulnerable');
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

    function loadMessages() {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

        onSnapshot(messagesQuery, (snapshot) => {
            const messagesDiv = document.getElementById('messages');

            snapshot.docChanges().forEach((change) => {
                const messageId = change.doc.id;
                const messageData = change.doc.data();

                if (change.type === 'added') {
                    displayMessage(messageId, messageData.username, messageData.text, messageData.timestamp.toDate(), messageData.role);
                } else if (change.type === 'removed') {
                    removeMessageDiv(messageId);
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
        hours = hours ? hours : 12;

        return `${day}, ${hours}:${minutes}:${seconds} ${ampm}`;
    }

    function displayMessage(messageId, username, text, timestamp, role) {
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.setAttribute('data-message-id', messageId);  // Add unique attribute for easy removal

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = formatTimestamp(timestamp);

        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');

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

    function removeMessageDiv(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
            console.log('Message removed from UI:', messageId);
        }
    }

    async function handleMessageSend() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();
        const user = auth.currentUser;

        if (!text || !user) {
            return;
        }

        // Handle commands
        if (text.startsWith('/')) {
            await handleCommand(text, user);
            messageInput.value = '';
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

    async function handleCommand(commandText, user) {
        const commandArgs = commandText.split(' ');
        const command = commandArgs[0].toLowerCase();
    
        // Fetch user data from the 'users' collection to check role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
    
        if (!userDoc.exists) {
            sendPrivateMessage('SERVER: User data not found.');
            return;
        }
    
        const userRole = userDoc.data().role;  // Fetch user role
    
        switch (command) {
            case '/deletemsg':
                if (userRole !== 'admin' && userRole !== 'owner') {
                    sendPrivateMessage('SERVER: You do not have sufficient permissions to execute this command.');
                    break;
                }
                const messageId = commandArgs[1];
                await deleteMessage(messageId);
                break;
    
            case '/chatpurge':
                if (userRole !== 'admin' && userRole !== 'owner') {
                    sendPrivateMessage('SERVER: You do not have sufficient permissions to execute this command.');
                    break;
                }
                await purgeChat();
                break;
    
            case '/mute':
                if (userRole !== 'admin' && userRole !== 'owner') {
                    sendPrivateMessage('SERVER: You do not have sufficient permissions to execute this command.');
                    break;
                }
                const muteUser = commandArgs[1];
                const reason = commandArgs[2] || 'No reason provided';
                const duration = commandArgs[3] || 'indefinite';
                await muteUserCommand(muteUser, reason, duration);
                break;
    
            case '/unmute':
                if (userRole !== 'admin' && userRole !== 'owner') {
                    sendPrivateMessage('SERVER: You do not have sufficient permissions to execute this command.');
                    break;
                }
                const unmuteUser = commandArgs[1];
                await unmuteUserCommand(unmuteUser);
                break;
    
            default:
                sendPrivateMessage('SERVER: Unknown command.');
        }
    }

    async function deleteMessage(messageId) {
        try {
            const messageDocRef = doc(db, 'messages', messageId);
            await deleteDoc(messageDocRef);
            console.log('Message deleted successfully:', messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }

    function sendPrivateMessage(text) {
        const messageInput = document.getElementById('messageInput');
        messageInput.value = text;
    }

    async function muteUserCommand(username, reason, duration) {
        try {
            const userDoc = await getDocs(query(collection(db, 'users'), where('Username', '==', username)));
            if (userDoc.empty) {
                sendPrivateMessage(`SERVER: User ${username} not found.`);
                return;
            }

            const userId = userDoc.docs[0].id;
            await addDoc(collection(db, 'mutedUsers'), {
                username: username,
                userId: userId,
                reason: reason,
                duration: duration,
                timestamp: Timestamp.fromDate(new Date())
            });

            sendPrivateMessage(`SERVER: User ${username} has been muted.`);
        } catch (error) {
            console.error('Error muting user:', error);
            sendPrivateMessage('SERVER: Error muting user.');
        }
    }

    async function unmuteUserCommand(username) {
        try {
            const querySnapshot = await getDocs(query(collection(db, 'mutedUsers'), where('username', '==', username)));
            if (querySnapshot.empty) {
                sendPrivateMessage(`SERVER: User ${username} is not muted.`);
                return;
            }

            querySnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            sendPrivateMessage(`SERVER: User ${username} has been unmuted.`);
        } catch (error) {
            console.error('Error unmuting user:', error);
            sendPrivateMessage('SERVER: Error unmuting user.');
        }
    }

    async function purgeChat() {
        try {
            const messagesSnapshot = await getDocs(collection(db, 'messages'));
            messagesSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
            });

            sendPrivateMessage('SERVER: All messages have been purged.');
        } catch (error) {
            console.error('Error purging chat:', error);
            sendPrivateMessage('SERVER: Error purging chat.');
        }
    }

    messageSendBtn.addEventListener('click', handleMessageSend);
    chatBox.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            handleMessageSend();
        }
    });
});
