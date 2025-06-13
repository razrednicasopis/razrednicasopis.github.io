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
const iconEl = friendBtn?.querySelector(".icon");

const params = new URLSearchParams(window.location.search);
const profileUID = params.get("uid");

let currentUserUID = null;
let isFriend = false;

// 🔁 Helper: Update Button
function updateButton(text, icon, bg, state = "") {
  if (!friendBtn || !iconEl) return;

  iconEl.textContent = icon;
  friendBtn.querySelectorAll(".text").forEach(el => el.remove());

  const textSpan = document.createElement("span");
  textSpan.classList.add("text");
  textSpan.textContent = text;
  textSpan.style.marginLeft = "6px";
  friendBtn.appendChild(textSpan);

  friendBtn.style.background = bg;
  friendBtn.style.color = "white";
  friendBtn.style.border = "none";
  friendBtn.disabled = false;
  friendBtn.dataset.state = state;
}

// 🔁 Check if already friends
async function checkIfFriends() {
  const currentUserRef = doc(db, "users", currentUserUID);
  const userSnap = await getDoc(currentUserRef);
  const friends = userSnap.exists() ? userSnap.data().friendsList || [] : [];

  return friends.includes(profileUID);
}

// 🔁 Check state
async function checkRequestState() {
  if (!currentUserUID || !profileUID) return;

  isFriend = await checkIfFriends();

  if (isFriend) {
    updateButton("Odstrani prijatelja", "🗑", "#7f8c8d", "friend");
    return;
  }

  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  const reqSnap = await getDoc(reqRef);

  if (reqSnap.exists()) {
    updateButton("Prekliči zahtevo", "❌", "#e74c3c", "sent");
  } else {
    updateButton("Dodaj prijatelja", "➕", "linear-gradient(135deg, #4f46e5, #3b82f6)", "none");
  }
}

// 🔘 Handle button
async function handleFriendButtonClick() {
  if (!currentUserUID) {
    toastr.info("Prijavi se, da lahko dodaš prijatelje.");
    return;
  }

  if (currentUserUID === profileUID) return;

  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  const currentState = friendBtn.dataset.state;

  if (currentState === "friend") {
    // 🔥 Unfriend
    const currentUserRef = doc(db, "users", currentUserUID);
    const profileUserRef = doc(db, "users", profileUID);

    await updateDoc(currentUserRef, {
      friendsList: arrayRemove(profileUID)
    });

    await updateDoc(profileUserRef, {
      friendsList: arrayRemove(currentUserUID)
    });

    toastr.warning("Prijatelj odstranjen.");
    isFriend = false;
    await checkRequestState();
    return;
  }

  if (currentState === "sent") {
    await deleteDoc(reqRef);
    toastr.info("Zahteva preklicana.");
  } else {
    await setDoc(reqRef, {
      from: currentUserUID,
      to: profileUID,
      timestamp: Date.now()
    });
    toastr.success("Zahteva poslana.");
  }

  await checkRequestState();
}

// 👁 Auth Watch
onAuthStateChanged(auth, (user) => {
  if (!friendBtn) return;

  if (!user) {
    updateButton("Dodaj prijatelja", "➕", "gray");
    friendBtn.addEventListener("click", () => {
      toastr.info("Prijavi se, da lahko dodaš prijatelje.");
    });
    return;
  }

  currentUserUID = user.uid;

  if (currentUserUID === profileUID) {
    friendBtn.remove(); // Don't show button on own profile
    return;
  }

  checkRequestState();
  friendBtn.addEventListener("click", handleFriendButtonClick);
});
