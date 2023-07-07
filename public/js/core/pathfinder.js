class PathFinder {
  static findPath(grid, entity, startX, startY, targetX, targetY, npc) {
    const openSet = new Set(); // The set of nodes to be evaluated
    const cameFrom = new Map(); // Stores the path from a node to its parent
    const gScore = new Map(); // Cost from start along the best-known path
    const fScore = new Map(); // Estimated total cost from start to goal through y
    const startNode = { x: startX, y: startY };
    const targetNode = { x: targetX, y: targetY };

    openSet.add(startNode);
    gScore.set(startNode, 0);
    fScore.set(startNode, this.heuristicCostEstimate(startNode, targetNode));

    let openSetSize = 1;

    while (openSetSize > 0) {
      const current = this.getLowestFScoreNode(openSet, fScore);

      if (current.x === targetNode.x && current.y === targetNode.y) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);
      openSetSize--;

      for (const neighbor of grid.getNeighbors(current.x, current.y)) {
        if (this.isNPCAtPosition(npc, neighbor.x, neighbor.y) && (neighbor.x !== targetNode.x || neighbor.y !== targetNode.y)) {
          // Skip this neighbor if it's an NPC and not the target position
          continue;
        }

        const tentativeGScore = gScore.get(current) + 1; // Assuming that moving to a neighbor costs 1

        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(
            neighbor,
            tentativeGScore + this.heuristicCostEstimate(neighbor, targetNode)
          );

          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
            openSetSize++;
          }
        }
      }
    }

    return null; // No path found
  }

  static heuristicCostEstimate(nodeA, nodeB) {
    return Math.abs(nodeA.x - nodeB.x) + Math.abs(nodeA.y - nodeB.y);
  }

  static reconstructPath(cameFrom, current) {
    const totalPath = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current);
      totalPath.unshift(current);
    }
    return totalPath;
  }

  static getLowestFScoreNode(nodes, fScore) {
    let lowestFScoreNode = null;
    let lowestFScore = Infinity;
  
    for (const node of nodes) {
      const nodeFScore = fScore.get(node);
      if (nodeFScore < lowestFScore) {
        lowestFScore = nodeFScore;
        lowestFScoreNode = node;
      }
    }
  
    return lowestFScoreNode;
  }

  static isNPCAtPosition(npc, x, y) {
    return npc.x === x && npc.y === y;
  }
}

export default PathFinder;
