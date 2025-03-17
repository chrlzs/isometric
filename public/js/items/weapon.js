import Item from './item.js';

export default class Weapon extends Item {
    constructor(id, name, description, damageBonus) {
        super(id, name, description, 'weapon');
        this.damageBonus = damageBonus;
    }

    use(player) {
        if (player.equippedWeapon) {
            // Unequip current weapon
            player.damage -= player.equippedWeapon.damageBonus;
        }
        player.equippedWeapon = this;
        player.damage += this.damageBonus;
        return false; // Item should not be consumed
    }
}