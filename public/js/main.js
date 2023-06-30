import Version from "./version.js";
import Grid from "./grid.js";
import Entity from "./entity.js";
import PathFinder from "./pathfinder.js";

class App {
  static grid;
  static entity;
  static gridElement;

  static init() {
    this.updateVersionText();
    this.grid = new Grid(5, 5);
    this.entity = new Entity(0, 0);
    this.gridElement = document.querySelector('.grid');
    this.createGrid();
    this.displayGrid();
  }

  static updateVersionText() {
    let ver = new Version();
    let version = ver.getVersion();
    let span = document.getElementById("version");
    span.textContent = version;
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

    for (let i = 0; i < path.length; i++) {
      const { x, y } = path[i];
      setTimeout(() => {
        this.displayGrid(x, y);
      }, i * delay);
    }
  }

  static displayGrid(targetX, targetY) {
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

        if (x === targetX && y === targetY) {
          cellElement.classList.add('cell-entity');
        }

        this.gridElement.appendChild(cellElement);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", function (event) {
  App.init();
});
