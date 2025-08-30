import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const rewards = [100, 150, 200, 250, 300, 400, 500];

// Overlay & Popup
const overlay = document.createElement("div");
overlay.id = "dailyRewardsOverlay";
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;
document.body.appendChild(overlay);

const popupContainer = document.createElement("div");
popupContainer.id = "dailyRewardsPopup";
popupContainer.style.cssText = `
  background: #1e1e2f;
  color: white;
  width: min(900px, 95%);
  border-radius: 12px;
  padding: 24px;
  max-height: 90%;
  overflow-y: auto;
  text-align: center;
  position: relative;
`;
overlay.appendChild(popupContainer);

overlay.addEventListener("click", e => {
  if (e.target === overlay) overlay.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("dailyRewardsBtn");
  btn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Najprej se prijavite za dnevne nagrade!");
      return;
    }
    overlay.style.display = "flex";
    await renderPopup(user);
  });
});

async function renderPopup(user) {
  const userDocRef = doc(db, "users", user.uid);
  const cgEventDocRef = doc(db, "cgEventData", user.uid);

  const userSnap = await getDoc(userDocRef);
  const eventSnap = await getDoc(cgEventDocRef);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let lastClaimTime = eventSnap.exists() ? eventSnap.data().lastDailyClaimTime?.toDate?.() : null;
  let streak = eventSnap.exists() ? eventSnap.data().streak || 0 : 0;

  // If streak is already 7, reset immediately
  if (streak >= rewards.length) {
    streak = 0;
    lastClaimTime = null;
    await updateDoc(cgEventDocRef, { streak: 0 });
  }

  let nextIndex = 0;
  let canClaim = true;

  if (lastClaimTime) {
    const lastDate = new Date(lastClaimTime);
    const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today - lastMidnight) / (1000*60*60*24));

    if (diffDays === 0) {
      canClaim = false; // already claimed today
      nextIndex = streak % rewards.length;
    } else if (diffDays === 1) {
      nextIndex = streak % rewards.length;
    } else {
      nextIndex = 0;
      streak = 0;
    }
  }

  function buildRewardsHtml(currentStreak, nextIdx) {
    return rewards.map((r, i) => {
      let chipEmoji = "🎲";
      let statusClass = "";

      if (i < currentStreak) {
        statusClass = "reward-claimed";
        chipEmoji = "✅";
      } else if (i === nextIdx) {
        statusClass = "reward-next pulse";
      }

      return `
        <div class="reward-card ${statusClass}">
          <div class="reward-chip">${chipEmoji}</div>
          <div class="reward-amount">${r} žetonov</div>
        </div>
      `;
    }).join("");
  }

  popupContainer.innerHTML = `
    <h2>Dnevne Nagrade</h2>
    <div class="rewards-grid">${buildRewardsHtml(streak, nextIndex)}</div>
    <div class="claim-area">
      ${canClaim
        ? `<button id="claimRewardBtn" class="claim-button">Prevzemi nagrado</button>`
        : `<p id="waitText" class="claim-countdown">Prosimo počakajte: <span id="countdown">...</span></p>`
      }
    </div>
  `;

  if (!canClaim) {
    const countdownElem = document.getElementById("countdown");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    startCountdown(countdownElem, tomorrow);
  } else {
    const claimBtn = document.getElementById("claimRewardBtn");
    claimBtn.addEventListener("click", async () => {
      const amount = rewards[nextIndex];

      if (!userSnap.exists()) {
        await setDoc(userDocRef, { cardEventChips: amount }, { merge: true });
      } else {
        const prev = userSnap.data().cardEventChips || 0;
        await updateDoc(userDocRef, { cardEventChips: prev + amount });
      }

      // Handle streak increment or reset after 7th reward
      let isReset = false;
      if (streak + 1 >= rewards.length) {
        streak = 0;
        isReset = true;
      } else {
        streak += 1;
      }

      await setDoc(cgEventDocRef, {
        lastDailyClaimTime: serverTimestamp(),
        streak: streak
      }, { merge: true });

      const rewardCards = popupContainer.querySelectorAll(".reward-card");

      // Update claimed reward
      const claimedCard = rewardCards[nextIndex];
      if (claimedCard) {
        claimedCard.classList.add("reward-claimed");
        claimedCard.classList.remove("reward-next", "pulse");
        claimedCard.querySelector(".reward-chip").textContent = "✅";
      }

      if (isReset) {
        // Reset all cards, highlight/pulse first box
        rewardCards.forEach((card, i) => {
          card.classList.remove("reward-claimed", "reward-next", "pulse");
          card.querySelector(".reward-chip").textContent = "🎲";
        });
        rewardCards[0].classList.add("reward-next", "pulse");
      } else {
        const newNext = rewardCards[streak % rewards.length];
        if (newNext) newNext.classList.add("reward-next", "pulse");
      }

      claimBtn.disabled = true;
      claimBtn.textContent = "Prejeto!";
      setTimeout(() => overlay.style.display = "none", 1000);
    });
  }
}

function startCountdown(element, targetTime) {
  const interval = setInterval(() => {
    const now = new Date();
    const diff = targetTime - now;
    if (diff <= 0) {
      clearInterval(interval);
      element.textContent = "Prevzemi nagrado";
    } else {
      const hours = String(Math.floor(diff / (1000*60*60))).padStart(2, "0");
      const mins = String(Math.floor((diff % (1000*60*60)) / (1000*60))).padStart(2, "0");
      const secs = String(Math.floor((diff % (1000*60)) / 1000)).padStart(2, "0");
      element.textContent = `${hours}:${mins}:${secs}`;
    }
  }, 1000);
}
