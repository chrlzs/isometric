class Door extends GameObject {
    constructor(x, y) {
      super(x, y);
      this.isOpen = false;
    }
  
    open() {
      // TODO: Implement logic for opening the door
    }
  
    render() {
      // Override the render method to display the door differently if it's open
      if (this.isOpen) {
        // Render an open door sprite
      } else {
        // Render a closed door sprite
      }
    }
  }