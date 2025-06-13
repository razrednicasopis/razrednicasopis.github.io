import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

const friendBtn = document.querySelector(".add-friend-btn");
const iconEl = friendBtn.querySelector(".icon");

const params = new URLSearchParams(window.location.search);
const profileUID = params.get("uid");

let currentUserUID = null;

// 🧱 Update Button Appearance
function updateButton(text, icon, color = null, disabled = false) {
  if (!friendBtn || !iconEl) return;

  iconEl.textContent = icon;

  friendBtn.querySelectorAll(".text").forEach(el => el.remove());

  if (text) {
    const textSpan = document.createElement("span");
    textSpan.classList.add("text");
    textSpan.textContent = text;
    textSpan.style.marginLeft = "6px";
    friendBtn.appendChild(textSpan);
  }

  friendBtn.style.color = "white";
  friendBtn.style.border = "none";
  friendBtn.disabled = disabled;
  friendBtn.style.opacity = disabled ? "0.6" : "1";
  if (color) friendBtn.style.background = color;
}

// 🔁 Check if users are already friends
async function checkFriendship() {
  const currentUserRef = doc(db, "users", currentUserUID);
  const currentUserSnap = await getDoc(currentUserRef);

  if (currentUserSnap.exists()) {
    const friends = currentUserSnap.data().friendsList || [];
    return friends.includes(profileUID);
  }

  return false;
}

// 🔁 Check if friend request is pending or friends
async function checkRequestState() {
  if (!currentUserUID || !profileUID) return;

  // Check if already friends
  const isFriend = await checkFriendship();
  if (isFriend) {
    updateButton("Prijatelj", "🤝", "#7f8c8d", true); // greyed out
    friendBtn.dataset.state = "friends";
    return;
  }

  // Check if request is sent
  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  const reqSnap = await getDoc(reqRef);

  if (reqSnap.exists()) {
    updateButton("Prekliči zahtevek", "❌", "#e74c3c");
    friendBtn.dataset.state = "sent";
  } else {
    updateButton("Dodaj prijatelja", "➕", "linear-gradient(135deg, #4f46e5, #3b82f6)");
    friendBtn.dataset.state = "none";
  }
}

// 🧠 Handle click
async function handleFriendButtonClick() {
  if (!currentUserUID) {
    toastr.warning("Prijavi se, da lahko dodaš prijatelje.");
    return;
  }

  const state = friendBtn.dataset.state;
  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);

  if (state === "sent") {
    await deleteDoc(reqRef);
    updateButton("Dodaj prijatelja", "➕", "linear-gradient(135deg, #4f46e5, #3b82f6)");
    friendBtn.dataset.state = "none";
    toastr.info("Zahtevek preklican.");
  } else if (state === "none") {
    await setDoc(reqRef, {
      from: currentUserUID,
      to: profileUID,
      timestamp: Date.now()
    });
    updateButton("Prekliči zahtevek", "❌", "#e74c3c");
    friendBtn.dataset.state = "sent";
    toastr.success("Zahtevek poslan!");
  }
}

// 🧠 Init button when user not logged in
function initLoggedOut() {
  updateButton("Dodaj prijatelja", "➕", "linear-gradient(135deg, #4f46e5, #3b82f6)");
  friendBtn.addEventListener("click", () => {
    toastr.warning("Prijavi se, da lahko dodaš prijatelje.");
  });
}

// 🚀 Init after auth state known
onAuthStateChanged(auth, (user) => {
  if (!friendBtn) return;

  if (!user) {
    initLoggedOut();
    return;
  }

  currentUserUID = user.uid;

  if (currentUserUID === profileUID) {
    friendBtn.remove(); // don't show on own profile
    return;
  }

  checkRequestState();
  friendBtn.addEventListener("click", handleFriendButtonClick);
});
