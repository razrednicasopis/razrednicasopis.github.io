<script type="module">
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
  import { getFirestore, doc, getDoc, getDocs, updateDoc, collection, query } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

  const auth = getAuth();
  const db = getFirestore();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;

      document.addEventListener("submit", async (e) => {
        if (e.target.id === "usernameForm") {
          e.preventDefault();

          const newUsername = document.getElementById("newUsername").value.trim();
          const submitBtn = e.target.querySelector("button");

          if (!newUsername || newUsername.length < 3) {
            alert("Uporabniško ime mora vsebovati vsaj 3 znake.");
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = "⏳ Preverjanje...";

          try {
            // Get current user doc
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            const lastChanged = userSnap.data().lastUsernameChange;

            // Check cooldown
            if (lastChanged && Date.now() - lastChanged.toMillis() < 86400000) {
              const msLeft = 86400000 - (Date.now() - lastChanged.toMillis());
              startCooldownTimer(msLeft, submitBtn);
              return;
            }

            // Check if username already exists
            const allUsersSnap = await getDocs(query(collection(db, "users")));
            let nameTaken = false;

            allUsersSnap.forEach(docSnap => {
              if (docSnap.id !== uid && docSnap.data().Username?.toLowerCase() === newUsername.toLowerCase()) {
                nameTaken = true;
              }
            });

            if (nameTaken) {
              alert("To uporabniško ime je že zasedeno.");
              submitBtn.disabled = false;
              submitBtn.textContent = "🔁 Spremeni uporabniško ime";
              return;
            }

            // Update username
            await updateDoc(userRef, {
              Username: newUsername,
              lastUsernameChange: new Date()
            });

            alert("Uporabniško ime je bilo uspešno spremenjeno!");
            startCooldownTimer(86400000, submitBtn);
          } catch (error) {
            console.error("Napaka pri spremembi uporabniškega imena:", error);
            alert("Prišlo je do napake. Poskusi znova.");
            submitBtn.disabled = false;
            submitBtn.textContent = "🔁 Spremeni uporabniško ime";
          }
        }
      });

      function startCooldownTimer(msLeft, btn) {
        let secondsLeft = Math.floor(msLeft / 1000);
        const interval = setInterval(() => {
          if (secondsLeft <= 0) {
            clearInterval(interval);
            btn.disabled = false;
            btn.textContent = "🔁 Spremeni uporabniško ime";
            return;
          }

          const hrs = Math.floor(secondsLeft / 3600);
          const mins = Math.floor((secondsLeft % 3600) / 60);
          const secs = secondsLeft % 60;
          btn.textContent = `⏳ Čas do spremembe: ${hrs}h ${mins}m ${secs}s`;
          btn.disabled = true;

          secondsLeft--;
        }, 1000);
      }

    } else {
      console.warn("Uporabnik ni prijavljen.");
    }
  });
</script>
