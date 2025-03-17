import Version from "./utils/version.js";
import WorldGrid from "./core/worldGrid.js";
import NPC from "./entities/npc.js";
import Player from "./entities/player.js";
import Enemy from "./entities/enemy.js";
import ChunkedPathFinder from "./core/chunkedPathFinder.js";
import Debug from './utils/debug.js';
import WeatherSystem from './core/weatherSystem.js';
import CellPool from './core/cellPool.js';
import MiniMap from './core/miniMap.js';
import DayNightCycle from './core/dayNightCycle.js';
import TooltipManager from './utils/tooltipManager.js';
import Portraits from './utils/portraits.js';
import QuestManager from './core/questManager.js';
import QuestLogUI from './ui/questLogUI.js';
import CombatManager from './core/combatManager.js';
import InventoryUI from './ui/inventoryUI.js';
import ItemDatabase from './items/itemDatabase.js';
import SaveLoadUI from './ui/saveLoadUI.js';
import SaveManager from './core/saveManager.js';

// Add this line before the App class to verify the import
console.log('Debug system imported:', Debug);

// Remove the dialogShown flag since we're not using it anymore

class App {
  static worldGrid;
  static player;
  static npc;
  static enemy;
  static enemy2;
  static enemy3;
  static gridElement;
  static lastPlayerX;
  static lastPlayerY;
  static weatherSystem;
  static cellPool;
  static miniMap;
  static gameState = {
    isMoving: false,
    isPaused: false,
    lastInteraction: null,
    currentStructure: null
  };
  static tooltipManager;
  static inventoryUI;

  static viewportBounds = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  };

  // Add buffer constant
  static VIEWPORT_BUFFER = 64; // Two cell sizes (32px * 2)

  static async init() {
    Debug.log('APP', 'Initializing application...');
    
    // Initialize the cell pool before using it
    this.cellPool = new CellPool();
    
    // Initialize tooltip manager AFTER grid is created
    Debug.log('APP', 'Creating TooltipManager...');
    this.tooltipManager = new TooltipManager();
    this.tooltipManager.init();
    
    // Initialize weather system
    this.weatherSystem = new WeatherSystem();

    // Initialize last position to null to force first render
    this.lastPlayerX = null;
    this.lastPlayerY = null;

    // Get reference to grid element and create container if needed
    this.gridElement = document.querySelector(".grid");
    if (!this.gridElement) {
        Debug.error("Could not find grid element");
        return;
    }

    // Ensure grid has a container
    if (!this.gridElement.parentElement.classList.contains('grid-container')) {
        const container = document.createElement('div');
        container.className = 'grid-container';
        this.gridElement.parentElement.insertBefore(container, this.gridElement);
        container.appendChild(this.gridElement);
    }

    // Initialize with chunk size 10 and render distance 1
    this.worldGrid = new WorldGrid(10, 1);
    this.worldGrid.initializeWorld();
    
    // Place entities in world coordinates
    this.player = new Player(0, 0, 100, "Hero");
    this.npc = new NPC(5, 5, 100);
    this.enemy = new Enemy(8, 8, 50);
    this.enemy2 = new Enemy(10, 10, 50);
    this.enemy3 = new Enemy(12, 12, 50);

    // Store entities in the world grid
    this.worldGrid.entities.player = this.player;
    this.worldGrid.entities.npcs.push(this.npc);
    this.worldGrid.entities.enemies.push(this.enemy);
    this.worldGrid.entities.enemies.push(this.enemy2);
    this.worldGrid.entities.enemies.push(this.enemy3);

    // Set up the grid size based on render distance and chunk size
    const totalSize = this.worldGrid.chunkSize * (2 * this.worldGrid.renderDistance + 1);
    this.gridElement.style.gridTemplateColumns = `repeat(${totalSize}, 32px)`;
    this.gridElement.style.gridTemplateRows = `repeat(${totalSize}, 32px)`;

    // Initialize minimap after world grid
    this.miniMap = new MiniMap(this.worldGrid);

    this.setupEventListeners();
    this.displayGrid();
    this.render();

    // Place structures with proper spacing for 4x4 size
    Debug.log('APP', 'Placing initial structures...');
    [
        [0, 0, 'TAVERN'],
        [5, 5, 'MARKET'],
        [10, 10, 'TEMPLE'],
        [15, 15, 'BLACKSMITH'],
        [20, 20, 'GARDEN']
    ].forEach(([x, y, structureType]) => {
        this.handlePlotCommand(x, y, 'structure', { structureType });
    });

    // Add resize listener to update viewport bounds
    window.addEventListener('resize', () => {
        this.updateViewportBounds();
    });

    // Initialize QuestManager
    QuestManager.initialize();
    
    // Initialize Quest Log UI
    this.questLogUI = new QuestLogUI();

    // Initialize health display
    this.initializeHealthDisplay();

    // Initialize CombatManager
    CombatManager.init();

    // Initialize ItemDatabase
    ItemDatabase.initialize();

    // Create player and give some starting items
    this.player = new Player(5, 5);
    this.player.addItem(ItemDatabase.getItem('health_potion_small'), 3);
    this.player.addItem(ItemDatabase.getItem('sword_iron'));
    this.player.addItem(ItemDatabase.getItem('armor_leather'));

    // Initialize inventory UI
    this.inventoryUI = new InventoryUI(this.player);

    // Initialize save/load UI
    this.saveLoadUI = new SaveLoadUI();

    // Add keyboard shortcut for quick save (F5)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F5') {
            e.preventDefault();
            SaveManager.saveGame(0); // Quick save to slot 0
        }
    });
  }

  static initializeHealthDisplay() {
    const healthDisplay = document.createElement('div');
    healthDisplay.id = 'player-health-display';
    healthDisplay.className = 'health-display';
    healthDisplay.innerHTML = `
        <div class="player-name">${this.player.name}</div>
        <div class="health-bar">
            <div class="health-bar-fill"></div>
            <div class="health-text">${this.player.hitPoints}/${this.player.maxHitPoints}</div>
        </div>
    `;
    document.body.appendChild(healthDisplay);
    this.player.updateHealthDisplay();
  }

  static setupEventListeners() {
    if (!this.gridElement) {
      console.error("Grid element not initialized");
      return;
    }

    console.log("Setting up event listeners");

    // Add keyboard event listeners for player movement
    document.addEventListener('keydown', (event) => {
      this.handleArrowKey(event);
    });

    // Add click event listeners for grid interaction
    this.gridElement.addEventListener('click', (event) => {
      Debug.log('GRID', "Grid clicked - from event listener");
      this.handleGridClick(event);
    });

    // Add dialog close button listener
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        const dialogBox = document.getElementById('dialogBox');
        dialogBox.style.display = 'none';
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
          modalOverlay.remove();
        }
      });
    }
  }

  static render() {
    const startTime = performance.now();

    // Update weather in the render loop
    if (this.weatherSystem) {
        this.weatherSystem.update();
    }

    // Only update if player position has changed
    if (this.lastPlayerX !== this.player.x || this.lastPlayerY !== this.player.y) {
        this.worldGrid.updateCurrentChunk(this.player.x, this.player.y);
        this.displayGrid();
        
        // Store last position
        this.lastPlayerX = this.player.x;
        this.lastPlayerY = this.player.y;
    }
    
    // Update minimap
    this.miniMap.update(this.player.x, this.player.y);
    
    const endTime = performance.now();
    if (endTime - startTime > 16.67) { // 60fps threshold
        Debug.log('APP', `Render took ${(endTime - startTime).toFixed(2)}ms - possible performance issue`);
    }
    
    requestAnimationFrame(() => this.render());
  }

  static displayGrid() {
    if (!this.gridElement || !this.worldGrid) return;

    // Release all currently displayed cells back to pool
    const existingCells = this.gridElement.children;
    Array.from(existingCells).forEach(cell => {
        this.cellPool.release(cell);
        cell.remove();
    });

    const chunkSize = this.worldGrid.chunkSize;
    const renderDistance = this.worldGrid.renderDistance;
    const totalSize = chunkSize * (2 * renderDistance + 1);
    const cellSize = 32;

    // Update viewport bounds
    this.updateViewportBounds();

    // Calculate the visible area
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate grid position to keep player centered
    const gridX = (viewportWidth/2);
    const gridY = (viewportHeight/2);

    let visibleCellCount = 0;
    let culledCellCount = 0;

    // Render cells using pool
    for (let y = -totalSize/2; y < totalSize/2; y++) {
        for (let x = -totalSize/2; x < totalSize/2; x++) {
            const worldX = Math.floor(this.player.x + x);
            const worldY = Math.floor(this.player.y + y);

            // Skip cells that aren't visible
            if (!this.isCellVisible(worldX, worldY, cellSize)) {
                culledCellCount++;
                continue;
            }

            visibleCellCount++;
            
            const cell = this.cellPool.acquire();
            cell.dataset.x = worldX;
            cell.dataset.y = worldY;

            // Add entities first
            if (this.player && this.player.x === worldX && this.player.y === worldY) {
                cell.className = 'cell player';
            } else if (this.npc && this.npc.x === worldX && this.npc.y === worldY) {
                cell.className = 'cell npc';
            } else {
                // Check if there's an enemy at this position
                const enemyAtPosition = this.worldGrid.entities.enemies.find(
                    enemy => enemy.x === worldX && enemy.y === worldY
                );
                
                if (enemyAtPosition) {
                    cell.className = 'cell enemy';
                } else {
                    const cellValue = this.worldGrid.getCellDisplay(worldX, worldY);
                    cell.className = `cell ${cellValue}`;
                    
                    if (cellValue === 'loading') {
                        cell.classList.add('loading');
                    }
                }
            }

            if (worldX % chunkSize === 0 || worldY % chunkSize === 0) {
                cell.classList.add('chunk-border');
            }

            this.gridElement.appendChild(cell);
        }
    }

    // Log performance metrics
    Debug.log('RENDER', `Rendered ${visibleCellCount} cells, culled ${culledCellCount} cells`);

    this.gridElement.style.gridTemplateColumns = `repeat(${totalSize}, ${cellSize}px)`;
    this.gridElement.style.gridTemplateRows = `repeat(${totalSize}, ${cellSize}px)`;
    
    this.gridElement.style.transform = `
        translate(${gridX}px, ${gridY}px)
        translate(-50%, -50%)
        rotateX(60deg)
        rotateZ(45deg)
        scale(1.42)
    `;

    // Refresh tooltip listeners after grid update
    Debug.log('APP', 'Refreshing tooltip listeners...');
    if (this.tooltipManager) {
        this.tooltipManager.refresh();
    }
  }

  static isCellVisible(worldX, worldY, cellSize) {
    // Convert isometric coordinates to screen space
    // Using isometric transformation matrix
    const isoX = (worldX - worldY) * cellSize * Math.sqrt(2) / 2;
    const isoY = (worldX + worldY) * cellSize * Math.sqrt(2) / 4;

    // Add offset for grid center position
    const screenX = isoX + window.innerWidth / 2;
    const screenY = isoY + window.innerHeight / 2;

    // Add a buffer zone of one cell size to prevent pop-in
    const buffer = cellSize * 2;

    return screenX + buffer >= this.viewportBounds.left &&
           screenX - buffer <= this.viewportBounds.right &&
           screenY + buffer >= this.viewportBounds.top &&
           screenY - buffer <= this.viewportBounds.bottom;
  }

  static updateViewportBounds() {
    this.viewportBounds = {
        left: -this.VIEWPORT_BUFFER,
        right: window.innerWidth + this.VIEWPORT_BUFFER,
        top: -this.VIEWPORT_BUFFER,
        bottom: window.innerHeight + this.VIEWPORT_BUFFER
    };
  }

  // Add this new helper method
  static getCellTerrainClass(cellValue) {
    return (() => {
        switch(cellValue) {
            case 0: return "ground";
            case 1: return "grass";
            case 2: return "water";
            case 3: return "sand";
            case 4: return "forest";
            case 5: return "mountain";
            case 6: return "snow";
            case 7: return "house";
            case 8: return "shop";
            case 9: return "tower";
            case 10: return "tavern";
            case 11: return "market";
            case 12: return "temple";
            case 13: return "blacksmith";
            case 14: return "garden";
            default: return "ground";
        }
    })();
  }

  static handleArrowKey(event) {
    try {
        let dx = 0;
        let dy = 0;

        switch (event.key) {
            case 'ArrowUp': case 'w': case 'W': dy = -1; break;
            case 'ArrowDown': case 's': case 'S': dy = 1; break;
            case 'ArrowLeft': case 'a': case 'A': dx = -1; break;
            case 'ArrowRight': case 'd': case 'D': dx = 1; break;
            default: return;
        }

        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        // Add boundary checks
        if (Math.abs(newX) > 1000 || Math.abs(newY) > 1000) {
            Debug.error(`Movement outside allowed bounds: (${newX}, ${newY})`);
            return;
        }

        // Debug movement attempt
        Debug.log('APP', `Movement attempt from (${this.player.x}, ${this.player.y}) to (${newX}, ${newY})`);

        if (!this.worldGrid.isValidPosition(newX, newY)) {
            Debug.log('APP', 'Invalid position, movement blocked');
            return;
        }

        // Get cell types
        const currentCell = this.worldGrid.getCellDisplay(this.player.x, this.player.y);
        const targetCell = this.worldGrid.getCellDisplay(newX, newY);

        Debug.log('APP', `Moving from cell type '${currentCell}' to '${targetCell}'`);

        // Structure detection
        const wasInStructure = currentCell.startsWith('structure-');
        const willBeInStructure = targetCell.startsWith('structure-');

        if (!this.worldGrid.isSolid(newX, newY) && 
            !(this.enemy && this.enemy.x === newX && this.enemy.y === newY)) {
            
            // Handle structure transitions
            if (wasInStructure && !willBeInStructure) {
                const structureType = currentCell.split('structure-')[1].toUpperCase();
                Debug.log('APP', `Player exited ${structureType}`);
            } else if (!wasInStructure && willBeInStructure) {
                const structureType = targetCell.split('structure-')[1].toUpperCase();
                Debug.log('APP', `Player entered ${structureType}`);
            }

            // Update player position
            this.worldGrid.updateCurrentChunk(newX, newY);
            this.player.x = newX;
            this.player.y = newY;
            this.displayGrid();
        }
    } catch (error) {
        Debug.error(`Movement error: ${error.message}`);
    }
  }

  static handleGridClick(event) {
    // Add timeout check
    if (this.gameState.isMoving && Date.now() - this.gameState.lastMoveTime > 2000) {
        Debug.log('APP', 'Movement appears stuck - resetting state');
        this.resetMovementState();
    }

    if (this.gameState.isPaused || this.gameState.isMoving) {
        return;
    }

    this.gameState.lastMoveTime = Date.now();

    const cell = event.target.closest('.cell');
    if (!cell) return;

    const targetX = parseInt(cell.dataset.x);
    const targetY = parseInt(cell.dataset.y);
    
    Debug.log('APP', `Grid clicked at (${targetX}, ${targetY})`);
    
    // Check for NPC click
    if (this.npc && this.npc.x === targetX && this.npc.y === targetY) {
        Debug.log('APP', "NPC clicked");
        if (this.isAdjacentToNPC()) {
            // If adjacent, interact immediately
            this.interactWithNPC();
        } else {
            // If not adjacent, find path to get adjacent to NPC
            Debug.log('APP', 'Finding path to NPC for interaction');
            
            // Find adjacent positions to the NPC
            const adjacentPositions = [
                {x: this.npc.x - 1, y: this.npc.y},
                {x: this.npc.x + 1, y: this.npc.y},
                {x: this.npc.x, y: this.npc.y - 1},
                {x: this.npc.x, y: this.npc.y + 1}
            ].filter(pos => 
                this.worldGrid.isValidPosition(pos.x, pos.y) && 
                !this.worldGrid.isSolid(pos.x, pos.y)
            );

            // Find the closest valid adjacent position
            let shortestPath = null;
            let bestPosition = null;

            for (const pos of adjacentPositions) {
                const path = ChunkedPathFinder.findPath(
                    this.worldGrid,
                    this.player,
                    this.player.x,
                    this.player.y,
                    pos.x,
                    pos.y
                );

                if (path && (!shortestPath || path.length < shortestPath.length)) {
                    shortestPath = path;
                    bestPosition = pos;
                }
            }

            if (shortestPath) {
                Debug.log('APP', `Moving to position (${bestPosition.x}, ${bestPosition.y}) to interact with NPC`);
                this.movePlayerAlongPath(shortestPath, () => {
                    // After movement completes, check if we're adjacent and interact
                    if (this.isAdjacentToNPC()) {
                        this.interactWithNPC();
                    }
                });
            } else {
                Debug.log('APP', 'No valid path to NPC found');
            }
        }
        return;
    }
    
    // Check for enemy click
    const enemy = this.worldGrid.entities.enemies.find(e => e.x === targetX && e.y === targetY);
    if (enemy) {
        if (enemy.isAdjacent(this.player.x, this.player.y)) {
            // If adjacent, start combat immediately
            CombatManager.startCombat(this.player, enemy, this.worldGrid);
        } else {
            // If not adjacent, find path to get adjacent to enemy
            Debug.log('APP', 'Finding path to enemy for combat');
            
            // Find adjacent positions to the enemy
            const adjacentPositions = [
                {x: enemy.x - 1, y: enemy.y},
                {x: enemy.x + 1, y: enemy.y},
                {x: enemy.x, y: enemy.y - 1},
                {x: enemy.x, y: enemy.y + 1}
            ].filter(pos => 
                this.worldGrid.isValidPosition(pos.x, pos.y) && 
                !this.worldGrid.isSolid(pos.x, pos.y)
            );

            // Find the closest valid adjacent position
            let shortestPath = null;
            let bestPosition = null;

            for (const pos of adjacentPositions) {
                const path = ChunkedPathFinder.findPath(
                    this.worldGrid,
                    this.player,
                    this.player.x,
                    this.player.y,
                    pos.x,
                    pos.y
                );

                if (path && (!shortestPath || path.length < shortestPath.length)) {
                    shortestPath = path;
                    bestPosition = pos;
                }
            }

            if (shortestPath) {
                Debug.log('APP', `Moving to position (${bestPosition.x}, ${bestPosition.y}) to engage enemy`);
                this.movePlayerAlongPath(shortestPath, () => {
                    // After movement completes, check if we're adjacent and start combat
                    if (enemy.isAdjacent(this.player.x, this.player.y)) {
                        CombatManager.startCombat(this.player, enemy, this.worldGrid);
                    }
                });
            } else {
                Debug.log('APP', 'No valid path to enemy found');
            }
        }
        return;
    }

    if (this.worldGrid.isValidPosition(targetX, targetY)) {
        if (this.worldGrid.isSolid(targetX, targetY)) {
            Debug.log('APP', `Movement blocked - solid terrain at (${targetX}, ${targetY})`);
            cell.classList.add('path-blocked');
            setTimeout(() => cell.classList.remove('path-blocked'), 1000);
            return;
        }

        const path = ChunkedPathFinder.findPath(
            this.worldGrid,
            this.player,
            this.player.x,
            this.player.y,
            targetX,
            targetY
        );

        if (path && path.length > 0) {
            Debug.log('APP', `Path found with ${path.length} steps`);
            // Check if path leads to NPC
            const lastStep = path[path.length - 1];
            if (this.npc && this.npc.x === lastStep.x && this.npc.y === lastStep.y) {
                Debug.log('APP', "Path leads to NPC");
                this.interactWithNPC();
                return;
            }

            this.movePlayerAlongPath(path);
        } else {
            Debug.log('APP', 'No valid path found');
        }
    }
  }

  static movePlayerAlongPath(path, callback = null) {
    if (this.gameState.isMoving) {
        Debug.log('APP', 'Movement already in progress - resetting state');
        this.resetMovementState();
        return;
    }
    
    this.gameState.isMoving = true;
    if (!path || path.length < 2) {
        this.resetMovementState();
        if (callback) callback();
        return;
    }

    let currentIndex = 1;
    const moveInterval = 200;
    
    this.gameState.moveTimeout = setTimeout(() => {
        Debug.log('APP', 'Movement timeout - resetting state');
        this.resetMovementState();
        if (callback) callback();
    }, moveInterval * (path.length + 1));

    const moveStep = () => {
        if (currentIndex >= path.length) {
            this.resetMovementState();
            if (callback) callback();
            return;
        }

        const currentPos = path[currentIndex - 1];
        const nextPosition = path[currentIndex];
        
        // Debug movement along path
        Debug.log('APP', `Path movement from (${currentPos.x}, ${currentPos.y}) to (${nextPosition.x}, ${nextPosition.y})`);

        // Get cell types for logging
        const currentCell = this.worldGrid.getCellDisplay(currentPos.x, currentPos.y);
        const targetCell = this.worldGrid.getCellDisplay(nextPosition.x, nextPosition.y);
        Debug.log('APP', `Moving from cell type '${currentCell}' to '${targetCell}'`);

        // Structure detection
        const wasInStructure = currentCell.startsWith('structure-');
        const willBeInStructure = targetCell.startsWith('structure-');

        if (wasInStructure && !willBeInStructure) {
            const structureType = currentCell.split('structure-')[1].toUpperCase();
            Debug.log('APP', `Player exited ${structureType}`);
        } else if (!wasInStructure && willBeInStructure) {
            const structureType = targetCell.split('structure-')[1].toUpperCase();
            Debug.log('APP', `Player entered ${structureType}`);
        }

        // Add visual feedback for movement
        const oldCell = document.querySelector(
            `.cell[data-x="${currentPos.x}"][data-y="${currentPos.y}"]`
        );
        if (oldCell) {
            oldCell.classList.add('player-moved-from');
            setTimeout(() => oldCell.classList.remove('player-moved-from'), 200);
        }

        // Update player position
        this.player.x = nextPosition.x;
        this.player.y = nextPosition.y;

        const newCell = document.querySelector(
            `.cell[data-x="${nextPosition.x}"][data-y="${nextPosition.y}"]`
        );
        if (newCell) {
            newCell.classList.add('player-move');
            setTimeout(() => newCell.classList.remove('player-move'), 200);
        }

        currentIndex++;
        setTimeout(moveStep, moveInterval);
    };

    moveStep();
  }

  static resetMovementState() {
    this.gameState.isMoving = false;
    if (this.gameState.moveTimeout) {
        clearTimeout(this.gameState.moveTimeout);
        this.gameState.moveTimeout = null;
    }
    ChunkedPathFinder.clearPathVisualization();
  }

  static interactWithNPC() {
    console.log("Interacting with the NPC");
    const dialogBox = document.getElementById("dialogBox");
    const dialogContent = document.getElementById("dialogContent");
    
    // Create and add modal overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";
    document.body.appendChild(modalOverlay);
    
    // Show dialog box using the new class
    dialogBox.classList.add('show');
    
    // Clear previous content
    dialogContent.innerHTML = '';
    
    // Initialize conversation history
    const conversationHistory = [];
    
    // Dialog tree structure
    const dialogTree = {
        start: {
            speaker: 'ELDER',
            mood: 'default',
            text: "Hello traveler! Welcome to our world.",
            options: [
                { text: "Tell me about this place", next: "about_place" },
                { text: "Do you need any help?", next: "available_quests" },
                { text: "Goodbye", next: "end" }
            ]
        },
        available_quests: {
            speaker: 'ELDER',
            mood: 'worried',
            text: "Actually, yes. We have some pressing matters that need attention.",
            options: [
                { 
                    text: "I can help gather herbs",
                    next: "quest_herbs",
                    condition: () => QuestManager.getQuestStatus('gather_herbs') === 'AVAILABLE'
                },
                { 
                    text: "I'll help clear the path",
                    next: "quest_enemies",
                    condition: () => QuestManager.getQuestStatus('clear_enemies') === 'AVAILABLE'
                },
                { text: "Show my active quests", next: "show_quests" },
                { text: "Maybe later", next: "start" }
            ]
        },
        quest_herbs: {
            speaker: 'ELDER',
            mood: 'happy',
            text: "We need medicinal herbs from the garden. Could you collect 5 of them?",
            options: [
                { 
                    text: "I'll help with that",
                    next: "accept_quest_herbs",
                    action: () => {
                        QuestManager.startQuest('gather_herbs');
                        return true;
                    }
                },
                { text: "Not right now", next: "available_quests" }
            ]
        },
        show_quests: {
            speaker: 'ELDER',
            mood: 'default',
            text: () => {
                const activeQuests = QuestManager.getActiveQuests();
                if (activeQuests.length === 0) {
                    return "You don't have any active quests at the moment. Would you like to take on a new quest?";
                }
                
                const questList = activeQuests.map(quest => {
                    const objectives = quest.objectives
                        .map(obj => `   • ${obj.description} (${obj.current}/${obj.required})`)
                        .join('\n');
                        
                    return `${quest.title}:\n${objectives}`;
                }).join('\n\n');
                
                return `Here are your current quests:\n\n${questList}`;
            },
            options: [
                { text: "Tell me about available quests", next: "available_quests" },
                { text: "Back to main topics", next: "start" }
            ]
        },
        about_place: {
            speaker: 'ELDER',
            mood: 'happy',
            text: "This is our humble village, a peaceful place where travelers can rest and trade.",
            options: [
                { text: "Tell me more about trading", next: "trading" },
                { text: "Are there any dangers?", next: "dangers" },
                { text: "Back to main topics", next: "start" }
            ]
        },
        dangers: {
            speaker: 'ELDER',
            mood: 'worried',
            text: "Beware of the hostile enemies that roam these lands. They're marked in red on your map.",
            options: [
                { text: "How do I defend myself?", next: "combat" },
                { text: "Where are safe areas?", next: "safe_zones" },
                { text: "Back to main topics", next: "start" }
            ]
        },
        activities: {
            text: "You can trade at the market, rest at the tavern, or seek wisdom at the temple.",
            options: [
                { text: "Tell me about trading", next: "trading" },
                { text: "Back to main topics", next: "start" },
                { text: "Goodbye", next: "end" }
            ]
        },
        offer_help: {
            text: "What kind of help do you need?",
            options: [
                { text: "I'm lost", next: "directions" },
                { text: "I need supplies", next: "supplies" },
                { text: "Never mind", next: "start" }
            ]
        },
        end: {
            text: "Safe travels, adventurer!",
            options: []  // No options means end of conversation
        }
    };

    let currentNode = 'start';

    const displayDialog = (nodeId, selectedOption = null) => {
        const node = dialogTree[nodeId];
        if (!node) return;

        // Evaluate text if it's a function
        const dialogText = typeof node.text === 'function' ? node.text() : node.text;

        // Add to conversation history
        const historyEntry = {
            nodeId,
            text: dialogText, // Store the evaluated text instead of the function
            selectedOption: selectedOption,
            timestamp: new Date().toISOString(),
            speaker: node.speaker || 'ELDER',
            mood: node.mood || 'default'
        };
        conversationHistory.push(historyEntry);

        // Clear existing content
        dialogContent.innerHTML = '';

        // Show recent history
        const recentHistory = conversationHistory.slice(-4, -1);
        recentHistory.forEach(entry => {
            const historyContainer = document.createElement('div');
            historyContainer.className = 'dialog-container dialog-history-entry';

            if (entry.selectedOption) {
                // Player's choice - text only
                historyContainer.innerHTML = `
                    <div class="dialog-content">
                        <div class="dialog-text-container player">
                            <div class="dialog-text">${entry.selectedOption}</div>
                        </div>
                    </div>
                `;
            }

            // NPC's response - text only
            historyContainer.innerHTML += `
                <div class="dialog-content">
                    <div class="dialog-text-container">
                        <div class="dialog-text">${entry.text}</div>
                    </div>
                </div>
            `;

            dialogContent.appendChild(historyContainer);
        });

        // Current dialog
        const currentContainer = document.createElement('div');
        currentContainer.className = 'dialog-container current';
        currentContainer.innerHTML = `
            <div class="portrait-container speaking">
                <img src="${Portraits.getPortrait(node.speaker || 'ELDER', node.mood || 'default')}" 
                     alt="${Portraits.getName(node.speaker || 'ELDER')}">
                <div class="portrait-name">${Portraits.getName(node.speaker || 'ELDER')}</div>
            </div>
            <div class="dialog-content">
                <div class="dialog-text-container">
                    <div class="dialog-text current"></div>
                </div>
            </div>
        `;
        dialogContent.appendChild(currentContainer);

        // Type out the text
        const textElement = currentContainer.querySelector('.dialog-text.current');
        let charIndex = 0;
        const typeText = () => {
            if (charIndex < node.text.length) {
                const char = node.text.charAt(charIndex);
                textElement.innerHTML += char === ' ' ? '&nbsp;' : char;
                charIndex++;
                setTimeout(typeText, 50);
            } else {
                // After text is typed, show options
                if (node.options && node.options.length > 0) {
                    const optionsContainer = document.createElement('div');
                    optionsContainer.className = 'dialog-options';
                    
                    node.options.forEach(option => {
                        const button = document.createElement('button');
                        button.className = 'dialog-option';
                        button.textContent = option.text;
                        button.addEventListener('click', () => {
                            if (option.next === 'end') {
                                saveConversationHistory();
                                closeDialog();
                            } else {
                                displayDialog(option.next, option.text);
                            }
                        });
                        optionsContainer.appendChild(button);
                    });
                    
                    dialogContent.appendChild(optionsContainer);
                }
            }
        };

        typeText();
        dialogContent.scrollTop = dialogContent.scrollHeight;
    };

    const saveConversationHistory = () => {
        // Save to localStorage
        const savedHistory = JSON.parse(localStorage.getItem('dialogHistory') || '[]');
        savedHistory.push({
            date: new Date().toISOString(),
            conversation: conversationHistory
        });
        
        // Keep only last 10 conversations
        while (savedHistory.length > 10) {
            savedHistory.shift();
        }
        
        localStorage.setItem('dialogHistory', JSON.stringify(savedHistory));
        Debug.log('APP', 'Dialog history saved to localStorage');
    };

    const closeDialog = () => {
        // Save conversation history before closing
        saveConversationHistory();
        
        dialogBox.classList.remove('show');  // Use class removal instead
        modalOverlay.remove();
        dialogContent.innerHTML = '';
    };

    // Set up close button
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
        closeButton.replaceWith(closeButton.cloneNode(true));
        document.getElementById('closeButton').addEventListener('click', closeDialog);
    }

    // Add escape key listener
    const escapeHandler = (event) => {
        if (event.key === 'Escape') {
            closeDialog();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Start the dialog
    displayDialog('start');
  }

  // Add method to handle plot commands
  static handlePlotCommand(x, y, type, data) {
    if (type === 'structure') {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            // Make sure structure type is lowercase for CSS class
            const structureType = data.structureType.toLowerCase();
            cell.className = `cell structure-${structureType}`;
            Debug.log('APP', `Set structure class: structure-${structureType}`);
        }
    }
    Debug.log('APP', `Handling plot command at (${x}, ${y}): ${type}`, data);
    this.worldGrid.plotItem(x, y, type, data);
    
    // Force an immediate re-render
    requestAnimationFrame(() => {
        this.displayGrid();
        Debug.log('APP', 'Grid display updated after plotting');
    });
  }

  // Add cleanup method
  static cleanup() {
    if (this.cellPool) {
      this.cellPool.clear();
    }
  }

  // Add helper method to check if player is adjacent to NPC
  static isAdjacentToNPC() {
    if (!this.npc || !this.player) return false;
    const dx = Math.abs(this.npc.x - this.player.x);
    const dy = Math.abs(this.npc.y - this.player.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }

  // Add method to show save/load menu
  static showSaveLoadMenu(mode = 'save') {
    this.saveLoadUI.show(mode);
  }

  static showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after animation
    notification.addEventListener('animationend', () => {
        notification.remove();
    });
  }
}

// Initialize the app when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Make App available globally
window.App = App;
window.App.Enemy = Enemy;
window.App.NPC = NPC;

export default App;
