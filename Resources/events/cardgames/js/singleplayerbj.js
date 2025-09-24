import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Niste prijavljeni! Preusmerjam vas na glavno stran...");
    window.location.href = "/Resources/events/cardgames/domov.html";
    return;
  }

  // --- DOM Elements ---
  const dealerCardsEl = document.getElementById("dealerCards");
  const playerCardsEl = document.getElementById("playerCards");
  const dealerScoreEl = document.getElementById("dealerScore");
  const playerScoreEl = document.getElementById("playerScore");
  const hitBtn = document.getElementById("hitBtn");
  const standBtn = document.getElementById("standBtn");
  const placeBetBtn = document.getElementById("placeBetBtn");
  const betInput = document.getElementById("betAmount");
  const playerChipsEl = document.getElementById("playerChips");

  const userEventRef = doc(db, "cgEventData", user.uid);
  const userDocRef = doc(db, "users", user.uid);

  // --- Ensure documents exist ---
  const snapEvent = await getDoc(userEventRef);
  if (!snapEvent.exists()) await setDoc(userEventRef, { rating: 0, league: "Dan 1" });

  const snapUser = await getDoc(userDocRef);
  if (!snapUser.exists()) await setDoc(userDocRef, { cardEventChips: 100 });

  // --- Game State ---
  let deck = ["2","3","4","5","6","7","8","9","10","Fant","Kraljica","Kralj","As"];
  let currentDeck = shuffle([...deck,...deck,...deck,...deck]);
  let playerHand = [], dealerHand = [];
  let currentBet = 0;
  let betPlaced = false;
  let chips = snapUser.data()?.cardEventChips ?? 100;
  playerChipsEl.textContent = chips;

  // --- Utilities ---
  function shuffle(array){ return array.sort(()=>Math.random()-0.5); }
  function getCardValue(card){ return ["Fant","Kraljica","Kralj"].includes(card)?10:card==="As"?11:parseInt(card); }
  function calculateScore(hand){
    let score = hand.reduce((sum,c)=>sum+getCardValue(c),0);
    let aces = hand.filter(c=>"As"===c).length;
    while(score>21 && aces>0){score-=10; aces--;}
    return score;
  }
  function renderCard(cardValue, container, hide=false){
    const cardEl = document.createElement("div");
    cardEl.className = "card";
    const back = document.createElement("div"); back.className="card-back"; back.textContent="?";
    const front = document.createElement("div"); front.className="card-front"; front.textContent=cardValue;
    cardEl.appendChild(back); cardEl.appendChild(front); container.appendChild(cardEl);
    if(!hide) setTimeout(()=>cardEl.classList.add("show"),50);
    else cardEl.style.filter="blur(5px)";
    cardEl.style.transform="translateY(-50px)"; cardEl.style.opacity=0;
    setTimeout(()=>{ cardEl.style.transition="all 0.5s ease"; cardEl.style.transform="translateY(0)"; cardEl.style.opacity=1; },50);
  }
  function renderHands(hideDealerSecond=true){
    dealerCardsEl.innerHTML=""; playerCardsEl.innerHTML="";
    dealerHand.forEach((c,i)=>renderCard(c,dealerCardsEl,i===1 && hideDealerSecond));
    playerHand.forEach(c=>renderCard(c,playerCardsEl));
    dealerScoreEl.textContent = hideDealerSecond ? getCardValue(dealerHand[0]) : calculateScore(dealerHand);
    playerScoreEl.textContent = calculateScore(playerHand);
  }
  function dealerPlay(){
    renderHands(false);
    while(calculateScore(dealerHand)<17){
      dealerHand.push(currentDeck.pop());
      renderHands(false);
    }
  }

  // --- Rating & Chips ---
  async function updateRating(winMultiplier){
    const snap = await getDoc(userEventRef);
    let rating = snap.exists() ? snap.data().rating || 0 : 0;
    if(winMultiplier>0) rating += 10;
    else if(winMultiplier<0) rating -= 15;
    if(rating<0) rating = 0;
    await updateDoc(userEventRef, { rating });
    return rating;
  }
  async function updateChips(change){
    chips += change;
    if(chips<0) chips=0;
    await updateDoc(userDocRef, { cardEventChips: chips });
    playerChipsEl.textContent = chips;

    if(chips <= 0){
      showNoChipsPopup();
      betPlaced=false;
      betInput.disabled=true; placeBetBtn.disabled=true;
      hitBtn.disabled=true; standBtn.disabled=true;
    }
  }

  // --- Popups ---
  function showNoChipsPopup(){
    const popup = document.createElement("div");
    popup.style.position="fixed"; popup.style.top="0"; popup.style.left="0";
    popup.style.width="100vw"; popup.style.height="100vh";
    popup.style.background="rgba(0,0,0,0.7)";
    popup.style.display="flex"; popup.style.justifyContent="center"; popup.style.alignItems="center";
    popup.style.zIndex="9999";

    const content = document.createElement("div");
    content.style.background="#1e1e2f"; content.style.color="#fff"; content.style.padding="30px";
    content.style.borderRadius="12px"; content.style.textAlign="center"; content.style.maxWidth="400px"; content.style.width="90%";
    content.innerHTML=`<h2>Žetoni so prazni!</h2><p>Trenutno nimate več žetonov za igranje Blackjacka.</p><button>Nazaj na glavno stran</button>`;
    popup.appendChild(content);
    document.body.appendChild(popup);

    content.querySelector("button").onclick = () => window.location.href="/Resources/events/cardgames/domov.html";
  }

  async function showResultPopup(message, winMultiplier){
    const popup = document.createElement("div");
    popup.style.position="fixed"; popup.style.top="0"; popup.style.left="0";
    popup.style.width="100vw"; popup.style.height="100vh";
    popup.style.background="rgba(0,0,0,0.7)";
    popup.style.display="flex"; popup.style.justifyContent="center"; popup.style.alignItems="center";
    popup.style.zIndex="9999";

    const content = document.createElement("div");
    content.style.background="#1e1e2f"; content.style.color="#fff"; content.style.padding="30px";
    content.style.borderRadius="12px"; content.style.textAlign="center"; content.style.maxWidth="400px"; content.style.width="90%";

    let chipChangeMessage="";
    if(winMultiplier>0) chipChangeMessage=`Zmagali ste ${currentBet} žetonov!`;
    else if(winMultiplier<0) chipChangeMessage=`Izgubili ste ${currentBet} žetonov!`;

    content.innerHTML=`<p>${message}</p><p>${chipChangeMessage}</p><button>Zapri</button>`;
    popup.appendChild(content);
    document.body.appendChild(popup);

    const btn = content.querySelector("button");
    btn.onclick = async ()=>{
      document.body.removeChild(popup);
      await updateRating(winMultiplier);
      if(winMultiplier>0) await updateChips(currentBet);
      else if(winMultiplier<0) await updateChips(-currentBet);
      playerHand=[]; dealerHand=[]; currentDeck=shuffle([...deck,...deck,...deck,...deck]);
      betPlaced=false; betInput.disabled=false; placeBetBtn.disabled=false;
      hitBtn.disabled=true; standBtn.disabled=true;

      // Show "no chips" popup if chips ran out
      if(chips<=0) showNoChipsPopup();
    };
  }

  // --- Game Logic ---
  function dealInitial(){
    let val=parseInt(betInput.value);
    if(!val || val<1) val=1;
    if(val>chips){ alert("Nimate dovolj žetonov za to stavo!"); return; }

    currentBet=val; betPlaced=true;
    betInput.disabled=true; placeBetBtn.disabled=true;
    hitBtn.disabled=false; standBtn.disabled=false;

    playerHand.push(currentDeck.pop());
    dealerHand.push(currentDeck.pop());
    playerHand.push(currentDeck.pop());
    dealerHand.push(currentDeck.pop());
    renderHands(true);
  }

  hitBtn.addEventListener("click", ()=>{
    if(!betPlaced){ alert("Najprej izberite stavo!"); return; }
    playerHand.push(currentDeck.pop());
    renderHands(true);
    if(calculateScore(playerHand)>21) showResultPopup("Busted! Izgubili ste.", -1);
  });

  standBtn.addEventListener("click", ()=>{
    if(!betPlaced){ alert("Najprej izberite stavo!"); return; }
    dealerPlay();
    const playerScore=calculateScore(playerHand);
    const dealerScore=calculateScore(dealerHand);

    if(playerScore===21 && dealerScore===21){
      showResultPopup("Tie! Ni spremembe.", 0);
    } else if(playerScore===21){
      showResultPopup("Blackjack! Zmagali ste!", 1);
    } else if(dealerScore===21){
      showResultPopup("Dealer ima Blackjack! Izgubili ste.", -1);
    } else if(playerScore>21){
      showResultPopup("Busted! Izgubili ste.", -1);
    } else if(dealerScore>21 || playerScore>dealerScore){
      showResultPopup("Zmagali ste!", 1);
    } else if(playerScore===dealerScore){
      showResultPopup("Tie! Ni spremembe.", 0);
    } else {
      showResultPopup("Izgubili ste!", -1);
    }
  });

  placeBetBtn.addEventListener("click", dealInitial);

  // --- Show "no chips" popup immediately if player has 0 chips ---
  if(chips<=0) showNoChipsPopup();
});
