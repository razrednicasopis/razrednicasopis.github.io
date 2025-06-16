import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
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

// Clean out any static text spans on load
friendBtn?.querySelectorAll(".text")?.forEach(e => e.remove());

function updateButton(text, icon, bgColor, textColor) {
  if (!friendBtn || !iconEl) return;
  iconEl.textContent = icon;

  // Remove old text spans
  friendBtn.querySelectorAll(".text").forEach(el => el.remove());

  const textSpan = document.createElement("span");
  textSpan.classList.add("text");
  textSpan.textContent = text;
  textSpan.style.marginLeft = "6px";
  friendBtn.appendChild(textSpan);

  friendBtn.style.backgroundColor = bgColor || "#007bff"; // default blue
  friendBtn.style.color = textColor || "#fff";
  friendBtn.style.cursor = "pointer";
}

async function hasPendingRequest(fromUid, toUid) {
  const reqQuery = query(
    collection(db, "friendRequests"),
    where("from", "==", fromUid),
    where("to", "==", toUid)
  );
  const reqSnap = await getDocs(reqQuery);
  return !reqSnap.empty ? reqSnap.docs[0].id : null;
}

function setRequestSentState(user) {
  updateButton("Prošnja poslana", "⏳", "#6c757d", "#fff");
  friendBtn.onclick = async () => {
    if (confirm("Ali želiš preklicati prošnjo za prijateljstvo?")) {
      try {
        const reqId = await hasPendingRequest(user.uid, profileUID);
        if (reqId) {
          await deleteDoc(doc(db, "friendRequests", reqId));
          toastr.success("Prošnja za prijateljstvo preklicana.");
          setAddFriendState(user);
        }
      } catch (err) {
        console.error(err);
        toastr.error("Napaka pri preklicu prošnje.");
      }
    }
  };
}

async function setAddFriendState(user) {
  // Check if there's already a pending friend request from me to them
  const pendingRequestId = await hasPendingRequest(user.uid, profileUID);

  if (pendingRequestId) {
    setRequestSentState(user);
    return;
  }

  updateButton("Dodaj prijatelja", "➕", "#007bff", "#fff"); // Blue button

  friendBtn.onclick = async () => {
    try {
      // Create a new friend request document
      await addDoc(collection(db, "friendRequests"), {
        from: user.uid,
        to: profileUID,
        createdAt: Timestamp.now(),
      });
      toastr.success("Prošnja za prijateljstvo poslana!");
      setRequestSentState(user);
    } catch (err) {
      console.error("Napaka pri pošiljanju prošnje:", err);
      toastr.error("Napaka pri pošiljanju prošnje, poskusi znova.");
    }
  };
}

function setRemoveFriendState(user) {
  updateButton("Odstrani prijatelja", "❌", "#dc3545", "#fff"); // Red button

  friendBtn.onclick = async () => {
    if (confirm("Si prepričan, da želiš odstraniti tega prijatelja?")) {
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), {
          friends: arrayRemove(profileUID),
        }),
        updateDoc(doc(db, "users", profileUID), {
          friends: arrayRemove(user.uid),
        }),
      ]);

      toastr.success("Prijatelj uspešno odstranjen.");
      setAddFriendState(user);
    }
  };
}

onAuthStateChanged(auth, async (user) => {
  if (!friendBtn) return;

  if (!user) {
    // Not logged in: gray disabled button
    updateButton("Dodaj prijatelja", "➕", "#6c757d", "#fff");
    friendBtn.style.cursor = "default";
    friendBtn.onclick = () => {
      toastr.warning("Za uporabo te funkcije se morate prijaviti.");
    };
    return;
  }

  if (user.uid === profileUID) {
    // Viewing own profile - no button
    friendBtn.remove();
    return;
  }

  const [currentSnap, targetSnap] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDoc(doc(db, "users", profileUID)),
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
    setRemoveFriendState(user);
  } else {
    // If not friends yet, check if there is a pending friend request from them to me
    const pendingRequestFromThemId = await hasPendingRequest(profileUID, user.uid);

    if (pendingRequestFromThemId) {
      // They sent me a request - show a different UI maybe to accept or reject (optional)
      // For now, let's just show a button to accept the request:

      updateButton("Sprejmi prošnjo", "✔️", "#28a745", "#fff");
      friendBtn.onclick = async () => {
        try {
          // Add each other as friends
          await Promise.all([
            updateDoc(doc(db, "users", user.uid), {
              friends: arrayUnion(profileUID),
            }),
            updateDoc(doc(db, "users", profileUID), {
              friends: arrayUnion(user.uid),
            }),
            // Delete the friend request after accepting
            deleteDoc(doc(db, "friendRequests", pendingRequestFromThemId)),
          ]);
          toastr.success("Prošnja sprejeta!");
          setRemoveFriendState(user);
        } catch (err) {
          console.error(err);
          toastr.error("Napaka pri sprejemu prošnje.");
        }
      };
    } else {
      // No mutual friendship, no incoming request - allow sending request
      await setAddFriendState(user);
    }
  }
});
