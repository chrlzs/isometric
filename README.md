# Isometric Game Application

A sophisticated isometric game application built with vanilla JavaScript, featuring dynamic world generation, quest systems, and advanced entity management.

## Features

- **Dynamic World Generation**
  - Chunk-based world system with efficient rendering
  - Plot system for procedural world generation
  - Day/night cycle with dynamic lighting
  - Weather system effects

- **Character Systems**
  - Player movement and combat
  - Equipment and inventory management
  - Health and damage systems
  - NPC interactions with dialog trees
  - Enemy AI and combat

- **Quest System**
  - Dynamic quest tracking
  - Multiple objectives support
  - Rewards system
  - Quest log UI

- **Advanced Features**
  - Pathfinding with chunked calculations
  - Mini-map system
  - Save/Load functionality
  - Item database with different types (weapons, armor, consumables)
  - Tooltip system
  - Debug utilities

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd isometric-game
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Game Controls

- Arrow keys for movement
- Click to move to a location
- 'I' to open inventory
- 'Q' to open quest log
- Interact with NPCs by moving adjacent to them

## Technical Architecture

- Modular JavaScript with ES6 modules
- Entity component system for game objects
- Event-driven architecture
- Efficient chunk-based world rendering
- Custom pathfinding implementation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

