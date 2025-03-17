class CellPool {
    constructor(initialSize = 400) {
        this.pool = new Map();
        this.initialSize = initialSize;
        this.initializePool();
    }

    initializePool() {
        for (let i = 0; i < this.initialSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.pool.set(cell, false); // false = not in use
        }
    }

    acquire() {
        // Try to find an unused cell
        for (const [cell, inUse] of this.pool) {
            if (!inUse) {
                this.pool.set(cell, true);
                return cell;
            }
        }

        // Create new cell if none available
        const cell = document.createElement('div');
        cell.className = 'cell';
        this.pool.set(cell, true);
        return cell;
    }

    release(cell) {
        if (this.pool.has(cell)) {
            // Reset cell state
            cell.className = 'cell';
            cell.removeAttribute('data-x');
            cell.removeAttribute('data-y');
            this.pool.set(cell, false);
        }
    }

    clear() {
        this.pool.forEach((inUse, cell) => {
            if (inUse) {
                cell.remove();
                this.pool.set(cell, false);
            }
        });
    }
}

export default CellPool;