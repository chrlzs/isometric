import Entity from './entity.js';

class NPC extends Entity {
  constructor(x, y, hitPoints) {
    super(x, y, hitPoints);
    // Additional properties or methods specific to the NPC can be added here
  }

  moveTo(newX, newY) {
    this.x = newX;
    this.y = newY;
  }
}

export default NPC;