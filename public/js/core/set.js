class Set {
    constructor() {
      this.items = {};
    }
  
    add(item) {
      this.items[item] = true;
    }
  
    delete(item) {
      if (this.has(item)) {
        delete this.items[item];
        return true;
      }
      return false;
    }
  
    has(item) {
      return this.items.hasOwnProperty(item);
    }
  
    isEmpty() {
      return Object.keys(this.items).length === 0;
    }
  
    min() {
      return Object.keys(this.items)[0];
    }
  }
  
  export default Set;
  