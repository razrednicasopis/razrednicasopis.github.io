//This is a JS code for the switching of the newspaper page content



//Code for the clock

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const time = `${hours}:${minutes}:${seconds}`;
    document.getElementById('clock').innerText = time;
  }

  // Update every second
  setInterval(updateClock, 1000);

  // Initial call to set the initial time
  updateClock();


  // Maintenance clock

  document.addEventListener('DOMContentLoaded', function () {
    // Set the end date and time for the maintenance period
    const endDate = new Date('2024-03-15T20:00:00').getTime();

    // Update the countdown every second
    const countdown = setInterval(function () {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance <= 0) {
            // If the maintenance period is over, redirect to your main site
            clearInterval(countdown);
            document.getElementById("nextMaintenance").innerHTML = "Trenutno ni določeno prih"
        }

        // Calculate remaining time
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the countdown
        document.getElementById('countdown').innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
});



// Search Bar FEB 2024

// Mock data - replace with your actual article data
const articles = [
  { title: "Drugo Srečanje DOS (Dijaška Skupnost Slovenije)", content: "Preberite članek Matica Novaka o njegovi udeležbi na drugem srečanju DOS.", link: "drugosrecanje.html" },
  { title: "Literarni natečaj ob Prešernovem dnevu", content: "Preberite članek Vite Potočnik o njenem uspehu na literarnim natečaju.", link: "literarninatecaj.html" },
  { title: "Grinch", content: "Preberite članek Mihe Šuligoja o Grinchu.", link: "grinch.html" },
  { title: "Terapevtska kolonija", content: "Preberite članek Zale Kozole o njenem sodelovanju na terapevtski koloniji.", link: "terapevtskakolonija.html" }
  // Add more articles as needed
];

// Backup of original articles
let originalArticles = null;

function searchArticles() {
  const searchInput = document.getElementById("searchInput").value.toLowerCase();
  const searchResults = articles.filter(article =>
      article.title.toLowerCase().includes(searchInput)
  );

  // Fetch articles from temamesecafeb2024.html
  fetchArticlesFromOtherPage(searchInput, searchResults);
}

function fetchArticlesFromOtherPage(searchInput, searchResults) {
  // Replace "temamesecafeb2024.html" with the correct path to your file
  fetch("temamesecafeb2024.html")
      .then(response => response.text())
      .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const articlesFromOtherPage = Array.from(doc.querySelectorAll("#dynamicText article"));

          const otherPageResults = articlesFromOtherPage.filter(article =>
              article.querySelector("h1").textContent.toLowerCase().includes(searchInput)
          ).map(article => ({
              title: article.querySelector("h1").textContent,
              content: article.textContent.trim().replace(article.querySelector("h1").textContent, ""),
              link: article.querySelector("a").getAttribute("href")
          }));

          displayResults(searchResults.concat(otherPageResults));
      })
      .catch(error => {
          console.error("Error fetching articles from other page:", error);
          displayResults(searchResults);
      });
}

function displayResults(results) {
  const searchResultsDiv = document.getElementById("searchResults");
  searchResultsDiv.innerHTML = ""; // Clear previous results

  if (results.length === 0) {
      // No matching articles found, display message
      searchResultsDiv.textContent = "Ni ustreznih člankov.";
      return;
  }

  const ul = document.createElement("ul");
  results.forEach(article => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = article.link;
      a.textContent = article.title;
      li.appendChild(a);
      ul.appendChild(li);
  });
  searchResultsDiv.appendChild(ul);
}

// Store original articles on page load
window.onload = function() {
  originalArticles = document.getElementById("dynamicText").innerHTML;
};