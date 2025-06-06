//Code for the flip clock

 function pad(num) {
    return num.toString().padStart(2, '0');
  }

  function updateDigit(id, newVal) {
    const digit = document.getElementById(id);
    const top = digit.querySelector('.top');
    const bottom = digit.querySelector('.bottom');
    const currentVal = top.textContent;

    if (currentVal !== newVal) {
      // Prepare for flip
      top.textContent = currentVal;
      bottom.textContent = newVal;
      digit.classList.add('flip');

      setTimeout(() => {
        // After animation completes, set top to new value and reset
        top.textContent = newVal;
        digit.classList.remove('flip');
      }, 400);
    }
  }

  function updateClock() {
    const now = new Date();
    const h = pad(now.getHours());
    const m = pad(now.getMinutes());
    const s = pad(now.getSeconds());

    updateDigit('hourTens', h[0]);
    updateDigit('hourOnes', h[1]);
    updateDigit('minuteTens', m[0]);
    updateDigit('minuteOnes', m[1]);
    updateDigit('secondTens', s[0]);
    updateDigit('secondOnes', s[1]);
  }

  setInterval(updateClock, 1000);
  updateClock();

  
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