import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateUserDocsWithUIDAndCreationDate() {
    const usersCollection = collection(db, "users");
    const userDocs = await getDocs(usersCollection);

    userDocs.forEach(async (userDoc) => {
        const userId = userDoc.id; // This is the uid
        const userData = userDoc.data();

        // Prepare update data
        let updateData = {};

        // If UID field is not already set, add it
        if (!userData.uid) {
            updateData.uid = userId;
            console.log(`UID added for user: ${userId}`);
        }

        // If creationDate is not set, add the current timestamp
        if (!userData.creationDate) {
            updateData.creationDate = Timestamp.now(); // Current time
            console.log(`Creation date added for user: ${userId}`);
        }

        // If there are any fields to update, perform the update
        if (Object.keys(updateData).length > 0) {
            await updateDoc(doc(db, "users", userId), updateData);
            console.log(`Updated document for user: ${userId}`);
        }
    });

    alert("All user documents have been updated with UID and creation date (if missing).");
}

document.addEventListener('DOMContentLoaded', () => {
    const updateButton = document.getElementById('updateButton');
    updateButton.addEventListener('click', updateUserDocsWithUIDAndCreationDate);
});