import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, collection, query, orderBy, deleteField, onSnapshot, where, getDocs, deleteDoc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
        } else {
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
        }
    }

    checkLoginState();
    setupAutoPurge();
    monitorChatMaintenance();

    document.getElementById('loginRedirectBtn').addEventListener('click', function () {
        localStorage.setItem('loginRedirect', 'true');
        window.location.href = '../prijava.html?source=chatroom';
    });

    async function checkLoginState() {
        onAuthStateChanged(auth, async user => {
            const chatMaintenance = await checkChatMaintenance();
            if (chatMaintenance.enabled) {
                chatBox.classList.add('chatMaintenance');
                messageSendBtn.classList.add('chatMaintenance');
                chatBox.placeholder = 'Napaka pri povezavi z strežnikom. Prosimo poskusite kasneje.';
                document.getElementById('maintenanceMessage').textContent = chatMaintenance.message || 'Chat is under maintenance.';
                return;
            }
            
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

    async function checkChatMaintenance() {
        const settingsDoc = await getDoc(doc(db, 'settings', 'chatMaintenance'));
        if (settingsDoc.exists()) {
            return settingsDoc.data();
        }
        return { enabled: false, message: '' };
    }

    async function monitorChatMaintenance() {
        let lastEnabledStatus = false; // Track last known status
    
        setInterval(async () => {
            const chatMaintenance = await checkChatMaintenance();
            
            // If enabled has changed, update chat and show/hide messages accordingly
            if (chatMaintenance.enabled !== lastEnabledStatus) {
                lastEnabledStatus = chatMaintenance.enabled;
    
                const messageContent = `[SERVER] ${chatMaintenance.message}`;
                if (lastEnabledStatus) {
                    // Disable chat inputs
                    chatBox.classList.add('chatMaintenance');
                    messageSendBtn.classList.add('chatMaintenance');
                    chatBox.placeholder = 'Napaka pri povezavi z strežnikom. Prosimo poskusite kasneje.';
                    sendPublicServerMessage(messageContent); // Send the public message
                } else {
                    // Enable chat inputs
                    chatBox.classList.remove('chatMaintenance');
                    messageSendBtn.classList.remove('chatMaintenance');
                    chatBox.placeholder = 'Vnesi sporočilo...';
                }
            }
        }, 1000); // Check every 5 seconds
    }


    async function getUserIp() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'Unknown';
        }
    }

    function loadMessages() {
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, orderBy('timestamp'));

        onSnapshot(messagesQuery, (snapshot) => {
            const messagesDiv = document.getElementById('messages');

            snapshot.docChanges().forEach((change) => {
                const messageId = change.doc.id;
                const messageData = change.doc.data();

                if (change.type === 'added') {
                    getUserColor(messageData.username).then(customColor => {
                        displayMessage(
                            messageId,
                            messageData.username,
                            messageData.text,
                            messageData.timestamp.toDate(),
                            messageData.role,
                            customColor
                        );
                    });
                } else if (change.type === 'removed') {
                    removeMessageDiv(messageId);
                }
            });

            setTimeout(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }, 0);
        });
    }




    async function getUserColor(username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('Username', '==', username));
        const querySnapshot = await getDocs(q);
    
        if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            return userData.customColor || null;
        }
        return null;
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

    function displayMessage(messageId, username, text, timestamp, role, customColor) {
        const messagesDiv = document.getElementById('messages');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.setAttribute('data-message-id', messageId);

        const timestampElement = document.createElement('span');
        timestampElement.classList.add('timestamp');
        timestampElement.textContent = formatTimestamp(timestamp);
        const usernameElement = document.createElement('span');
        usernameElement.classList.add('username');
        
        // Apply custom color if available and user has a valid role
        if ((role === 'owner' || role === 'co-owner' || role === 'admin') && customColor) {
            if (customColor === 'rainbow') {
                usernameElement.classList.add('rainbow-name');
            } else {
                usernameElement.style.color = customColor;
            }
        }
        

        if (role === 'owner') {
            usernameElement.textContent = '[OWNER] ' + username + ': ';
            usernameElement.classList.add('owner');
        } else if (role === 'co-owner') {
            usernameElement.textContent = '[CO OWNER] ' + username + ': ';
            usernameElement.classList.add('coowner');
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
                role: role,
                customColor: userDoc.data().customColor || null
            });
            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    async function handleCommand(commandText, user) {
        const commandArgs = commandText.split(' ');
        const command = commandArgs[0].toLowerCase();
    
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
    
        if (!userDocSnap.exists()) {
            sendPrivateMessage('SERVER: Uporabniški podatki niso najdeni.');
            return;
        }
    
        const userData = userDocSnap.data();
        const userRole = userData.role;
    
        switch (command) {
            case '/color':
                if (userRole !== 'owner' && userRole !== 'co-owner' && userRole !== 'admin') {
                    sendPrivateMessage('SERVER: Nimaš dovoljenja za uporabo tega ukaza.');
                    break;
                }
    
                const colorInput = commandArgs[1];
    
                if (!colorInput) {
                    sendPrivateMessage('SERVER: Uporaba: /barva <barva> ali /barva reset');
                    break;
                }
    
                if (colorInput.toLowerCase() === 'reset') {
                    await updateDoc(userDocRef, { customColor: deleteField() });
                    sendPrivateMessage('SERVER: Barva je bila ponastavljena.');
                } else {
                    await updateDoc(userDocRef, { customColor: colorInput });
                    sendPrivateMessage(`SERVER: Barva nastavljena na "${colorInput}".`);
                }
                break;
    
            case '/maintenance':
                if (userRole !== 'admin' && userRole !== 'owner' && userRole !== 'co-owner') {
                    sendPrivateMessage('SERVER: Primanjkujejo vam zahtevana dovoljenja za uporabo tega ukaza.');
                    break;
                }
    
                const action = commandArgs[1];
                if (action === 'enable') {
                    await enableChatMaintenance();
                } else if (action === 'disable') {
                    await disableChatMaintenance();
                } else {
                    sendPrivateMessage('SERVER: Uporaba: /maintenance <enable|disable>');
                }
                break;
    
            case '/deletemsg':
                if (userRole !== 'admin' && userRole !== 'owner' && userRole !== 'co-owner') {
                    sendPrivateMessage('SERVER: Primanjkujejo vam zahtevana dovoljenja za uporabo tega ukaza.');
                    break;
                }
                const messageId = commandArgs[1];
                await deleteMessage(messageId);
                break;
    
            case '/clearchat':
                if (userRole !== 'admin' && userRole !== 'owner' && userRole !== 'co-owner') {
                    sendPrivateMessage('SERVER: Primanjkujejo vam zahtevana dovoljenja za uporabo tega ukaza.');
                    break;
                }
                await purgeChat();
                break;
    
                case '/mute':
                    if (userRole !== 'admin' && userRole !== 'owner' && userRole !== 'co-owner') {
                        sendPrivateMessage('SERVER: Primanjkujejo vam zahtevana dovoljenja za uporabo tega ukaza.');
                        break;
                    }
        
                    const targetUsername = commandArgs[1];
                    if (!targetUsername) {
                        sendPrivateMessage('SERVER: Uporaba: /mute <username>');
                        break;
                    }
        
                    // Mute logic
                    const targetUserRef = await getUserByUsername(targetUsername);
                    if (!targetUserRef) {
                        sendPrivateMessage('SERVER: Uporabnik ni najden.');
                        break;
                    }
        
                    const targetUserDocRef = doc(db, 'users', targetUserRef.id);
                    await updateDoc(targetUserDocRef, { muted: true });
        
                    sendPublicServerMessage(`SERVER: Uporabnik ${targetUsername} je bil utišan.`);
        
                    // Update UI to disable input field
                    disableChatInput();
                    break;
        
                default:
                    sendPrivateMessage('SERVER: Neznan ukaz.');
                    break;

        }
    }

    async function getUserByUsername(username) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('Username', '==', username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : querySnapshot.docs[0];
    }
    
    // Function to disable the chat input and apply the muted effect
    function disableChatInput() {
        messageSendBtn.disabled = true;
        chatBox.placeholder = 'Ti si utišan. Počakaj, da te odmutirajo.';
    }
    
    // Function to enable the chat input again
    function enableChatInput() {
        messageSendBtn.disabled = false;
        chatBox.placeholder = 'Vnesi sporočilo...';
    }



    async function enableChatMaintenance() {
        try {
            await updateDoc(doc(db, 'settings', 'chatMaintenance'), { enabled: true });
            sendPublicServerMessage('Chat is now under maintenance.');
            chatBox.classList.add('chatMaintenance');
            messageSendBtn.classList.add('chatMaintenance');
            chatBox.placeholder = 'Napaka pri povezavi z strežnikom. Prosimo poskusite kasneje.';
        } catch (error) {
            sendPrivateMessage('SERVER: Napaka pri vklopu vzdrževanja.');
        }
    }
    
    async function disableChatMaintenance() {
        try {
            await updateDoc(doc(db, 'settings', 'chatMaintenance'), { enabled: false });
            sendPublicServerMessage('Chat maintenance has been disabled.');
            chatBox.classList.remove('chatMaintenance');
            messageSendBtn.classList.remove('chatMaintenance');
            chatBox.placeholder = 'Vnesi sporočilo...';
        } catch (error) {
            sendPrivateMessage('SERVER: Napaka pri izklopu vzdrževanja.');
        }
    }
    
    function sendPublicServerMessage(message) {
        const publicMessageElement = document.createElement('div');
        publicMessageElement.classList.add('message', 'server-message');
        publicMessageElement.textContent = message;
        document.getElementById('messages').appendChild(publicMessageElement);
    }
    
    async function deleteMessage(messageId) {
        try {
            await deleteDoc(doc(db, 'messages', messageId));
        } catch (error) {
            sendPrivateMessage('SERVER: Napaka pri brisanju sporočila.');
        }
    }

    async function purgeChat() {
        try {
            const messagesSnapshot = await getDocs(collection(db, 'messages'));
            const deletePromises = [];

            messagesSnapshot.forEach((messageDoc) => {
                deletePromises.push(deleteDoc(doc(db, 'messages', messageDoc.id)));
            });

            await Promise.all(deletePromises);
            sendPrivateMessage('SERVER: Klepet je bil uspešno izpraznjen.');
        } catch (error) {
            sendPrivateMessage('SERVER: Napaka pri praznjenju klepeta.');
        }
    }

    function sendPrivateMessage(message) {
        const privateMessageElement = document.createElement('div');
        privateMessageElement.classList.add('message', 'server-message');
        privateMessageElement.textContent = message;
        document.getElementById('messages').appendChild(privateMessageElement);
    }

    async function setupAutoPurge() {
        const now = new Date();
        const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay()), 0, 0, 0);
        const timeUntilNextMonday = nextMonday.getTime() - now.getTime();

        setTimeout(async () => {
            await purgeChat();
            setInterval(purgeChat, 7 * 24 * 60 * 60 * 1000); // Every Monday
        }, timeUntilNextMonday);
    }

    messageSendBtn.addEventListener('click', handleMessageSend);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey && chatBox.value.trim()) {
            handleMessageSend();
        }

        onAuthStateChanged(auth, async user => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (userData.muted) {
                        disableChatInput(); // Disable input if user is muted
                    } else {
                        enableChatInput(); // Enable input if user is unmuted
                    }
                }
            }
        });
    });
});


