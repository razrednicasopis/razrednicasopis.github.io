// Function to handle user login
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // User logged in successfully
            console.log("User logged in:", userCredential.user);
            // Redirect or perform actions after successful login
        })
        .catch((error) => {
            console.error("Error logging in:", error.message);
        });
}
