export default class InventoryUI {
    constructor(player) {
        this.player = player;
        this.visible = false;
        this.createUI();
        this.bindEvents();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'inventory-ui';
        
        this.container.innerHTML = `
            <div class="inventory-header">
                <h3>Inventory</h3>
                <button class="close-button">×</button>
            </div>
            <div class="equipment-slots">
                <div class="equipment-slot weapon-slot" data-type="weapon">
                    <div class="slot-label">Weapon</div>
                    <div class="slot-content"></div>
                </div>
                <div class="equipment-slot armor-slot" data-type="armor">
                    <div class="slot-label">Armor</div>
                    <div class="slot-content"></div>
                </div>
            </div>
            <div class="inventory-grid"></div>
            <div class="item-tooltip"></div>
        `;

        document.body.appendChild(this.container);
        this.tooltip = this.container.querySelector('.item-tooltip');

        // Add category filters
        const categoryFilters = document.createElement('div');
        categoryFilters.className = 'inventory-categories';
        categoryFilters.innerHTML = `
            <button class="category-btn active" data-category="all">All</button>
            <button class="category-btn" data-category="weapon">Weapons</button>
            <button class="category-btn" data-category="armor">Armor</button>
            <button class="category-btn" data-category="consumable">Consumables</button>
        `;
        
        this.container.insertBefore(categoryFilters, this.container.querySelector('.inventory-grid'));
    }

    bindEvents() {
        // Toggle inventory with 'I' key
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'i') {
                this.toggle();
            }
        });

        // Close button
        this.container.querySelector('.close-button').addEventListener('click', () => {
            this.hide();
        });

        // Item hover events
        this.container.addEventListener('mouseover', (e) => {
            const slot = e.target.closest('.inventory-slot, .equipment-slot');
            if (slot && slot.dataset.itemId) {
                this.showTooltip(slot.dataset.itemId, e);
            }
        });

        this.container.addEventListener('mouseout', () => {
            this.hideTooltip();
        });

        // Item click events
        this.container.addEventListener('click', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (slot && slot.dataset.itemId) {
                this.player.useItem(slot.dataset.itemId);
                this.update();
            }
        });

        // Drag and drop functionality
        this.container.addEventListener('dragstart', (e) => {
            const slot = e.target.closest('.inventory-slot, .equipment-slot');
            if (slot && slot.dataset.itemId) {
                e.dataTransfer.setData('text/plain', slot.dataset.itemId);
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        this.container.addEventListener('dragover', (e) => {
            const slot = e.target.closest('.inventory-slot, .equipment-slot');
            if (slot) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });

        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const itemId = e.dataTransfer.getData('text/plain');
            const targetSlot = e.target.closest('.inventory-slot, .equipment-slot');
            
            if (targetSlot) {
                if (targetSlot.classList.contains('equipment-slot')) {
                    const slotType = targetSlot.dataset.type;
                    this.equipItem(itemId, slotType);
                } else {
                    this.swapItems(itemId, targetSlot.dataset.itemId);
                }
            }
            this.update();
        });

        // Add category filter handling
        const categoryButtons = this.container.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Update active button
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter and update items
                const category = button.dataset.category;
                const filteredItems = this.filterItems(category);
                const sortedItems = this.sortItems(filteredItems);
                this.updateInventoryGrid(sortedItems);
            });
        });
    }

    showTooltip(itemId, event) {
        const item = this.player.inventory.get(itemId)?.item;
        if (!item) return;

        let statsText = '';
        switch (item.type) {
            case 'weapon':
                statsText = `Damage Bonus: +${item.damageBonus}`;
                break;
            case 'armor':
                statsText = `Defense Bonus: +${item.defenseBonus}`;
                break;
            case 'consumable':
                statsText = `Heals: ${item.healAmount} HP`;
                break;
        }

        this.tooltip.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-stats">${statsText}</div>
        `;

        const rect = event.target.getBoundingClientRect();
        this.tooltip.style.left = `${rect.right + 10}px`;
        this.tooltip.style.top = `${rect.top}px`;
        this.tooltip.classList.add('visible');
    }

    hideTooltip() {
        this.tooltip.classList.remove('visible');
    }

    update() {
        // Update equipment slots
        const weaponSlot = this.container.querySelector('.weapon-slot');
        const armorSlot = this.container.querySelector('.armor-slot');

        // Update weapon slot
        if (this.player.equippedWeapon) {
            weaponSlot.classList.add('filled');
            weaponSlot.dataset.itemId = this.player.equippedWeapon.id;
            weaponSlot.querySelector('.slot-content').textContent = this.player.equippedWeapon.name;
        } else {
            weaponSlot.classList.remove('filled');
            delete weaponSlot.dataset.itemId;
            weaponSlot.querySelector('.slot-content').textContent = 'Empty';
        }

        // Update armor slot
        if (this.player.equippedArmor) {
            armorSlot.classList.add('filled');
            armorSlot.dataset.itemId = this.player.equippedArmor.id;
            armorSlot.querySelector('.slot-content').textContent = this.player.equippedArmor.name;
        } else {
            armorSlot.classList.remove('filled');
            delete armorSlot.dataset.itemId;
            armorSlot.querySelector('.slot-content').textContent = 'Empty';
        }

        // Update inventory grid with current category filter
        const activeCategory = this.container.querySelector('.category-btn.active').dataset.category;
        const filteredItems = this.filterItems(activeCategory);
        const sortedItems = this.sortItems(filteredItems);
        this.updateInventoryGrid(sortedItems);

        // Update weight indicator
        let weightIndicator = this.container.querySelector('.weight-indicator');
        if (!weightIndicator) {
            weightIndicator = document.createElement('div');
            weightIndicator.className = 'weight-indicator';
            this.container.appendChild(weightIndicator);
        }

        const totalWeight = this.player.getInventoryItems()
            .reduce((sum, {item, quantity}) => sum + (item.weight * quantity), 0);
        const maxWeight = this.player.maxCarryWeight || 50;

        weightIndicator.innerHTML = `
            <div class="weight-bar">
                <div class="weight-fill" style="width: ${(totalWeight/maxWeight) * 100}%"></div>
            </div>
            <div class="weight-text">${totalWeight.toFixed(1)}/${maxWeight.toFixed(1)} kg</div>
        `;
    }

    show() {
        this.visible = true;
        this.container.classList.add('visible');
        this.update();
    }

    hide() {
        this.visible = false;
        this.container.classList.remove('visible');
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    equipItem(itemId, slotType) {
        const item = this.player.inventory.get(itemId)?.item;
        if (!item || item.type !== slotType) return;

        if (slotType === 'weapon') {
            this.player.equipWeapon(item);
        } else if (slotType === 'armor') {
            this.player.equipArmor(item);
        }
    }

    swapItems(itemId1, itemId2) {
        // Implement item position swapping logic
        // This would require adding position tracking to inventory items
    }

    filterItems(category) {
        const items = this.player.getInventoryItems();
        if (category === 'all') return items;
        return items.filter(({item}) => item.type === category);
    }

    sortItems(items, criteria = 'name') {
        return items.sort((a, b) => {
            switch (criteria) {
                case 'name':
                    return a.item.name.localeCompare(b.item.name);
                case 'type':
                    return a.item.type.localeCompare(b.item.type);
                case 'rarity':
                    return b.item.rarity.localeCompare(a.item.rarity);
                default:
                    return 0;
            }
        });
    }

    showSplitStackDialog(itemId) {
        const {item, quantity} = this.player.inventory.get(itemId);
        if (!item.stackable || quantity <= 1) return;

        const dialog = document.createElement('div');
        dialog.className = 'split-stack-dialog';
        dialog.innerHTML = `
            <h4>Split Stack</h4>
            <input type="range" min="1" max="${quantity-1}" value="${Math.floor(quantity/2)}">
            <span class="split-value"></span>
            <div class="split-buttons">
                <button class="confirm">Split</button>
                <button class="cancel">Cancel</button>
            </div>
        `;

        this.container.appendChild(dialog);
        // Add split stack logic...
    }

    updateInventoryGrid(items) {
        const inventoryGrid = this.container.querySelector('.inventory-grid');
        inventoryGrid.innerHTML = '';

        items.forEach(({item, quantity}) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.itemId = item.id;
            slot.draggable = true;
            slot.innerHTML = `
                ${item.name}
                ${quantity > 1 ? `<span class="quantity">${quantity}</span>` : ''}
            `;
            inventoryGrid.appendChild(slot);
        });
    }
}
