import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";

/* ===========================
   FIREBASE INITIALIZATION
=========================== */
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

/* ===========================
   DOM ELEMENT
=========================== */
const ticketsContainer = document.getElementById("myTicketsList");
if (ticketsContainer) {
    ticketsContainer.style.display = "flex";
    ticketsContainer.style.flexDirection = "column";
    ticketsContainer.style.alignItems = "center";
    ticketsContainer.style.gap = "15px";
}

/* ===========================
   HELPER FUNCTIONS
=========================== */
function formatNumbersWithDots(num) {
    if (!num) return "";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function createTicketEl(ticket, statusText, bgColor, prizeText, combinationText) {
    const mainNumbers = ticket.numbers.join(" ");
    const stars = ticket.stars.join(" ");
    const date = ticket.purchasedAt?.toDate?.().toLocaleString() || "—";

    const ticketEl = document.createElement("div");
    ticketEl.className = "ticket-item";
    ticketEl.style.cssText = `
        border-radius:8px; padding:15px; 
        width:300px; text-align:center;
        cursor:pointer; display:flex; flex-direction:column;
        background:${bgColor};
        color:white;
        box-shadow: 0 0 8px rgba(0,0,0,0.5);
    `;

    ticketEl.innerHTML = `
        <div class="ticket-header" style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <strong>Kolo: ${ticket.roundId || "—"}</strong>
            <span>${date}</span>
        </div>
        <div class="ticket-numbers" style="font-weight:bold; font-size:16px;">
            <span>${mainNumbers}  |  ${stars}</span>
        </div>
        <div class="ticket-status" style="margin-top:5px;">
            <span>${statusText}${combinationText ? " — Kombinacija: " + combinationText : ""}${prizeText ? " — Nagrada: " + prizeText : ""}</span>
        </div>
    `;

    return ticketEl;
}

/* ===========================
   DISPLAY TICKETS
=========================== */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        if (ticketsContainer) ticketsContainer.innerHTML = "<p>Za ogled srečk se morate prijaviti.</p>";
        return;
    }

    const userUid = user.uid;
    const ticketsQuery = query(
        collection(db, "tickets"),
        where("uid", "==", userUid),
        orderBy("purchasedAt", "desc")
    );

    onSnapshot(ticketsQuery, async (snapshot) => {
        if (!ticketsContainer) return;
        ticketsContainer.innerHTML = "";

        if (snapshot.empty) {
            ticketsContainer.innerHTML = "<p>Zaenkrat nimate kupljenih srečk.</p>";
            return;
        }

        // Cache final prizes for rounds to avoid repeated fetching
        const roundsCache = {};

        // Group tickets by round end time
        const ticketsByEndTime = {};

        for (const docSnap of snapshot.docs) {
            const ticket = docSnap.data();
            const roundId = ticket.roundId;

            // Get lottery results for this round, caching final prizes
            let lottery;
            if (roundsCache[roundId]) {
                lottery = roundsCache[roundId];
            } else {
                const lotteryDoc = await getDoc(doc(db, "lotteryData", roundId));
                if (lotteryDoc.exists()) {
                    lottery = lotteryDoc.data();

                    // If lottery closed, ensure prizes object exists
                    if (lottery.status === "closed" && !lottery.prizes) {
                        lottery.prizes = {}; // placeholder if somehow missing
                    }

                    roundsCache[roundId] = lottery;
                } else {
                    lottery = null;
                    roundsCache[roundId] = null;
                }
            }

            const endTimeStr = lottery?.endsAt?.toDate?.().toLocaleDateString() || roundId;
            if (!ticketsByEndTime[endTimeStr]) ticketsByEndTime[endTimeStr] = [];
            ticketsByEndTime[endTimeStr].push({ ticket, lottery });
        }

        for (const [endTime, ticketGroup] of Object.entries(ticketsByEndTime)) {
            const sectionTitle = document.createElement("h3");
            sectionTitle.textContent = `Rezultati dne: ${endTime}`;
            ticketsContainer.appendChild(sectionTitle);

            ticketGroup.forEach(({ ticket, lottery }) => {
                let statusText = "V obdelavi";
                let bgColor = "#f7d354"; // yellow
                let prizeText = "";
                let combinationText = "";

                if (lottery) {
                    const now = new Date().getTime();
                    const lotteryEnded = lottery.status === "closed" || lottery.endsAt?.toDate?.().getTime() < now;

                    if (!lotteryEnded) {
                        statusText = "V obdelavi!";
                        bgColor = "#f7d354";
                    } else {
                        // Calculate matches
                        const mainMatches = ticket.numbers.reduce(
                            (acc, num, idx) => acc + (lottery.winningNumbers[idx] === num ? 1 : 0),
                            0
                        );
                        const starMatches = ticket.stars.reduce(
                            (acc, num, idx) => acc + (lottery.winningStars[idx] === num ? 1 : 0),
                            0
                        );
                        combinationText = `${mainMatches}+${starMatches}`;

                        const prizeMap = lottery.prizes || {};
                        let prize = 0;

                        // Determine prize tier from saved final prizes
                        if (mainMatches === 5 && starMatches === 2) { prize = prizeMap.prize1 || 0; statusText = "ZMAGAL!"; bgColor = "#2ecc71"; }
                        else if (mainMatches === 5 && starMatches === 1) { prize = prizeMap.prize2 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#27ae60"; }
                        else if (mainMatches === 5 && starMatches === 0) { prize = prizeMap.prize3 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#2980b9"; }
                        else if (mainMatches === 4 && starMatches === 2) { prize = prizeMap.prize4 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#f39c12"; }
                        else if (mainMatches === 4 && starMatches === 1) { prize = prizeMap.prize5 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#e67e22"; }
                        else if (mainMatches === 3 && starMatches === 2) { prize = prizeMap.prize6 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#d35400"; }
                        else if (mainMatches === 2 && starMatches === 2) { prize = prizeMap.prize7 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#c0392b"; }
                        else if (mainMatches === 2 && starMatches === 1) { prize = prizeMap.prize8 || 0; statusText = "DELNO ZMAGAL!"; bgColor = "#8e44ad"; }
                        else { statusText = "IZGUBLJENO!"; bgColor = "#7f8c8d"; }

                        prizeText = prize ? formatNumbersWithDots(prize) : "";
                    }
                }

                const ticketEl = createTicketEl(ticket, statusText, bgColor, prizeText, combinationText);
                ticketsContainer.appendChild(ticketEl);
            });
        }
    });
});

console.log("Sistem srečk inicializiran z barvami, statusom, nagradami in kombinacijami.");
