import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

const usernameEl = document.getElementById("username");
const bioEl = document.getElementById("bio");
const avatarEl = document.getElementById("avatar");
const addFriendBtn = document.querySelector(".add-friend-btn");

// Load profile data for any user
async function loadUserProfile(uid) {
  if (!uid) {
    usernameEl.textContent = "Napaka pri iskanju računa";
    bioEl.textContent = "Prosimo podajte veljaven UID v URL brskalnika.";
    addFriendBtn?.remove();
    avatarEl?.remove();
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      usernameEl.textContent = " @ " + (data.Username || "unknown");
      bioEl.textContent = data.bio || "Bio ne obstaja.";
      avatarEl.src = data.avatarURL || "avatarPFP.png";
    } else {
      usernameEl.textContent = "Napaka pri iskanju računa";
      bioEl.textContent = "Uporabnik s tem UID-jem ne obstaja.";
      addFriendBtn?.remove();
      avatarEl?.remove();    
    }
  } catch (error) {
    usernameEl.textContent = "Napaka pri nalaganju profila";
    bioEl.textContent = error.message;
    addFriendBtn?.remove();
    avatarEl?.remove();
  }
}

// Always load profile
loadUserProfile(uid);

// Then, check if we are logged in and viewing our own profile
onAuthStateChanged(auth, (user) => {
  if (user && user.uid === uid) {
    addFriendBtn?.remove();
  }
});
