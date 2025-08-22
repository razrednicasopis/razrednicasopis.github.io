import { getFirestore, doc, collection, query, orderBy, limit, onSnapshot, where, updateDoc, getDoc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

// Firebase initialization
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

// Prize setup
const prizePercentages = { prize1: 1.0, prize2: 0.5, prize3: 0.25, prize4: 0.10, prize5: 0.05 };
const fixedPrizes = { prize6: 1000, prize7: 500, prize8: 100 };

// DOM elements
const jackpotSpan = document.getElementById("currentJackpot");
const prizeSpans = {
    prize1: document.getElementById("prize1"),
    prize2: document.getElementById("prize2"),
    prize3: document.getElementById("prize3"),
    prize4: document.getElementById("prize4"),
    prize5: document.getElementById("prize5"),
    prize6: document.getElementById("prize6"),
    prize7: document.getElementById("prize7"),
    prize8: document.getElementById("prize8")
};
const countdownSpan = document.getElementById("countdown");
const pastRoundsList = document.getElementById("pastRoundsList");

let currentRound = null;
let countdownInterval = null;

// --- Listen for open lottery rounds ---
const roundsCollection = "lotteryData";
const q = query(collection(db, roundsCollection), where("status", "==", "open"), orderBy("createdAt", "desc"), limit(1));

onSnapshot(q, async (snapshot) => {
    const buttons = document.querySelectorAll(".ticket-card .btn");

    if (snapshot.empty) {
        if (currentRound) await saveFinalPrizes(currentRound);
        jackpotSpan.textContent = "Ni trenutnih iger.";
        countdownSpan.textContent = "";
        countdownSpan.style.display = "none"; // hide countdown
        for (const prizeId in prizeSpans) prizeSpans[prizeId].textContent = "Ni zadetkov.";
        currentRound = null;
        buttons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        });
        return;
    }

    countdownSpan.style.display = "block"; // show countdown

    const latestRound = snapshot.docs[0].data();
    currentRound = snapshot.docs[0];

    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    });

    const jackpot = latestRound.jackpot || 50000;
    jackpotSpan.textContent = `${jackpot.toLocaleString()} 💎`;

    for (const prizeId in prizePercentages) {
        prizeSpans[prizeId].textContent = Math.floor(jackpot * prizePercentages[prizeId]).toLocaleString();
    }
    for (const prizeId in fixedPrizes) {
        prizeSpans[prizeId].textContent = fixedPrizes[prizeId].toLocaleString();
    }

    if (latestRound.endsAt) startCountdown(latestRound.endsAt);
});

// --- Countdown function ---
function startCountdown(endTime) {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endTime.toMillis ? endTime.toMillis() - now : new Date(endTime).getTime() - now;

        if (distance <= 0) {
            countdownSpan.textContent = "Dogodek je končan!";
            closeLottery();
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownSpan.textContent = `Čas do konca: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// --- Save final prizes ---
async function saveFinalPrizes(roundDoc) {
    const roundRef = doc(db, roundsCollection, roundDoc.id);
    const prizesToSave = {};
    for (const prizeId in prizeSpans) {
        prizesToSave[prizeId] = parseInt(prizeSpans[prizeId].textContent.replace(/\D/g, '')) || 0;
    }
    await updateDoc(roundRef, {
        prizes: prizesToSave,
        status: "closed"
    });
    for (const prizeId in prizeSpans) prizeSpans[prizeId].textContent = "Ni zadetkov.";
}

// --- Close lottery manually ---
async function closeLottery() {
    if (!currentRound) return;
    await saveFinalPrizes(currentRound);
}

// --- Past rounds with line-by-line main prize checking ---
const pastQuery = query(
    collection(db, roundsCollection),
    orderBy("createdAt", "desc"),
    limit(5)
);

onSnapshot(pastQuery, async (snapshot) => {
    if (!pastRoundsList) return;
    pastRoundsList.innerHTML = "";

    for (const docSnap of snapshot.docs) {
        const round = docSnap.data();
        const roundDiv = document.createElement("div");
        roundDiv.style.width = "25%";
        roundDiv.style.justifySelf = "center";
        roundDiv.className = "past-round";
        roundDiv.style.padding = "15px";
        roundDiv.style.marginBottom = "20px";
        roundDiv.style.borderRadius = "10px";
        roundDiv.style.display = "flex";
        roundDiv.style.flexDirection = "column";
        roundDiv.style.gap = "8px";

        const title = document.createElement("div");
        title.className = "past-round-title";
        title.textContent = `Krog ${round.roundNumber || docSnap.id}`;
        title.style.fontWeight = "bold";
        roundDiv.appendChild(title);

        const numbersDiv = document.createElement("div");
        numbersDiv.style.display = "flex";
        numbersDiv.style.gap = "5px";
        numbersDiv.style.flexWrap = "wrap";
        numbersDiv.style.alignItems = "center";
        numbersDiv.style.justifyContent = "center";

        (round.winningNumbers || []).forEach(num => {
            const numSpan = document.createElement("span");
            numSpan.textContent = num;
            numSpan.style.fontWeight = "bold";
            numSpan.style.backgroundColor = "#e0e0e0";
            numSpan.style.padding = "3px 8px";
            numSpan.style.borderRadius = "5px";
            numbersDiv.appendChild(numSpan);
        });

        const separator = document.createElement("span");
        separator.textContent = " | ";
        separator.style.fontWeight = "bold";
        numbersDiv.appendChild(separator);

        (round.winningStars || []).forEach(star => {
            const starSpan = document.createElement("span");
            starSpan.textContent = star;
            starSpan.style.fontWeight = "bold";
            starSpan.style.padding = "3px 8px";
            starSpan.style.borderRadius = "5px";
            numbersDiv.appendChild(starSpan);
        });

        roundDiv.appendChild(numbersDiv);

        const jackpotDiv = document.createElement("div");
        jackpotDiv.className = "past-round-jackpot";
        jackpotDiv.textContent = `Glavni sklad: ${round.jackpot?.toLocaleString() || "0"} 💎`;
        roundDiv.appendChild(jackpotDiv);

        // --- Check main prize line-by-line ---
        const ticketsQuery = query(collection(db, "tickets"), where("roundId", "==", docSnap.id));
        const ticketsSnapshot = await getDocs(ticketsQuery);

        let mainPrizeWon = false;
        ticketsSnapshot.forEach(ticketDoc => {
            const ticket = ticketDoc.data();
            const numbersMatch = (ticket.numbers || []).every((num, idx) => num === (round.winningNumbers || [])[idx]);
            const starsMatch = (ticket.stars || []).every((star, idx) => star === (round.winningStars || [])[idx]);
            if (numbersMatch && starsMatch) mainPrizeWon = true;
        });

        if (mainPrizeWon !== round.mainPrizeWon) {
            await updateDoc(doc(db, roundsCollection, docSnap.id), { mainPrizeWon });
        }

        // --- Green or red border based on main prize ---
        roundDiv.style.border = `2px solid ${mainPrizeWon ? "green" : "red"}`;

        const statusDiv = document.createElement("div");
        statusDiv.className = "past-round-status";
        statusDiv.textContent = mainPrizeWon ? "Glavni dobitek je bil izžreban ✔" : "Glavni dobitek ni bil izžreban ✖";
        if (!mainPrizeWon) statusDiv.classList.add("not-won");
        roundDiv.appendChild(statusDiv);

        pastRoundsList.appendChild(roundDiv);
    }
});

// --- Ticket purchase system ---
async function saveTicket(uid, username, numbers, stars) {
    if (!currentRound) return;
    const ticketRef = doc(collection(db, "tickets"));
    await setDoc(ticketRef, { uid, username, roundId: currentRound.id, numbers, stars, purchasedAt: new Date() });
}

// --- Random numbers ---
function generateRandomNumbers() {
    const numbers = [];
    while (numbers.length < 5) {
        const n = Math.floor(Math.random() * 50) + 1;
        if (!numbers.includes(n)) numbers.push(n);
    }
    const stars = [];
    while (stars.length < 2) {
        const s = Math.floor(Math.random() * 10) + 1;
        if (!stars.includes(s)) stars.push(s);
    }
    return { numbers, stars };
}

// --- Popup system ---
function createPopup(content, onConfirm) {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = 9999;

    const popup = document.createElement("div");
    popup.style.background = "#fff";
    popup.style.padding = "30px 25px";
    popup.style.borderRadius = "15px";
    popup.style.maxWidth = "450px";
    popup.style.width = "90%";
    popup.style.boxShadow = "0 5px 25px rgba(0,0,0,0.35)";
    popup.style.textAlign = "center";

    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = content;
    contentDiv.style.marginBottom = "20px";
    popup.appendChild(contentDiv);

    const btnDiv = document.createElement("div");
    btnDiv.style.display = "flex";
    btnDiv.style.justifyContent = "space-around";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Potrdi";
    confirmBtn.style.padding = "12px 25px";
    confirmBtn.style.border = "none";
    confirmBtn.style.borderRadius = "10px";
    confirmBtn.style.background = "#4CAF50";
    confirmBtn.style.color = "#fff";
    confirmBtn.style.cursor = "pointer";
    confirmBtn.style.fontSize = "16px";
    confirmBtn.onmouseenter = () => confirmBtn.style.background = "#45a049";
    confirmBtn.onmouseleave = () => confirmBtn.style.background = "#4CAF50";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Prekliči";
    cancelBtn.style.padding = "12px 25px";
    cancelBtn.style.border = "none";
    cancelBtn.style.borderRadius = "10px";
    cancelBtn.style.background = "#f44336";
    cancelBtn.style.color = "#fff";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.fontSize = "16px";
    cancelBtn.onmouseenter = () => cancelBtn.style.background = "#da190b";
    cancelBtn.onmouseleave = () => cancelBtn.style.background = "#f44336";

    btnDiv.appendChild(confirmBtn);
    btnDiv.appendChild(cancelBtn);
    popup.appendChild(btnDiv);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    confirmBtn.onclick = () => { if (onConfirm) onConfirm(); document.body.removeChild(overlay); };
    cancelBtn.onclick = () => document.body.removeChild(overlay);
}

// --- Buy ticket functions ---
async function buyManualTicket(user, userData) {
    const inputsHtml = `<h3>Izberi 5 številk (1-50) in 2 zvezdici (1-10)</h3>
        <div style="display:flex; justify-content:center; gap:5px; margin:10px 0;">
            ${[1,2,3,4,5].map(i=>`<input id="num${i}" type="number" min="1" max="50" style="width:50px; font-size:18px; text-align:center;" placeholder="${i}">`).join('')}
        </div>
        <div style="display:flex; justify-content:center; gap:5px; margin:10px 0;">
            ${[1,2].map(i=>`<input id="star${i}" type="number" min="1" max="10" style="width:50px; font-size:18px; text-align:center;" placeholder="★${i}">`).join('')}
        </div>
        <p>Vnesite vsako številko in zvezdico posebej, nato pritisnite Potrdi.</p>`;
    createPopup(inputsHtml, async () => {
        const nums = [1,2,3,4,5].map(i => parseInt(document.getElementById(`num${i}`).value)).filter(n=>!isNaN(n));
        const stars = [1,2].map(i => parseInt(document.getElementById(`star${i}`).value)).filter(n=>!isNaN(n));
        if (nums.length !== 5 || stars.length !== 2 || nums.some(n=>n<1||n>50) || stars.some(s=>s<1||s>10)) return alert("Prosimo, vnesite pravilne številke in zvezdice!");
        await saveTicket(user.uid, userData.Username, nums, stars);
        await updateDoc(doc(db,"users",user.uid), { premiumBalance: userData.premiumBalance-100 });
        createPopup(`<h3>Vaša srečka</h3><p>${nums.join(", ")} | ★${stars.join(", ")}</p><p>Srečno!</p>`);
    });
}

async function buyRandomTicket(user, userData) {
    const { numbers, stars } = generateRandomNumbers();
    createPopup(`<h3>Vaša naključna srečka</h3><p>${numbers.join(", ")} | ★${stars.join(", ")}</p>`, async () => {
        await saveTicket(user.uid, userData.Username, numbers, stars);
        await updateDoc(doc(db,"users",user.uid), { premiumBalance: userData.premiumBalance-100 });
    });
}

async function buyTicket(ticketType) {
    if (!currentRound) return alert("Trenutno ni odprte loterije!");
    const user = auth.currentUser;
    if (!user) return alert("Prijavite se za nakup srečke!");
    const userSnap = await getDoc(doc(db,"users",user.uid));
    if (!userSnap.exists()) return alert("Uporabniški podatki manjkajo!");
    const userData = userSnap.data();
    if (userData.premiumBalance < 100) return alert("Nimate dovolj 💎!");
    if (ticketType === "random") return buyRandomTicket(user,userData);
    if (ticketType === "manual") return buyManualTicket(user,userData);
}

// --- Attach buttons ---
document.querySelectorAll(".ticket-card .btn").forEach(button => {
    button.addEventListener("click", () => {
        const ticketType = button.parentElement.querySelector("h2").textContent.includes("Izberi") ? "manual" : "random";
        buyTicket(ticketType);
    });
});
