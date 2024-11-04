import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, collection, query, where, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import axios from 'https://cdn.skypack.dev/axios';

const firebaseConfig = {
  apiKey: "AIzaSyC_Fw12d6WR9GFVt7TVKrFMkp4EFW8gijk",
  authDomain: "razrednicasopisdatabase-29bad.firebaseapp.com",
  projectId: "razrednicasopisdatabase-29bad",
  storageBucket: "razrednicasopisdatabase-29bad.appspot.com",
  messagingSenderId: "294018128318",
  appId: "1:294018128318:web:31df9ea055eec5798e81ef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// Helper function to get URL parameter
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Toastr options
toastr.options = {
  "positionClass": "toast-top-center",
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};

// Function to handle toasts from localStorage
function handleToasts() {
  const loginRedirect = localStorage.getItem('loginRedirect');
  const toastType = localStorage.getItem('toast');

  if (loginRedirect) {
    if (toastType === 'login-success') {
      toastr.success('Prijava uspešna!');
    }
    localStorage.removeItem('toast');
    localStorage.removeItem('loginRedirect');
  } else {
    if (toastType) {
      switch (toastType) {
        case 'registration-success':
          toastr.success('Račun uspešno ustvarjen! Prosimo preverite svoj e-mail račun za potrditev.');
          break;
        case 'login-success':
          toastr.success('Prijava uspešna!');
          break;
        case 'logout-success':
          toastr.success('Odjava uspešna.');
          break;
        default:
          console.log("Unknown toast type:", toastType);
          break;
      }
      localStorage.removeItem('toast');
    }
  }
}

// Maintenance mode check
async function checkMaintenanceMode() {
  try {
    const docRef = doc(db, "settings", "maintenanceMode");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const maintenanceData = docSnap.data();
      if (maintenanceData.enabled) {
        document.getElementById('maintenance-message').textContent = maintenanceData.message || 'Spletna stran je trenutno v vzdrževanju.';
        document.getElementById('maintenanceEndTime').textContent = maintenanceData.endTime || 'Kmalu';
        document.querySelector('.overlay').style.display = 'block';
        document.getElementById('maintenancePopup').style.display = 'block';
      } else {
        document.querySelector('.overlay').style.display = 'none';
        document.getElementById('maintenancePopup').style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error checking maintenance mode:", error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handleToasts();
  updateButtonVisibility();
  checkMaintenanceMode();

  const loginBtn = document.getElementById('prijavaBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const identifier = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        let email = identifier;

        // Check if identifier is a username, then get corresponding email
        if (!identifier.includes('@')) {
          const usersRef = collection(db, "users");
          const usernameQuery = query(usersRef, where("Username", "==", identifier));
          const usernameSnapshot = await getDocs(usernameQuery);

          if (usernameSnapshot.empty) {
            toastr.error('Uporabniško ime ne obstaja. Prosimo preverite svoje podatke.');
            return;
          }

          email = usernameSnapshot.docs[0].data().Email;
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.emailVerified) {
          toastr.warning('E-mail ni potrjen. Preverite vaš e-poštni predal za potrditveno e-sporočilo.');
          await signOut(auth);
          return;
        }

        const source = getQueryParam('source');
        const redirectUrl = source === 'chatroom' ? 'utills/klepet.html' : 'index.html';
        localStorage.setItem('toast', 'login-success');
        window.location.href = `${redirectUrl}`;
      } catch (error) {
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
          toastr.error('Napačno geslo ali e-mail račun/uporabniško ime. Prosimo, poskusite znova.');
        } else if (error.code === 'auth/invalid-email') {
          toastr.error('Napačno geslo ali e-mail račun/uporabniško ime. Prosimo poskusite znova.');
        } else if (error.code === 'auth/user-disabled') {
          await signOut(auth);
          toastr.error('Vaš račun je bil blokiran. Prosimo kontaktirajte našo pomoč.');
        } else {
          console.error("Prišlo je do napake pri prijavi:", error);
          toastr.error('Napaka pri prijavi. Prosimo kontaktirajte našo pomoč.');
        }
      }
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        localStorage.setItem('toast', 'logout-success');
        window.location.href = 'prijava.html';
      } catch (error) {
        console.error('Error logging out:', error);
        toastr.error('Napaka pri odjavi:', error);
      }
    });
  }

  function updateButtonVisibility() {
    const prijavaLinkBtn = document.getElementById('loginHref');
    const logoutBtn = document.getElementById('logoutBtn');
  
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (prijavaLinkBtn) prijavaLinkBtn.style.display = 'none';
      } else {
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (prijavaLinkBtn) prijavaLinkBtn.style.display = 'block';
      }
    });
  }
});
