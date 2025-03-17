class Chunk {
  static BIOMES = {
    DESERT: { 
      type: 'desert', 
      threshold: 0.2,
      moisture: { min: 0, max: 0.3 }
    },
    PLAINS: { 
      type: 'plains', 
      threshold: 0.4,
      moisture: { min: 0.3, max: 0.6 }
    },
    FOREST: { 
      type: 'forest', 
      threshold: 0.6,
      moisture: { min: 0.5, max: 0.8 }
    },
    MOUNTAINS: { 
      type: 'mountains', 
      threshold: 0.8,
      moisture: { min: 0.4, max: 0.7 }
    },
    TUNDRA: { 
      type: 'tundra', 
      threshold: 1.0,
      moisture: { min: 0.6, max: 1.0 }
    }
  };

  // Define structure types as a static property
  static STRUCTURES = {
    TAVERN: {
      size: 4,
      color: '#8B4513',
      walkable: true
    },
    MARKET: {
      size: 4,
      color: '#DAA520',
      walkable: true
    },
    TEMPLE: {
      size: 4,
      color: '#F0E68C',
      walkable: true
    },
    BLACKSMITH: {
      size: 4,
      color: '#696969',
      walkable: true
    },
    GARDEN: {
      size: 4,
      color: '#228B22',
      walkable: true
    }
  };

  constructor(size) {
    this.size = size;
    this.cells = Array(size).fill().map(() => Array(size).fill('ground'));
    this.structures = new Map();
    this.chunkX = 0;
    this.chunkY = 0;
    this.biomeScale = 0.03; // Reduced for larger biome regions
    this.moistureScale = 0.02; // Reduced for smoother transitions
    this.blendFactor = 0.3; // Controls biome blending
  }

  isValidPosition(x, y) {
    // Check if coordinates are within chunk bounds
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  generate(chunkX, chunkY) {
    this.chunkX = chunkX;
    this.chunkY = chunkY;

    // Generate base noise maps
    const elevationMap = this.generateNoiseMap(this.biomeScale);
    const moistureMap = this.generateNoiseMap(this.moistureScale, 1000);
    const blendMap = this.generateNoiseMap(this.biomeScale * 2, 2000);

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const worldX = chunkX * this.size + x;
        const worldY = chunkY * this.size + y;
        
        // Get base values
        const elevation = elevationMap[y][x];
        const moisture = moistureMap[y][x];
        const blend = blendMap[y][x];

        // Apply biome blending
        const biomeType = this.getBiomeType(elevation, moisture, blend);
        this.cells[y][x] = this.smoothBiomeTransition(x, y, biomeType, elevation, moisture);
      }
    }

    // Post-process to ensure biome coherence
    this.postProcessBiomes();
  }

  generateNoiseMap(scale, offset = 0) {
    const map = Array(this.size).fill(0).map(() => Array(this.size).fill(0));
    
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const worldX = (this.chunkX * this.size + x + offset) * scale;
        const worldY = (this.chunkY * this.size + y + offset) * scale;
        map[y][x] = this.noise(worldX, worldY);
      }
    }
    
    return map;
  }

  getBiomeType(elevation, moisture, blend) {
    // Use moisture to influence biome transitions
    const adjustedElevation = elevation * (1 + moisture * 0.2);
    
    // Smooth transition between biomes using blend factor
    if (adjustedElevation < 0.2) {
      return moisture < 0.5 ? 'water' : 'swamp';
    } else if (adjustedElevation < 0.4) {
      return moisture < 0.3 ? 'desert' : 'plains';
    } else if (adjustedElevation < 0.6) {
      return moisture < 0.6 ? 'plains' : 'forest';
    } else if (adjustedElevation < 0.8) {
      return moisture < 0.5 ? 'hills' : 'mountains';
    } else {
      return 'tundra';
    }
  }

  smoothBiomeTransition(x, y, centerBiome, elevation, moisture) {
    // Check neighboring cells for different biomes
    const neighbors = this.getNeighborBiomes(x, y);
    
    // If surrounded by same biome type, no need to transition
    if (neighbors.every(b => b === centerBiome)) {
      return centerBiome;
    }

    // Create transition based on elevation and moisture
    const transitionThreshold = 0.3;
    if (Math.random() < transitionThreshold) {
      // Pick a neighboring biome for smooth transition
      return neighbors[Math.floor(Math.random() * neighbors.length)];
    }

    return centerBiome;
  }

  getNeighborBiomes(x, y) {
    const neighbors = [];
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    
    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < this.size && newY >= 0 && newY < this.size) {
        neighbors.push(this.cells[newY][newX]);
      }
    }
    
    return neighbors.filter(Boolean);
  }

  postProcessBiomes() {
    // Smooth out single-cell biomes
    const tempGrid = this.cells.map(row => [...row]);
    
    for (let y = 1; y < this.size - 1; y++) {
      for (let x = 1; x < this.size - 1; x++) {
        const currentBiome = this.cells[y][x];
        const neighbors = this.getNeighborBiomes(x, y);
        
        // If current cell is surrounded by different biomes, adapt to majority
        const biomeCounts = neighbors.reduce((acc, biome) => {
          acc[biome] = (acc[biome] || 0) + 1;
          return acc;
        }, {});
        
        const majorityBiome = Object.entries(biomeCounts)
          .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        
        if (biomeCounts[currentBiome] < 3) {
          tempGrid[y][x] = majorityBiome;
        }
      }
    }
    
    this.cells = tempGrid;
  }

  placeStructure(x, y, structureType) {
    // Validate structure type
    if (!Chunk.STRUCTURES[structureType]) {
      console.warn(`Invalid structure type: ${structureType}`);
      return false;
    }

    const structure = Chunk.STRUCTURES[structureType];
    const size = structure.size;

    // Ensure there's enough space for the structure
    if (x + size > this.size || y + size > this.size || x < 0 || y < 0) {
      console.warn(`Not enough space for ${size}x${size} structure at (${x}, ${y})`);
      return false;
    }

    // Check if the area is clear
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const key = `${x + dx},${y + dy}`;
        if (this.structures.has(key)) {
          console.warn(`Space occupied at (${x + dx}, ${y + dy})`);
          return false;
        }
      }
    }

    // Place the structure in all cells
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const key = `${x + dx},${y + dy}`;
        this.structures.set(key, structureType);
        this.cells[y + dy][x + dx] = `structure-${structureType.toLowerCase()}`;
      }
    }

    return true;
  }

  // Improved noise function using multiple octaves for more natural variation
  noise(x, y) {
    // Basic implementation of multiple octaves
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    const persistence = 0.5;
    const octaves = 4;

    for (let i = 0; i < octaves; i++) {
      value += this.simpleNoise(x * frequency, y * frequency) * amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    // Normalize the value between 0 and 1
    return (value + 1) / 2;
  }

  simpleNoise(x, y) {
    const n = x * 1234567 + y * 7654321;
    const value = Math.sin(n) * 43758.5453123;
    return Math.sin(value) * Math.cos(value);
  }
}

export default Chunk;
