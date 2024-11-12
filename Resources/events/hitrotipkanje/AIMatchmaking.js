// DOM Elements
const matchmakingOverlay = document.getElementById('matchmakingOverlay');
const difficultyPopup = document.getElementById('difficultyPopup');
const matchmakingPopup = document.getElementById('matchmakingPopup');
const startPveMatchmakingButton = document.getElementById('startPveMatchmaking');
const difficultyButtons = document.querySelectorAll('.difficultyBtn');
const cancelBtn = document.getElementById('cancelBtn');
const closeMatchmakingPopup = document.getElementById('closeMatchmakingPopup');

// Default typing speed for AI
let aiTypingSpeed = 50;

// Start matchmaking process
function startMatchmaking() {
    // Show the difficulty selection popup
    difficultyPopup.style.display = 'block';
    matchmakingOverlay.style.display = 'block';
}

// Handle difficulty selection
function selectDifficulty(difficulty) {
    // Set AI typing speed based on selected difficulty
    switch (difficulty) {
        case 'easy':
            aiTypingSpeed = 30;
            break;
        case 'medium':
            aiTypingSpeed = 50;
            break;
        case 'hard':
            aiTypingSpeed = 80;
            break;
        default:
            aiTypingSpeed = 50;  // Default to medium if no valid selection
    }

    // Hide difficulty popup and matchmaking overlay
    difficultyPopup.style.display = 'none';
    matchmakingOverlay.style.display = 'none';

    // Simulate matchmaking process and start the game
    simulateMatchmaking();
}

// Simulate matchmaking process
function simulateMatchmaking() {
    // Show matchmaking popup
    matchmakingPopup.style.display = 'block';
    matchmakingOverlay.style.display = 'block';

    // After a short delay, start the game
    setTimeout(() => {
        // Proceed with the game initialization (e.g., redirect or start the race)
        window.location.href = "offlineigra.html";  // Adjust this if needed
    }, 1000);  // Simulate a 1-second matchmaking time
}

// Event listener for start PvE matchmaking button
if (startPveMatchmakingButton) {
    startPveMatchmakingButton.addEventListener('click', () => {
        startMatchmaking();  // Trigger the matchmaking process
    });
}

// Event listener for difficulty selection buttons
difficultyButtons.forEach(button => {
    if (button) {
        button.addEventListener('click', () => {
            const difficulty = button.getAttribute('data-difficulty');  // Get difficulty from button's data attribute
            selectDifficulty(difficulty);  // Handle difficulty selection
        });
    }
});

// Event listener for cancel button (close difficulty popup)
if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
        cancelDifficultySelection();  // Close the difficulty popup
    });
}

// Function to cancel difficulty selection and close the popup
function cancelDifficultySelection() {
    difficultyPopup.style.display = 'none';
    matchmakingOverlay.style.display = 'none';
}

// Event listener to close matchmaking popup
if (closeMatchmakingPopup) {
    closeMatchmakingPopup.addEventListener('click', () => {
        matchmakingPopup.style.display = 'none';  // Hide matchmaking popup
    });
}
