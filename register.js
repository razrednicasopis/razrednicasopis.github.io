import { signInWithEmailAndPassword } from 'firebase/auth';

// Function to handle user registration
function register() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User registered successfully
            console.log("User registered:", userCredential.user);
            // Redirect or perform actions after successful registration
        })
        .catch((error) => {
            console.error("Error registering user:", error.message);
        });
}
