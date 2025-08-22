import { getFirestore, doc, setDoc, getDocs, collection, query, where, orderBy, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Firebase init
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const startBtn = document.querySelector(".start-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const statusBox = document.getElementById("adminStatus");

// Create popup + overlay dynamically
const overlay = document.createElement("div");
overlay.id = "adminOverlay";
overlay.style.cssText = "display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:100;";
document.body.appendChild(overlay);

const popup = document.createElement("div");
popup.id = "adminPopup";
popup.style.cssText = `
  display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
  background:#fff; padding:2rem; border-radius:12px; z-index:101; max-width:400px; width:90%;
`;

popup.innerHTML = `
  <h2>Nova Loterija</h2>
  <label>Round ID (ali prazen za danes):</label>
  <input type="text" id="roundId" style="width:100%; margin-bottom:1rem;">

  <label>Začetni čas:</label>
  <input type="datetime-local" id="startTime" style="width:100%; margin-bottom:1rem;">

  <label>Konec (endTime):</label>
  <input type="datetime-local" id="endTime" style="width:100%; margin-bottom:1rem;">

  <label>Jackpot:</label>
  <input type="number" id="jackpot" placeholder="npr. 50.000" style="width:100%; margin-bottom:1rem;">

  <div style="display:flex; justify-content:space-between; gap:1rem; margin-top:1rem;">
    <button id="closePopup" style="flex:1; background:#ccc; padding:0.8rem; border:none; border-radius:8px;">Prekliči</button>
    <button id="confirmNewRound" style="flex:1; background:#28a745; color:white; padding:0.8rem; border:none; border-radius:8px;">Potrdi</button>
  </div>
`;
document.body.appendChild(popup);

// Open popup
startBtn.addEventListener("click", () => {
  overlay.style.display = "block";
  popup.style.display = "block";
});

// Close popup
document.addEventListener("click", (e) => {
  if (e.target.id === "closePopup" || e.target.id === "adminOverlay") {
    overlay.style.display = "none";
    popup.style.display = "none";
  }
});

// Confirm new round
document.addEventListener("click", async (e) => {
  if (e.target.id === "confirmNewRound") {
    let roundId = document.getElementById("roundId").value.trim();
    if (!roundId) {
      roundId = new Date().toISOString().split("T")[0]; // e.g., "2025-08-20"
    }

    const jackpot = parseInt(document.getElementById("jackpot").value) || 50000;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!endTime) {
      statusBox.innerHTML = `<p style="color:red;">❌ Prosimo, da vnesete konec runde (endTime)!</p>`;
      return;
    }

    const newRound = {
      roundId,
      status: "open",
      jackpot,
      winningNumbers: [],
      winningStars: [],
      tickets: {},
      createdAt: startTime ? Timestamp.fromDate(new Date(startTime)) : Timestamp.fromDate(new Date()),
      endsAt: Timestamp.fromDate(new Date(endTime))
    };

    try {
      await setDoc(doc(db, "lotteryData", roundId), newRound);
      statusBox.innerHTML = `<p style="color:green;">✅ Nova runda ustvarjena: ${roundId}</p>`;
    } catch (err) {
      console.error(err);
      statusBox.innerHTML = `<p style="color:red;">❌ Napaka pri ustvarjanju runde.</p>`;
    }

    overlay.style.display = "none";
    popup.style.display = "none";
  }
});

// Cancel current lottery
cancelBtn.addEventListener("click", async () => {
  try {
    const q = query(
      collection(db, "lotteryData"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusBox.innerHTML = `<p style="color:red;">❌ Ni odprtih rund za preklic.</p>`;
      return;
    }

    const latestRound = querySnapshot.docs[0];
    const roundRef = doc(db, "lotteryData", latestRound.id);

    await setDoc(roundRef, {
      ...latestRound.data(),
      status: "closed",
      closedAt: new Date().toISOString()
    });

    statusBox.innerHTML = `<p style="color:orange;">⚠️ Runda ${latestRound.id} je bila zaprta.</p>`;

  } catch (err) {
    console.error(err);
    statusBox.innerHTML = `<p style="color:red;">❌ Napaka pri zapiranju runde.</p>`;
  }
});

// --- Random winning numbers button ---
const randomBtn = document.createElement("button");
randomBtn.textContent = "🎲 Generiraj naključne številke";
randomBtn.className = "admin-btn";
randomBtn.style.background = "#007bff";
randomBtn.style.color = "#fff";
randomBtn.style.marginTop = "1rem";
randomBtn.addEventListener("mouseover", () => randomBtn.style.background = "#0069d9");
randomBtn.addEventListener("mouseout", () => randomBtn.style.background = "#007bff");
document.querySelector(".admin-buttons").appendChild(randomBtn);

// Generate unique random numbers in range
function generateUniqueRandomNumbers(count, min, max) {
  const numbers = new Set();
  while (numbers.size < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(n);
  }
  return Array.from(numbers).sort((a,b)=>a-b);
}

// Handle random numbers
randomBtn.addEventListener("click", async () => {
  try {
    const q = query(
      collection(db, "lotteryData"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      statusBox.innerHTML = `<p style="color:red;">❌ Ni odprtih rund za generiranje številk.</p>`;
      return;
    }

    const latestRoundDoc = querySnapshot.docs[0];
    const roundRef = doc(db, "lotteryData", latestRoundDoc.id);

    const winningNumbers = generateUniqueRandomNumbers(5, 1, 50);
    const winningStars = generateUniqueRandomNumbers(2, 1, 12);

    await setDoc(roundRef, {
      ...latestRoundDoc.data(),
      winningNumbers,
      winningStars,
      status: "closed",
      closedAt: new Date().toISOString()  // optional timestamp
    });

    statusBox.innerHTML = `<p style="color:green;">✅ Naključne številke dodane: [${winningNumbers.join(", ")}] ★[${winningStars.join(", ")}]</p>`;

  } catch (err) {
    console.error(err);
    statusBox.innerHTML = `<p style="color:red;">❌ Napaka pri generiranju naključnih številk.</p>`;
  }
});
