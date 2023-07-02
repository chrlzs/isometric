import Version from "./version.js";
import Grid from "./grid.js";
import Entity from "./entity.js";
import PathFinder from "./pathfinder.js";

// TODO: Move this out
class NPC {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  moveTo(newX, newY) {
    this.x = newX;
    this.y = newY;
  }
}

class App {
  static grid;
  static player;
  static npc;
  static gridElement;

  static init() {
    this.grid = new Grid(10, 10);
    this.player = new Entity(0, 1);
    this.npc = new NPC(0, 0);    
    // Place the NPC at a random position on the grid
    this.placeNPC();
    this.gridElement = document.querySelector(".grid");
    this.createGrid();
    this.displayGrid();
    this.updateVersionText();

    // Add arrow key event listeners
    document.addEventListener("keydown", (event) => {
      this.handleArrowKey(event);
    });
  }

  static handleArrowKey(event) {
    const { key } = event;
    let newX = this.player.x;
    let newY = this.player.y;

    switch (key) {
      case "ArrowUp":
        newY--;
        break;
      case "ArrowDown":
        newY++;
        break;
      case "ArrowLeft":
        newX--;
        break;
      case "ArrowRight":
        newX++;
        break;
      default:
        return;
    }

    if (
      this.grid.isValidPosition(newX, newY) &&
      !this.grid.isSolid(newX, newY)
    ) {
      const newPath = PathFinder.findPath(
        this.grid,
        this.player,
        this.player.x,
        this.player.y,
        newX,
        newY
      );

      if (newPath && newPath.length > 0) {
        this.animatePath(newPath);
        this.player.x = newX;
        this.player.y = newY;

        // Check if the player and NPC are on the same position
        if (this.player.x === this.npc.x && this.player.y === this.npc.y) {
          this.interactWithNPC();
        }
      }
    }
  }

  static placeNPC() {
    // Generate random coordinates within the grid boundaries
    const newX = Math.floor(Math.random() * this.grid.width);
    const newY = Math.floor(Math.random() * this.grid.height);

    // Check if the generated coordinates are valid and not blocked by a solid object
    if (
      this.grid.isValidPosition(newX, newY) &&
      !this.grid.isSolid(newX, newY)
    ) {
      this.grid.setCellDataAttribute(newX, newY, "test", "charlie");
      this.npc.moveTo(newX, newY);
    } else {
      // If the generated coordinates are not valid, recursively try again until a valid position is found
      this.placeNPC();
    }
  }

  static interactWithNPC() {
    // Add your logic for interacting with the NPC here
    console.log("Interacting with the NPC");
    // You can update the NPC's position or trigger some action
    // For example, you can move the NPC to a new random position
    const newX = Math.floor(Math.random() * this.grid.width);
    const newY = Math.floor(Math.random() * this.grid.height);
    this.npc.moveTo(newX, newY);
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
    this.grid.setCell(9, 4, 1);

    this.gridElement.addEventListener("click", (event) => {
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

      const newPath = PathFinder.findPath(
        this.grid,
        this.player,
        this.player.x,
        this.player.y,
        newX,
        newY
      );

      if (newPath && newPath.length > 0) {
        this.animatePath(newPath);
        this.player.x = newX;
        this.player.y = newY;
      }
    }
  }

  static animatePath(path) {
    let delay = 100; // Delay between rendering each cell in milliseconds
    let prevX = this.player.x;
    let prevY = this.player.y;

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

  static displayGrid(targetX = -1, targetY = -1, direction = "") {
    this.gridElement.innerHTML = "";

    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        const cellElement = document.createElement("div");
        cellElement.className = "cell";
        cellElement.dataset.x = x;
        cellElement.dataset.y = y;

        if (this.grid.isSolid(x, y)) {
          cellElement.classList.add("cell-solid");
        }

        if (this.grid.isFlora(x, y)) {
          cellElement.classList.add("flora");
        }

        if (this.grid.isWater(x, y)) {
          cellElement.classList.add("water");
        }

        // Check if the current position matches the NPC position
        if (x === this.npc.x && y === this.npc.y) {
          cellElement.classList.add("cell-entity", "cell-npc", "red"); // Reapply the red CSS class
        }

        if (x === targetX && y === targetY) {
          // Add a glyph element to represent the center of the selected tile
          const glyphElement = document.createElement("div");
          glyphElement.className = "glyph";

          // Check if the current position matches the NPC position
          if (x === this.npc.x && y === this.npc.y) {
            // NPC position matching
            cellElement.classList.add("cell-entity", "cell-npc", "yellow");
          } else {
            // Player position or empty cell
            glyphElement.innerText = "G";
            cellElement.classList.add("cell-entity");
          }

          // Set the direction class for the glyph element
          glyphElement.classList.add(`cell-entity-${direction}`);

          cellElement.appendChild(glyphElement);
        }

        this.gridElement.appendChild(cellElement);
      }
    }
    //TODO: Remove - these methods are just validating usage
    this.grid.addClassToCell(2, 3, "highlight");
    this.grid.setCellDataAttribute(2, 3, "test", "ABC");
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
