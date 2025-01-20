import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDocs, collection, deleteDoc, Timestamp, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase App
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// References to DOM elements
const mailIcon = document.getElementById('mailIcon');
const mailWindow = document.getElementById('mailWindow');
const closeMailWindowBtn = document.getElementById('closeMailWindow');
const mailMessagesContainer = document.getElementById('mailMessagesContainer');
const popup = document.getElementById('popup');
const popupContent = document.getElementById('popupContent');
const popupCloseBtn = document.getElementById('popupClose');

// Show mail window when icon is clicked
mailIcon.addEventListener('click', () => {
    mailWindow.style.display = 'block';
    loadMessages(); // Load messages when mail window is opened
});

// Close mail window
closeMailWindowBtn.addEventListener('click', () => {
    mailWindow.style.display = 'none';
});

// Close popup
popupCloseBtn.addEventListener('click', () => {
    popup.style.display = 'none';
});

async function loadMessages() {
    const user = auth.currentUser;
    if (!user) {
        mailMessagesContainer.innerHTML = ''; // Clear mail container if no user
        console.log('No user is logged in.');
        return;
    }

    const mailCollectionRef = collection(db, 'notifications');
    const querySnapshot = await getDocs(mailCollectionRef);

    mailMessagesContainer.innerHTML = ''; // Clear previous messages

    let hasUserMessages = false; // Flag to check if user has any messages

    if (querySnapshot.empty) {
        mailMessagesContainer.innerHTML = '<p><b>Ni trenutnih sporočil.</b></p>';
    } else {
        querySnapshot.forEach(async (docSnapshot) => {
            const mail = docSnapshot.data();
            const mailId = docSnapshot.id;

            // Check if the mail is public or contains the current user's UID in targetUsers
            const targetUsers = mail.targetUsers || [];
            const isPublic = targetUsers.length === 0 || targetUsers.includes(user.uid);

            if (isPublic) {
                const mailDiv = document.createElement('div');
                mailDiv.classList.add('mail-message');

                const title = document.createElement('h3');
                title.textContent = mail.title;

                const expirationText = document.createElement('p');
                let expirationDate;

                // Check if expiration exists and is a Firestore Timestamp or a valid date
                if (mail.expiration) {
                    console.log('ExpiresAt value:', mail.expiration);

                    // If it's a Firestore Timestamp, convert it to a JavaScript Date object
                    if (mail.expiration instanceof Timestamp) {
                        expirationDate = mail.expiration.toDate();
                    } else if (typeof mail.expiration === 'string' || typeof mail.expiration === 'number') {
                        // Handle case where expiration is a string or number (timestamps in other formats)
                        expirationDate = new Date(mail.expiration);
                    }
                } else {
                    console.log('No expiration value found.');
                }

                if (expirationDate && !isNaN(expirationDate.getTime())) {
                    expirationText.textContent = `Poteče čez: ${expirationDate.toLocaleDateString()} at ${expirationDate.toLocaleTimeString()}`;
                    
                    // Countdown logic
                    const countdown = setInterval(() => {
                        const now = new Date();
                        const timeRemaining = expirationDate - now;

                        if (timeRemaining <= 0) {
                            clearInterval(countdown);
                            deleteExpiredMail(mailId);
                            mailDiv.remove(); // Remove the mail div
                            checkEmptyMessagesContainer(); // Check if the container is empty after removing the mail

                            // Close the popup if the expired mail is currently open
                            const currentMailIdInPopup = popupContent.getAttribute('data-mail-id');
                            if (currentMailIdInPopup === mailId) {
                                popup.style.display = 'none';
                                const overlay = document.querySelector('.overlay');
                                overlay.style.display = 'none';
                            }
                        } else {
                            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
                            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
                            expirationText.textContent = `Poteče čez: ${hours}h ${minutes}m ${seconds}s`;
                        }
                    }, 1000);
                } else {
                    expirationText.textContent = 'Poteče čez: Invalid Date';
                }

                mailDiv.appendChild(title);
                mailDiv.appendChild(expirationText);

                // Automatically delete expired mails
                if (expirationDate && new Date() > expirationDate) {
                    deleteExpiredMail(mailId);
                    mailDiv.remove();
                    checkEmptyMessagesContainer(); // Check if the container is empty after removing the mail
                } else {
                    // Display only unexpired mails
                    const description = document.createElement('p');
                    description.innerHTML = mail.description || '';  // Using innerHTML to allow HTML formatting
                    mailDiv.appendChild(description);

                    const readMoreLink = document.createElement('a');
                    readMoreLink.href = '#';
                    readMoreLink.textContent = 'Preberi več';
                    readMoreLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        openPopup(mail, mailId); // Open popup with mail details
                    });
                    mailDiv.appendChild(readMoreLink);

                    mailMessagesContainer.appendChild(mailDiv);
                    hasUserMessages = true; // Set flag if user has messages
                }
            }
        });
    }

    // If the user has no messages, display the "Ni trenutnih sporočil." message
    if (!hasUserMessages) {
        mailMessagesContainer.innerHTML = '<p><b>Ni trenutnih sporočil.</b></p>';
    }
}


// Function to open the popup and display the mail content
function openPopup(mail, mailId) {
    // Reference to the Firestore collection and document
    const mailRef = doc(db, 'notifications', mailId);  // Updated to use the modular approach

    // Fetch the document from Firestore
    getDoc(mailRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const mail = docSnapshot.data();
            
            // Clear previous content
            popupContent.innerHTML = '';
     
            

            // Ensure mail has a title
            const title = document.createElement('h3');
            title.textContent = mail.title || 'No title available';  // Default if title is missing
            title.style.textAlign = 'center'; // Center the title
            title.style.marginTop = '20px'; // Add some space above the title
            popupContent.appendChild(title);

            // Ensure fullMessage is present and allow HTML formatting
            const fullMessage = mail.fullMessage || 'No message content available'; // Default if message is empty
            const description = document.createElement('p');
            description.innerHTML = fullMessage;  // Allow HTML formatting
             // Center the description
            description.style.marginTop = '20px'; // Add some space above the description
            description.style.wordWrap = 'break-word';  // Ensure long text wraps properly
            description.style.whiteSpace = 'normal';  // Allow the text to break and wrap
            description.style.maxWidth = '300px'; // Optional: set a max width for better control
            popupContent.appendChild(description);

            // Check for rewards and display accordingly
            if (mail.type === "reward" && mail.reward) {
                const rewardText = document.createElement('p');
                // rewardText.textContent = `Prejeli ste ${mail.reward.amount} ${mail.reward.item}!`;
                rewardText.style.textAlign = 'center'; // Center the reward text
                rewardText.style.marginTop = '20px'; // Add some space above the reward text
                popupContent.appendChild(rewardText);

                const claimButton = document.createElement('button');
                claimButton.textContent = 'Vnovči nagrado';
                claimButton.style.backgroundColor = '#4CAF50'; // Green color for reward
                claimButton.style.color = '#fff';
                claimButton.style.padding = '15px 20px';
                claimButton.style.fontSize = '16px';
                claimButton.style.fontWeight = 'bold';
                claimButton.style.marginLeft = '12px';
                claimButton.style.cursor = 'pointer';
                claimButton.style.border = 'none';
                claimButton.style.borderRadius = '8px';
                claimButton.style.marginTop = '30px'; // Move further down
                claimButton.style.width = '90%'; // Slightly wider
                claimButton.style.boxSizing = 'border-box'; // Make sure padding doesn't increase width

                claimButton.addEventListener('click', () => {
                    claimReward(mailId);
                    popup.style.display = 'none';
                    const overlay = document.querySelector('.overlay');
                    overlay.style.display = 'none';
                });
                popupContent.appendChild(claimButton);
            }

             // Create and style the close button
             const closeButton = document.createElement('button');
             closeButton.textContent = 'Zapri'; // Change text to "Zapri"
             closeButton.style.backgroundColor = '#f44336'; // Red color for close
             closeButton.style.color = '#fff';
             closeButton.style.padding = '15px 20px';
             closeButton.style.fontSize = '16px';
             closeButton.style.fontWeight = 'bold';
             closeButton.style.marginLeft = '12px';
             closeButton.style.cursor = 'pointer';
             closeButton.style.border = 'none';
             closeButton.style.borderRadius = '8px';
             closeButton.style.marginTop = '10px'; // Add space between the buttons
             closeButton.style.width = '90%'; // Slightly wider
             closeButton.style.boxSizing = 'border-box'; // Make sure padding doesn't increase width
             closeButton.addEventListener('click', () => {
                 popup.style.display = 'none';
                 overlay.style.display = 'none';
             });
             popupContent.appendChild(closeButton);

            popup.style.display = 'block'; // Display the popup
            const overlay = document.querySelector('.overlay');
            overlay.style.display = 'block';
          

            // Center popup window
            popup.style.position = 'absolute';
            popup.style.top = '50%';
            popup.style.left = '50%';
            popup.style.transform = 'translate(-50%, -50%)';
            popup.style.zIndex = '998';
        }
    }).catch((error) => {
        console.error("Error fetching document:", error);
    });
}

// Function to claim the reward for the user
function claimReward(mailId) {
    const user = auth.currentUser;  // Get the current user
    if (!user) {
        console.log('No user is logged in.');
        return;
    }

    const mailRef = doc(db, 'notifications', mailId);

    // Fetch the mail document
    getDoc(mailRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
            const mailData = docSnapshot.data();
            const claimedArray = mailData.claimed || [];  // Get the existing claimed array or initialize an empty array

            // Check if the user has already claimed the reward
            if (claimedArray.includes(user.uid)) {
                console.log('Reward has already been claimed by this user.');
                return;
            }

            // Add the user UID to the claimed array
            claimedArray.push(user.uid);

            // Update the Firestore document with the new claimed array
            updateDoc(mailRef, {
                claimed: claimedArray
            }).then(() => {
                console.log('Reward claimed successfully.');

                // Remove the message div from the DOM
                const mailDiv = document.querySelector(`#mail-${mailId}`);
                if (mailDiv) {
                    mailDiv.remove();
                    checkEmptyMessagesContainer(); // Check if the container is empty after removing the mail
                }

                // Optionally, handle any other reward logic (e.g., add items to the user's inventory)
                // For example, add the reward to the user's account here.

                closePopup();  // Close the popup after claiming the reward
            }).catch((error) => {
                console.error('Error updating claimed status in Firestore:', error);
            });
        } else {
            console.error('Mail not found.');
        }
    }).catch((error) => {
        console.error('Error fetching mail document:', error);
    });
}


// Function to close the popup
function closePopup() {
    popup.style.display = 'none';
}

// Function to delete expired mails
function deleteExpiredMail(mailId) {
    const mailRef = doc(db, 'notifications', mailId);
    deleteDoc(mailRef).then(() => {
        console.log(`Mail with ID ${mailId} has expired and been deleted.`);
    }).catch((error) => {
        console.error('Error deleting mail:', error);
    });
}

