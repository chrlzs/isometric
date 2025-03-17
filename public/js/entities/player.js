import Entity from './entity.js';

class Player extends Entity {
  constructor(x, y, hitPoints = 100, name = 'Player') {
    super(x, y, hitPoints);
    this.name = name;
    this.maxHitPoints = hitPoints;
    this.baseDamage = 10;
    this.attackPower = this.baseDamage;
    this.baseDefense = 0;
    this.defense = this.baseDefense;
    this.equippedWeapon = null;
    this.equippedArmor = null;
    this.inventory = new Map(); // Map of item ID to {item: Item, quantity: number}
  }

  takeDamage(amount) {
    // Apply defense reduction
    const reducedDamage = Math.max(1, amount - this.defense);
    this.hitPoints = Math.max(0, this.hitPoints - reducedDamage);
    this.updateHealthDisplay();
  }

  heal(amount) {
    this.hitPoints = Math.min(this.maxHitPoints, this.hitPoints + amount);
    this.updateHealthDisplay();
  }

  updateHealthDisplay() {
    const healthDisplay = document.getElementById('player-health-display');
    if (healthDisplay) {
      const healthBar = healthDisplay.querySelector('.health-bar-fill');
      const healthText = healthDisplay.querySelector('.health-text');
      
      const healthPercent = (this.hitPoints / this.maxHitPoints) * 100;
      healthBar.style.width = `${healthPercent}%`;
      healthText.textContent = `${this.hitPoints}/${this.maxHitPoints}`;
    }
  }

  addItem(item, quantity = 1) {
    if (this.inventory.has(item.id) && item.stackable) {
      // Increment quantity for stackable items
      this.inventory.get(item.id).quantity += quantity;
    } else {
      // Add new item
      this.inventory.set(item.id, { item, quantity });
    }
  }

  removeItem(itemId, quantity = 1) {
    if (!this.inventory.has(itemId)) return false;
    
    const inventoryItem = this.inventory.get(itemId);
    if (inventoryItem.quantity <= quantity) {
      this.inventory.delete(itemId);
    } else {
      inventoryItem.quantity -= quantity;
    }
    return true;
  }

  useItem(itemId) {
    const inventoryItem = this.inventory.get(itemId);
    if (!inventoryItem) return false;

    const consumed = inventoryItem.item.use(this);
    if (consumed) {
      this.removeItem(itemId, 1);
    }
    return true;
  }

  getInventoryItems() {
    return Array.from(this.inventory.values());
  }
}

export default Player;