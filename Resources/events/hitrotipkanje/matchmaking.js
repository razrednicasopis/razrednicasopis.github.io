// Function to show the matchmaking popup
function showMatchmakingPopup() {
    document.getElementById('matchmakingOverlay').style.display = 'block'; // Show overlay
    document.getElementById('matchmakingPopup').style.display = 'block'; // Show popup
}

// Function to hide the matchmaking popup
function hideMatchmakingPopup() {
    document.getElementById('matchmakingOverlay').style.display = 'none'; // Hide overlay
    document.getElementById('matchmakingPopup').style.display = 'none'; // Hide popup
}

// Event listener for the matchmaking button
document.getElementById('startPvpMatchmaking').addEventListener('click', showMatchmakingPopup);

// Close button event
document.getElementById('closeMatchmakingPopup').addEventListener('click', hideMatchmakingPopup);