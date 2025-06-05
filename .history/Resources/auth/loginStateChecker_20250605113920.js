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
const auth = getAuth(app);

function updateButtonVisibility() {
  const prijavaLinkBtn = document.getElementById('loginHref');
const registracijaLink = document.querySelector('.registracijaLink');
  const userMenu = document.getElementById('userMenu');
  const currentUsername = document.getElementById('currentUsername');
  const logoutLink = document.getElementById('logoutLink');
  const menuToggle = document.getElementById('menuToggle');
  const userDropdown = document.getElementById('userDropdown');

  // 1) Toggle dropdown visibility when “Meni ⌄” is clicked
  menuToggle.addEventListener('click', (e) => {
    e.preventDefault();
    userDropdown.style.display = (userDropdown.style.display === 'block') ? 'none' : 'block';
  });

  // 2) Close dropdown if clicking outside
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.style.display = 'none';
    }
  });

  // 3) Show/hide links based on auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Hide “Prijava” only
    if (prijavaLinkBtn) prijavaLinkBtn.style.display = 'none';

    // Show “Meni” dropdown
    if (userMenu) userMenu.style.display = 'inline-block';

    // Keep “Registracija” visible (do NOT hide it anymore)

    // Update the username in the dropdown
    if (currentUsername) currentUsername.textContent = `Prijavljen kot: ${user.email}`;
  } else {
    // Show “Prijava” + “Registracija”
    if (prijavaLinkBtn) prijavaLinkBtn.style.display = 'inline-block';
    if (registracijaLink) registracijaLink.style.display = 'inline-block';

    // Hide “Meni” dropdown and its content
    if (userMenu) userMenu.style.display = 'none';
    if (userDropdown) userDropdown.style.display = 'none';
  }
});


  // 4) Handle logout click inside dropdown
  logoutLink.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      localStorage.setItem('toast', 'logout-success');
      window.location.reload();
    } catch (error) {
      console.error('Napaka pri odjavi:', error);
      toastr.error('Napaka pri odjavi.');
    }
  });
}

// Call it once on load
document.addEventListener('DOMContentLoaded', updateButtonVisibility);
