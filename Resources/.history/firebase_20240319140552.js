function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById(login-password).value;

    auth.signInWithEmailAndPassword(email, password)
        .then((user))
}