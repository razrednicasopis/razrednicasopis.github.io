class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.hexSize = 50;
    this.hexHeight = Math.sqrt(3) * this.hexSize;
    this.hexWidth = 2 * this.hexSize;
    this.spacing = 5;
  }

  preload() {
    // Load a player image from an online source for sure
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  }

  create() {
    this.player = this.physics.add.sprite(this.cameras.main.centerX, this.cameras.main.centerY, 'player');
    this.player.setOrigin(0.5);
    this.player.setDisplaySize(64, 64);
    this.playerSpeed = 200;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // Graphics object for drawing hexes
    this.hexGraphics = this.add.graphics();

    // Make camera follow the player
    this.cameras.main.startFollow(this.player);
  }

  drawHexagon(x, y) {
    const g = this.hexGraphics;
    const size = this.hexSize;

    g.lineStyle(2, 0x777777, 1);
    g.fillStyle(0x555555, 1);

    g.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = Phaser.Math.DegToRad(60 * i - 30);
      const px = x + size * Math.cos(angle);
      const py = y + size * Math.sin(angle);
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fillPath();
    g.strokePath();
  }

  drawHexGrid() {
    this.hexGraphics.clear();

    const cam = this.cameras.main;
    const w = cam.width;
    const h = cam.height;

    // Calculate columns and rows with some buffer
    const cols = Math.ceil(w / (this.hexWidth + this.spacing)) + 3;
    const rows = Math.ceil(h / (this.hexHeight + this.spacing)) + 3;

    const offsetX = cam.scrollX;
    const offsetY = cam.scrollY;

    for (let row = -2; row < rows; row++) {
      for (let col = -2; col < cols; col++) {
        const x = col * (this.hexWidth + this.spacing) + (row % 2) * (this.hexWidth / 2) - (offsetX % (this.hexWidth + this.spacing));
        const y = row * (this.hexHeight + this.spacing) - (offsetY % (this.hexHeight + this.spacing));
        this.drawHexagon(x, y);
      }
    }
  }

  update() {
    this.player.body.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      this.player.body.setVelocityX(-this.playerSpeed);
    }
    if (this.cursors.right.isDown || this.wasd.D.isDown) {
      this.player.body.setVelocityX(this.playerSpeed);
    }
    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      this.player.body.setVelocityY(-this.playerSpeed);
    }
    if (this.cursors.down.isDown || this.wasd.S.isDown) {
      this.player.body.setVelocityY(this.playerSpeed);
    }

    this.drawHexGrid();
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#111111',
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scene: MainScene
};

window.addEventListener('load', () => {
  new Phaser.Game(config);
});
