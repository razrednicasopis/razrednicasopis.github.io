export default class BulletSpread {
  constructor() {
    this.name = "Bullet Spread";
    this.description = "Fires two additional bullets at slight angles.";
    this.rarity = "Rare";
  }

  apply(playerStats, game) {
    playerStats.bulletSpread = true;
  }

  isEligible(playerStats, activeBonuses) {
    return !activeBonuses.some(b => b instanceof BulletSpread);
  }
}
