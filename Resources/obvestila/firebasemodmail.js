import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, collection, updateDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const mailIcon = document.getElementById('mailIcon');
const mailWindow = document.getElementById('mailWindow');
const mailMessagesContainer = document.getElementById('mailMessagesContainer');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const claimRewardButton = document.getElementById('claimReward');
const overlay = document.getElementById('mailOverlay');
const closeButton = document.createElement('button');
const closeMailWindowButton = document.getElementById('closeMailWindow');

// Event listener for opening the mail window
mailIcon.addEventListener('click', () => {
    mailWindow.style.display = 'block';
    setupRealTimeUpdates();  // Replace loadMessages with real-time updates
});

// Event listener to close the mail window
closeMailWindowButton.addEventListener('click', () => {
    mailWindow.style.display = 'none';
    overlay.style.display = 'none'; // Close the overlay
});

function setupRealTimeUpdates() {
    const user = auth.currentUser;
    if (!user) {
        mailMessagesContainer.innerHTML = '<p><b>Prosimo prijavite se za ogled sporočil.</b></p>';
        return;
    }

    // Real-time listener for 'notifications' collection
    onSnapshot(collection(db, 'notifications'), (querySnapshot) => {
        mailMessagesContainer.innerHTML = '';
        let hasVisibleMessages = false;

        querySnapshot.forEach(async (docSnapshot) => {
            const mail = docSnapshot.data();
            const mailId = docSnapshot.id;
            const targetUsers = mail.targetUsers || [];
            const isPublic = targetUsers.length === 0 || targetUsers.includes(user.uid);
            const userDeletedMails = mail.hasDeletedMail || [];

            if (userDeletedMails.includes(user.uid)) return;

            if (isPublic) {
                hasVisibleMessages = true;
                const mailDiv = document.createElement('div');
                mailDiv.classList.add('mail-message');

                const title = document.createElement('h3');
                title.textContent = mail.title;

                const description = document.createElement('p');
                description.textContent = mail.description || 'Brez opisa';
                description.style.overflow = 'hidden';
                description.style.textOverflow = 'ellipsis';
                description.style.whiteSpace = 'nowrap';

                const readMoreLink = document.createElement('a');
                readMoreLink.href = "#";
                readMoreLink.textContent = "Preberi več";
                readMoreLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    openPopup(mail, mailId);
                });

                const deleteButton = document.createElement('button');
                deleteButton.textContent = "Izbriši";
                deleteButton.style.marginLeft = "10px";
                deleteButton.style.backgroundColor = "red";
                deleteButton.style.color = "white";
                deleteButton.addEventListener('click', async () => {
                    const claimedArray = mail.claimed || [];
                    const user = auth.currentUser;
                
                    // Check if the current user has claimed the reward before allowing them to delete the mail
                    if (mail.type === "reward" && !claimedArray.includes(user.uid)) {
                        alert('Najprej morate prevzeti nagrado, preden jo izbrišete.');
                        return;
                    }
                
                    // Allow deletion if the current user has claimed the reward or if it's not a reward mail
                    const hasDeletedMail = mail.hasDeletedMail || [];
                    hasDeletedMail.push(user.uid);
                    await updateDoc(doc(db, 'notifications', mailId), { hasDeletedMail });
                    mailDiv.remove();
                
                    if (!mailMessagesContainer.hasChildNodes()) {
                        mailMessagesContainer.innerHTML = '<p><b>Ni trenutnih sporočil.</b></p>';
                    }
                });

                // Check if the expiration timestamp has passed
                const expirationTimestamp = mail.expiration;
                if (expirationTimestamp && expirationTimestamp <= Date.now() / 1000) {
                    // Document expired, delete it
                    await deleteDoc(doc(db, 'notifications', mailId));
                    return; // Skip adding the expired mail to the list
                }

                mailDiv.appendChild(title);
                mailDiv.appendChild(description);
                mailDiv.appendChild(readMoreLink);
                mailDiv.appendChild(deleteButton);
                mailMessagesContainer.appendChild(mailDiv);
            }
        });

        if (!hasVisibleMessages) {
            mailMessagesContainer.innerHTML = '<p><b>Ni trenutnih sporočil.</b></p>';
        }
    });
}

function openPopup(mail, mailId) {
    popupContent.innerHTML = `<h3 style="margin-bottom: 20px;">${mail.title}</h3><p style="margin-top: 15px; margin-bottom: 20px;">${mail.fullMessage || 'Ni vsebine.'}</p>`;
    popup.style.display = 'block';
    overlay.style.display = 'block';

    if (mail.type === "reward") {
        claimRewardButton.classList.remove("hidden");
        claimRewardButton.onclick = () => claimReward(mailId);
        claimRewardButton.style.backgroundColor = '#4CAF50';
        claimRewardButton.style.color = '#fff';
        claimRewardButton.style.padding = '15px';
        claimRewardButton.style.marginBottom = '10px'; // Reduced bottom margin
        claimRewardButton.style.fontSize = '16px';
        claimRewardButton.style.width = '100%';
        claimRewardButton.style.display = 'block';
        claimRewardButton.style.cursor = 'pointer';
        claimRewardButton.textContent = 'Prevzemi nagrado';
        claimRewardButton.onmouseover = function () {
            claimRewardButton.style.backgroundColor = '#66BB6A';
        };
        claimRewardButton.onmouseout = function () {
            claimRewardButton.style.backgroundColor = '#4CAF50';
        };
        popupContent.appendChild(claimRewardButton);
    } else {
        claimRewardButton.classList.add("hidden");
    }

    if (!popupContent.contains(closeButton)) {
        closeButton.textContent = 'Zapri';
        closeButton.style.backgroundColor = '#f44336';
        closeButton.style.color = '#fff';
        closeButton.style.padding = '15px';
        closeButton.style.marginBottom = '10px'; // Reduced bottom margin
        closeButton.style.fontSize = '16px';
        closeButton.style.width = '100%';
        closeButton.style.display = 'block';
        closeButton.style.cursor = 'pointer';
        closeButton.onmouseover = function () {
            closeButton.style.backgroundColor = '#FF7961';
        };
        closeButton.onmouseout = function () {
            closeButton.style.backgroundColor = '#f44336';
        };
        closeButton.addEventListener('click', closePopup);
        popupContent.appendChild(closeButton);
    }
}

function closePopup() {
    popup.style.display = 'none';
    overlay.style.display = 'none';
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
            alert('Nagrada je bila že prevzeta!');
            console.log('Reward already claimed by user.');
            return;
        }

        claimedArray.push(user.uid);
        await updateDoc(mailRef, { claimed: claimedArray });

        const rewardItem = mailData.reward?.item;
        const rewardAmount = parseInt(mailData.reward?.amount, 10); // Convert amount to a number

        if (rewardItem === "vrtljaji" && !isNaN(rewardAmount)) {
            const userEventRef = doc(db, 'lbEventData', user.uid);
            const userEventDoc = await getDoc(userEventRef);

            if (userEventDoc.exists()) {
                const userData = userEventDoc.data();
                const currentSpins = userData.free_spins || 0;
                const newSpins = currentSpins + rewardAmount;

                try {
                    await updateDoc(userEventRef, { free_spins: newSpins });
                    console.log("Successfully updated the spins in Firestore.");
                } catch (error) {
                    console.error("Error updating spins:", error);
                }
            } else {
                console.log("User document not found in lbEventData.");
            }
        } else {
            console.log("No reward item 'vrtljaji' found or invalid amount.");
        }

        alert('Nagrada uspešno prevzeta!');
        closePopup();
    } else {
        console.log("Mail document not found.");
    }
}
