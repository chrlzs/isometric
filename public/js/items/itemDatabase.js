import Consumable from './consumable.js';
import Weapon from './weapon.js';
import Armor from './armor.js';

export default class ItemDatabase {
    static items = new Map();

    static initialize() {
        // Consumables
        this.registerItem(new Consumable(
            'health_potion_small',
            'Small Health Potion',
            'Restores 25 HP',
            25
        ));

        this.registerItem(new Consumable(
            'health_potion_large',
            'Large Health Potion',
            'Restores 50 HP',
            50
        ));

        // Weapons
        this.registerItem(new Weapon(
            'sword_iron',
            'Iron Sword',
            'A basic iron sword',
            5
        ));

        this.registerItem(new Weapon(
            'sword_steel',
            'Steel Sword',
            'A sharp steel sword',
            10
        ));

        // Armor
        this.registerItem(new Armor(
            'armor_leather',
            'Leather Armor',
            'Basic leather protection',
            2
        ));

        this.registerItem(new Armor(
            'armor_chainmail',
            'Chainmail Armor',
            'Reliable chainmail protection',
            5
        ));
    }

    static registerItem(item) {
        this.items.set(item.id, item);
    }

    static getItem(id) {
        return this.items.get(id);
    }
}