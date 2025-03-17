import Entity from "./entity.js";

class Enemy extends Entity {
  constructor(x, y, hitPoints, name = "Enemy", damage = 10) {
    super(x, y, hitPoints);
    this.name = name;
    this.maxHitPoints = hitPoints;
    this.damage = damage;
    this.image = "/assets/enemies/enemy-default.png"; // Default image path
  }

  attack() {
    // Return a value between 80-120% of base damage
    return Math.floor(this.damage * (0.8 + Math.random() * 0.4));
  }

  takeDamage(amount) {
    this.hitPoints = Math.max(0, this.hitPoints - amount);
    return this.hitPoints <= 0;
  }

  isAdjacent(playerX, playerY) {
    const dx = Math.abs(this.x - playerX);
    const dy = Math.abs(this.y - playerY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
}

export default Enemy;
