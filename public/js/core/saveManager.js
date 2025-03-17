import Debug from '../utils/debug.js';
import QuestManager from './questManager.js';

class SaveManager {
    static SAVE_SLOTS = 3;
    
    static saveGame(slotNumber = 0) {
        try {
            const saveData = {
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                player: this.getPlayerData(),
                world: this.getWorldData(),
                quests: this.getQuestData(),
                weather: this.getWeatherData()
            };

            const saveKey = `gameState_slot_${slotNumber}`;
            localStorage.setItem(saveKey, JSON.stringify(saveData));
            
            // Save metadata for save slot selection screen
            const metadata = {
                timestamp: saveData.timestamp,
                playerLevel: saveData.player.level,
                location: saveData.player.location,
                playTime: saveData.player.playTime
            };
            localStorage.setItem(`${saveKey}_metadata`, JSON.stringify(metadata));

            // Show feedback to player
            if (window.App) {
                window.App.showNotification('Game saved successfully!');
            }

            Debug.log('SAVE', `Game saved successfully to slot ${slotNumber}`);
            return true;
        } catch (error) {
            Debug.log('SAVE', `Error saving game: ${error.message}`);
            if (window.App) {
                window.App.showNotification('Failed to save game!', 'error');
            }
            return false;
        }
    }

    static loadGame(slotNumber = 0) {
        try {
            const saveKey = `gameState_slot_${slotNumber}`;
            const saveData = JSON.parse(localStorage.getItem(saveKey));
            
            if (!saveData) {
                Debug.log('SAVE', `No save data found in slot ${slotNumber}`);
                return false;
            }

            // Load player data
            this.loadPlayerData(saveData.player);
            
            // Load world data
            this.loadWorldData(saveData.world);
            
            // Load quest data
            this.loadQuestData(saveData.quests);
            
            // Load weather data
            this.loadWeatherData(saveData.weather);

            // Show feedback to player
            if (window.App) {
                window.App.showNotification('Game loaded successfully!');
                window.App.displayGrid(); // Refresh the game display
            }

            Debug.log('SAVE', `Game loaded successfully from slot ${slotNumber}`);
            return true;
        } catch (error) {
            Debug.log('SAVE', `Error loading game: ${error.message}`);
            if (window.App) {
                window.App.showNotification('Failed to load game!', 'error');
            }
            return false;
        }
    }

    static getPlayerData() {
        const player = window.App.player;
        return {
            x: player.x,
            y: player.y,
            hitPoints: player.hitPoints,
            maxHitPoints: player.maxHitPoints,
            level: player.level || 1,
            inventory: player.inventory ? Array.from(player.inventory) : [],
            equipment: {
                weapon: player.equippedWeapon || null,
                armor: player.equippedArmor || null
            },
            stats: {
                attackPower: player.attackPower || 1,
                defense: player.defense || 1
            },
            playTime: player.playTime || 0,
            location: this.getCurrentLocation()
        };
    }

    static getWorldData() {
        const worldGrid = window.App.worldGrid;
        return {
            entities: {
                enemies: worldGrid.entities?.enemies?.map(enemy => ({
                    x: enemy.x,
                    y: enemy.y,
                    hitPoints: enemy.hitPoints,
                    type: enemy.constructor.name
                })) || [],
                npcs: worldGrid.entities?.npcs?.map(npc => ({
                    x: npc.x,
                    y: npc.y,
                    type: npc.constructor.name
                })) || []
            },
            structures: worldGrid.structures ? Array.from(worldGrid.structures) : [],
            modifiedTerrain: worldGrid.modifiedTerrain ? Array.from(worldGrid.modifiedTerrain) : []
        };
    }

    static getQuestData() {
        return {
            active: QuestManager.activeQuests ? Array.from(QuestManager.activeQuests.entries()) : [],
            completed: QuestManager.completedQuests ? Array.from(QuestManager.completedQuests.entries()) : []
        };
    }

    static getWeatherData() {
        const weather = window.App.weatherSystem;
        return {
            currentWeather: weather?.currentWeather || 'clear',
            intensity: weather?.intensity || 0
        };
    }

    static loadPlayerData(data) {
        try {
            const player = window.App.player;
            player.x = data.x;
            player.y = data.y;
            player.hitPoints = data.hitPoints;
            player.maxHitPoints = data.maxHitPoints;
            player.level = data.level || 1;
            
            // Safely handle inventory
            player.inventory = new Map();
            if (data.inventory && Array.isArray(data.inventory)) {
                data.inventory.forEach(([key, value]) => {
                    player.inventory.set(key, value);
                });
            }

            // Equipment
            player.equippedWeapon = data.equipment?.weapon || null;
            player.equippedArmor = data.equipment?.armor || null;
            
            // Stats
            player.attackPower = data.stats?.attackPower || 1;
            player.defense = data.stats?.defense || 1;
            player.playTime = data.playTime || 0;
            
            // Update UI
            player.updateHealthDisplay();
            Debug.log('SAVE', 'Player data loaded successfully');
        } catch (error) {
            Debug.error('Failed to load player data:', error);
            throw error;
        }
    }

    static loadWorldData(data) {
        try {
            const worldGrid = window.App.worldGrid;
            
            // Ensure player reference is maintained
            const player = window.App.player;
            
            // Clear current entities but maintain player reference
            worldGrid.entities = {
                player: player, // Keep player reference
                enemies: [],
                npcs: []
            };
            
            // Recreate enemies
            if (data.entities?.enemies) {
                data.entities.enemies.forEach(enemyData => {
                    const Enemy = window.App.Enemy; // Get Enemy class from App
                    if (Enemy) {
                        const enemy = new Enemy(enemyData.x, enemyData.y);
                        enemy.hitPoints = enemyData.hitPoints;
                        worldGrid.entities.enemies.push(enemy);
                    }
                });
            }
            
            // Recreate NPCs
            if (data.entities?.npcs) {
                data.entities.npcs.forEach(npcData => {
                    const NPC = window.App.NPC; // Get NPC class from App
                    if (NPC) {
                        const npc = new NPC(npcData.x, npcData.y);
                        worldGrid.entities.npcs.push(npc);
                    }
                });
            }
            
            // Restore structures and terrain
            worldGrid.structures = new Map(data.structures || []);
            worldGrid.modifiedTerrain = new Map(data.modifiedTerrain || []);
            
            // Ensure player is properly referenced
            if (!worldGrid.entities.player) {
                worldGrid.entities.player = player;
            }
            
            Debug.log('SAVE', 'World data loaded successfully');
        } catch (error) {
            Debug.error('Failed to load world data:', error);
            throw error;
        }
    }

    static loadQuestData(data) {
        try {
            QuestManager.activeQuests = new Map(data.active || []);
            QuestManager.completedQuests = new Map(data.completed || []);
            QuestManager.notifyListeners();
            Debug.log('SAVE', 'Quest data loaded successfully');
        } catch (error) {
            Debug.error('Failed to load quest data:', error);
            throw error;
        }
    }

    static loadWeatherData(data) {
        try {
            // Ensure we have a weather system
            if (!window.App.weatherSystem) {
                window.App.weatherSystem = new WeatherSystem();
            }

            const weather = window.App.weatherSystem;
            const weatherType = data?.currentWeather || 'clear';
            const intensity = data?.intensity || 0;

            // Use the new setWeather method
            weather.setWeather(weatherType, intensity);
            
            Debug.log('SAVE', `Weather data loaded successfully: ${weatherType} (${intensity})`);
        } catch (error) {
            Debug.error('Failed to load weather data:', error);
            // Set default weather without throwing
            if (window.App.weatherSystem) {
                window.App.weatherSystem.setWeather('clear', 0);
            }
        }
    }

    static getCurrentLocation() {
        const player = window.App.player;
        const x = Math.floor(player.x / 10);
        const y = Math.floor(player.y / 10);
        return `Region (${x},${y})`;
    }

    static getSaveSlotMetadata(slotNumber) {
        const metadata = localStorage.getItem(`gameState_slot_${slotNumber}_metadata`);
        return metadata ? JSON.parse(metadata) : null;
    }

    static getAllSaveSlots() {
        const slots = [];
        for (let i = 0; i < this.SAVE_SLOTS; i++) {
            const metadata = this.getSaveSlotMetadata(i);
            slots.push({
                slot: i,
                empty: !metadata,
                metadata
            });
        }
        return slots;
    }

    static deleteSave(slotNumber) {
        const saveKey = `gameState_slot_${slotNumber}`;
        localStorage.removeItem(saveKey);
        localStorage.removeItem(`${saveKey}_metadata`);
        Debug.log('SAVE', `Deleted save in slot ${slotNumber}`);
    }
}

export default SaveManager;