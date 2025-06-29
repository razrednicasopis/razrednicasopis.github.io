// /src/systems/death/DeathHandler.js

export default class DeathHandler {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
  }

  triggerDeath() {
    const { scene, player } = this;
    console.log('You have died trying to escape the invasion. May you rest in eternal peace.');

    // Freeze game
    scene.physics.pause();
    player.setVelocity(0, 0);
    player.body.enable = false;

    // Glow
    scene.tweens.add({
      targets: player,
      scale: 1.3,
      duration: 500,
      ease: 'Sine.easeOut',
      yoyo: true,
      onComplete: () => this._disintegrate(),
    });

    player.setTintFill(0xffffff); // white glow
  }

 _disintegrate() {
  const { scene, player } = this;

  const particles = scene.add.particles('particle');

  particles.createEmitter({
    x: player.x,
    y: player.y,
    lifespan: 800,
    speed: { min: -100, max: 100 },
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    quantity: 40,
    blendMode: 'ADD',
    tint: [0xffcccc, 0xffffff]
  });

  player.setAlpha(0); // hide player

  scene.time.delayedCall(1000, () => {
    particles.destroy();
  });

  this._darkenScreen();
}


  _darkenScreen() {
    const { scene } = this;

    const overlay = scene.add.rectangle(0, 0, scene.cameras.main.width, scene.cameras.main.height, 0x000000, 0)
      .setOrigin(0)
      .setScrollFactor(0);

    scene.tweens.add({
      targets: overlay,
      alpha: 0.8,
      duration: 1000,
      delay: 1000,
    });

    scene.time.delayedCall(2000, () => {
      this._showDeathText();
    });
  }

  _showDeathText() {
    const { scene } = this;

    const { text, style } = this._getTextConfig();

    const deathText = scene.add.text(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      text,
      style
    ).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

    scene.tweens.add({
      targets: deathText,
      alpha: 1,
      duration: 1500,
    });
  }

  _getTextConfig() {
    return {
      text: 'Tvoja zgodba je končana...',
      style: {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Arial Black',
        stroke: '#ff0000',
        strokeThickness: 4,
        shadow: {
          offsetX: 0,
          offsetY: 0,
          color: '#ff0000',
          blur: 16,
          fill: true
        }
      }
    };
  }
}