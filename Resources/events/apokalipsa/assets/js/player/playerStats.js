// playerStats.js
export default class PlayerStats {
  constructor() {
    this.maxHP = 100;
    this.currentHP = this.maxHP;
    this.atk = 10;
    this.critRate = 0.1;  // 10% Critical Rate
    this.critDmg = 1.5;   // 150% Critical Damage
    this.defense = 5;     // Defense stat
    this.speed = 100;     // Speed Stat
    this.fireRate = 50;   // Can fire every 50 milliseconds     
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
