import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("loginHref");
  const registerLink = document.querySelector(".registracijaLink");
  const userMenu = document.getElementById("userMenu");
  const menuToggle = document.getElementById("menuToggle");
  const userDropdown = document.getElementById("userDropdown");
  const logoutLink = document.getElementById("logoutLink");
  const currentUsername = document.getElementById("currentUsername");

  let usernameInitialized = false;

  async function setupUsername() {
    if (!auth.currentUser || !currentUsername || usernameInitialized) return;
    usernameInitialized = true;

    try {
      const userDocSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
      const username = userDocSnap.exists() ? userDocSnap.data().Username || auth.currentUser.email : auth.currentUser.email;
      currentUsername.textContent = `Prijavljen kot: ${username}`;

      // Make sure the element is interactable
      Object.assign(currentUsername.style, {
        cursor: "pointer",
        padding: "5px 10px",
        borderRadius: "4px",
        transition: "background 0.2s",
        display: "block",
        position: "relative",
        zIndex: "1000",
        pointerEvents: "auto" // critical
      });

      // Hover effect
      // Hover effect - darker grey
currentUsername.addEventListener("mouseenter", () => currentUsername.style.backgroundColor = "#a0a0a0");
currentUsername.addEventListener("mouseleave", () => currentUsername.style.backgroundColor = "transparent");

      // Click redirect
      currentUsername.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `https://razrednicasopis.github.io/Resources/profiles/profile.html?uid=${auth.currentUser.uid}`;
      });

    } catch (err) {
      console.error(err);
      currentUsername.textContent = `Prijavljen kot: ${auth.currentUser.email}`;
    }
  }

  // Dropdown toggle
  if (menuToggle && userDropdown) {
    menuToggle.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Ensure dropdown is fully visible and interactable
      Object.assign(userDropdown.style, {
        position: "absolute",
        display: userDropdown.style.display === "block" ? "none" : "block",
        zIndex: "9999",
        pointerEvents: "auto",
      });

      // Initialize username
      if (userDropdown.style.display === "block") {
        await setupUsername();
      }
    });
  }

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (userMenu && userDropdown && !userMenu.contains(e.target)) {
      userDropdown.style.display = "none";
    }
  });

  // Firebase auth listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginLink) loginLink.style.display = "none";
      if (userMenu) userMenu.style.display = "inline-block";
    } else {
      if (loginLink) loginLink.style.display = "inline-block";
      if (registerLink) registerLink.style.display = "inline-block";
      if (userMenu) userMenu.style.display = "none";
      if (userDropdown) userDropdown.style.display = "none";
    }
  });

  // Logout
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await signOut(auth);
        localStorage.setItem("toast", "logout-success");
        window.location.reload();
      } catch (err) {
        console.error(err);
        if (typeof toastr !== "undefined") toastr.error("Napaka pri odjavi.");
      }
    });
  }
});
