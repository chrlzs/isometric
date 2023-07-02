import Version from "./version.js";
import Grid from "./grid.js";
import Entity from "./entity.js";
import PathFinder from "./pathfinder.js";

class App {
  static grid;
  static entity;
  static gridElement;

  static init() {
    this.grid = new Grid(10, 10);
    this.entity = new Entity(0, 0);
    this.gridElement = document.querySelector('.grid');
    this.createGrid();
    this.displayGrid();
  }

  static updateVersionText() {
    let ver = new Version();
    let version = ver.getVersion();
    this.setPageTitle(version);
  }

  static setPageTitle(version) {
    document.title = `Version ${version}`;
  }

  static createGrid() {
    this.grid.setCell(0, 0, 1);
    this.grid.setCell(1, 0, 0);
    this.grid.setCell(2, 0, 0);
    this.grid.setCell(2, 1, 1);
    this.grid.setCell(2, 2, 1);
    this.grid.setCell(3, 0, 0);
    this.grid.setCell(4, 0, 1);
    this.grid.setCell(4, 4, 1);

    this.grid.setCell(5, 0, 1);
    this.grid.setCell(6, 0, 0);
    this.grid.setCell(7, 0, 0);
    this.grid.setCell(8, 1, 2);
    this.grid.setCell(8, 2, 2);
    this.grid.setCell(9, 0, 2);
    this.grid.setCell(10, 0, 1);
    this.grid.setCell(10, 4, 1);

    console.log(this.grid.isSolid(this.entity.x, this.entity.y)); // false

    this.gridElement.addEventListener('click', (event) => {
      this.handleGridClick(event);
    });
  }

  static handleGridClick(event) {
    event.stopPropagation();

    const cellElement = event.target;
    const x = cellElement.dataset.x;
    const y = cellElement.dataset.y;

    if (x !== undefined && y !== undefined) {
      const newX = parseInt(x);
      const newY = parseInt(y);

      if (this.grid.isSolid(newX, newY)) {
        // Cell is occupied, do not proceed
        return;
      }

      const newPath = PathFinder.findPath(this.grid, this.entity, this.entity.x, this.entity.y, newX, newY);

      if (newPath && newPath.length > 0) {
        this.animatePath(newPath);
        this.entity.x = newX;
        this.entity.y = newY;
      }
    }
  }

  static animatePath(path) {
    let delay = 100; // Delay between rendering each cell in milliseconds
    let prevX = this.entity.x;
    let prevY = this.entity.y;

    for (let i = 0; i < path.length; i++) {
      const { x, y } = path[i];
      const direction = getMovementDirection(prevX, prevY, x, y);
      console.log("direction is " + direction);
      prevX = x;
      prevY = y;

      setTimeout(() => {
        this.displayGrid(x, y, direction);
      }, i * delay);
    }
  } 

  static displayGrid(targetX, targetY, direction) {
    this.gridElement.innerHTML = '';
  
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const cellElement = document.createElement('div');
        cellElement.className = 'cell';
        cellElement.dataset.x = x;
        cellElement.dataset.y = y;
  
        if (this.grid.isSolid(x, y)) {
          cellElement.classList.add('cell-solid');
        }
  
        if (this.grid.isFlora(x, y)) {
          cellElement.classList.add('flora');
        }
  
        if (this.grid.isWater(x, y)) {
          cellElement.classList.add('water');
        }
  
        if (x === targetX && y === targetY) {
          // Add a glyph element to represent the center of the selected tile
          const glyphElement = document.createElement('div');
          glyphElement.className = 'glyph';
          //glyphElement.innerText = 'G'; // Replace 'G' with the desired glyph
  
          // Set the direction class for the glyph element
          glyphElement.classList.add(`cell-entity-${direction}`);
          console.log(`fuck cell-entity-${direction}`)
  
          cellElement.classList.add('cell-entity');
          cellElement.appendChild(glyphElement);
        }
  
        this.gridElement.appendChild(cellElement);
      }
    }
  }
}  

function getMovementDirection(prevX, prevY, newX, newY) {
  // Calculate the movement direction based on the previous and new positions
  // Assumes a 45-degree isometric grid

  const deltaX = newX - prevX;
  const deltaY = newY - prevY;

  // Determine the horizontal and vertical movement directions
  let horizontalDirection = "";
  let verticalDirection = "";

  if (deltaX > 0) {
    horizontalDirection = "right";
  } else if (deltaX < 0) {
    horizontalDirection = "left";
  }

  if (deltaY > 0) {
    verticalDirection = "down";
  } else if (deltaY < 0) {
    verticalDirection = "up";
  }

  // Determine the final movement direction based on the horizontal and vertical directions
  let movementDirection = "";

  if (horizontalDirection && verticalDirection) {
    // Diagonal movement
    movementDirection = `${verticalDirection}-${horizontalDirection}`;
  } else if (horizontalDirection) {
    // Horizontal movement
    movementDirection = horizontalDirection;
  } else if (verticalDirection) {
    // Vertical movement
    movementDirection = verticalDirection;
  }

  return movementDirection;
}

document.addEventListener("DOMContentLoaded", function (event) {
  App.init();
});
