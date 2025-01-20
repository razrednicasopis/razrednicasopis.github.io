import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, Timestamp, query, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Show reward input fields when "Reward" is selected
document.getElementById("type").addEventListener("change", (e) => {
    const rewardSection = document.getElementById("rewardSection");
    if (e.target.value.toLowerCase() === "reward" || e.target.value.toLowerCase() === "nagrada") {
        rewardSection.style.display = 'block';
    } else {
        rewardSection.style.display = 'none';
    }
});


// Handle form submission
document.getElementById("notificationForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const fullMessage = document.getElementById("fullMessage").value; // Add fullMessage
    const expiration = document.getElementById("expiration").value; // This should be in a valid date format (e.g., yyyy-mm-dd)
    const type = document.getElementById("type").value;
    const userIdsInput = document.getElementById("userIds").value.trim(); // Get the input from the userIds field
    const rewardItem = document.getElementById("rewardItem").value;
    const rewardAmount = document.getElementById("rewardAmount").value;

    // Convert the expiration string to a Firestore Timestamp
    const expirationTimestamp = expiration ? Timestamp.fromDate(new Date(expiration)) : null;

    // Validate reward fields if "reward" type is selected
    if (type === "reward") {
        if (!rewardItem || !rewardAmount) {
            alert("Prosimo, izberite nagrado in vnesite količino.");
            return; // Exit the function if reward fields are not filled
        }
    }

    let userIds = [];
    
    // Check if the input value is 'public'
    if (userIdsInput.toLowerCase() === "public") {
        // Query all users from the Firestore database
        const usersSnapshot = await getDocs(collection(db, "users"));
        usersSnapshot.forEach((doc) => {
            userIds.push(doc.id); // Push each user UID into the array
        });
    } else {
        // Otherwise, use the entered user IDs
        userIds = userIdsInput.split(',').map(uid => uid.trim());
    }

    // Prepare notification object
    const newNotification = {
        title,
        description,
        fullMessage, // Add fullMessage to the notification object
        expiration: expirationTimestamp,
        type,
        reward: type === "reward" ? { item: rewardItem, amount: rewardAmount } : null,
        read: [],
        claimed: [],
        targetUsers: userIds, // Add the resolved user IDs (either 'public' or specific ones)
        timestamp: new Date().toISOString()
    };

    try {
        // Add the new notification to Firestore
        const notificationRef = await addDoc(collection(db, "notifications"), newNotification);

        // If it's a reward notification and the item is spins, update user spins
        if (rewardItem === "vrtljaji" && userIds.length > 0) {
            // Loop through all the user IDs who have claimed the reward
            userIds.forEach(async (uid) => {
                // Check if the user has claimed the reward
                if (newNotification.claimed.includes(uid)) {

                    // Reference the user's document in the lbEventData collection
                    const userDocRef = doc(db, "lbEventData", uid);

                    // Fetch the user's current data
                    const userDoc = await getDoc(userDocRef);

                    // Check if the user document exists
                    if (userDoc.exists()) {
                        const currentFreeSpins = userDoc.data().free_spins || 0; // Get current spins (defaults to 0 if not set)
                        const spinsToAdd = parseInt(rewardAmount, 10); // Ensure rewardAmount is parsed as an integer

                        // Add the reward spins to the current spins
                        await updateDoc(userDocRef, {
                            free_spins: currentFreeSpins + spinsToAdd // Update the free_spins field correctly
                        });
                    } else {
                        console.log(`User document with uid ${uid} does not exist.`);
                    }
                }
            });
        }

        alert("Obvestilo uspešno dodano!");

        // Reset form
        document.getElementById("notificationForm").reset();
    } catch (error) {
        console.error("Napaka pri dodajanju obvestila: ", error);
        alert("Napaka pri dodajanju obvestila.");
    }
});
