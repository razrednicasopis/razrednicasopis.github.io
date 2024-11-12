// Function to fetch a random text snippet from Wikipedia
async function fetchRandomText() {
    const url = 'https://sl.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=500&explaintext&generator=random&grnnamespace=0&origin=*';
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const firstPage = Object.values(pages)[0];
    return firstPage.extract;
}

// Function to clean the fetched text (remove extra spaces, line breaks, and unwanted characters)
function cleanText(text) {
    return text
        .replace(/[\r\n]+/g, ' ') // Remove line breaks
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim() // Remove leading and trailing spaces
        .replace(/[^\w\s,.!?čšžČŠŽ]/g, ''); // Remove non-alphanumeric characters (except specific punctuation)
}

// Function to split text into sentences, limiting to 5 sentences
function splitIntoSentences(text) {
    const sentences = text.match(/[^.!?]*[.!?]/g) || [];
    return sentences.slice(0, 5).join(' '); // Return first 5 sentences
}

// Function to generate the race text by fetching and cleaning random Wikipedia text
async function generateRaceText() {
    const snippet = await fetchRandomText(); // Fetch random text
    let raceText = cleanText(snippet); // Clean the text
    raceText = splitIntoSentences(raceText); // Split into sentences and limit to 5
    return raceText;
}

// Function to update the "text to type" field with the generated race text
async function updateTextToTypeField() {
    const textToTypeField = document.getElementById('textToType'); // Get the text input field
    const raceText = await generateRaceText(); // Generate race text
    textToTypeField.innerHTML = raceText; // Set the generated text into the text input field
}

// Function to initialize the typing race
function initializeTypingRace() {
    const textToTypeField = document.getElementById('textToType');
      
        
        // Update the text to type field with new random text
        updateTextToTypeField();
        
      
    
    textToTypeField.addEventListener('input', () => {
        const originalText = document.getElementById('textToType').value;
        const typedText = textToTypeField.value;

        // Check if the typed text matches the original text
        if (typedText === originalText) {
            alert('Končano!');
            textToTypeField.disabled = true; // Disable typing input after finishing
        }
    });
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    initializeTypingRace(); // Initialize the game
});
