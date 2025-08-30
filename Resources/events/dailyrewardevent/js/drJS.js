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

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const rewards = [50, 75, 100, 125, 150, 200, 250];

const rewardsGrid = document.getElementById("drRewardsGrid");
const claimArea = document.getElementById("drClaimArea");
const countdownEl = document.getElementById("drCountdown");

let countdownInterval = null;

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    rewardsGrid.innerHTML = `<p>Prijavite se, da vidite DR nagrade!</p>`;
    claimArea.innerHTML = "";
    countdownEl.textContent = "";
    return;
  }
  await renderInlineRewards(user);
});

async function renderInlineRewards(user) {
  const userDocRef = doc(db, "users", user.uid);
  const drEventDocRef = doc(db, "DrEventData", user.uid);

  const userSnap = await getDoc(userDocRef);
  const eventSnap = await getDoc(drEventDocRef);

  let streak = eventSnap.exists() ? eventSnap.data().streak || 0 : 0;
  let lastClaimTime = eventSnap.exists() ? eventSnap.data().lastDailyClaimTime?.toDate?.() : null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let canClaim = streak < rewards.length;
  let nextIndex = streak;
  let nextClaimTime = null;

  if (streak < rewards.length && lastClaimTime) {
    const lastDate = new Date(lastClaimTime);
    const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today - lastMidnight) / (1000*60*60*24));

    if (diffDays < 1) {
      canClaim = false;
      nextClaimTime = new Date(lastMidnight);
      nextClaimTime.setDate(nextClaimTime.getDate() + 1);
    }
  }

  // Build rewards grid with day labels
  function buildRewardsHtml() {
    return rewards.map((r, i) => {
      let chipEmoji = "💎";
      let statusClass = "";
      if (i < streak) {
        statusClass = "reward-claimed";
        chipEmoji = "✅";
      } else if (i === streak && canClaim) {
        statusClass = "reward-next pulse";
      }
      let extraClass = i === 6 ? "day7" : "";
      
      const dayLabel = `Dan ${i + 1}`; // or "Nagrada #" + (i + 1)

      return `
        <div class="dr-reward-card ${statusClass} ${extraClass}" data-index="${i}">
          <div class="dr-reward-day">${dayLabel}</div>
          <div class="dr-reward-chip">${chipEmoji}</div>
          <div class="dr-reward-amount">${r} Diamantov</div>
        </div>
      `;
    }).join("");
  }

  rewardsGrid.innerHTML = buildRewardsHtml();
  claimArea.innerHTML = "";

  if (streak >= rewards.length) {
    countdownEl.textContent = "Vse nagrade prevzete.";
    countdownEl.style.color = "gold";
    return;
  }

  if (canClaim) {
    const claimBtn = document.createElement("button");
    claimBtn.textContent = "Prevzemi Nagrado";
    claimBtn.className = "dr-claim-button";
    claimBtn.style.cursor = "pointer";
    claimArea.appendChild(claimBtn);

    claimBtn.addEventListener("click", async () => {
      const rewardAmount = rewards[nextIndex];

      if (!userSnap.exists()) {
        await setDoc(userDocRef, { premiumBalance: rewardAmount }, { merge: true });
      } else {
        const prev = userSnap.data().premiumBalance || 0;
        await updateDoc(userDocRef, { premiumBalance: prev + rewardAmount });
      }

      streak += 1;
      await setDoc(drEventDocRef, {
        lastDailyClaimTime: serverTimestamp(),
        streak: streak
      }, { merge: true });

      const rewardCards = rewardsGrid.querySelectorAll(".dr-reward-card");
      const claimedCard = rewardCards[nextIndex];
      if (claimedCard) {
        claimedCard.classList.add("reward-claimed");
        claimedCard.classList.remove("reward-next", "pulse");
        claimedCard.querySelector(".dr-reward-chip").textContent = "✅";
      }

      nextIndex += 1;
      claimBtn.remove();

      if (streak >= rewards.length) {
        countdownEl.textContent = "Vse nagrade prevzete.";
        countdownEl.style.color = "gold";
      } else {
        const nextCard = rewardCards[nextIndex];
        if (nextCard) nextCard.classList.add("reward-next", "pulse");

        let lastClaimDate = new Date();
        lastClaimDate.setHours(0,0,0,0);
        let nextDay = new Date(lastClaimDate);
        nextDay.setDate(nextDay.getDate() + 1);
        updateCountdown(nextDay);
      }
    });
  } else if (nextClaimTime) {
    updateCountdown(nextClaimTime);
  }
}

// Countdown function
function updateCountdown(nextTime) {
  if (countdownInterval) clearInterval(countdownInterval);
  if (!nextTime) {
    countdownEl.textContent = "";
    return;
  }

  countdownInterval = setInterval(() => {
    const now = new Date();
    const diff = nextTime - now;

    if (diff <= 0) {
      clearInterval(countdownInterval);
      countdownEl.textContent = "You can claim your next reward!";
    } else {
      const hours = String(Math.floor(diff / (1000*60*60))).padStart(2,"0");
      const mins = String(Math.floor((diff % (1000*60*60)) / (1000*60))).padStart(2,"0");
      const secs = String(Math.floor((diff % (1000*60)) / 1000)).padStart(2,"0");
      countdownEl.textContent = `Prosimo počakajte: ${hours}:${mins}:${secs}`;
    }
  }, 1000);
}
