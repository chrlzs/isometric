class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = this.createGrid(width, height);
  }

  createGrid(width, height) {
    const cells = new Array(height);
    for (let i = 0; i < height; i++) {
      cells[i] = new Array(width).fill(0);
    }
    return cells;
  }

  setCell(x, y, value) {
    if (this.isValidPosition(x, y)) {
      this.cells[y][x] = value;
    }
  }

  isSolid(x, y) {
    if (this.isValidPosition(x, y)) {
      return this.cells[y][x] > 0;
    }
    return false;
  }

  isFlora(x, y) {
    if (this.isValidPosition(x, y)) {
      return this.cells[y][x] === 1;
    }
    return false;
  }

  isWater(x, y) {
    if (this.isValidPosition(x, y)) {
      return this.cells[y][x] === 2;
    }
    return false;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getNode(x, y) {
    if (this.isValidPosition(x, y)) {
      return { x, y };
    }
    return null;
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }, // right
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 }, // down
    ];

    for (const direction of directions) {
      const newX = x + direction.dx;
      const newY = y + direction.dy;
      if (this.isValidPosition(newX, newY) && !this.isSolid(newX, newY)) {
        neighbors.push(this.getNode(newX, newY));
      }
    }

    return neighbors;
  }
}

export default Grid;
