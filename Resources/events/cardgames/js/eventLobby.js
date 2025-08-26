// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const blackjackInfoIcon = document.getElementById("blackjackInfo");
  if (!blackjackInfoIcon) return;

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "blackjackPopupOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
  overlay.style.display = "none";
  overlay.style.zIndex = "999";

  // Create popup
  const popup = document.createElement("div");
  popup.id = "blackjackPopup";
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.backgroundColor = "#1e1e2f";
  popup.style.color = "#fff";
  popup.style.padding = "30px";
  popup.style.borderRadius = "12px";
  popup.style.width = "90%";
  popup.style.maxWidth = "500px";
  popup.style.boxShadow = "0 8px 20px rgba(0,0,0,0.5)";
  popup.style.display = "none";
  popup.style.zIndex = "1000";

  popup.innerHTML = `
    <h2 style="margin-bottom:1rem;">Pravila Blackjacka</h2>
    <p>
      Blackjack je igra proti dealerju (računalniku). Cilj je doseči <strong>21 točk</strong> ali čim bližje temu številu, ne da bi ga presegli.
    </p>
    <p>
      <strong>Vrednosti kart:</strong><br>
      - Karte 2–10 = nominalna vrednost.<br>
      - Fant, Kraljica, Kralj = 10 točk.<br>
      - As = 1 ali 11, odvisno kaj je ugodnejše.
    </p>
    <p>
      <strong>Potek igre:</strong><br>
      1. Igralec prejme dve karti, dealer prav tako.<br>
      2. Če igralec dobi <strong>Blackjack</strong> (As + Fant/Kraljica/Kralj ali 10) in dealer ne, igralec avtomatsko zmaga.<br>
      3. Če tako igralec kot dealer dobita Blackjack → izid je neodločen (tie/push).<br>
      4. Igralec lahko izbere "Hit" za novo karto ali "Stand" za konec poteze.<br>
      5. Če igralec preseže 21 → izgubi (bust).<br>
      6. Dealer razkrije svoje karte in mora <strong>vzeti nove karte, dokler ne doseže vsaj 17</strong>.<br>
      7. Če dealer preseže 21 → igralec zmaga.<br>
      8. Če ne preseže 21, zmaga tista stran, ki je bližje 21.
    </p>
    <div style="text-align:right; margin-top:20px;">
      <button id="closeBlackjackPopup" style="background:#28a745; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">Zapri</button>
    </div>
  `;

  // Append to body
  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  // Show/hide functions
  const showPopup = () => {
    overlay.style.display = "block";
    popup.style.display = "block";
  };
  const hidePopup = () => {
    overlay.style.display = "none";
    popup.style.display = "none";
  };

  // Event listeners
  blackjackInfoIcon.addEventListener("click", showPopup);
  document.getElementById("closeBlackjackPopup").addEventListener("click", hidePopup);
  overlay.addEventListener("click", hidePopup);
});
