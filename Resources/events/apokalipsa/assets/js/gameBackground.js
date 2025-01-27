// Select the canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Decorative shapes for the background
const hexagonSize = 100; // Size of the hexagons
const hexagonHeight = Math.sqrt(3) * hexagonSize; // Height of the hexagon
const hexagonWidth = 2 * hexagonSize; // Width of the hexagon
const cmToPx = 37.795; // Conversion factor from cm to pixels
const spacing = 0.5 * cmToPx; // Space between hexagons (0.5 cm in pixels)

// Player object
const player = {
    x: canvas.width / 2, // Start at center
    y: canvas.height / 2,
    speed: 5 // Movement speed
};

// Function to generate hexagon coordinates with shading
function drawHexagon(x, y, rotation) {
    ctx.save(); // Save the current state
    ctx.translate(x, y); // Move to the hexagon's position
    ctx.rotate(rotation); // Apply the fixed rotation

    // Create gradient for shading
    const gradient = ctx.createLinearGradient(-hexagonSize, 0, hexagonSize, 0);
    gradient.addColorStop(0, 'rgba(70, 70, 70, 1)'); // Darker color for shadow
    gradient.addColorStop(1, 'rgba(100, 100, 100, 1)'); // Lighter color for highlight

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i; // Angle for hexagon vertices
        const xOffset = hexagonSize * Math.cos(angle);
        const yOffset = hexagonSize * Math.sin(angle);
        ctx.lineTo(xOffset, yOffset); // Offset by x and y
    }
    ctx.closePath();

    ctx.fillStyle = gradient; // Apply gradient shading
    ctx.fill();
    ctx.restore(); // Restore the state
}

// Function to draw hexagons based on camera offset
function drawHexagonGrid() {
    // Calculate the number of columns and rows based on the canvas size
    const cols = Math.ceil(canvas.width / (hexagonWidth + spacing)) + 1; // Ensure full coverage
    const rows = Math.ceil(canvas.height / (hexagonHeight + spacing)) + 1; // Ensure full coverage

    // Calculate start positions for rows and cols
    const startCol = Math.floor((player.x - canvas.width / 2) / (hexagonWidth + spacing));
    const startRow = Math.floor((player.y - canvas.height / 2) / (hexagonHeight + spacing));

    // Increase the area of visible hexagons to three times the current area
    const extraRows = Math.floor(rows * 1.5);  // Increased coverage
    const extraCols = Math.floor(cols * 1.5);  // Increased coverage

    // Draw the hexagon grid
    for (let row = startRow - 3; row <= startRow + extraRows + 3; row++) { // Extra rows for pre-generation
        for (let col = startCol - 3; col <= startCol + extraCols + 3; col++) { // Extra cols for pre-generation
            // Calculate x position, stagger every other row
            const x = col * (hexagonWidth + spacing) + (row % 2) * (hexagonWidth / 2) - player.x;
            // Calculate y position
            const y = row * (hexagonHeight + spacing) - player.y;

            drawHexagon(x, y, Math.PI / 2); // Draw hexagon rotated 90 degrees
        }
    }
}

// Draw the background
function drawBackground() {
    ctx.fillStyle = "#111"; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Update player position based on keyboard input
function updatePlayer() {
    // WASD and Arrow Keys Movement
    if (keys['ArrowUp'] || keys['w']) {
        player.y -= player.speed; // Move up
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.y += player.speed; // Move down
    }
    if (keys['ArrowLeft'] || keys['a']) {
        player.x -= player.speed; // Move left
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.x += player.speed; // Move right
    }
}

// Handle key presses
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Game Loop
function gameLoop() {
    // Draw the background
    drawBackground();

    // Draw the hexagon grid
    drawHexagonGrid();

    // Update player position
    updatePlayer();

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();

// Handle window resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Center the player when resizing
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
});
