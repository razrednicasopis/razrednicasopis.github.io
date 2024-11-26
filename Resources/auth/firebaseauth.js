import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getFirestore, setDoc, doc, collection, query, where, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
  
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
  checkMaintenanceMode();


// Login System
const loginBtn = document.getElementById('prijavaBtn');
if (loginBtn) {
  loginBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    const identifier = document.getElementById('email').value; // Can be either email or username
    const password = document.getElementById('password').value;

    // Validate email and password inputs
    if (!identifier || !password) {
      toastr.error('Prosimo izpolnite e-mail in geslo.');
      return;
    }

    try {
      let email = identifier;

      // If identifier is a username, get the corresponding email from Firestore
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

      // Sign in with the email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the email is verified
      if (!user.emailVerified) {
        toastr.warning('E-mail ni potrjen. Preverite vaš e-poštni predal za potrditveno e-sporočilo.');
        await signOut(auth); // Log the user out after showing the warning
        return;
      }

      // Proceed with the login if email is verified
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

  // Registration System

  const registerBtn = document.getElementById('registracijaBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      const username = document.getElementById('register-username').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;

      // Validation
      if (!username || !email || !password) {
        toastr.error('Vsa polja so obvezna. Prosimo izpolnite vse.');
        return;
      }

      try {
        // Check if the username already exists in the users collection
        const usersRef = collection(db, "users");
        const usernameQuery = query(usersRef, where("Username", "==", username));
        const usernameSnapshot = await getDocs(usernameQuery);

        if (!usernameSnapshot.empty) {
          toastr.error('Uporabniško ime je že v uporabi. Prosimo poskusite znova.');
          return; // Stop further registration process
        }


        // Get user's IP address using an external service
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const userIp = ipResponse.data.ip;

        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await setDoc(doc(db, "users", user.uid), {
          Email: email,
          Username: username,
          role: 'member', // Default role
          uid: user.uid,
          isAdmin: false, // Default admin status
          IP_Address: userIp, // Store user's IP address
        });

        // Send email verification
        await sendEmailVerification(user);

        // Log the user out after registration and show success message
        await signOut(auth);
        toastr.warning('Račun uspešno ustvarjen! Prosimo preverite svoj e-mail račun za potrditev.');
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          toastr.error('E-mail že obstaja. Prosimo uporabite drug e-mail.');
        } else if (error.code === 'auth/invalid-email') {
          toastr.error('Napačen e-mail naslov. Prosimo preverite.');
        } else {
          console.error("Prišlo je do napake pri registraciji:", error);
          toastr.error('Napaka pri registraciji. Prosimo kontaktirajte našo pomoč.');
        }
      }
    });
  }
});


    // Password Reset System
    const resetPasswordLink = document.getElementById("resetPassword");
    const resetPasswordPopup = document.getElementById("resetPasswordPopup");
    const overlay = document.getElementById("resetPasswordOverlay");
    const closeResetPopupBtn = document.getElementById("closeResetPopupBtn");
    const confirmEmailBtn = document.getElementById("confirmEmailBtn");
    const resetEmailField = document.getElementById("resetEmail");

    // Open the reset password popup
    resetPasswordLink.addEventListener("click", () => {
        resetPasswordPopup.style.display = "block";
        overlay.style.display = "block";
    });

    // Close the reset password popup
    closeResetPopupBtn.addEventListener("click", () => {
        resetPasswordPopup.style.display = "none";
        overlay.style.display = "none";
    });

    // Handle password reset request
    confirmEmailBtn.addEventListener("click", () => {
        const email = resetEmailField.value;
        
        if (email) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    // Change popup content after sending the email
                    resetPasswordPopup.innerHTML = `
                        <div class="popupContent">
                            <h2>Resetiranje gesla</h2>
                            <p>Povezava za ponastavitev gesla je bila poslana na <strong>${email}</strong>. Prosimo preverite svojo e-pošto za nadaljnja navodila.</p>
                            <button id="closeResetPopupBtn">Zapri</button>
                        </div>
                    `;
                    document.getElementById("closeResetPopupBtn").addEventListener("click", () => {
                        resetPasswordPopup.style.display = "none";
                        overlay.style.display = "none";
                    });
                })
                .catch((error) => {
                    // Handle errors, for example, if the email is invalid or not registered
                    alert("Napaka pri pošiljanju e-pošte. Prosimo preverite vneseni e-poštni naslov.");
                });
        } else {
            alert("Prosimo vnesite veljaven e-poštni naslov.");
        }
    });

