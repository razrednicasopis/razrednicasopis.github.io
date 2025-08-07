export default class FasterShooting {
  constructor() {
    this.id = 'faster_shooting';
    this.name = 'Faster Shooting';
    this.description = 'Increases player fire rate by 20%.';
    this.rarity = 'Common';
  }

  isEligible(playerStats, activeBonuses) {
    // Can’t pick if already active
    return !activeBonuses.find(b => b.id === this.id);
  }

  apply(playerStats, game) {
    playerStats.fireRate *= 0.8; // 20% faster
  }
}
