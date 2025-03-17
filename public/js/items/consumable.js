import Item from './item.js';

export default class Consumable extends Item {
    constructor(id, name, description, healAmount) {
        super(id, name, description, 'consumable');
        this.healAmount = healAmount;
        this.stackable = true;
    }

    use(player) {
        player.heal(this.healAmount);
        return true; // Item should be consumed
    }
}