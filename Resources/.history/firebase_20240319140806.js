function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById(login-password).value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            //Logged in successfully
            const user = userCredential.user;
            console.log("Uspešno prijavljen v račun0" user.email);
        })
            .catch((error) ))
}