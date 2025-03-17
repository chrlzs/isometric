class Debug {
    static enabled = true;
    static visualEnabled = true;  // New flag for visual debugging
    static categories = {
        APP: true,
        WORLD: true,
        PLOT: true,
        PATHFINDING: true  // New category for pathfinding
    };

    static log(category, message, data = null) {
        if (!this.enabled || !this.categories[category]) return;
        
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}][${category}]`;
        
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    }

    static error(message) {
        console.error(`[ERROR] ${message}`);
    }

    static toggleVisual() {
        this.visualEnabled = !this.visualEnabled;
        return this.visualEnabled;
    }
}

export default Debug;