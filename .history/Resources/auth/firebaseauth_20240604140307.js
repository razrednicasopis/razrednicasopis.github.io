import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import axios from 'https://cdn.skypack.dev/axios'; // Import Axios for making HTTP requests

// Your web app's Firebase configuration
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

document.addEventListener('DOMContentLoaded', () => {
  const signUpBtn = document.getElementById('registracijaBtn');
  if (signUpBtn) {
    signUpBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        // Step 1: Fetch IP address
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ipAddress = ipResponse.data.ip;

        // Step 2: Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 3: Prepare user data
        const userData = {
          Username: username,
          Email: email,
          IP_Address: ipAddress,
          isAdmin: false, // Initially set to false
          role: 'member' // Set role to "member" initially
        };

        // Step 4: Save user data in Firestore
        await setDoc(doc(db, "users", user.uid), userData);

        // Step 5: Create the typing status document for the user
        const typingStatusRef = doc(db, 'typingStatus', user.uid);
        await setDoc(typingStatusRef, {
          username: username,
          isTyping: false,
          timestamp: serverTimestamp()
        });

        // Step 6: Send email verification
        await sendEmailVerification(user);

        // Step 7: Alert user about successful registration
        alert('Račun uspešno ustvarjen! Prosimo preverite svoj e-mail račun za potrditev.');
        window.location.href = 'prijava.html';

      } catch (error) {
        // Handle errors appropriately
        if (error.code === 'auth/email-already-in-use') {
          alert('Ta e-mail račun je že v uporabi. Prosimo poskusite drug račun.');
        } else if (error.code === 'auth/invalid-email') {
          alert('E-mail naslov ni veljaven.');
        } else if (error.code === 'auth/weak-password') {
          alert('Geslo je prešibko. Prosimo, izberite močnejše geslo.');
        } else {
          console.error("Prišlo je do napake pri ustvarjanju računa:", error);
          alert('Napaka pri ustvarjanju računa. Prosimo kontaktirajte našo pomoč.');
        }

        // Attempt to delete the user if an error occurs after user creation
        if (auth.currentUser) {
          try {
            await deleteDoc(doc(db, "users", user.uid));
            await deleteDoc(doc(db, "typingStatus", user.uid));
            await deleteUser(auth.currentUser);
          } catch (deleteError) {
            console.error("Napaka pri brisanju uporabnika po neuspešni registraciji:", deleteError);
          }
        }
      }
    });
  }

  const loginBtn = document.getElementById('prijavaBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user.emailVerified) {
          alert('E-mail ni potrjen. Preverite vaš e-poštni predal za potrditveno e-sporočilo.');
          return;
        }
        alert('Prijava uspešna!');

        // Redirect based on the source parameter
        const source = getQueryParam('source');
        if (source === 'chatroom') {
          window.location.href = 'utills/klepet.html'; // Redirect to chatroom
        } else {
          window.location.href = 'index.html'; // Default redirect to index
        }
      } catch (error) {
        if (error.code === 'auth/invalid-credential') {
          alert('Napačno geslo ali e-mail račun. Prosimo, poskusite znova.');
        } else if (error.code === 'auth/user-not-found') {
          alert('Uporabnik s tem e-mail naslovom ne obstaja. Prosimo, preverite e-mail ali se registrirajte.');
        } else if (error.code === 'auth/invalid-email') {
          alert('Napačno geslo ali e-mail račun. Prosimo poskusite znova.');
        } else if (error.code === 'auth/user-disabled') {
          alert('Vaš račun je bil blokiran. Prosimo kontaktirajte našo pomoč.');
        } else {
          console.error("Prišlo je do napake pri prijavi:", error);
          alert('Napaka pri prijavi. Prosimo kontaktirajte našo pomoč.');
        }
      }
    });
  }

  const loginHref = document.getElementById('loginHref');
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        alert('Odjava uspešna.');
        window.location.href = 'prijava.html'; // Redirect to the login page after logout
      } catch (error) {
        console.error('Error logging out')
        alert('Napaka pri odjavi:', error);
      }
    });
  }

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (loginHref) loginHref.style.display = 'none';
    } else {
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (loginHref) loginHref.style.display = 'block';
    }
  });
});
