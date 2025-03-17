import WorldGrid from './worldGrid.js';

class ChunkedPathFinder {
    static pathCache = new Map();
    static MAX_CACHE_SIZE = 100;

    static findPath(worldGrid, entity, startX, startY, targetX, targetY) {
        const cacheKey = `${startX},${startY}-${targetX},${targetY}`;
        
        // Check cache first
        if (this.pathCache.has(cacheKey)) {
            Debug.log('PATHFINDING', 'Using cached path');
            return this.pathCache.get(cacheKey);
        }

        // Clear any existing path visualization
        this.clearPathVisualization();

        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const start = {x: startX, y: startY};
        const target = {x: targetX, y: targetY};

        // Visualize start and end points
        this.visualizeCell(startX, startY, 'path-start');
        this.visualizeCell(targetX, targetY, 'path-end');

        openSet.add(JSON.stringify(start));
        gScore.set(JSON.stringify(start), 0);
        fScore.set(JSON.stringify(start), this.heuristic(start, target));

        while (openSet.size > 0) {
            let current = this.getLowestFScore(openSet, fScore);
            let currentStr = JSON.stringify(current);

            if (current.x === target.x && current.y === target.y) {
                const path = this.reconstructPath(cameFrom, current);
                this.visualizePath(path);
                return path;
            }

            openSet.delete(currentStr);
            closedSet.add(currentStr);

            // Visualize explored cells
            this.visualizeCell(current.x, current.y, 'path-explored');

            const neighbors = this.getNeighbors(current, worldGrid);
            for (const neighbor of neighbors) {
                const neighborStr = JSON.stringify(neighbor);
                
                if (closedSet.has(neighborStr)) continue;
                
                const tentativeGScore = gScore.get(currentStr) + 1;

                if (!openSet.has(neighborStr)) {
                    openSet.add(neighborStr);
                } else if (tentativeGScore >= gScore.get(neighborStr)) {
                    continue;
                }

                cameFrom.set(neighborStr, current);
                gScore.set(neighborStr, tentativeGScore);
                fScore.set(neighborStr, tentativeGScore + this.heuristic(neighbor, target));
            }
        }

        // If no path found, mark target as blocked
        this.visualizeCell(targetX, targetY, 'path-blocked');
        return null;
    }

    static clearPathVisualization() {
        const pathClasses = ['path-start', 'path-end', 'path-preview', 'path-explored', 'path-blocked'];
        pathClasses.forEach(className => {
            document.querySelectorAll(`.${className}`).forEach(element => {
                element.classList.remove(className);
            });
        });
    }

    static visualizeCell(x, y, className) {
        const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
        if (cell) {
            cell.classList.add(className);
        }
    }

    static visualizePath(path) {
        if (!path) return;
        
        // Skip start and end points as they have their own classes
        for (let i = 1; i < path.length - 1; i++) {
            this.visualizeCell(path[i].x, path[i].y, 'path-preview');
        }
    }

    static heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    static getLowestFScore(openSet, fScore) {
        let lowest = null;
        let lowestScore = Infinity;

        for (const posStr of openSet) {
            const score = fScore.get(posStr);
            if (score < lowestScore) {
                lowest = JSON.parse(posStr);
                lowestScore = score;
            }
        }

        return lowest;
    }

    static getNeighbors(pos, worldGrid) {
        const neighbors = [];
        const directions = [
            {x: 0, y: -1},  // up
            {x: 1, y: 0},   // right
            {x: 0, y: 1},   // down
            {x: -1, y: 0},  // left
        ];

        for (const dir of directions) {
            const newX = pos.x + dir.x;
            const newY = pos.y + dir.y;

            if (worldGrid.isValidPosition(newX, newY) && !worldGrid.isSolid(newX, newY)) {
                neighbors.push({x: newX, y: newY});
            }
        }

        return neighbors;
    }

    static reconstructPath(cameFrom, current) {
        const path = [current];
        let currentStr = JSON.stringify(current);

        while (cameFrom.has(currentStr)) {
            current = cameFrom.get(currentStr);
            currentStr = JSON.stringify(current);
            path.unshift(current);
        }

        return path;
    }
}

export default ChunkedPathFinder;
