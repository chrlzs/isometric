import Debug from '../utils/debug.js';

class CombatManager {
    static init() {
        this.createCombatModal();
        this.inCombat = false;
        this.currentEnemy = null;
        this.combatLog = [];
    }

    static createCombatModal() {
        const modal = document.createElement('div');
        modal.className = 'combat-modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="combat-modal">
                <div class="combat-header">
                    <div class="combatant player-combat">
                        <h3 class="player-name"></h3>
                        <div class="health-bar">
                            <div class="health-bar-fill"></div>
                            <div class="health-text"></div>
                        </div>
                    </div>
                    <div class="combatant enemy-combat">
                        <h3 class="enemy-name"></h3>
                        <img class="combatant-image" src="" alt="Enemy">
                        <div class="health-bar">
                            <div class="health-bar-fill"></div>
                            <div class="health-text"></div>
                        </div>
                    </div>
                </div>
                <div class="combat-log"></div>
                <div class="combat-actions">
                    <button class="combat-button attack-button">Attack</button>
                    <button class="combat-button retreat-button">Retreat</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        this.setupEventListeners();
    }

    static setupEventListeners() {
        const attackBtn = this.modal.querySelector('.attack-button');
        const retreatBtn = this.modal.querySelector('.retreat-button');

        attackBtn.addEventListener('click', () => this.handleAttack());
        retreatBtn.addEventListener('click', () => this.handleRetreat());
    }

    static startCombat(player, enemy, worldGrid) {
        if (!enemy.isAdjacent(player.x, player.y)) {
            Debug.log('COMBAT', 'Enemy not adjacent to player');
            return false;
        }

        this.inCombat = true;
        this.currentEnemy = enemy;
        this.player = player;
        this.worldGrid = worldGrid;  // Store reference to world grid
        this.combatLog = [];
        
        // Update modal content
        this.modal.querySelector('.player-name').textContent = player.name;
        this.modal.querySelector('.enemy-name').textContent = enemy.name;
        this.modal.querySelector('.combatant-image').src = enemy.image;
        
        this.updateHealthDisplays();
        this.modal.style.display = 'flex';
        
        Debug.log('COMBAT', `Combat started with ${enemy.name}`);
        this.addToCombatLog(`Combat started with ${enemy.name}!`);
        return true;
    }

    static handleAttack() {
        if (!this.inCombat) return;

        // Player attacks
        const playerDamage = Math.floor(10 + Math.random() * 5);
        const enemyKilled = this.currentEnemy.takeDamage(playerDamage);
        this.addToCombatLog(`You deal ${playerDamage} damage to ${this.currentEnemy.name}!`);
        this.updateHealthDisplays();
        Debug.log('COMBAT', `Player dealt ${playerDamage} damage. Enemy HP: ${this.currentEnemy.hitPoints}`);

        if (enemyKilled) {
            this.endCombat(true);
            return;
        }

        // Enemy attacks
        const enemyDamage = this.currentEnemy.attack();
        Debug.log('COMBAT', `Enemy attempting to deal ${enemyDamage} damage. Player HP before: ${this.player.hitPoints}`);
        this.player.takeDamage(enemyDamage);  // Changed from damage to takeDamage
        Debug.log('COMBAT', `Player HP after enemy attack: ${this.player.hitPoints}`);
        this.addToCombatLog(`${this.currentEnemy.name} deals ${enemyDamage} damage to you!`);
        this.updateHealthDisplays();

        if (this.player.hitPoints <= 0) {
            this.endCombat(false);
            return;
        }
    }

    static handleRetreat() {
        const retreatChance = Math.random();
        if (retreatChance > 0.3) { // 70% chance to retreat successfully
            this.addToCombatLog("Retreat successful!");
            this.endCombat(null);
        } else {
            this.addToCombatLog("Retreat failed!");
            // Enemy gets a free attack
            const enemyDamage = this.currentEnemy.attack();
            this.player.damage(enemyDamage);
            this.addToCombatLog(`${this.currentEnemy.name} deals ${enemyDamage} damage to you!`);
            this.updateHealthDisplays();
        }
    }

    static updateHealthDisplays() {
        // Update player health
        const playerHealth = this.modal.querySelector('.player-combat .health-bar-fill');
        const playerHealthText = this.modal.querySelector('.player-combat .health-text');
        const playerHealthPercent = (this.player.hitPoints / this.player.maxHitPoints) * 100;
        playerHealth.style.width = `${playerHealthPercent}%`;
        playerHealthText.textContent = `${this.player.hitPoints}/${this.player.maxHitPoints}`;

        // Update enemy health
        const enemyHealth = this.modal.querySelector('.enemy-combat .health-bar-fill');
        const enemyHealthText = this.modal.querySelector('.enemy-combat .health-text');
        const enemyHealthPercent = (this.currentEnemy.hitPoints / this.currentEnemy.maxHitPoints) * 100;
        enemyHealth.style.width = `${enemyHealthPercent}%`;
        enemyHealthText.textContent = `${this.currentEnemy.hitPoints}/${this.currentEnemy.maxHitPoints}`;
    }

    static addToCombatLog(message) {
        this.combatLog.push(message);
        const logElement = this.modal.querySelector('.combat-log');
        logElement.innerHTML = this.combatLog.map(msg => `<div>${msg}</div>`).join('');
        logElement.scrollTop = logElement.scrollHeight;
    }

    static endCombat(victory) {
        if (victory === true) {
            this.addToCombatLog(`${this.currentEnemy.name} was defeated!`);
            
            // Remove enemy from the world grid's entities
            const enemies = this.worldGrid.entities.enemies;
            const enemyIndex = enemies.findIndex(e => e === this.currentEnemy);
            if (enemyIndex !== -1) {
                enemies.splice(enemyIndex, 1);
                Debug.log('COMBAT', `Removed defeated enemy ${this.currentEnemy.name} from world`);
                
                // Force immediate grid update
                if (window.App) {
                    window.App.displayGrid();
                    Debug.log('COMBAT', 'Forced grid update after enemy removal');
                }
            }
        } else if (victory === false) {
            this.addToCombatLog("You were defeated!");
            this.handlePlayerDeath();
        }
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.inCombat = false;
            this.currentEnemy = null;
            
            // Force another update after the modal closes
            if (victory === true && window.App) {
                window.App.displayGrid();
                Debug.log('COMBAT', 'Final grid update after combat end');
            }
        }, 1500);
    }

    static handlePlayerDeath() {
        // Create death overlay
        const deathOverlay = document.createElement('div');
        deathOverlay.className = 'death-overlay';
        deathOverlay.innerHTML = `
            <div class="death-message">
                <h2>You have been defeated!</h2>
                <p>Would you like to:</p>
                <button class="respawn-button">Respawn at Last Checkpoint</button>
                <button class="load-button">Load Last Save</button>
            </div>
        `;
        document.body.appendChild(deathOverlay);

        // Handle respawn
        deathOverlay.querySelector('.respawn-button').addEventListener('click', () => {
            this.respawnPlayer();
            deathOverlay.remove();
        });

        // Handle load
        deathOverlay.querySelector('.load-button').addEventListener('click', () => {
            this.loadLastSave();
            deathOverlay.remove();
        });
    }

    static respawnPlayer() {
        // Reset player health
        this.player.hitPoints = this.player.maxHitPoints;
        this.player.updateHealthDisplay();

        // Move player to last safe position (could be last village, checkpoint, etc.)
        // This is placeholder logic - implement based on your game's checkpoint system
        this.player.x = 5;  // Starting position or last checkpoint
        this.player.y = 5;

        // Update world state
        if (window.App) {
            window.App.displayGrid();
        }

        Debug.log('COMBAT', 'Player respawned at checkpoint');
    }

    static loadLastSave() {
        // Implement your save/load system here
        Debug.log('COMBAT', 'Loading last save...');
        // Example: GameSaveManager.loadLastSave();
    }
}

export default CombatManager;