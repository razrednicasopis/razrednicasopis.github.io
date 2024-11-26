import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Function to check server status and navigate accordingly
async function checkServerStatus(button) {
    if (!button) {
        console.error("Button is undefined!");
        return; // Exit the function if button is undefined
    }

    const href = button.getAttribute('data-href'); // Get the href from data attribute
    const docRef = doc(db, "settings", "eventServer");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.online) {
            window.location.href = href; // Navigate to the specified link
        } else {
            alert("Server je trenutno nedosegljiv. Kmalu se bodo pričela vzdrževalna dela! Prosimo poskusite kasneje.");
        }
    } else {
        console.error("No such document!");
        alert("Napaka pri povezavi z strežnikom. Prosimo poskusite kasneje.");
    }
}

// Add event listeners to the buttons
document.querySelectorAll('.checkEventServerStatus').forEach(button => {
    button.addEventListener('click', () => checkServerStatus(button));
});
