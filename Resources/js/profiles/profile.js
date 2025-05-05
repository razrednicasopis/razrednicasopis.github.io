import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDoc, updateDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);





const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

// Load profile data
async function loadUserProfile(uid) {
  const usernameEl = document.getElementById("username");
  const bioEl = document.getElementById("bio");
  const avatarEl = document.getElementById("avatar");

  if (!uid) {
    usernameEl.textContent = "User not found";
    bioEl.textContent = "No UID provided.";
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      usernameEl.textContent = " @ " + (data.Username || "unknown");
      bioEl.textContent = data.bio || "This user hasn't written a bio.";
      avatarEl.src = data.avatarURL || "default-avatar.png";
    } else {
      usernameEl.textContent = "User not found";
      bioEl.textContent = "No user with that ID exists.";
    }
  } catch (error) {
    usernameEl.textContent = "Error loading profile";
    bioEl.textContent = error.message;
  }
}

loadUserProfile(uid);