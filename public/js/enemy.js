import Entity from "./entity.js";

class Enemy extends Entity {
  constructor(x, y, hitPoints) {
    super(x, y, hitPoints);
  }

  enemyAction() {
    //TODO: Enemy action
  }
}

export default Enemy;
