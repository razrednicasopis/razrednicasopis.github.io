// Enemy object constructor
export function Enemy(x, y, speed, size) {
    this.x = x;         // Enemy's x position
    this.y = y;         // Enemy's y position
    this.speed = speed; // Movement speed
    this.size = size;   // Size of the triangle (half-length of a side)
    this.angle = 0;     // Rotation angle of the enemy
}

// Array to store all active enemies
export const enemies = [];

// Function to create an enemy triangle just outside the viewport
export function spawnEnemy(player, canvas) {
    let x, y;

    // Determine random spawn point outside the visible area, but close to the player
    const spawnDistance = Math.random() * 200 + canvas.width / 2; // Random distance, outside of the viewport, but close
    const angle = Math.random() * Math.PI * 2; // Random direction in a circle around the player

    x = player.x + Math.cos(angle) * spawnDistance;
    y = player.y + Math.sin(angle) * spawnDistance;

    const speed = 2 + Math.random() * 3; // Random speed between 2 and 5
    const size = 20; // Size of the triangle (fixed for now)

    const enemy = new Enemy(x, y, speed, size);
    enemies.push(enemy);

    // Log enemy spawn info to the console
    console.log(`Enemy spawned at (${x.toFixed(2)}, ${y.toFixed(2)}) with speed ${speed.toFixed(2)}.`);
}

// Function to draw each enemy as a triangle, rotated towards the player
export function drawEnemies(ctx) {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.fillStyle = "blue"; // Enemy color
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.angle); // Rotate the enemy to face the player

        // Draw triangle
        ctx.beginPath();
        ctx.moveTo(0, -enemy.size); // Tip of the triangle
        ctx.lineTo(-enemy.size, enemy.size); // Bottom-left vertex
        ctx.lineTo(enemy.size, enemy.size); // Bottom-right vertex
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    });
}

// Function to update enemy positions (moving towards the player)
export function updateEnemies(player) {
    enemies.forEach(enemy => {
        // Move enemies toward the player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate angle to rotate the enemy to face the player
        enemy.angle = Math.atan2(dy, dx);

        // Stop the enemy when the tip of the triangle touches the edge of the player image
        const enemyTipToPlayerDistance = enemy.size + player.width / 2; // Distance between enemy tip and player's edge

        if (distance > enemyTipToPlayerDistance) {
            // Normalize movement and move the enemy towards the player
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    });
}
