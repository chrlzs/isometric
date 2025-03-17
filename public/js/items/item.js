export default class Item {
    constructor(id, name, description, type, rarity = 'common') {
        this.id = id;
        this.name = name;
        this.description = description;
        this.type = type;
        this.rarity = rarity;
        this.stackable = false;
        this.weight = 1.0; // Default weight in kg
    }
}