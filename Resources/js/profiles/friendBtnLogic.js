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

// ✅ Ensure the button has no static text
friendBtn?.querySelectorAll(".text")?.forEach(e => e.remove());

function updateButton(text, icon) {
  if (!friendBtn || !iconEl) return;
  iconEl.textContent = icon;

  // Remove old text
  friendBtn.querySelectorAll(".text").forEach(el => el.remove());

  const textSpan = document.createElement("span");
  textSpan.classList.add("text");
  textSpan.textContent = text;
  textSpan.style.marginLeft = "6px";
  friendBtn.appendChild(textSpan);
}

onAuthStateChanged(auth, async user => {
  if (!friendBtn) return;

  // Logged out
  if (!user) {
    updateButton("Dodaj prijatelja", "➕");

    friendBtn.onclick = () => {
      toastr.warning("Za uporabo te funkcije se morate prijaviti.");
    };
    return;
  }

  if (user.uid === profileUID) {
    // Viewing own profile – already handled in profile.js
    friendBtn.remove();
    return;
  }

  const [currentSnap, targetSnap] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDoc(doc(db, "users", profileUID))
  ]);

  if (!currentSnap.exists() || !targetSnap.exists()) {
    friendBtn.remove();
    return;
  }

  const currentData = currentSnap.data();
  const targetData = targetSnap.data();
  const myFriends = currentData.friends || [];
  const theirFriends = targetData.friends || [];

  const isMutual = myFriends.includes(profileUID) && theirFriends.includes(user.uid);

  if (isMutual) {
    // ✅ Already friends
    updateButton("Odstrani prijatelja", "❌");

    friendBtn.onclick = async () => {
      if (confirm("Si prepričan, da želiš odstraniti tega prijatelja?")) {
        await Promise.all([
          updateDoc(doc(db, "users", user.uid), {
            friends: arrayRemove(profileUID)
          }),
          updateDoc(doc(db, "users", profileUID), {
            friends: arrayRemove(user.uid)
          })
        ]);

        toastr.success("Prijatelj uspešno odstranjen.");
        updateButton("Dodaj prijatelja", "➕"); // fallback state
        friendBtn.onclick = addFriendLogic; // re-bind logic
      }
    };

  } else {
    // ✅ Not friends, allow adding
    updateButton("Dodaj prijatelja", "➕");

    friendBtn.onclick = addFriendLogic;

    async function addFriendLogic() {
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), {
          friends: arrayUnion(profileUID)
        }),
        updateDoc(doc(db, "users", profileUID), {
          friends: arrayUnion(user.uid)
        })
      ]);

      toastr.success("Prijatelj uspešno dodan!");
      updateButton("Odstrani prijatelja", "❌");

      friendBtn.onclick = async () => {
        if (confirm("Si prepričan, da želiš odstraniti tega prijatelja?")) {
          await Promise.all([
            updateDoc(doc(db, "users", user.uid), {
              friends: arrayRemove(profileUID)
            }),
            updateDoc(doc(db, "users", profileUID), {
              friends: arrayRemove(user.uid)
            })
          ]);
          toastr.success("Prijatelj uspešno odstranjen.");
          updateButton("Dodaj prijatelja", "➕");
          friendBtn.onclick = addFriendLogic;
        }
      };
    }
  }
});
