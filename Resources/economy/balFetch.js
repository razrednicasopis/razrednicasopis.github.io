import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js"; // Ensure proper import

// Your web app's Firebase configuration
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
const db = getFirestore();
const auth = getAuth();

document.addEventListener('DOMContentLoaded', () => {
    const stanjeText = document.getElementById('accountBalanceText'); // Reference to the accountBalanceText element
    
    // Initially hide the balance text
    stanjeText.style.display = 'none';  // Make sure it's hidden until the user is logged in

    // Check if the user is logged in
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in, show the Stanje text
            const uid = user.uid;

            // Show the 'Stanje' span
            stanjeText.style.display = 'inline';  // Make it visible when user is logged in

            // Fetch the user's premiumBalance from Firestore
            const userDocRef = doc(db, "users", uid);
            
            // Real-time listener for user's premium balance
            onSnapshot(userDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    const premiumBalance = userData.premiumBalance || 0;  // Default to 0 if not set

                    // Update the Stanje text with the premiumBalance and diamond emoji
                    const accountBalanceSpan = document.getElementById('accountBalance');
                    animateBalanceUpdate(accountBalanceSpan, premiumBalance);
                } else {
                    console.log("No such user document!");
                }
            });
        } else {
            // User is not logged in, hide the Stanje text (it should already be hidden by default)
            stanjeText.style.display = 'none';  // Hide the 'Stanje' span if user is logged out
        }
    });
});

// Function to animate the balance update smoothly
function animateBalanceUpdate(element, newBalance) {
    let currentBalance = parseInt(element.textContent, 10) || 0;
    const targetBalance = newBalance;
    
    // If the balance is different, animate it
    const increment = Math.ceil((targetBalance - currentBalance) / 10); // Adjust the increment speed
    let currentAnimationStep = currentBalance;

    const intervalId = setInterval(() => {
        currentAnimationStep += increment;

        // Ensure we do not overshoot the target balance
        if (Math.abs(currentAnimationStep - targetBalance) <= Math.abs(increment)) {
            clearInterval(intervalId);
            currentAnimationStep = targetBalance; // Set to exact target balance
        }

        // Update the text content
        element.textContent = currentAnimationStep;
    }, 50); // Speed of the update (in ms per step)
}
