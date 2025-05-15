 const settingsContent = document.getElementById("settingsContent");

  const profileTab = document.getElementById("profileTab");
  const friendsTab = document.getElementById("friendsTab");

  profileTab.addEventListener("click", (e) => {
    e.preventDefault();
    settingsContent.innerHTML = `
      <h2>Profilne nastavitve</h2>
      <form id="usernameForm">
        <label for="newUsername">Novo uporabniško ime:</label><br>
        <input type="text" id="newUsername" name="newUsername"><br>
        <button type="submit">Spremeni uporabniško ime</button>
      </form>
    `;
  });

  friendsTab.addEventListener("click", (e) => {
    e.preventDefault();
    settingsContent.innerHTML = `
      <h2>Prošnje za prijateljstvo</h2>
      <p>Tu bodo prikazane tvoje prejete in poslane prošnje.</p>
      <!-- You can dynamically populate friend requests using Firebase or dummy data -->
    `;
  });

  // Load default section (e.g., profile)
  profileTab.click();