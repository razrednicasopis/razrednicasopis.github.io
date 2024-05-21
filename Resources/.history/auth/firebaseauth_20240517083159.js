import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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


const signUp = document.getElementById('registracijaBtn');
signUp.addEventListener('click', async (event) => {
  event.preventDefault();
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  const auth = getAuth();
  const db = getFirestore();

  createUserWithEmailAndPassword( auth, email, password)
  .then((userCredential) => {
    const user = userCredential.user;
    const userData = {
      Username: username,
      Email: email
    };
    alert('Račun uspešno ustvarjen! Sedaj se lahko prijavite.');
    const docRef = doc(db, "users", user.uid);
    setDoc(docRef, userData)
    .then(() => {
        window.location.href='prijava.html';
    })
    .catch((error) => {
      console.error("Error writting the document:", error)
    })
  })
  .catch ((error) => {
    const errorCode = error.code;
    if(errorCode == 'auth/email-already-in-use'){
      alert('Ta e-mail račun je že v uporabi. Prosimo poskusite drug račun.');
    }
    else {
      console.error("Prišlo je do napake pri ustvarjanju računa:", error);
      alert('Napaka pri ustvarjanju računa. Prosimo kontaktirajte našo pomoč.');
    }
  })
});


document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded and parsed");
  
  const loginBtn = document.getElementById('prijavaBtn');
  if (!loginBtn) {
    console.error('Login button not found.');
    return;
  }

  loginBtn.addEventListener(, async (event) => {
    event.preventDefault();
    console.log('Login button clicked');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Successfully logged in
      const user = userCredential.user;
      alert('Prijava uspešna!');
      window.location.href = 'index.html'; // Redirect to the dashboard or desired page
    } catch (error) {
      const errorCode = error.code;
      if (errorCode === 'auth/wrong-password') {
        alert('Napačno geslo. Prosimo, poskusite znova.');
      } else if (errorCode === 'auth/user-not-found') {
        alert('Uporabnik s tem e-mail naslovom ne obstaja. Prosimo, preverite e-mail ali se registrirajte.');
      } else {
        console.error("Prišlo je do napake pri prijavi:", error);
        alert('Napaka pri prijavi. Prosimo kontaktirajte našo pomoč.');
      }
    }
  });
});