import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

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

// Registration
document.addEventListener('DOMContentLoaded', () => {
  const signUpBtn = document.getElementById('registracijaBtn');
  if (signUpBtn) {
    signUpBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = { Username: username, Email: email };

        await setDoc(doc(db, "users", user.uid), userData);
        alert('Račun uspešno ustvarjen! Sedaj se lahko prijavite.');
        window.location.href = 'prijava.html';
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          alert('Ta e-mail račun je že v uporabi. Prosimo poskusite drug račun.');
        } else {
          if (error.code === 'auth/invalid-email') {
            alert('E-mail naslov ni veljaven.');
          } else if (error.code === 'auth/weak-password') {
            alert('Geslo je prešibko. Prosimo, izberite močnejše geslo.');
          } else {
            console.error("Prišlo je do napake pri ustvarjanju računa:", error);
            alert('Napaka pri ustvarjanju računa. Prosimo kontaktirajte našo pomoč.');
          }
        }
      }
    });
  }

  // Login
  const loginBtn = document.getElementById('prijavaBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        alert('Prijava uspešna!');
        window.location.href = 'index.html'; // Redirect to the dashboard or desired page
      } catch (error) {
        if (error.code === 'auth/wrong-password') {
          alert('Napačno geslo ali e-mail račun. Prosimo poskusite znova.');
        } else if (error.code === 'auth/user-not-found') {
          alert('Uporabnik s tem e-mail naslovom ne obstaja. Prosimo, preverite e-mail ali se registrirajte.');
        } else if (error.code === 'auth/invalid-email') {
          alert('Napačno geslo ali e-mail račun. Prosimo poskusite znova.');
        } else {
          console.error("Prišlo je do napake pri prijavi:", error);
          alert('Napaka pri prijavi. Prosimo kontaktirajte našo pomoč.');
        }
      }
    });
  }
});
