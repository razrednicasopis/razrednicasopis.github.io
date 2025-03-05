// IMPORTS
import { spawnEnemy, drawEnemies, updateEnemies } from './enemy.js'; // Import enemy functions

// PLAYER MOVEMENT AND BACKGROUND GENERATION SYSTEM

// Select the canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Decorative shapes for the background (hexagons)
const hexagonSize = 100; // Size of the hexagons
const hexagonHeight = Math.sqrt(3) * hexagonSize;
const hexagonWidth = 2 * hexagonSize;
const cmToPx = 37.795;
const spacing = 0.5 * cmToPx; // Spacing between hexagons

// Select the player image from the HTML (using existing player img from HTML)
const playerImg = document.getElementById("character");

// Player object
const player = {
    x: canvas.width / 2, // Start at center
    y: canvas.height / 2,
    width: playerImg.width, // Player image width
    height: playerImg.height, // Player image height
    speed: 5 // Movement speed
};

// Handle key presses
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Function to update player position based on keyboard input
function updatePlayer() {
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

// Function to draw the player image
function drawPlayer() {
    ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}

// Function to draw the hexagon grid (preserving original functionality)
function drawHexagon(x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    const gradient = ctx.createLinearGradient(-hexagonSize, 0, hexagonSize, 0);
    gradient.addColorStop(0, 'rgba(70, 70, 70, 1)');
    gradient.addColorStop(1, 'rgba(100, 100, 100, 1)');
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const xOffset = hexagonSize * Math.cos(angle);
        const yOffset = hexagonSize * Math.sin(angle);
        ctx.lineTo(xOffset, yOffset);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
}

function drawHexagonGrid() {
    const cols = Math.ceil(canvas.width / (hexagonWidth + spacing)) + 1;
    const rows = Math.ceil(canvas.height / (hexagonHeight + spacing)) + 1;
    const startCol = Math.floor((player.x - canvas.width / 2) / (hexagonWidth + spacing));
    const startRow = Math.floor((player.y - canvas.height / 2) / (hexagonHeight + spacing));

    const extraRows = Math.floor(rows * 1.5);
    const extraCols = Math.floor(cols * 1.5);

    for (let row = startRow - 3; row <= startRow + extraRows + 3; row++) {
        for (let col = startCol - 3; col <= startCol + extraCols + 3; col++) {
            const x = col * (hexagonWidth + spacing) + (row % 2) * (hexagonWidth / 2) - player.x;
            const y = row * (hexagonHeight + spacing) - player.y;
            drawHexagon(x, y, Math.PI / 2);
        }
    }
}

// Draw the background
function drawBackground() {
    ctx.fillStyle = "#111"; // Dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Game Loop
let lastEnemySpawnTime = 0;
const spawnInterval = 2000; // Spawn an enemy every 2 seconds

function gameLoop(timestamp) {
    // Draw the background
    drawBackground();

    // Draw the hexagon grid
    drawHexagonGrid();

    // Update player position and draw the player image
    updatePlayer();
    drawPlayer();

    // Spawn enemy if the spawn interval has passed
    if (timestamp - lastEnemySpawnTime > spawnInterval) {
        spawnEnemy(player, canvas);
        lastEnemySpawnTime = timestamp;
    }

    // Update and draw enemies
    updateEnemies(player);
    drawEnemies(ctx);

    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// Start the game loop
requestAnimationFrame(gameLoop);

// Handle window resizing
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
});
