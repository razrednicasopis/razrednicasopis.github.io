// playerStats.js
export default class PlayerStats {
  constructor() {
    this.maxHP = 100;
    this.currentHP = 100;
    this.atk = 10;
    this.critRate = 0.1;  // 10%
    this.critDmg = 1.5;   // 150%
    this.defense = 5;     // New defense stat
  }

  // A method to apply damage considering defense
  takeDamage(damage) {
    const effectiveDamage = Math.max(0, damage - this.defense);
    this.currentHP = Math.max(0, this.currentHP - effectiveDamage);
    return effectiveDamage;
  }


  heal(amount) {
    this.currentHP = Math.min(this.currentHP + amount, this.maxHP);
  }

  isDead() {
    return this.currentHP <= 0;
  }
}
