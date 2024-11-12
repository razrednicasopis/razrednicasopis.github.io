// Initialize variables
const textToTypeField = document.getElementById('textToType');
const typingField = document.getElementById('typingField');
const leaveButton = document.getElementById('leaveButton');
const submitButton = document.getElementById('submitButton');
const playersProgress = document.getElementById('playersProgress');
const eventEndedPopup = document.getElementById('eventEndedPopupContainer');
const endedEventName = document.getElementById('endedEventName');
const closeEventEndedPopup = document.getElementById('closeEventEndedPopup');
const maintenanceMessage = document.getElementById('maintenance-message');
const maintenanceEndTime = document.getElementById('maintenanceEndTime');

// Game variables
let textToType = '';
let eventEnded = false;

// Initialize the game (fetch text and set up event listeners)
async function initializeTypingRace() {
    // Ensure the elements exist
    if (!textToTypeField || !typingField || !playersProgress) {
        console.error("Required elements not found in the HTML.");
        return;
    }

    // Fetch the text to type (this can be static or dynamic from a backend)
    textToType = "This is an example sentence that will be typed!";
    textToTypeField.textContent = textToType;

    typingField.addEventListener('input', checkTyping);

    // Add event listeners for buttons
    leaveButton.addEventListener('click', leaveGame);
    submitButton.addEventListener('click', submitTyping);
}

// Check if the player has typed the text correctly
function checkTyping() {
    const typedText = typingField.value;

    if (typedText === textToType) {
        endGame(); // End the game when the player finishes typing
    }
}

// End the game and display the "Event ended" popup
function endGame() {
    eventEnded = true;
    textToTypeField.textContent = "Game Over! You finished typing!";
    typingField.disabled = true;  // Disable further input

    eventEndedPopup.style.display = 'block'; // Show the "Event ended" popup
    endedEventName.textContent = "Typing Race"; // Customize based on the event
}

// Close the "Event Ended" popup
closeEventEndedPopup.addEventListener('click', () => {
    eventEndedPopup.style.display = 'none';
    resetGame(); // Reset the game for a new round if desired
});

// Handle leaving the game
function leaveGame() {
    if (eventEnded) {
        resetGame(); // Reset the game if the event ended
    } else {
        // Logic to leave the game before completion (maybe disconnect player or similar)
        console.log("Leaving the game...");
    }
}

// Reset the game (can be used for new rounds)
function resetGame() {
    textToTypeField.textContent = "Pridobivanje besedila..."; // Reset text
    typingField.value = ""; // Clear the typing field
    typingField.disabled = false; // Enable typing again
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', initializeTypingRace);

// Maintenance message handling
function showMaintenanceMessage(message, endTime) {
    maintenanceMessage.textContent = message;
    maintenanceEndTime.textContent = endTime;
    document.getElementById('maintenancePopup').style.display = 'block';
}

document.getElementById('closeMaintenancePopupBtn').addEventListener('click', () => {
    location.reload(); // Refresh the page when the maintenance popup is closed
});
