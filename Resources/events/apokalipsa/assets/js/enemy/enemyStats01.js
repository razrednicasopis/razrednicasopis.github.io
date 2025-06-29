export default class EnemyStats {
  constructor() {
    this.atk = 15;
    this.maxHP = 10;
    this.currentHP = this.maxHP;
    this.def = 5;
    this.speed = 50;
  }


  takeDamage(damage) {
    const actualDamage = Math.max(0, damage - this.def);
    this.currentHP -= actualDamage;
    return this.currentHP;
  }

  isDead() {
    return this.currentHP <= 0;
  }
}