import Item from './item.js';

export default class Armor extends Item {
    constructor(id, name, description, defenseBonus) {
        super(id, name, description, 'armor');
        this.defenseBonus = defenseBonus;
    }

    use(player) {
        if (player.equippedArmor) {
            // Unequip current armor
            player.defense -= player.equippedArmor.defenseBonus;
        }
        player.equippedArmor = this;
        player.defense += this.defenseBonus;
        return false; // Item should not be consumed
    }
}