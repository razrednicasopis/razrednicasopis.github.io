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

// 🧱 Helper: Update Button Appearance
function updateButton(text, icon) {
  if (!friendBtn || !iconEl) return;

  // Update icon
  iconEl.textContent = icon;

  // Remove ALL spans with class 'text'
  friendBtn.querySelectorAll(".text").forEach(el => el.remove());

  // Create and append a new span with text
  const textSpan = document.createElement("span");
  textSpan.classList.add("text");
  textSpan.textContent = text;
  textSpan.style.marginLeft = "6px";
  friendBtn.appendChild(textSpan);

  // Common styles
  friendBtn.style.color = "white";
  friendBtn.style.border = "none";
}

// 🔁 Check if friend request already sent
async function checkRequestState() {
  if (!currentUserUID || !profileUID) return;

  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  const reqSnap = await getDoc(reqRef);

  if (reqSnap.exists()) {
    updateButton("Cancel Request", "❌");
    friendBtn.style.background = "#e74c3c"; // red
    friendBtn.dataset.state = "sent";
  } else {
    updateButton("Add Friend", "➕");
    friendBtn.style.background = "linear-gradient(135deg, #4f46e5, #3b82f6)"; // purple/blue
    friendBtn.dataset.state = "none";
  }
}

// 🔁 Handle friend button click
async function handleFriendButtonClick() {
  if (!currentUserUID || !profileUID) return;

  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  const currentState = friendBtn.dataset.state;

  if (currentState === "sent") {
    // Remove the friend request document from user B's request list
    await deleteDoc(reqRef);

    updateButton("Add Friend", "➕");
    friendBtn.style.background = "linear-gradient(135deg, #4f46e5, #3b82f6)"; // purple/blue
    friendBtn.dataset.state = "none";
    toastr.info("Friend request cancelled.");
  } else {
    // Send the friend request and add to user B's friendRequests array
    await setDoc(reqRef, {
      from: currentUserUID,
      to: profileUID,
      timestamp: Date.now()
    });

    updateButton("Cancel Request", "❌");
    friendBtn.style.background = "#e74c3c"; // red
    friendBtn.dataset.state = "sent";
    toastr.success("Friend request sent.");
  }
}

// 🚀 Accept Friend Request
async function acceptFriendRequest() {
  if (!currentUserUID || !profileUID) return;

  // Remove the friend request from both user A and B's friendRequests arrays
  const reqRef = doc(db, "friendRequests", `${currentUserUID}_${profileUID}`);
  await deleteDoc(reqRef);
  const reverseReqRef = doc(db, "friendRequests", `${profileUID}_${currentUserUID}`);
  await deleteDoc(reverseReqRef);

  // Add each user to the other's friends list
  const currentUserRef = doc(db, "users", currentUserUID);
  const profileUserRef = doc(db, "users", profileUID);

  await updateDoc(currentUserRef, {
    friendsList: arrayUnion(profileUID)
  });
  await updateDoc(profileUserRef, {
    friendsList: arrayUnion(currentUserUID)
  });

  toastr.success("Friend request accepted.");
  updateButton("Prijatelja", "🤝");
  friendBtn.style.background = "#2ecc71"; // green (friend status)
}

// 🚀 Init after auth
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  currentUserUID = user.uid;

  if (currentUserUID === profileUID) {
    friendBtn?.remove(); // Hide button on own profile
  } else {
    checkRequestState();
    friendBtn?.addEventListener("click", handleFriendButtonClick);
  }
});
