import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
    authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
    projectId: "razrednicasopisdatabase-29bad",
    storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
    messagingSenderId: "294018128318",
    appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore();


const searchInput = document.getElementById("userSearchInput");
const searchBtn = document.getElementById("userSearchBtn");
const searchResult = document.getElementById("searchResult");

searchBtn.addEventListener("click", async () => {
  const username = searchInput.value.trim();
  searchResult.style.color = "red";

  if (!username) {
    searchResult.textContent = "Prosim vnesite uporabniško ime.";
    return;
  }

  searchResult.textContent = "Iskanje...";

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("Username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      searchResult.textContent = "Uporabnik ni najden.";
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const uid = userDoc.id;

    searchResult.style.color = "green";
    searchResult.textContent = "Uporabnik najden! Preusmerjanje...";

    window.location.href = `https://razrednicasopis.github.io/Resources/profiles/profile.html?uid=${uid}`;

  } catch (error) {
    console.error("Napaka pri iskanju uporabnika:", error);
    searchResult.textContent = "Napaka pri iskanju. Poskusite kasneje.";
  }
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();  // Prevent form submission or default behavior
    searchBtn.click();       // Trigger the button click programmatically
  }
});