import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { 
  getFirestore, getDoc, getDocs, doc, addDoc, arrayUnion, arrayRemove, 
  updateDoc, collection,onSnapshot, query, where, deleteDoc, orderBy 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeInteractions } from "./profilesSocial.js";

// --- Firebase config ---
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

// --- DOM elements ---
const params = new URLSearchParams(window.location.search);
const uid = params.get("uid");

const usernameEl = document.getElementById("username");
const bioEl = document.getElementById("bio");
const avatarEl = document.getElementById("avatar");
let currentUserAvatarURL = "avatarPFP.png";

const addFriendBtn = document.querySelector(".add-friend-btn");
const postsContainer = document.getElementById("postsContainer");
const newPostBtn = document.getElementById("newPostBtn");
const newPostPopup = document.getElementById("newPostPopup");
const overlay = document.getElementById('resetPasswordOverlay');

// --- Overlay for comments ---
let commentOverlay = document.getElementById('commentOverlay');
if (!commentOverlay) {
  commentOverlay = document.createElement('div');
  commentOverlay.id = 'commentOverlay';
  commentOverlay.style.position = 'fixed';
  commentOverlay.style.top = 0;
  commentOverlay.style.left = 0;
  commentOverlay.style.width = '100vw';
  commentOverlay.style.height = '100vh';
  commentOverlay.style.backgroundColor = 'rgba(0,0,0,0.6)';
  commentOverlay.style.display = 'none';
  commentOverlay.style.zIndex = 999;
  document.body.appendChild(commentOverlay);
}

// --- Load user profile ---
async function loadUserProfile(uid) {
  if (!uid) {
    usernameEl.textContent = "Napaka pri iskanju računa";
    bioEl.textContent = "Prosimo podajte veljaven UID v URL brskalnika.";
    addFriendBtn?.remove();
    avatarEl?.remove();
    return;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    if (!userSnap.exists()) {
      usernameEl.textContent = "Napaka pri iskanju računa";
      bioEl.textContent = "Uporabnik s tem UID-jem ne obstaja.";
      addFriendBtn?.remove();
      avatarEl?.remove();
      newPostBtn?.remove();
      return;
    }

    const userData = userSnap.data();
    usernameEl.textContent = " @ " + (userData.Username || "unknown");
    bioEl.textContent = userData.bio || "Bio ne obstaja.";

    // Load profile picture
    const pfpSnap = await getDoc(doc(db, "pfpData", uid));
    if (pfpSnap.exists() && pfpSnap.data().profilePicture?.startsWith("data:image")) {
      avatarEl.src = pfpSnap.data().profilePicture;
      currentUserAvatarURL = pfpSnap.data().profilePicture;
    } else {
      avatarEl.src = "avatarPFP.png";
      currentUserAvatarURL = "avatarPFP.png";
    }

  } catch (err) {
    console.error("Error loading profile:", err);
    usernameEl.textContent = "Napaka pri nalaganju profila";
    bioEl.textContent = err.message;
    addFriendBtn?.remove();
    avatarEl?.remove();
  }
}

// --- Hide add friend if viewing own profile ---
onAuthStateChanged(auth, async (user) => {
  if (!user || !uid) return;

  if (user.uid === uid) {
    addFriendBtn?.remove();
  } else {
    try {
      const [mySnap, theirSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDoc(doc(db, "users", uid)),
        newPostBtn?.remove()
      ]);

      if (!mySnap.exists() || !theirSnap.exists()) {
        addFriendBtn?.remove();
        return;
      }
    } catch (err) {
      console.error("Error checking friendship:", err);
    }
  }
});

// --- New post ---
newPostBtn?.addEventListener("click", () => {
  newPostPopup.style.display = "block";
  overlay.style.display = "block";
});

document.getElementById("submitPost")?.addEventListener("click", async () => {
  const content = document.getElementById("postContent").value.trim();
  if (!content) return alert("Vnesi vsebino objave.");
  const date = new Date().toISOString();

  onAuthStateChanged(auth, async user => {
    if (!user) return alert("Prijava je obvezna.");
    if (user.uid !== uid) return alert("Ne moreš objaviti na tujem profilu.");

    await addDoc(collection(db, "profilePosts"), { uid: user.uid, postContent: content, postDate: date, likes: [] });

    document.getElementById("postContent").value = "";
    newPostPopup.style.display = "none";
    overlay.style.display = "none";
    startListeningForPosts();
  });
});

document.getElementById("cancelPost")?.addEventListener("click", () => {
  document.getElementById("postContent").value = "";
  newPostPopup.style.display = "none";
  overlay.style.display = "none";
});

// --- Load posts with likes & comments ---
function startListeningForPosts() {
  if (!postsContainer) return;

  // ✅ enforce newest first
  const q = query(
    collection(db, "profilePosts"),
    where("uid", "==", uid),
    orderBy("postDate", "desc")
  );

  onSnapshot(q, async (querySnapshot) => {
    postsContainer.innerHTML = "";
    for (const postDoc of querySnapshot.docs) {
      const post = { id: postDoc.id, ...postDoc.data() };

      // Count comments
      const commentsQuerySnapshot = await getDocs(
        query(collection(db, "profileCommentsRef"), where("postId", "==", post.id))
      );
      const commentsCount = commentsQuerySnapshot.size;

      const postEl = document.createElement("div");
      postEl.className = "profile-post";
      postEl.style.cssText = "border:1px solid #ccc; border-radius:8px; padding:10px; margin-bottom:10px; background:#f9f9f9;";

      const timestamp = new Date(post.postDate).toLocaleString();
      const likesCount = post.likes?.length || 0;

      postEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <small style="color: gray;">${timestamp}</small>
          <div style="display:flex; align-items:center; gap:5px;">
            <img src="${currentUserAvatarURL}" style="width:30px; height:30px; border-radius:50%;" />
            <strong>${usernameEl.textContent.trim()}</strong>
          </div>
        </div>
        <div style="margin-top:8px;">${post.postContent}</div>
        <div style="display:flex; gap:10px; margin-top:5px;">
          <button class="like-btn" data-postid="${post.id}" style="background:none; border:none; color:#007bff; cursor:pointer;">
            ❤️ <span class="like-count">${likesCount}</span>
          </button>
          <button class="comment-btn" data-postid="${post.id}" style="background:none; border:none; color:#007bff; cursor:pointer;">
            💬 Komentarji <span class="comment-count">${commentsCount}</span>
          </button>
        </div>
      `;

      postsContainer.appendChild(postEl);
    }

    // Initialize likes & comment button interactions
    initializeInteractions();
  });
}

// --- Initialize ---
window.addEventListener("DOMContentLoaded", async () => {
  await loadUserProfile(uid);
  startListeningForPosts();
});
