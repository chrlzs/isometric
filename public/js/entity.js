class Entity {
    constructor(x, y, hitPoints) {
      this.x = x;
      this.y = y;
      this.hitPoints = hitPoints;
      this.inventory = [];
    }

    addItemToInventory(item) {
      this.inventory.push(item);
    }

    removeItemFromInventory(item) {
      const index = this.inventory.indexOf(item);
      if (index !== -1) {
        this.inventory.splice(index, 1);
      }
    }

    hasItemInInventory(item) {
      return this.inventory.includes(item);
    }
  }

  export default Entity;