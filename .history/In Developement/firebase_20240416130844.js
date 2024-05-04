<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moja Prva Spletna Stran</title>

    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(45deg, #8A2BE2, #0000FF);
            background-size: 400% 400%;
            animation: gradientBackground 10s ease infinite;
        }

        @keyframes gradientBackground {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }

        header {
            background-color: #333;
            color: #fff;
            padding: 20px 0;
            text-align: center;
            font-size: 36px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .content-container {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            margin-top: 50px;
        }

        .content {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 100%;
            max-width: 400px;
            margin-bottom: 20px;
        }

        input[type="text"],
        input[type="password"] {
            padding: 10px;
            margin: 5px;
            border: 1px solid #ccc;
            border-radius: 5px;
            width: calc(100% - 22px);
            transition: border-color 0.3s ease;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #4CAF50;
        }

        button[type="submit"] {
            background-color: #4CAF50;
            color: white;
            padding: 15px 20px;
            border: none;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }

        button[type="submit"]:hover {
            background-color: #45a049;
        }

        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
        }

        .alert.success {
            background-color: #4CAF50;
            color: white;
        }

        .alert.warning {
            background-color: #ff9800;
            color: white;
        }

        .alert.error {
            background-color: #f44336;
            color: white;
        }
    </style>
</head>
<body>
<header>
    <h1>Vpisna stran</h1>
</header>

<div class="content-container">
    <div class="content">
        <h2>Registracija</h2>
        <form id="registrationForm">
            <label for="username">Uporabniško ime:</label>
            <input type="text" id="username" required><br>
            <label for="password">Geslo:</label>
            <input type="password" id="password" required><br>
            <button type="submit">Registracija</button>
        </form>
    </div>

    <div class="content">
        <h2>Prijava</h2>
        <form id="loginForm">
            <label for="loginUsername">Uporabniško ime:</label>
            <input type="text" id="loginUsername" required><br>
            <label for="loginPassword">Geslo:</label>
            <input type="password" id="loginPassword" required><br>
            <button type="submit">Prijava</button>
        </form>
    </div>
</div>

<script>
function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('alert', type);
    alertBox.textContent = message;
    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}

document.getElementById("registrationForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Preprečimo običajno obnašanje obrazca

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Shranimo podatke v lokalno shrambo (localStorage)
    localStorage.setItem(username, password);

    showAlert("Registracija uspešna!", "success");
    // Po registraciji lahko naredite karkoli, npr. preusmerite uporabnika na drugo stran
    // window.location.href = "naslednja_stran.html";
});

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Preprečimo običajno obnašanje obrazca

    var loginUsername = document.getElementById("loginUsername").value;
    var loginPassword = document.getElementById("loginPassword").value;

    // Preverimo, ali je uporabnik registriran in ali se geslo ujema
    var storedPassword = localStorage.getItem(loginUsername);

    if (storedPassword === loginPassword) {
        showAlert("Prijava uspešna!", "success");
        // Po prijavi preusmerimo uporabnika na stran "r.html"
        window.location.href = "r.html";
    } else {
        showAlert("Neuspešna prijava. Preverite uporabniško ime in geslo.", "error");
    }
});
</script>


</body>
</html>
