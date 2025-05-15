const settingsContent = document.getElementById("settingsContent");
const profileTab = document.getElementById("profileTab");
const friendsTab = document.getElementById("friendsTab");
const allTabs = document.querySelectorAll(".settings-tab");

function setActiveTab(tab) {
  allTabs.forEach(t => t.classList.remove("active-tab"));
  tab.classList.add("active-tab");
}

profileTab.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveTab(profileTab);
  settingsContent.innerHTML = `
    <h2>Sprememba uporabniškega imena</h2>
  <form id="usernameForm">
    <label for="newUsername">Novo uporabniško ime:</label><br>
    <input type="text" id="newUsername" name="newUsername" required><br><br>
    <button type="submit" class="change-username-btn">🔁 Spremeni uporabniško ime</button>
  </form>
  `;
});

friendsTab.addEventListener("click", (e) => {
  e.preventDefault();
  setActiveTab(friendsTab);
  settingsContent.innerHTML = `
    <h2>Prošnje za prijateljstvo</h2>
    <p>Tu bodo prikazane tvoje prejete in poslane prošnje.</p>
  `;
});

// Load default section (e.g., profile)
profileTab.click();
