// worldGrid.js
import Chunk from './chunk.js';
import Debug from '../utils/debug.js';
import PlotSystem from './plotSystem.js';

class WorldGrid {
  constructor(chunkSize = 16, renderDistance = 2) {
    this.chunkSize = chunkSize;
    this.renderDistance = renderDistance;
    this.chunks = new Map();
    this.currentChunkX = 0;
    this.currentChunkY = 0;
    this.loadingChunks = new Set();
    this.chunkLoadQueue = [];
    this.isProcessingQueue = false;
    this.preloadDistance = renderDistance + 1; // Preload one extra layer of chunks
    this.plotSystem = new PlotSystem(this);
    this.entities = {
      player: null,
      npcs: [],
      enemies: []
    };
  }

  initializeWorld() {
    // Initialize the starting chunk and its neighbors
    for (let dy = -this.renderDistance; dy <= this.renderDistance; dy++) {
      for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
        this.getChunk(this.currentChunkX + dx, this.currentChunkY + dy);
      }
    }
  }

  isValidPosition(x, y) {
    // Check if the position is within the world bounds
    if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
      return false;
    }

    // Calculate which chunk this position would be in
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    
    // Get the chunk
    const chunk = this.getChunkForCoordinate(x, y);
    if (!chunk) {
      Debug.log('WORLD', `Chunk not loaded at (${chunkX}, ${chunkY})`);
      return false;
    }

    // Calculate local coordinates within the chunk
    const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;

    // Check if the position is valid within the chunk
    return chunk.isValidPosition(localX, localY);
  }

  isSolid(x, y) {
    const cellType = this.getCellDisplay(x, y);
    return cellType === 'water'; // Water tiles are solid/impassable
  }

  getCellValue(x, y) {
    // Get the chunk coordinates
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    
    // Get the local coordinates within the chunk
    const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;

    // Get the chunk
    const chunk = this.getChunk(chunkX, chunkY);
    if (!chunk) return null;

    return chunk.cells[localY][localX];
  }

  getChunk(chunkX, chunkY) {
    const key = `${chunkX},${chunkY}`;
    if (!this.chunks.has(key)) {
      const chunk = new Chunk(this.chunkSize);
      // Pass the chunk coordinates to generate method
      chunk.generate(chunkX, chunkY);
      this.chunks.set(key, chunk);
    }
    return this.chunks.get(key);
  }

  plotItem(x, y, type, data) {
    Debug.log('WORLD', `Plotting item at (${x}, ${y}): ${type}`, data);
    this.plotSystem.addPlot(x, y, type, data);
    
    // Ensure the chunk is loaded and updated
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const chunk = this.getChunk(chunkX, chunkY);
    
    if (chunk) {
        this.plotSystem.applyPlot(x, y);
        Debug.log('WORLD', 'Plot applied successfully');
    } else {
        Debug.log('WORLD', 'Failed to get chunk for plotting');
    }
  }

  isInView(x, y) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    
    return Math.abs(chunkX - this.currentChunkX) <= this.renderDistance &&
           Math.abs(chunkY - this.currentChunkY) <= this.renderDistance;
  }

  updateCurrentChunk(playerX, playerY) {
    const newChunkX = Math.floor(playerX / this.chunkSize);
    const newChunkY = Math.floor(playerY / this.chunkSize);

    // Early return if we haven't moved chunks
    if (newChunkX === this.currentChunkX && newChunkY === this.currentChunkY) {
      return;
    }

    this.currentChunkX = newChunkX;
    this.currentChunkY = newChunkY;

    const chunksToKeep = new Set();
    const chunksToLoad = [];

    // Expand the loading area to include preload distance
    for (let dy = -this.preloadDistance; dy <= this.preloadDistance; dy++) {
      for (let dx = -this.preloadDistance; dx <= this.preloadDistance; dx++) {
        const chunkX = this.currentChunkX + dx;
        const chunkY = this.currentChunkY + dy;
        const key = `${chunkX},${chunkY}`;
        
        chunksToKeep.add(key);
        
        // Prioritize chunks within render distance
        const priority = Math.abs(dx) <= this.renderDistance && 
                       Math.abs(dy) <= this.renderDistance ? 1 : 2;
        
        if (!this.chunks.has(key) && !this.loadingChunks.has(key)) {
          chunksToLoad.push({ x: chunkX, y: chunkY, key, priority });
        }
      }
    }

    // Sort chunks by priority and distance from player
    chunksToLoad.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      const distA = Math.abs(a.x - this.currentChunkX) + Math.abs(a.y - this.currentChunkY);
      const distB = Math.abs(b.x - this.currentChunkX) + Math.abs(b.y - this.currentChunkY);
      return distA - distB;
    });

    // Queue chunks for loading
    this.chunkLoadQueue.push(...chunksToLoad);
    
    // Start processing the queue immediately
    if (!this.isProcessingQueue) {
      this.processChunkLoadQueue();
    }

    // Clean up chunks outside preload distance
    for (const [key] of this.chunks) {
      if (!chunksToKeep.has(key)) {
        this.chunks.delete(key);
      }
    }
  }

  async processChunkLoadQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    const processNextChunk = async () => {
      if (this.chunkLoadQueue.length === 0) {
        this.isProcessingQueue = false;
        return;
      }

      const { x, y, key } = this.chunkLoadQueue.shift();
      
      // Skip if chunk is already loaded or loading
      if (this.chunks.has(key) || this.loadingChunks.has(key)) {
        processNextChunk();
        return;
      }

      this.loadingChunks.add(key);

      try {
        const chunk = new Chunk(this.chunkSize);
        await chunk.generate(x, y);
        
        // Double check the chunk is still needed
        if (Math.abs(x - this.currentChunkX) <= this.preloadDistance && 
            Math.abs(y - this.currentChunkY) <= this.preloadDistance) {
          this.chunks.set(key, chunk);
          this.plotSystem.applyPlotsToChunk(x, y);
        }
      } catch (error) {
        Debug.error(`Failed to load chunk ${key}: ${error.message}`);
      } finally {
        this.loadingChunks.delete(key);
      }

      // Process next chunk after a small delay
      setTimeout(processNextChunk, 1);
    };

    processNextChunk();
  }

  getChunkForCoordinate(x, y) {
    const chunkX = Math.floor(x / this.chunkSize);
    const chunkY = Math.floor(y / this.chunkSize);
    const key = `${chunkX},${chunkY}`;
    
    if (this.loadingChunks.has(key)) {
      Debug.log('WORLD', `Chunk still loading at (${chunkX}, ${chunkY})`);
      return null;
    }
    
    return this.chunks.get(key);
  }

  getCellDisplay(x, y) {
    const chunk = this.getChunkForCoordinate(x, y);
    if (!chunk) {
      // Return a temporary value while chunk is loading
      return 'loading';
    }

    const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
    const localY = ((y % this.chunkSize) + this.chunkSize) % this.chunkSize;

    return chunk.cells[localY][localX] || 'ground';
  }

  triggerUpdate() {
    Debug.log('WORLD', 'Triggering world grid update');
    // Force a re-render of the current view
    this.updateCurrentChunk(this.entities.player.x, this.entities.player.y);
  }
}

export default WorldGrid;
