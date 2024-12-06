import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";


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

function updateButtonVisibility() {
    const prijavaLinkBtn = document.getElementById('loginHref');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!prijavaLinkBtn || !logoutBtn) {
      console.error("Login/Logout buttons not found in the DOM.");
      return;
    }
  
    onAuthStateChanged(auth, (user) => {
      if (user) {
        logoutBtn.style.display = 'block';
        prijavaLinkBtn.style.display = 'none';
      } else {
        logoutBtn.style.display = 'none';
        prijavaLinkBtn.style.display = 'block';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateButtonVisibility();
  })

  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      localStorage.setItem('toast', 'logout-success');
    } catch (error) {
      console.error('Error logging out:', error);
      toastr.error('Napaka pri odjavi:', error);
    }
  });