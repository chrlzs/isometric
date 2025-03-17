import Debug from '../utils/debug.js';

class MiniMap {
    constructor(worldGrid, size = 150) {
        this.worldGrid = worldGrid;
        this.size = size;
        this.scale = 2; // Each cell will be 2x2 pixels
        this.exploredChunks = new Set();
        this.element = this.createMiniMapElement();
        this.canvas = this.createCanvas();
        this.context = this.canvas.getContext('2d');
        
        // Colors for different elements
        this.colors = {
            unexplored: '#1a1a1a',
            ground: '#3c6e3c',
            water: '#4287f5',
            mountain: '#6b6b6b',
            structure: '#8b4513',
            player: '#ff0000',
            npc: '#ffff00',
            enemy: '#ff00ff',
            currentChunk: 'rgba(255, 255, 255, 0.1)'
        };
    }

    createMiniMapElement() {
        const container = document.createElement('div');
        container.className = 'mini-map';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: ${this.size}px;
            height: ${this.size}px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #333;
            border-radius: 5px;
            z-index: 1000;
        `;
        document.body.appendChild(container);
        return container;
    }

    createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = this.size;
        canvas.height = this.size;
        this.element.appendChild(canvas);
        return canvas;
    }

    update(playerX, playerY) {
        const currentChunkX = Math.floor(playerX / this.worldGrid.chunkSize);
        const currentChunkY = Math.floor(playerY / this.worldGrid.chunkSize);
        
        // Add current chunk to explored chunks
        this.exploredChunks.add(`${currentChunkX},${currentChunkY}`);
        
        this.render(playerX, playerY);
    }

    render(playerX, playerY) {
        // Safety check
        if (typeof playerX === 'undefined' || typeof playerY === 'undefined') {
            return; // Skip rendering if coordinates are not valid
        }

        this.context.clearRect(0, 0, this.size, this.size);

        // Calculate the visible area
        const centerX = this.size / 2;
        const centerY = this.size / 2;
        
        // Draw explored chunks
        this.exploredChunks.forEach(chunkKey => {
            const [chunkX, chunkY] = chunkKey.split(',').map(Number);
            const chunk = this.worldGrid.getChunk(chunkX, chunkY);
            if (chunk) {
                this.renderChunk(chunk, playerX, playerY, centerX, centerY);
            }
        });

        // Draw entities only if player position is valid
        if (this.worldGrid.entities?.player) {
            this.renderEntity(playerX, playerY, centerX, centerY, this.colors.player);
            
            if (Array.isArray(this.worldGrid.entities.npcs)) {
                this.worldGrid.entities.npcs.forEach(npc => {
                    if (npc && typeof npc.x !== 'undefined' && typeof npc.y !== 'undefined') {
                        this.renderEntity(npc.x, npc.y, centerX, centerY, this.colors.npc);
                    }
                });
            }

            if (Array.isArray(this.worldGrid.entities.enemies)) {
                this.worldGrid.entities.enemies.forEach(enemy => {
                    if (enemy && typeof enemy.x !== 'undefined' && typeof enemy.y !== 'undefined') {
                        this.renderEntity(enemy.x, enemy.y, centerX, centerY, this.colors.enemy);
                    }
                });
            }
        }

        Debug.log('MINIMAP', 'Rendered minimap update');
    }

    renderChunk(chunk, playerX, playerY, centerX, centerY) {
        const chunkWorldX = chunk.chunkX * this.worldGrid.chunkSize;
        const chunkWorldY = chunk.chunkY * this.worldGrid.chunkSize;

        for (let y = 0; y < chunk.size; y++) {
            for (let x = 0; x < chunk.size; x++) {
                const worldX = chunkWorldX + x;
                const worldY = chunkWorldY + y;
                
                // Calculate position relative to player
                const relX = worldX - playerX;
                const relY = worldY - playerY;
                
                // Convert to minimap coordinates
                const mapX = centerX + (relX * this.scale);
                const mapY = centerY + (relY * this.scale);

                // Only draw if within minimap bounds
                if (mapX >= 0 && mapX < this.size && mapY >= 0 && mapY < this.size) {
                    const cellType = chunk.cells[y][x];
                    this.context.fillStyle = this.getCellColor(cellType);
                    this.context.fillRect(mapX, mapY, this.scale, this.scale);
                }
            }
        }
    }

    renderEntity(x, y, centerX, centerY, color) {
        // Safety check for player entity
        if (!this.worldGrid.entities?.player?.x || !this.worldGrid.entities?.player?.y) {
            return; // Skip rendering if player position is not available
        }

        const mapX = centerX + ((x - this.worldGrid.entities.player.x) * this.scale);
        const mapY = centerY + ((y - this.worldGrid.entities.player.y) * this.scale);

        if (mapX >= 0 && mapX < this.size && mapY >= 0 && mapY < this.size) {
            this.context.fillStyle = color;
            this.context.beginPath();
            this.context.arc(mapX, mapY, 3, 0, Math.PI * 2);
            this.context.fill();
        }
    }

    getCellColor(cellType) {
        if (cellType.includes('water')) return this.colors.water;
        if (cellType.includes('mountain')) return this.colors.mountain;
        if (cellType.includes('structure')) return this.colors.structure;
        return this.colors.ground;
    }
}

export default MiniMap;