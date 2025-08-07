export default class ExplosiveShot {
  constructor() {
    this.name = "Explosive Shot";
    this.description = "Bullets explode on impact, dealing area damage.";
    this.rarity = "Epic";
  }

  apply(playerStats, game) {
    playerStats.explosiveShots = true;
  }

  isEligible(playerStats, activeBonuses) {
    return !activeBonuses.some(b => b instanceof ExplosiveShot);
  }
}
