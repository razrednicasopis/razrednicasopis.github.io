const db = firebase.firestore();
const auth = firebase.auth();

// Spin the Wheel
document.getElementById("spinButton").addEventListener("click", startSpinAnimation);

async function spinWheel() {
    const userId = auth.currentUser.uid;
    const userEventRef = db.collection("lbEventData").doc(userId);
    const userSnapshot = await userEventRef.get();

    if (!userSnapshot.exists) {
        await userEventRef.set({
            eventTokens: 0,
            free_spins: 1
        });
    }

    const userData = (await userEventRef.get()).data();

    // Check free spins
    if (userData.free_spins <= 0) {
        document.getElementById("spinMessage").textContent = "No spins available! Try again tomorrow.";
        return;
    }

    // Rewards and spinning logic
    const rewards = [10, 20, 50, 100, 200];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    await userEventRef.update({
        eventTokens: firebase.firestore.FieldValue.increment(reward),
        free_spins: firebase.firestore.FieldValue.increment(-1)
    });

    // Show the reward message
    document.getElementById("spinMessage").textContent = `You won ${reward} tokens!`;
}

function startSpinAnimation() {
    const wheel = document.getElementById("wheel");
    const degrees = Math.floor(Math.random() * 360) + 1440; // Random spin
    wheel.style.transform = `rotate(${degrees}deg)`;

    document.getElementById("spinButton").disabled = true;
    setTimeout(() => {
        spinWheel(); // Trigger spin logic after animation
        document.getElementById("spinButton").disabled = false;
    }, 4000);
}

// Firebase Authentication
auth.onAuthStateChanged(user => {
    if (!user) {
        alert("Please log in to use the Lucky Wheel!");
        window.location.href = "/login.html"; // Redirect to login page
    }
});