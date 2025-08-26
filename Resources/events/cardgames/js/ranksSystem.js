// ranksSystem.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

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

// --- Container for ranks ---
const ranksContainer = document.getElementById("ranksContainer") || (() => {
    const container = document.createElement("div");
    container.id = "ranksContainer";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.width = "90%";
    container.style.maxWidth = "500px";
    container.style.margin = "2rem auto";
    container.style.gap = "10px";
    document.body.appendChild(container);
    return container;
})();

// --- League definitions ---
const leagues = [
    { name: "Dan 1", min: 0, max: 49, icon: "🥉", reward: 5 },
    { name: "Dan 2", min: 50, max: 99, icon: "🥉", reward: 10 },
    { name: "Dan 3", min: 100, max: 149, icon: "🥉", reward: 15 },
    { name: "Dan 4", min: 150, max: 199, icon: "🥉", reward: 20 },
    { name: "Dan 5", min: 200, max: 299, icon: "🥉", reward: 25 },
    { name: "Dan 6", min: 300, max: 399, icon: "🥈", reward: 30 },
    { name: "Dan 7", min: 400, max: 499, icon: "🥈", reward: 35 },
    { name: "Dan 8", min: 500, max: 599, icon: "🥇", reward: 40 },
    { name: "Dan 9", min: 600, max: 749, icon: "🥇", reward: 45 },
    { name: "Dan 10", min: 750, max: 899, icon: "💎", reward: 50 },
    { name: "Warrior", min: 900, max: 1199, icon: "⚔️", reward: 60 },
    { name: "Champion", min: 1200, max: 1499, icon: "🏆", reward: 70 },
    { name: "Master", min: 1500, max: 1999, icon: "🎖️", reward: 80 },
    { name: "Legend", min: 2000, max: Infinity, icon: "🌟", reward: 100 }
];

function getLeagueFromRating(rating) {
    for (const l of leagues) if (rating >= l.min && rating <= l.max) return l.name;
    return "Dan 1";
}

// --- Sync leagues with ratings ---
async function syncUserLeague(uid, rating, currentLeague) {
    const correctLeague = getLeagueFromRating(rating);
    if (currentLeague !== correctLeague) {
        const userRef = doc(db, "cgEventData", uid);
        await updateDoc(userRef, { league: correctLeague });
    }
}

// --- Render the ranks vertically ---
export async function renderRanks() {
    ranksContainer.innerHTML = "";

    let userRating = null;
    let userUID = null;

    // Get logged-in user's rating and UID
    await new Promise(resolve => {
        onAuthStateChanged(auth, async user => {
            if (user) {
                userUID = user.uid;
                const snap = await getDoc(doc(db, "cgEventData", user.uid));
                if (snap.exists()) userRating = snap.data().rating || 0;
            }
            resolve();
        });
    });

    // Sync all users' leagues with their ratings
    const usersSnapshot = await getDocs(collection(db, "cgEventData"));
    const updates = [];
    usersSnapshot.forEach(userDoc => {
        const data = userDoc.data();
        const rating = data.rating || 0;
        if (rating <= 0) return;
        updates.push(syncUserLeague(userDoc.id, rating, data.league));
    });
    await Promise.all(updates);

// Render ranks boxes
leagues.forEach(l => {
    const box = document.createElement("div");
    box.style.display = "flex";
    box.style.alignItems = "center";
    box.style.justifyContent = "space-between";
    box.style.padding = "15px";
    box.style.border = "2px solid #ccc";
    box.style.borderRadius = "10px";
    box.style.backgroundColor = "#f9f9f9";
    box.style.transition = "all 0.3s ease";

    // Highlight if this is the logged-in user's current league
    let ratingText = '';
    if (userRating !== null && userRating >= l.min && userRating <= l.max) {
        box.style.borderColor = "#47ff4dff";
        box.style.backgroundColor = "#fff4f0";
        box.style.boxShadow = "0 0 15px rgba(255,99,71,0.5)";
        ratingText = `<div style="font-weight:bold; font-size:1rem; margin-top:5px;">Tvoja ocena: ${userRating}</div>`;
    }

    box.innerHTML = `
        <div style="font-size:2rem;">${l.icon}</div>
        <div style="flex-grow:1; margin-left:10px;">
            <div style="font-weight:bold; font-size:1.2rem;">${l.name}</div>
            <div style="font-size:0.9rem; color:#555;">Potrebna ocena: ${l.min} - ${l.max === Infinity ? '∞' : l.max}</div>
            ${ratingText}
        </div>
        <div style="font-weight:bold; font-size:1.2rem;">💎 ${l.reward}</div>
    `;
    ranksContainer.appendChild(box);
});
}

// --- Auto-render on DOM ---
document.addEventListener("DOMContentLoaded", () => renderRanks());
