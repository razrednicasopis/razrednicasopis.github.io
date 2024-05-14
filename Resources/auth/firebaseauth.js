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


const signIn=document.getElementById('prijavaBtn');
 signIn.addEventListener('click', (event)=>{
    event.preventDefault();
    const email=document.getElementById('email').value;
    const password=document.getElementById('password').value;
    const auth=getAuth();

    signInWithEmailAndPassword(auth, email,password)
    .then((userCredential)=>{
        alert('Prijava uspešna.')
        const user=userCredential.user;
        localStorage.setItem('loggedInUserId', user.uid);
        window.location.href='prijava.html';
    })
    .catch((error)=>{
        const errorCode=error.code;
        if(errorCode==='auth/invalid-credential'){
            alert('Nepravili geslo ali e-mail račun.');
        }
        else{
            alert('Račun s tem e-mailom ne obstaja.');
        }
    })
 })