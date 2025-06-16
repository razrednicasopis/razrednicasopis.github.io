import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, getDoc, doc, addDoc, getDocs, query, where, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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
let currentUserAvatarURL = "avatarPFP.png"; // fallback
const addFriendBtn = document.querySelector(".add-friend-btn");
const postsContainer = document.getElementById("postsContainer");
const newPostBtn = document.getElementById("newPostBtn");
const newPostPopup = document.getElementById("newPostPopup");
const overlay = document.getElementById('resetPasswordOverlay');

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
      newPostBtn?.remove();
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

  if (base64) {
if (base64.startsWith("data:image")) {
  avatarEl.src = base64;
  currentUserAvatarURL = base64;
} else {
  avatarEl.src = "avatarPFP.png";
  currentUserAvatarURL = "avatarPFP.png";
}

  } else {
    avatarEl.src = "avatarPFP.png";
    currentUserAvatarURL = "avatarPFP.png";
  }
} else {
  avatarEl.src = "avatarPFP.png";
  currentUserAvatarURL = "avatarPFP.png";
}



  } catch (error) {
    console.error("Error loading profile:", error);
    usernameEl.textContent = "Napaka pri nalaganju profila";
    bioEl.textContent = error.message;
    addFriendBtn?.remove();
    avatarEl?.remove();
  }
}


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
        newPostBtn?.remove()
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
    } catch (err) {
      console.error("Error checking friendship:", err);
    }
  }
});



// Post System

newPostBtn.addEventListener("click", () => {
  newPostPopup.style.display = "block";
  overlay.style.display = "block";
});

document.getElementById("submitPost").addEventListener("click", async () => {
  const content = document.getElementById("postContent").value.trim();
  const date = new Date().toISOString();

  if (!content) return alert("Vnesi vsebino objave.");

  onAuthStateChanged(auth, async user => {
    if (!user) return alert("Prijava je obvezna.");
    if (user.uid !== uid) return alert("Ne moreš objaviti na tujem profilu.");

    const postRef = collection(db, "profilePosts");
    await addDoc(postRef, {
      uid: user.uid,
      postContent: content,
      postDate: date,
    });

    toastr.success("Objava je bila ustvarjena!");
    document.getElementById("postContent").value = "";
    newPostPopup.style.display = "none";
    overlay.style.display = "none";
    loadPosts(); // refresh posts
  });
});


// Loading Posts

function startListeningForPosts() {
  const q = query(collection(db, "profilePosts"), where("uid", "==", uid));

  onSnapshot(q, async (querySnapshot) => {
    const posts = [];
    querySnapshot.forEach(doc => {
      posts.push({ id: doc.id, ...doc.data() });
    });

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    postsContainer.innerHTML = ""; // Clear before re-render

    posts.forEach(post => {
      const postEl = document.createElement("div");
      postEl.className = "profile-post";
      postEl.style.border = "1px solid #ccc";
      postEl.style.borderRadius = "8px";
      postEl.style.padding = "10px";
      postEl.style.marginBottom = "10px";
      postEl.style.position = "relative";
      postEl.style.backgroundColor = "#f9f9f9";

      // Top-left: timestamp
      const timestamp = new Date(post.postDate).toLocaleString();

      postEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <small style="color: gray;">${timestamp}</small>
          <div style="display: flex; align-items: center; gap: 5px;">
            <img src="${currentUserAvatarURL}" style="width: 30px; height: 30px; border-radius: 50%;" />
            <strong>${usernameEl.textContent.trim()}</strong>
          </div>
        </div>
        <div style="margin-top: 8px;">${post.postContent}</div>
      `;

      postsContainer.appendChild(postEl);
    });
  });
}

document.getElementById("cancelPost").addEventListener("click", () => {
  document.getElementById("postContent").value = "";
  newPostPopup.style.display = "none";
  overlay.style.display = "none";
});


window.addEventListener("DOMContentLoaded", async () => {
  await loadUserProfile(uid);  // Wait for avatar to load
  if (postsContainer) {
    startListeningForPosts();
  } else {
    console.warn("postsContainer not found in DOM.");
  }
});


