import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDocs, collection, deleteDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const mailIcon = document.getElementById('mailIcon');
const mailWindow = document.getElementById('mailWindow');
const closeMailWindowBtn = document.getElementById('closeMailWindow');
const mailMessagesContainer = document.getElementById('mailMessagesContainer');
const popup = document.getElementById('popup'); // Popup container
const popupContent = document.getElementById('popupContent'); // Popup content
const popupCloseBtn = document.getElementById('popupClose'); // Close button for popup
const claimRewardButton = document.getElementById('claimReward'); // Claim reward button
const closeFullMessageButton = document.getElementById('closeFullMessage'); // Close button for full message popup
const overlay = document.querySelector('.mailOverlay'); // Overlay for popup

// Ensure the mail messages container is scrollable with a maximum height
mailMessagesContainer.style.overflowY = "auto";
mailMessagesContainer.style.maxHeight = "400px"; // Prevents overflow, allows scrolling

mailIcon.addEventListener('click', () => {
    mailWindow.style.display = 'block';
    loadMessages();
});

closeMailWindowBtn.addEventListener('click', () => {
    mailWindow.style.display = 'none';
});

// Close popup
popupCloseBtn.addEventListener('click', closePopup);

// Close full message popup
closeFullMessageButton.addEventListener('click', closePopup);

async function loadMessages() {
    const user = auth.currentUser;
    if (!user) {
        mailMessagesContainer.innerHTML = '<p><b>Prosimo prijavite se za ogled sporočil.</b></p>';
        return;
    }

    const querySnapshot = await getDocs(collection(db, 'notifications'));
    mailMessagesContainer.innerHTML = '';

    if (querySnapshot.empty) {
        mailMessagesContainer.innerHTML = '<p><b>Ni trenutnih sporočil.</b></p>';
    } else {
        querySnapshot.forEach(async (docSnapshot) => {
            const mail = docSnapshot.data();
            const mailId = docSnapshot.id;
            const targetUsers = mail.targetUsers || [];
            const isPublic = targetUsers.length === 0 || targetUsers.includes(user.uid);

            if (isPublic) {
                const mailDiv = document.createElement('div');
                mailDiv.classList.add('mail-message');

                const titleContainer = document.createElement('div');
                titleContainer.style.display = "flex";
                titleContainer.style.justifyContent = "space-between";
                titleContainer.style.alignItems = "center";

                const title = document.createElement('h3');
                title.textContent = mail.title;

                // Expiration Date Display
                const expirationText = document.createElement('span');
                expirationText.style.fontSize = "12px";
                expirationText.style.color = "#888";
                expirationText.style.fontWeight = "bold";
                expirationText.textContent = mail.expiration ? `Exp: ${new Date(mail.expiration.toDate()).toLocaleString()}` : "No Expiration";

                const description = document.createElement('p');
                description.textContent = mail.description || 'Brez opisa';
                description.style.overflow = 'hidden';
                description.style.textOverflow = 'ellipsis';
                description.style.whiteSpace = 'nowrap';

                titleContainer.appendChild(title);
                titleContainer.appendChild(expirationText);
                mailDiv.appendChild(titleContainer);
                mailDiv.appendChild(description); // Add description to mail div

                // "Preberi več" link to show popup
                const readMoreLink = document.createElement('a');
                readMoreLink.href = "#";
                readMoreLink.textContent = "Preberi več";
                readMoreLink.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default anchor behavior
                    openPopup(mail, mailId); // Open the popup with the mail content
                });
                mailDiv.appendChild(readMoreLink);

                // Delete option
                const deleteButton = document.createElement('button');
                deleteButton.textContent = "Izbriši";
                deleteButton.style.color = "white"; // White text
                deleteButton.style.backgroundColor = "red"; // Red background
                deleteButton.style.marginLeft = "10px"; // Move slightly to the right
                deleteButton.addEventListener('click', async () => {
                    const claimedArray = mail.claimed || [];
                    if (claimedArray.length === 0) { // Only allow deletion if no claims
                        await deleteDoc(doc(db, 'notifications', mailId));
                        mailDiv.remove(); // Remove the mail message from the UI
                    } else {
                        alert('Ne morete izbrisati, dokler je nagrada neprevzeta.');
                    }
                });
                mailDiv.appendChild(deleteButton);

                mailMessagesContainer.appendChild(mailDiv);
            }
        });
    }
}

// Function to open the popup
async function openPopup(mail, mailId) {
    popupContent.innerHTML = '';
    popupContent.setAttribute('data-mail-id', mailId);

    const title = document.createElement('h3');
    title.textContent = mail.title || 'No title available';
    title.style.textAlign = 'center';
    title.style.marginTop = '20px';
    popupContent.appendChild(title);

    const fullMessage = document.createElement('p');
    fullMessage.innerHTML = mail.fullMessage || 'No message content available';
    fullMessage.style.wordWrap = 'break-word';
    fullMessage.style.whiteSpace = 'normal';
    popupContent.appendChild(fullMessage);

    // Check if it's a reward mail and if the user has already claimed it
    const user = auth.currentUser;
    if (mail.type === "reward" && mail.reward) {
        const claimedArray = mail.claimed || [];
        if (claimedArray.includes(user.uid)) {
            const claimedText = document.createElement('p');
            claimedText.textContent = "Nagrada je bila že prevzeta.";
            claimedText.style.color = "red"; // Optional styling
            popupContent.appendChild(claimedText);
        } else {
            claimRewardButton.classList.remove("hidden");
            claimRewardButton.style.backgroundColor = "green"; // Style for green button
            claimRewardButton.style.color = "white"; // White text for button
            claimRewardButton.onclick = () => claimReward(mailId);
            popupContent.appendChild(claimRewardButton);
        }
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Zapri';
    closeButton.style.backgroundColor = '#f44336';
    closeButton.style.color = '#fff';
    closeButton.style.padding = '15px 20px';
    closeButton.style.fontSize = '16px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.cursor = 'pointer';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '8px';
    closeButton.style.marginTop = '20px'; // Move down from main text
    closeButton.style.width = '100%';
    closeButton.style.boxSizing = 'border-box';
    closeButton.addEventListener('click', closePopup);
    popupContent.appendChild(closeButton);

    popup.style.display = 'block';
    overlay.style.display = 'block'; // Show overlay
    document.body.style.overflow = 'hidden'; // Disable body scroll
}

function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none'; // Hide overlay
    document.body.style.overflow = 'auto'; // Enable body scroll
}

async function claimReward(mailId) {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user is logged in.');
        return;
    }

    const mailRef = doc(db, 'notifications', mailId);
    const mailDoc = await getDoc(mailRef);

    if (mailDoc.exists()) {
        const mailData = mailDoc.data();
        const claimedArray = mailData.claimed || [];

        if (claimedArray.includes(user.uid)) {
            console.log('Reward already claimed by user.');
            return;
        }

        claimedArray.push(user.uid); // Add user ID to claimed array
        await updateDoc(mailRef, { claimed: claimedArray });
        alert('Nagrada uspešno prevzeta!');
        closePopup(); // Close the popup after claiming
    }
}
