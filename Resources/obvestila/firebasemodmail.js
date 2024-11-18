import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Selectors
const mailIcon = document.getElementById("mail-icon");
const unreadCount = document.getElementById("unread-count");
const mailDropdown = document.getElementById("mail-dropdown");
const noMailsMessage = document.getElementById("no-mails");
const mailList = document.getElementById("mail-list");
const mailPopup = document.getElementById("mail-popup");
const popupSubject = document.getElementById("popup-subject");
const popupContent = document.getElementById("popup-content");
const popupExpiration = document.getElementById("popup-expiration");

// State
let userUid = null;

// Toggle Mail Dropdown
function toggleMailDropdown() {
    mailDropdown.classList.toggle("hidden");
}

// Close Detailed Popup
function closeMailPopup() {
    mailPopup.style.display = "none";
}

// Render Not Signed-In Message
function renderNotSignedIn() {
    mailList.innerHTML = ""; // Clear mail list
    noMailsMessage.textContent = "Prosimo prijavite se za ogled sporočil.";
    noMailsMessage.classList.remove("hidden");
    unreadCount.classList.add("hidden");
}

// Render No Mails Message
function renderNoMails() {
    mailList.innerHTML = "";
    noMailsMessage.textContent = "Ni trenutnih sporočil.";
    noMailsMessage.classList.remove("hidden");
    unreadCount.classList.add("hidden");
}

// Show Detailed Mail Popup
function showMailPopup(mail) {
    popupSubject.textContent = mail.title;
    popupContent.textContent = mail.content;
    popupExpiration.textContent = `Veljavnost do: ${new Date(mail.expirationDate).toLocaleString()}`;
    mailPopup.style.display = "block";
}

// Fetch and Render Mails
function fetchAndRenderMails() {
    if (!userUid) {
        renderNotSignedIn();
        return;
    }

    const mailQuery = query(
        collection(db, "mailDatabase"),
        where("isPublicMail", "==", true)
    );

    const userMailQuery = query(
        collection(db, "mailDatabase"),
        where("receivers", "array-contains", userUid)
    );

    const mailSnapshots = [];

    onSnapshot(mailQuery, (snapshot) => {
        snapshot.forEach((doc) => {
            const mailData = { id: doc.id, ...doc.data() };
            mailSnapshots.push(mailData);
        });
        renderMailList(mailSnapshots);
    });

    onSnapshot(userMailQuery, (snapshot) => {
        snapshot.forEach((doc) => {
            const mailData = { id: doc.id, ...doc.data() };
            mailSnapshots.push(mailData);
        });
        renderMailList(mailSnapshots);
    });
}

// Render Mail List
function renderMailList(mails) {
    mailList.innerHTML = ""; // Clear mail list

    const now = Date.now();
    const validMails = mails.filter((mail) => mail.expirationDate > now);

    if (validMails.length === 0) {
        renderNoMails();
        return;
    }

    validMails.forEach((mail) => {
        const mailItem = document.createElement("li");
        mailItem.classList.add("mail-item");

        const title = document.createElement("h4");
        title.textContent = mail.title;

        const description = document.createElement("p");
        description.textContent = mail.description;

        const expiration = document.createElement("p");
        expiration.textContent = `Veljavnost do: ${new Date(mail.expirationDate).toLocaleString()}`;

        const readMore = document.createElement("button");
        readMore.textContent = "Preberi več";
        readMore.addEventListener("click", () => showMailPopup(mail));

        mailItem.appendChild(title);
        mailItem.appendChild(description);
        mailItem.appendChild(expiration);
        mailItem.appendChild(readMore);

        mailList.appendChild(mailItem);
    });

    // Update unread count
    unreadCount.textContent = validMails.length;
    unreadCount.classList.remove("hidden");
}

// Delete Expired Mails
function deleteExpiredMails() {
    const mailQuery = query(collection(db, "mailDatabase"));

    onSnapshot(mailQuery, (snapshot) => {
        snapshot.forEach((doc) => {
            const mailData = doc.data();
            if (mailData.expirationDate <= Date.now()) {
                deleteDoc(doc(db, "mailDatabase", doc.id));
            }
        });
    });
}

// Listen for Authentication State
onAuthStateChanged(auth, (user) => {
    if (user) {
        userUid = user.uid;
        fetchAndRenderMails();
    } else {
        userUid = null;
        renderNotSignedIn();
    }
});

// Initialize
mailIcon.addEventListener("click", toggleMailDropdown);
deleteExpiredMails();
