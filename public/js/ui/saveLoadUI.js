import SaveManager from '../core/saveManager.js';

class SaveLoadUI {
    constructor() {
        this.createUI();
        this.createFloatingButton();
    }

    createUI() {
        this.container = document.createElement('div');
        this.container.className = 'save-load-menu hidden';
        this.container.innerHTML = `
            <div class="save-load-content">
                <h2>Save/Load Game</h2>
                <div class="save-mode-tabs">
                    <button class="tab-button active" data-mode="save">Save Game</button>
                    <button class="tab-button" data-mode="load">Load Game</button>
                </div>
                <div class="save-slots"></div>
                <div class="button-row">
                    <button class="close-button">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    createFloatingButton() {
        const button = document.createElement('button');
        button.className = 'save-load-button';
        button.innerHTML = `Save/Load <span class="shortcut-hint">[F5]</span>`;
        button.addEventListener('click', () => this.show('save'));
        document.body.appendChild(button);
    }

    setupEventListeners() {
        // Close button
        this.container.querySelector('.close-button').addEventListener('click', () => {
            this.hide();
        });

        // Tab switching
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Update active tab
                this.container.querySelectorAll('.tab-button').forEach(b => 
                    b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update slots
                this.updateSlots(e.target.dataset.mode);
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.container.classList.contains('hidden')) {
                this.hide();
            }
        });
    }

    show(mode = 'save') {
        this.container.classList.remove('hidden');
        // Set active tab
        this.container.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });
        this.updateSlots(mode);
    }

    hide() {
        this.container.classList.add('hidden');
    }

    updateSlots(mode) {
        const slotsContainer = this.container.querySelector('.save-slots');
        slotsContainer.innerHTML = '';

        const slots = SaveManager.getAllSaveSlots();
        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'save-slot';

            if (slot.empty) {
                slotElement.innerHTML = `
                    <div class="slot-info">
                        <h3>Empty Slot ${slot.slot + 1}</h3>
                        <p class="empty-slot-hint">Click Save to create a new save file</p>
                    </div>
                `;
            } else {
                const date = new Date(slot.metadata.timestamp);
                slotElement.innerHTML = `
                    <div class="slot-info">
                        <h3>Slot ${slot.slot + 1}</h3>
                        <p>Location: ${slot.metadata.location}</p>
                        <p>Saved: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
                    </div>
                `;
            }

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'slot-buttons';

            const buttonText = mode === 'save' ? 'Save' : 'Load';
            const actionButton = document.createElement('button');
            actionButton.textContent = buttonText;
            actionButton.className = `${mode}-button`;
            actionButton.addEventListener('click', () => {
                if (mode === 'save') {
                    SaveManager.saveGame(slot.slot);
                } else {
                    SaveManager.loadGame(slot.slot);
                }
                this.hide();
            });

            if (!slot.empty) {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button';
                deleteButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this save?')) {
                        SaveManager.deleteSave(slot.slot);
                        this.updateSlots(mode);
                    }
                });
                buttonContainer.appendChild(deleteButton);
            }

            buttonContainer.appendChild(actionButton);
            slotElement.appendChild(buttonContainer);
            slotsContainer.appendChild(slotElement);
        });
    }
}

export default SaveLoadUI;