# isometric
isometric game

code summary:

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
