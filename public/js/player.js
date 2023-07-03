import Entity from './entity.js';

class Player extends Entity {
  constructor(x, y, hitPoints) {
    super(x, y, hitPoints);
    // Additional properties or methods specific to the player can be added here
  }

  isNPCAtPosition(npc, x, y) {
    return npc.x === x && npc.y === y;
  }
}

export default Player;