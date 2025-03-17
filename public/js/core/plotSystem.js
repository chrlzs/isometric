import Debug from '../utils/debug.js';
import Chunk from './chunk.js';

class PlotSystem {
    constructor(worldGrid) {
        this.worldGrid = worldGrid;
        this.plots = new Map(); // Store plots using coordinates as keys
    }

    // Add a plot at specific world coordinates
    addPlot(x, y, type, data) {
        Debug.log('PLOT', `Adding plot at (${x}, ${y}): ${type}`, data);
        const key = `${x},${y}`;
        this.plots.set(key, { type, data });
    }

    // Apply a specific plot
    applyPlot(x, y) {
        const key = `${x},${y}`;
        const plot = this.plots.get(key);
        if (!plot) {
            Debug.log('PLOT', `No plot found at (${x}, ${y})`);
            return;
        }

        const chunkX = Math.floor(x / this.worldGrid.chunkSize);
        const chunkY = Math.floor(y / this.worldGrid.chunkSize);
        const chunk = this.worldGrid.getChunk(chunkX, chunkY);
        
        if (!chunk) {
            Debug.log('PLOT', `Chunk not loaded for plot at (${x}, ${y})`);
            return;
        }

        const localX = x - (chunkX * this.worldGrid.chunkSize);
        const localY = y - (chunkY * this.worldGrid.chunkSize);

        switch (plot.type) {
            case 'structure':
                this.applyStructure(chunk, localX, localY, plot.data);
                break;
            case 'biome':
                this.applyBiome(chunk, localX, localY, plot.data);
                break;
            case 'terrain':
                this.applyTerrain(chunk, localX, localY, plot.data);
                break;
            default:
                Debug.log('PLOT', `Unknown plot type: ${plot.type}`);
        }
    }

    applyStructure(chunk, x, y, structureData) {
        Debug.log('PLOT', `Placing structure: ${structureData.structureType} at (${x}, ${y})`);
        const success = chunk.placeStructure(x, y, structureData.structureType);
        
        if (success) {
            // Add placement animation
            requestAnimationFrame(() => {
                const cell = document.querySelector(
                    `.cell[data-x="${x + chunk.chunkX * chunk.size}"][data-y="${y + chunk.chunkY * chunk.size}"]`
                );
                if (cell) {
                    cell.classList.add('structure-placing');
                    // Remove the animation class after it completes
                    setTimeout(() => {
                        cell.classList.remove('structure-placing');
                    }, 500);
                }
            });
        } else {
            Debug.log('PLOT', 'Failed to place structure');
        }
        
        return success;
    }

    applyBiome(chunk, x, y, biomeData) {
        const { biomeType, radius = 1 } = biomeData;
        Debug.log('PLOT', `Applying biome: ${biomeType} at (${x}, ${y}) with radius ${radius}`);
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const targetX = x + dx;
                const targetY = y + dy;
                
                if (targetX >= 0 && targetX < chunk.size && 
                    targetY >= 0 && targetY < chunk.size) {
                    chunk.cells[targetY][targetX] = biomeType;
                }
            }
        }
    }

    applyTerrain(chunk, x, y, terrainData) {
        Debug.log('PLOT', `Applying terrain: ${terrainData.terrainType} at (${x}, ${y})`);
        if (x >= 0 && x < chunk.size && y >= 0 && y < chunk.size) {
            chunk.cells[y][x] = terrainData.terrainType;
        }
    }

    // Apply all plots for a newly loaded chunk
    applyPlotsToChunk(chunkX, chunkY) {
        Debug.log('PLOT', `Applying plots to chunk (${chunkX}, ${chunkY})`);
        const chunkStartX = chunkX * this.worldGrid.chunkSize;
        const chunkStartY = chunkY * this.worldGrid.chunkSize;
        const chunkEndX = chunkStartX + this.worldGrid.chunkSize;
        const chunkEndY = chunkStartY + this.worldGrid.chunkSize;
        
        // Apply all plots that fall within this chunk
        this.plots.forEach((plot, key) => {
            const [x, y] = key.split(',').map(Number);
            if (x >= chunkStartX && x < chunkEndX && 
                y >= chunkStartY && y < chunkEndY) {
                this.applyPlot(x, y);
            }
        });
    }
}

export default PlotSystem;