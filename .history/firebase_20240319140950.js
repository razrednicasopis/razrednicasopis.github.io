function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById(login-password).value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            //Logged in successfully
            const user = userCredential.user;
            console.log("Uspešno prijavljen v račun" user.email);
        })
            .catch((error) => {
                //Login errors
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Napaka pri vpisu:", )
            })
}