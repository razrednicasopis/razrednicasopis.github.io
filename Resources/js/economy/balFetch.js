import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase app
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);


document.addEventListener('DOMContentLoaded', () => {
    // Check if the user is logged in
    onAuthStateChanged(auth, async (user) => {
        const stanjeText = document.getElementById('stanjeText');
        
        if (user) {
            // User is logged in, show the Stanje text
            const uid = user.uid;

            // Show the 'Stanje' span
            stanjeText.style.display = 'inline';

            // Fetch the user's premiumBalance from Firestore
            const userDocRef = doc(db, "users", uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const premiumBalance = userData.premiumBalance || 0;  // Default to 0 if not set

                // Update the Stanje text with the premiumBalance and diamond emoji
                stanjeText.textContent = `Stanje: ${premiumBalance}💎`;
            } else {
                console.log("No such user document!");
            }
        } else {
            // User is not logged in, hide the Stanje text (it should already be hidden)
            stanjeText.style.display = 'none';
        }
    });
});
