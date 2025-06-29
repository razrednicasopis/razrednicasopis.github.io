// IMPORTS
import PlayerStats from "./player/playerStats.js";
import EnemyStats from "./enemy/enemyStats01.js";  // <-- Added this line

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.image('player', 'assets/resources/playerChar.png');
    this.load.image('enemy', 'assets/resources/enemy.png');
  }

  create() {
    // Hex parameters
    this.hexSize = 50;
    this.hexHeight = Math.sqrt(3) * this.hexSize;
    this.hexWidth = 2 * this.hexSize;
    this.spacing = 10;

    // Massive grid dimensions (adjust as needed)
    this.worldWidth = 10000;
    this.worldHeight = 10000;

    // Pre-rendered hex background
    this.hexRenderTexture = this.add.renderTexture(0, 0, this.worldWidth, this.worldHeight).setOrigin(0);
    this.drawHexGridToRenderTexture();

    // Player starts at world center
    const centerX = this.worldWidth / 2;
    const centerY = this.worldHeight / 2;

    this.player = this.physics.add.sprite(centerX, centerY, 'player');
    this.player.setDisplaySize(64, 64);
    this.player.setCollideWorldBounds(true);

    // Set camera bounds and follow player
    this.cameras.main.setBounds(-Infinity, -Infinity, Infinity, Infinity);
    this.player.setCollideWorldBounds(false);
    this.cameras.main.startFollow(this.player, false);
    this.cameras.main.roundPixels = true; // rounds camera scroll to integer pixels

    // Creating Stats
    this.playerStats = new PlayerStats();
    this.enemyStats = new EnemyStats();
    this.lastPlayerHP = this.playerStats.currentHP;

    // Create health bar background (gray bar)
    this.healthBarWidth = 300;
    const barHeight = 25;
    const bottomOffset = 40;

    this.healthBarBG = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - bottomOffset,
      this.healthBarWidth,
      barHeight,
      0x333333
    ).setOrigin(0.5);

    this.healthBarFill = this.add.rectangle(
      this.cameras.main.width / 2 - this.healthBarWidth / 2,
      this.cameras.main.height - bottomOffset,
      this.healthBarWidth,
      barHeight,
      0x00ff00
    ).setOrigin(0, 0.5); // anchor to left

    this.healthBarDamage = this.add.rectangle(
      this.cameras.main.width / 2 - this.healthBarWidth / 2 + this.healthBarWidth,
      this.cameras.main.height - bottomOffset,
      0,
      barHeight,
      0xffff00
    ).setOrigin(0, 0.5); // also anchor to left
    this.healthBarDamage.alpha = 0; // hidden initially

    this.healthText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - bottomOffset,
      '',
      { fontSize: '18px', fill: '#ffffff', fontFamily: 'Arial', fontWeight: 'bold' }
    ).setOrigin(0.5);

    // Fix health bar UI to camera (no scrolling)
    this.healthBarBG.setScrollFactor(0);
    this.healthBarFill.setScrollFactor(0);
    this.healthBarDamage.setScrollFactor(0);
    this.healthText.setScrollFactor(0);

    // Update health bar initially
    this.updateHealthBar();

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.playerSpeed = 150; // slower player

    // Enemies group
    this.enemies = this.physics.add.group();

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true
    });

    // Twitch fix: round player body position after physics step
    this.physics.world.roundPixels = true;
    this.physics.world.on('worldstep', () => {
      if (this.player.body) {
        this.player.body.position.x = Math.round(this.player.body.position.x);
        this.player.body.position.y = Math.round(this.player.body.position.y);
        this.player.x = this.player.body.position.x + this.player.body.halfWidth;
        this.player.y = this.player.body.position.y + this.player.body.halfHeight;
      }
    });

    // Initialize enemy damage cooldown map
    this.enemyLastDamageTime = new Map();

    // Add collider to handle damage when enemies overlap player
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      const now = this.time.now;
      const lastHit = this.enemyLastDamageTime.get(enemy) || 0;
      if (now - lastHit > 1000) { // damage cooldown per enemy: 1 second
        this.applyDamage(10);
        this.enemyLastDamageTime.set(enemy, now);
      }
    });

    // Variables for damage overlay draining tween and delay timer
    this.damageOverlayDrainTween = null;
    this.damageOverlayDrainDelayTimer = null;
  }

  spawnEnemy() {
    const cam = this.cameras.main;
    const spawnMargin = 200; // Distance outside viewport to spawn enemies

    // Get camera view rectangle
    const camRect = new Phaser.Geom.Rectangle(cam.worldView.x, cam.worldView.y, cam.worldView.width, cam.worldView.height);

    const sides = ['top', 'bottom', 'left', 'right'];
    const side = Phaser.Utils.Array.GetRandom(sides);

    let x, y;

    switch (side) {
      case 'top':
        x = Phaser.Math.Between(camRect.x, camRect.right);
        y = camRect.top - spawnMargin;
        break;
      case 'bottom':
        x = Phaser.Math.Between(camRect.x, camRect.right);
        y = camRect.bottom + spawnMargin;
        break;
      case 'left':
        x = camRect.left - spawnMargin;
        y = Phaser.Math.Between(camRect.y, camRect.bottom);
        break;
      case 'right':
        x = camRect.right + spawnMargin;
        y = Phaser.Math.Between(camRect.y, camRect.bottom);
        break;
    }

    x = Phaser.Math.Clamp(x, 0, this.worldWidth);
    y = Phaser.Math.Clamp(y, 0, this.worldHeight);

    const enemy = this.enemies.create(x, y, 'enemy');
    enemy.setDisplaySize(40, 40);
    enemy.speed = 120;
    enemy.setCollideWorldBounds(false);

    enemy.setTint(0xff0000);

    // FIX: Added backticks for template literal in console.log
    console.log(`Enemy spawned at (${x.toFixed(1)}, ${y.toFixed(1)})`);
  }

  updateHealthBar() {
    const { currentHP, maxHP } = this.playerStats;
    const barWidth = this.healthBarWidth;

    const fillRatio = currentHP / maxHP;
    this.healthBarFill.width = barWidth * fillRatio;

    // Always position from left
    this.healthBarFill.x = this.cameras.main.width / 2 - barWidth / 2;

    const green = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(255, 0, 0),
      new Phaser.Display.Color(0, 255, 0),
      maxHP,
      currentHP
    );
    const colorInt = Phaser.Display.Color.GetColor(green.r, green.g, green.b);
    this.healthBarFill.setFillStyle(colorInt);

    // FIX: Added backticks for template literal in setText
    this.healthText.setText(`${currentHP} / ${maxHP}`);
  }

  applyDamage(damage) {
    if (damage <= 0) return;

    const barWidth = this.healthBarWidth;
    const maxHP = this.playerStats.maxHP;
    const unitWidth = barWidth / maxHP;

    const previousHP = this.lastPlayerHP;
    const newHP = this.playerStats.takeDamage(damage);
    const actualDamage = Math.max(0, previousHP - newHP);

    // Clamp and calculate pixel widths
    const prevWidth = Phaser.Math.Clamp(previousHP, 0, maxHP) * unitWidth;
    const damageWidth = Phaser.Math.Clamp(actualDamage, 0, maxHP) * unitWidth;

    const barLeft = this.cameras.main.width / 2 - barWidth / 2;
    const damageX = barLeft + prevWidth - damageWidth;


    // Now update the green bar visually
    this.updateHealthBar();

    // Clear any old animations
    if (this.damageOverlayDrainTween) {
      this.damageOverlayDrainTween.stop();
      this.damageOverlayDrainTween = null;
    }
    if (this.damageOverlayDrainDelayTimer) {
      this.damageOverlayDrainDelayTimer.remove(false);
    }

    // Start drain after short delay
    this.damageOverlayDrainDelayTimer = this.time.delayedCall(400, () => {
      this.startDamageOverlayDrain();
    });

    // Update tracker
    this.lastPlayerHP = newHP;
  }

  startDamageOverlayDrain() {
    this.damageOverlayDrainTween = this.tweens.add({
      targets: this.healthBarDamage,
      width: 0,
      alpha: 0,
      duration: 2000,
      ease: 'Linear'
    });
  }

  update() {
    this.player.setVelocity(0);
    if (this.cursors.left.isDown || this.wasd.A.isDown) this.player.setVelocityX(-this.playerSpeed);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) this.player.setVelocityX(this.playerSpeed);

    if (this.cursors.up.isDown || this.wasd.W.isDown) this.player.setVelocityY(-this.playerSpeed);
    else if (this.cursors.down.isDown || this.wasd.S.isDown) this.player.setVelocityY(this.playerSpeed);

    this.cameras.main.scrollX = Math.round(this.cameras.main.scrollX);
    this.cameras.main.scrollY = Math.round(this.cameras.main.scrollY);

    const stopDistance = 50;
    this.enemies.children.iterate(enemy => {
      if (!enemy) return;

      const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (dist > stopDistance) {
        let dx = this.player.x - enemy.x;
        let dy = this.player.y - enemy.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        enemy.setVelocity(dx * enemy.speed, dy * enemy.speed);
      } else {
        enemy.setVelocity(0, 0);
      }
    });
  }

  drawHexGridToRenderTexture() {
    const cols = Math.ceil(this.worldWidth / (this.hexWidth + this.spacing));
    const rows = Math.ceil(this.worldHeight / (this.hexHeight + this.spacing));
    const graphics = this.make.graphics({ add: false });

    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        let x = col * (this.hexWidth + this.spacing);
        if (row % 2 === 1) x += this.hexWidth / 2;
        let y = row * (this.hexHeight + this.spacing);

        this.drawHexagonToGraphics(graphics, x, y, this.hexSize);
      }
    }

    this.hexRenderTexture.draw(graphics);
    graphics.destroy();
  }

  drawHexagonToGraphics(graphics, x, y, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      points.push(new Phaser.Geom.Point(x + size * Math.cos(angle), y + size * Math.sin(angle)));
    }

    graphics.lineStyle(2, 0x646464, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();

    graphics.fillStyle(0x444444, 0.6);
    graphics.fillPoints(points, true);
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#111111',
  parent: 'gameCanvas',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: [MainScene]
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});