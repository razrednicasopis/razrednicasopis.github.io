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

async function loadUserProfile(uid) {
  console.log("[loadUserProfile] UID:", uid);

  if (!uid) {
    console.warn("No UID provided.");
    usernameEl.textContent = "Napaka pri iskanju računa";
    bioEl.textContent = "Prosimo podajte veljaven UID v URL brskalnika.";
    addFriendBtn?.remove();
    avatarEl?.remove();
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    console.log("[loadUserProfile] User document fetched");

    if (!userSnap.exists()) {
      console.warn("User not found:", uid);
      usernameEl.textContent = "Napaka pri iskanju računa";
      bioEl.textContent = "Uporabnik s tem UID-jem ne obstaja.";
      addFriendBtn?.remove();
      avatarEl?.remove();
      return;
    }

    const userData = userSnap.data();
    console.log("[User Data]", userData);

    usernameEl.textContent = " @ " + (userData.Username || "unknown");
    bioEl.textContent = userData.bio || "Bio ne obstaja.";

    // Load profile picture from pfpData
    const pfpRef = doc(db, "pfpData", uid);
    const pfpSnap = await getDoc(pfpRef);
    console.log("[loadUserProfile] Profile picture document fetched");

    if (pfpSnap.exists()) {
      const pfpData = pfpSnap.data();
      let base64 = pfpData.profilePicture;

      console.log("[Profile Picture Base64]", base64?.substring(0, 30) + "...");

      if (base64) {
        if (!base64.startsWith("data:image")) {
          base64 = `data:image/png;base64,${base64}`;
        }

        fetch(base64)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            avatarEl.src = blobUrl;
            avatarEl.onload = () => URL.revokeObjectURL(blobUrl);
            console.log("[Avatar Set] Blob URL created");
          })
          .catch(err => {
            console.error("Failed to load avatar from base64:", err);
            avatarEl.src = "avatarPFP.png";
          });
      } else {
        console.warn("Profile picture data was empty.");
        avatarEl.src = "avatarPFP.png";
      }
    } else {
      console.warn("No profile picture data found.");
      avatarEl.src = "avatarPFP.png";
    }

  } catch (error) {
    console.error("Error loading profile:", error);
    usernameEl.textContent = "Napaka pri nalaganju profila";
    bioEl.textContent = error.message;
    addFriendBtn?.remove();
    avatarEl?.remove();
  }
}

// Load profile on page load
loadUserProfile(uid);

// Remove add friend button if viewing own profile
onAuthStateChanged(auth, async (user) => {
  if (!user || !uid) return;

  if (user.uid === uid) {
    console.log("Viewing own profile – hiding add friend button.");
    addFriendBtn?.remove();
  } else {
    try {
      console.log("Checking friendship status...");
      const myRef = doc(db, "users", user.uid);
      const theirRef = doc(db, "users", uid);

      const [mySnap, theirSnap] = await Promise.all([
        getDoc(myRef),
        getDoc(theirRef),
      ]);

      if (!mySnap.exists() || !theirSnap.exists()) {
        console.warn("One of the user documents does not exist.");
        addFriendBtn?.remove();
        return;
      }

      const myData = mySnap.data();
      const theirData = theirSnap.data();

      const myFriends = myData.friends || [];
      const theirFriends = theirData.friends || [];

      const areMutualFriends = myFriends.includes(uid) && theirFriends.includes(user.uid);
      console.log("Are mutual friends:", areMutualFriends);

      if (areMutualFriends && addFriendBtn) {
        addFriendBtn.disabled = true;
        addFriendBtn.innerHTML = '✅ Prijatelja';
        addFriendBtn.style.backgroundColor = '#28a745';
        addFriendBtn.style.cursor = 'default';
      }

    } catch (err) {
      console.error("Error checking friendship:", err);
    }
  }
});
