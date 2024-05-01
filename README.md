# Isometric Game Application

This is an isometric game application built with JavaScript. It includes features such as player movement, NPC interactions, and grid-based gameplay.

## Installation

1. Clone the repository to your local machine:

   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:

   ```
   cd isometric-game
   ```

3. Install dependencies using npm:

   ```
   npm install
   ```

## Usage

1. Start the server:

   ```
   npm start
   ```

2. Open your web browser and navigate to [http://localhost:3000](http://localhost:3000) to play the game.

## Features

- Player movement with arrow keys
- Interaction with NPCs
- Grid-based gameplay
- Dynamic rendering of the game world

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

## Code Summary:

The App class is defined with various static methods. The init method initializes the game by creating instances of Grid, Player, NPC, and Enemy. It also sets up event listeners for arrow key presses.

The handleArrowKey method handles the arrow key events and updates the player's position accordingly. It also checks for interactions with the NPC and updates the game state accordingly.

The placeNPC method generates random coordinates for placing the NPC on the grid. It recursively tries again if the generated coordinates are not valid.

The interactWithNPC method handles the logic for interacting with the NPC. It shows or hides a dialog box and displays a text message.

The updateVersionText method retrieves the version number using the Version class and updates the page title accordingly.

The setPageTitle method sets the page title with the provided version number.

The createGrid method initializes the grid by setting cells with specific values. It also sets up a click event listener for the grid.

The handleGridClick method handles the click events on the grid and updates the player's position accordingly.

The animatePath method animates the player's movement along a given path by displaying the grid cells sequentially.

The displayGrid method renders the grid by creating cell elements and applying CSS classes based on the grid state. It also handles the display of the player and the interaction with the NPC.

The getMovementDirection function calculates the movement direction based on the previous and new positions of the player.
