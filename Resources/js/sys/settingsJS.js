import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, getDocs, updateDoc, collection, query, where, deleteDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
let uid;

// UI elements
const settingsContent = document.getElementById("settingsContent");
const profileTab = document.getElementById("profileTab");
const friendsTab = document.getElementById("friendsTab");
const allTabs = document.querySelectorAll(".settings-tab");

function setActiveTab(tab) {
  allTabs.forEach(t => t.classList.remove("active-tab"));
  tab.classList.add("active-tab");
}

// Utility: Create friend request UI card
function createFriendRequestCard(request, senderUsername) {
  const container = document.createElement("div");
  container.classList.add("friend-request-card");
  container.style = `
    border: 1px solid #ccc;
    box-shadow: 0 0 8px rgba(0,0,0,0.1);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
  `;

  const usernameDiv = document.createElement("div");
  usernameDiv.textContent = senderUsername;
  usernameDiv.style.fontWeight = "bold";
  usernameDiv.style.fontSize = "1.1em";

  const buttonsDiv = document.createElement("div");
  buttonsDiv.style.display = "flex";
  buttonsDiv.style.gap = "10px";

  const acceptBtn = document.createElement("button");
  acceptBtn.innerHTML = "✔️";
  acceptBtn.title = "Sprejmi prošnjo";
  acceptBtn.style = `
    border-radius: 50%;
    background-color: #28a745;
    color: white;
    border: none;
    cursor: pointer;
    width: 32px;
    height: 32px;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const rejectBtn = document.createElement("button");
  rejectBtn.innerHTML = "❌";
  rejectBtn.title = "Zavrni prošnjo";
  rejectBtn.style = `
    border-radius: 50%;
    background-color: #dc3545;
    color: white;
    border: none;
    cursor: pointer;
    width: 32px;
    height: 32px;
    font-size: 18px;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  buttonsDiv.appendChild(acceptBtn);
  buttonsDiv.appendChild(rejectBtn);
  container.appendChild(usernameDiv);
  container.appendChild(buttonsDiv);

acceptBtn.addEventListener("click", async () => {
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;

  try {
    const senderUid = request.from;      
    const receiverUid = request.to;

    const senderRef = doc(db, "users", senderUid);
    const receiverRef = doc(db, "users", receiverUid);

    await updateDoc(senderRef, {
      friends: arrayUnion(receiverUid)
    });
    await updateDoc(receiverRef, {
      friends: arrayUnion(senderUid)
    });

    await deleteDoc(doc(db, "friendRequests", request.id));  // <---- fixed here
    container.remove();
  } catch (err) {
    console.error("Napaka pri sprejemanju prošnje:", err);
    alert("Napaka pri sprejemanju prošnje, poskusi znova.");
    acceptBtn.disabled = false;
    rejectBtn.disabled = false;
  }
});

  rejectBtn.addEventListener("click", async () => {
    acceptBtn.disabled = true;
    rejectBtn.disabled = true;
    try {
      const requestId = request.id;
      await deleteDoc(doc(db, "friendRequests", requestId));
      container.remove();
    } catch (err) {
      console.error("Napaka pri zavrnitvi prošnje:", err);
      alert("Napaka pri zavrnitvi prošnje, poskusi znova.");
      acceptBtn.disabled = false;
      rejectBtn.disabled = false;
    }
  });

  return container;
}

async function loadFriendRequests() {
  if (!uid) return;

  settingsContent.innerHTML = `
    <h2>Prošnje za prijateljstvo</h2>
    <p>Tu bodo prikazane tvoje prejete prošnje.</p>
    <div id="requestsContainer" style="margin-top:16px;"></div>
  `;

  const requestsContainer = document.getElementById("requestsContainer");

  try {
    const requestsQuery = query(
      collection(db, "friendRequests"),
      where("to", "==", uid)
    );

    const requestsSnapshot = await getDocs(requestsQuery);

    if (requestsSnapshot.empty) {
      requestsContainer.innerHTML = "<p>Trenutno ni nobenih prošenj za prijateljstvo.</p>";
      return;
    }

    for (const docSnap of requestsSnapshot.docs) {
      const requestData = docSnap.data();
      const requestId = docSnap.id;

      const senderDoc = await getDoc(doc(db, "users", requestData.from));
      const senderUsername = senderDoc.exists() ? senderDoc.data().Username || "Nepoznani uporabnik" : "Nepoznani uporabnik";

      const card = createFriendRequestCard({...requestData, id: requestId}, senderUsername);
      requestsContainer.appendChild(card);
    }
  } catch (err) {
    console.error("Napaka pri nalaganju prošenj:", err);
    requestsContainer.innerHTML = "<p>Prišlo je do napake pri nalaganju prošenj.</p>";
  }
}

profileTab.addEventListener("click", async (e) => {
  e.preventDefault();
  setActiveTab(profileTab);
  settingsContent.innerHTML = `
  <h2>Sprememba uporabniškega imena</h2>
  <form id="usernameForm">
    <label for="newUsername">Novo uporabniško ime:</label><br>
    <input type="text" id="newUsername" name="newUsername" required><br><br>
    <button type="submit" class="change-username-btn">🔁 Spremeni uporabniško ime</button>
  </form>
  <hr style="margin: 24px 0;">
  <h2>Sprememba opisa (bio)</h2>
  <form id="bioForm">
    <label for="newBio">Tvoj novi opis:</label><br>
    <textarea id="newBio" name="newBio" rows="4" cols="50" placeholder="Vnesi svoj opis tukaj..."></textarea><br><br>
    <button type="submit" class="change-username-btn">💬 Spremeni opis</button>
  </form>
  <hr style="margin: 24px 0;">
<h2>Sprememba profilne slike</h2>
<input type="file" id="pfpUpload" accept="image/*"><br><br>
<img id="pfpPreview" src="" style="display:none; max-width: 128px; border-radius: 8px; margin-bottom: 12px;"><br>
<button id="uploadPfpBtn" class="change-username-btn" style="display:none;">⬆️ Naloži profilno sliko</button>

  `;

  if (uid) {
    await checkCooldownStatus();
  }
});

friendsTab.addEventListener("click", async (e) => {
  e.preventDefault();
  setActiveTab(friendsTab);
  await loadFriendRequests();
});

profileTab.click();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    uid = user.uid;
    profileTab.click();
  }
});

// Profile Picture Changing System

document.addEventListener("change", async (e) => {
  if (e.target.id === "pfpUpload") {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = function (event) {
      img.src = event.target.result;
    };

    img.onload = function () {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      // Resize and center image
      const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
      const newWidth = img.width * ratio;
      const newHeight = img.height * ratio;
      const xOffset = (canvas.width - newWidth) / 2;
      const yOffset = (canvas.height - newHeight) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, xOffset, yOffset, newWidth, newHeight);

      const base64 = canvas.toDataURL("image/png");

      const preview = document.getElementById("pfpPreview");
      const uploadBtn = document.getElementById("uploadPfpBtn");

      preview.src = base64;
      preview.style.display = "block";
      uploadBtn.style.display = "inline-block";

      uploadBtn.onclick = async () => {
        try {
          const pfpRef = doc(db, "pfpData", uid);
          await setDoc(pfpRef, {
            profilePicture: base64
          });
          alert("Profilna slika je bila uspešno naložena.");
        } catch (err) {
          console.error("Napaka pri nalaganju slike:", err);
          alert("Prišlo je do napake pri nalaganju slike.");
        }
      };
    };

    reader.readAsDataURL(file);
  }
});


document.addEventListener("submit", async (e) => {
  if (e.target.id === "usernameForm") {
    e.preventDefault();

    const newUsername = document.getElementById("newUsername").value.trim();
    const submitBtn = e.target.querySelector("button");

    if (!newUsername || newUsername.length < 3) {
      alert("Uporabniško ime mora vsebovati vsaj 3 znake.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Preverjanje...";

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      const lastChanged = userSnap.data()?.lastUsernameChange;

      // Check if username was changed within last 24 hours
      if (lastChanged && Date.now() - lastChanged.toMillis() < 86400000) {
        const msLeft = 86400000 - (Date.now() - lastChanged.toMillis());
        startCooldownTimer(msLeft, submitBtn);
        return;
      }

      const allUsersSnap = await getDocs(query(collection(db, "users")));
      let nameTaken = false;

      allUsersSnap.forEach(docSnap => {
        if (docSnap.data().Username?.toLowerCase() === newUsername.toLowerCase()) {
          nameTaken = true;
        }
      });

      if (nameTaken) {
        alert("To uporabniško ime je že zasedeno.");
        submitBtn.disabled = false;
        submitBtn.textContent = "🔁 Spremeni uporabniško ime";
        return;
      }

      await updateDoc(userRef, {
        Username: newUsername,
        lastUsernameChange: new Date()
      });

      alert("Uporabniško ime je bilo uspešno spremenjeno.");
      submitBtn.disabled = false;
      submitBtn.textContent = "🔁 Spremeni uporabniško ime";
    } catch (err) {
      console.error(err);
      alert("Prišlo je do napake, poskusi znova.");
      submitBtn.disabled = false;
      submitBtn.textContent = "🔁 Spremeni uporabniško ime";
    }
  } else if (e.target.id === "bioForm") {
    e.preventDefault();

    const newBio = document.getElementById("newBio").value.trim();
    const submitBtn = e.target.querySelector("button");

    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Shranjevanje...";

    try {
      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        bio: newBio
      });

      alert("Opis je bil uspešno posodobljen.");
      document.getElementById("newBio").value = "";
      submitBtn.disabled = false;
      submitBtn.textContent = "💬 Spremeni opis";
    } catch (err) {
      console.error(err);
      alert("Prišlo je do napake, poskusi znova.");
      submitBtn.disabled = false;
      submitBtn.textContent = "💬 Spremeni opis";
    }
  }
});

async function checkCooldownStatus() {
  const submitBtn = document.querySelector("#usernameForm button");
  if (!submitBtn) return;

  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const lastChanged = userSnap.data()?.lastUsernameChange;

    if (lastChanged) {
      const lastChangedMs = lastChanged.toMillis ? lastChanged.toMillis() : new Date(lastChanged).getTime();
      const diff = Date.now() - lastChangedMs;

      if (diff < 86400000) {
        startCooldownTimer(86400000 - diff, submitBtn);
      }
    }
  } catch (err) {
    console.error("Napaka pri preverjanju cooldown statusa:", err);
  }
}

let cooldownInterval;

function startCooldownTimer(durationMs, button) {
  if (cooldownInterval) clearInterval(cooldownInterval);

  button.disabled = true;

  let timeLeft = durationMs;

  updateButtonText();

  cooldownInterval = setInterval(() => {
    timeLeft -= 1000;
    if (timeLeft <= 0) {
      clearInterval(cooldownInterval);
      button.disabled = false;
      button.textContent = "🔁 Spremeni uporabniško ime";
    } else {
      updateButtonText();
    }
  }, 1000);

  function updateButtonText() {
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    button.textContent = `⏳ Počakaj ${hours}h ${minutes}m ${seconds}s`;
  }
}
