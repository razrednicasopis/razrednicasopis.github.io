import Bonuses from './bonusExports.js';

const RARITY_WEIGHTS = {
  Common: 60,
  Rare: 30,
  Epic: 10,
};

const BONUS_POINT_THRESHOLD = 100;

function weightedRandomPick(items, weightFn, count) {
  const weightedPool = [];
  items.forEach(item => {
    const weight = weightFn(item) || 1;
    for(let i = 0; i < weight; i++) weightedPool.push(item);
  });

  const picked = new Set();
  while (picked.size < count && weightedPool.length > 0) {
    const choice = weightedPool[Math.floor(Math.random() * weightedPool.length)];
    picked.add(choice);
  }
  return Array.from(picked);
}

export class BonusManager {
  constructor(playerStats, game) {
    this.playerStats = playerStats;
    this.game = game;
    this.activeBonuses = [];
    this.bonusPoints = 0;
    this.inBonusSelection = false;
    this.allBonuses = Bonuses.map(BonusClass => new BonusClass());
  }

  onEnemyDefeated(enemy) {
    this.bonusPoints += enemy.bonusPoints || 10;

    if (!this.inBonusSelection && this.bonusPoints >= BONUS_POINT_THRESHOLD) {
      this.triggerBonusSelection();
      this.bonusPoints = 0;
    }
  }

  triggerBonusSelection() {
    this.inBonusSelection = true;
    this.game.freezeAll(true);

    const eligible = this.allBonuses.filter(bonus =>
      bonus.isEligible(this.playerStats, this.activeBonuses)
    );

    const options = weightedRandomPick(
      eligible,
      bonus => RARITY_WEIGHTS[bonus.rarity] || 1,
      3
    );

    this.game.showBonusOverlay(options, (selected) => {
      selected.apply(this.playerStats, this.game);
      this.activeBonuses.push(selected);
      this.inBonusSelection = false;
      this.game.freezeAll(false);
    });
  }
}
