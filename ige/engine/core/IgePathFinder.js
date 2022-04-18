/**
 * Creates a new path using the A* path-finding algorithm.
 */

const pq_top = 0;
const pq_parent = i => ((i + 1) >>> 1) - 1;
const pq_left = i => (i << 1) + 1;
const pq_right = i => (i + 1) << 1;

class PriorityQueue {
  constructor(comparator = (a, b) => a > b) {
    this._heap = [];
    this._comparator = comparator;
  }
  size() {
    return this._heap.length;
  }
  isEmpty() {
    return this.size() == 0;
  }
  peek() {
    return this._heap[pq_top];
  }
  push(...values) {
    values.forEach(value => {
      this._heap.push(value);
      this._siftUp();
    });
    return this.size();
  }
  pop() {
    const poppedValue = this.peek();
    const bottom = this.size() - 1;
    if (bottom > pq_top) {
      this._swap(pq_top, bottom);
    }
    this._heap.pop();
    this._siftDown();
    return poppedValue;
  }
  replace(value) {
    const replacedValue = this.peek();
    this._heap[pq_top] = value;
    this._siftDown();
    return replacedValue;
  }
  _greater(i, j) {
    return this._comparator(this._heap[i], this._heap[j]);
  }
  _swap(i, j) {
    [this._heap[i], this._heap[j]] = [this._heap[j], this._heap[i]];
  }
  _siftUp() {
    let node = this.size() - 1;
    while (node > pq_top && this._greater(node, pq_parent(node))) {
      this._swap(node, pq_parent(node));
      node = pq_parent(node);
    }
  }
  _siftDown() {
    let node = pq_top;
    while (
      (pq_left(node) < this.size() && this._greater(pq_left(node), node)) ||
      (pq_right(node) < this.size() && this._greater(pq_right(node), node))
    ) {
      let maxChild = (pq_right(node) < this.size() && this._greater(pq_right(node), pq_left(node))) ? pq_right(node) : pq_left(node);
      this._swap(node, maxChild);
      node = maxChild;
    }
  }
}

var IgePathFinder = IgeEventingClass.extend({
	classId: 'IgePathFinder',

	init: function() {
		this._neighbourLimit = 1000;
		this._squareCost = 10;
		this._diagonalCost = 10;
	},

	/**
	 * Gets / sets the cost of movement over a square (left,
	 * right, up, down) adjacent tile.
	 * @param {Number=} val
	 * @return {*}
	 */
	squareCost: function (val) {
		if (val !== undefined) {
			this._squareCost = val;
			return this;
		}

		return this._squareCost;
	},

	/**
	 * Gets / sets the cost of movement over a diagonal (nw,
	 * ne, sw, se) adjacent tile.
	 * @param {Number=} val
	 * @return {*}
	 */
	diagonalCost: function (val) {
		if (val !== undefined) {
			this._diagonalCost = val;
			return this;
		}

		return this._diagonalCost;
	},

	/**
	 * Gets / sets the limit on the number of neighbour nodes
	 * that the path-finder will analyse before reaching it's
	 * target tile. On large maps this limit should be increased
	 * to allow pathing where many neighbours need to be
	 * considered.
	 * @param val
	 * @return {*}
	 */
	neighbourLimit: function (val) {
		if (val !== undefined) {
			this._neighbourLimit = val;
			return this;
		}

		return this._neighbourLimit;
	},
	
	aStar: function () {
		this.log('The "IgePathFinder.aStar" method has been renamed to "generate". Please update your code.', 'error');
	},

	/**
	 * Uses the A* algorithm to generate path data between two points.
	 * @param {IgeCollisionMap2d} tileMap The tile map to use when generating the path.
	 * @param {IgePoint3d} startPoint The point on the map to start path-finding from.
	 * @param {IgePoint3d} endPoint The point on the map to try to path-find to.
	 * @param {Function} comparisonCallback The callback function that will decide if each tile that is being considered for use in the path is allowed or not based on the tile map's data stored for that tile which is passed to this method as the first parameter. Must return a boolean value.
	 * @param {Boolean} allowSquare Whether to allow neighboring tiles along a square axis. Defaults to true if undefined.
	 * @param {Boolean} allowDiagonal Whether to allow neighboring tiles along a diagonal axis. Defaults to false if undefined.
	 * @param {Boolean=} allowInvalidDestination If the path finder cannot path to the destination tile, if this is true the closest path will be returned instead.
	 * @return {Array} An array of objects each containing an x, y co-ordinate that describes the path from the starting point to the end point in order.
	 */
	generate: function (tileMap, startPoint, endPoint, comparisonCallback, allowSquare, allowDiagonal, allowInvalidDestination) {
		var openList = [],
			closedList = [],
			listHash = {},
			startNode,
			lowestFScoringIndex,
			openCount,
			currentNode,
			pathPoint,
			finalPath,
			neighbourList,
			neighbourCount,
			neighbourNode,
			endPointCheckTile,
			tileMapData,
			existingNode,
			lowestHNode;

		// Set some defaults
		if (allowSquare === undefined) { allowSquare = true; }
		if (allowDiagonal === undefined) { allowDiagonal = false; }

		// Check that the end point on the map is actually allowed to be pathed to!
		tileMapData = tileMap.map._mapData;
		endPointCheckTile = tileMapData[endPoint.y] && tileMapData[endPoint.y][endPoint.x] ? tileMapData[endPoint.y][endPoint.x] : null;
		if (!allowInvalidDestination && !comparisonCallback(endPointCheckTile, endPoint.x, endPoint.y)) {
			// There is no path to the end point because the end point
			// is not allowed to be pathed to!
			this.emit('noPathFound');
			//this.log('Cannot path to destination because the destination tile is not pathable!');
			return [];
		}

		// Starting point to open list
		startNode = new IgePathNode(startPoint.x, startPoint.y, 0, 0, this._heuristic(startPoint.x, startPoint.y, endPoint.x, endPoint.y, 10));
		startNode.link = 1;
		openList.push(startNode);
		listHash[startNode.hash] = startNode;
		startNode.listType = 1;

		lowestHNode = startNode;

		// Loop as long as there are more points to process in our open list
		while (openList.length) {
			// Check for some major error
			if (openList.length > this._neighbourLimit) {
				//this.log('Path finder error, open list nodes exceeded ' + this._neighbourLimit + '!', 'warning');
				this.emit('exceededLimit');
				break;
			}

			// Grab the lowest f scoring node from the open list
			// to process next
			lowestFScoringIndex = 0;
			openCount = openList.length;

			while (openCount--) {
				if(openList[openCount].f < openList[lowestFScoringIndex].f) { lowestFScoringIndex = openCount; }
			}

			currentNode = openList[lowestFScoringIndex];

			// Check if the current node is the end point
			if (currentNode.x === endPoint.x && currentNode.y === endPoint.y) {
				// We have reached the end point
				pathPoint = currentNode;
				finalPath = [];

				while(pathPoint.link) {
					finalPath.push(pathPoint);
					pathPoint = pathPoint.link;
				}

				this.emit('pathFound', finalPath);

				return finalPath.reverse();
			} else {
				// Remove the current node from the open list
				openList.splice(lowestFScoringIndex, 1);

				// Add the current node to the closed list
				closedList.push(currentNode);
				currentNode.listType = -1;

				// Get the current node's neighbors
				neighbourList = this._getNeighbours(currentNode, endPoint, tileMap, comparisonCallback, allowSquare, allowDiagonal);
				neighbourCount = neighbourList.length;

				// Loop the neighbours and add each one to the open list
				while (neighbourCount--) {
					neighbourNode = neighbourList[neighbourCount];
					existingNode = listHash[neighbourNode.hash];

					// Check that the neighbour is not on the closed list
					if (!existingNode || existingNode.listType !== -1) {
						// The neighbour is not on the closed list so
						// check if it is already on the open list
						if (existingNode && existingNode.listType === 1) {
							// The neighbour is already on the open list
							// so check if our new path is a better score
							if (existingNode.g > neighbourNode.g) {
								// Pathing from the current node through this neighbour
								// costs less that any way we've calculated before
								existingNode.link = neighbourNode.link;
								existingNode.g = neighbourNode.g;
								existingNode.f = neighbourNode.f;
							}
						} else {
							// Add the neighbour to the open list
							openList.push(neighbourNode);
							listHash[neighbourNode.hash] = neighbourNode;
							neighbourNode.listType = 1;
							existingNode = neighbourNode;
						}
					}

					// Check if this neighbour node has the lowest
					// h value (distance from target) and store it
					if (!lowestHNode || existingNode.h < lowestHNode.h) {
						lowestHNode = existingNode;
					}
				}
			}

		}

		if (!allowInvalidDestination || (allowInvalidDestination && !lowestHNode)) {
			// Could not find a path, return an empty array!
			//this.log('Could not find a path to destination!');
			this.emit('noPathFound');
			return [];
		} else {
			// We couldn't path to the destination so return
			// the closest detected end point
			pathPoint = lowestHNode;
			finalPath = [];

			while(pathPoint.link) {
				finalPath.push(pathPoint);
				pathPoint = pathPoint.link;
			}

			// Reverse the final path so it is from
			// start to finish
			finalPath = finalPath.reverse();

			this.emit('pathFound', finalPath);
			return finalPath;
		}
	},

	_pHash: function(point) {
        return point.x + ',' + point.y;
    },

	/**
	 * Get all tiles that can be reached from the current tile with a given movement cost
	 * @param  {object} tileMap The tile map to use
     * @param  {object} startPoint The tile to start from
     * @param  {number} maxSteps The maximum number of steps to take
     * @return {array} An array of tiles that can be reached from the current tile
	 */
	getReachableTiles: function(tileMap, startPoint, maxSteps) {
	    // use dijkstra's algorithm to find all reachable tiles
        var reachableTiles = new Set();
        var distMap = {};

        const pairwiseQueue = new PriorityQueue((a, b) => a[1] < b[1]);
        // we use a priority queue to keep track of the tiles we need to check
        // we add the startPoint as the first item in the queue
        pairwiseQueue.push([startPoint, 0]);

        // we use a dictionary to keep track of the distance to each tile
        distMap[this._pHash(startPoint)] = 0;

        // we start the search loop
        while (pairwiseQueue.size() > 0)
        {
            // we get the next tile to check
            var currentTile = pairwiseQueue.pop()[0];
            // we get the distance to the current tile
            var currentDist = distMap[this._pHash(currentTile)];
            // we get the neighbours of the current tile
            var neighbours = this._getSimpleNeighbours(tileMap, currentTile);
            // we loop through the neighbours
            for (var i = 0; i < neighbours.length; i++)
            {
                // we get the neighbour
                var neighbour = neighbours[i];
                // we get the distance to the neighbour
                var neighbourDist = currentDist + 1;
                if (neighbourDist <= maxSteps)
                {
                    // we check if we have already found a path to the neighbour
                    if (distMap[this._pHash(neighbour)])
                    {
                        // check the old distance
                        if (distMap[this._pHash(neighbour)] > neighbourDist)
                        {
                            // we update the distance to the neighbour
                            distMap[this._pHash(neighbour)] = neighbourDist;
                            // we add the neighbour to the queue
                            pairwiseQueue.push([neighbour, neighbourDist]);
                            continue;
                        }
                        else
                        {
                            continue;
                        }
                    }
                    // we add the neighbour to the queue
                    pairwiseQueue.push([neighbour, neighbourDist]);
                    // we set the distance to the neighbour
                    distMap[this._pHash(neighbour)] = neighbourDist;
                    // we add the neighbour to the reachable tiles
                    reachableTiles.add(neighbour);
                }
            }
        }
        return reachableTiles;
	},
    _getSimpleNeighbours: function (tileMap, currentTile) {
        var mapData = tileMap.map._mapData;
        var neighbours = [];
        const bounds = tileMap._gridSize;

        // we get the neighbours of the current tile
        var north = mapData[currentTile.y - 1] && mapData[currentTile.y - 1][currentTile.x] ? mapData[currentTile.y - 1][currentTile.x] : null;
        var south = mapData[currentTile.y + 1] && mapData[currentTile.y + 1][currentTile.x] ? mapData[currentTile.y + 1][currentTile.x] : null;
        var east = mapData[currentTile.y] && mapData[currentTile.y][currentTile.x + 1] ? mapData[currentTile.y][currentTile.x + 1] : null;
        var west = mapData[currentTile.y] && mapData[currentTile.y][currentTile.x - 1] ? mapData[currentTile.y][currentTile.x - 1] : null;

        // check if the neighbour is walkable and in bounds
        if (north === null && currentTile.y - 1 >= 0)
        {
            neighbours.push({x: currentTile.x, y: currentTile.y - 1});
        }
        if (south === null && currentTile.y + 1 < bounds.y)
        {
            neighbours.push({x: currentTile.x, y: currentTile.y + 1});
        }
        if (east === null && currentTile.x + 1 < bounds.x)
        {
            neighbours.push({x: currentTile.x + 1, y: currentTile.y});
        }
        if (west === null && currentTile.x - 1 >= 0)
        {
            neighbours.push({x: currentTile.x - 1, y: currentTile.y});
        }


        return neighbours;
    },

	/**
	 * Get all the neighbors of a node for the A* algorithm.
	 * @param {IgePathNode} currentNode The current node along the path to evaluate neighbors for.
	 * @param {IgePathNode} endPoint The end point of the path.
	 * @param {IgeCollisionMap2d} tileMap The tile map to use when evaluating neighbours.
	 * @param {Function} comparisonCallback The callback function that will decide if the tile data at the neighbouring node is to be used or not. Must return a boolean value.
	 * @param {Boolean} allowSquare Whether to allow neighboring tiles along a square axis.
	 * @param {Boolean} allowDiagonal Whether to allow neighboring tiles along a diagonal axis.
	 * @return {Array} An array containing nodes describing the neighbouring tiles of the current node.
	 * @private
	 */
	_getNeighbours: function (currentNode, endPoint, tileMap, comparisonCallback, allowSquare, allowDiagonal) {
		var list = [],
			x = currentNode.x,
			y = currentNode.y,
			newX = 0,
			newY = 0,
			newNode,
			mapData = tileMap.map._mapData,
			currentNodeData = mapData[y] && mapData[y][x] ? mapData[y][x] : undefined,
			tileData;

		if (allowSquare) {
			newX = x - 1; newY = y;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._squareCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._squareCost), currentNode, 'W');
				list.push(newNode);
			}

			newX = x + 1; newY = y;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._squareCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._squareCost), currentNode, 'E');
				list.push(newNode);
			}

			newX = x; newY = y - 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._squareCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._squareCost), currentNode, 'N');
				list.push(newNode);
			}

			newX = x; newY = y + 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._squareCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._squareCost), currentNode, 'S');
				list.push(newNode);
			}

		}

		if (allowDiagonal) {
			newX = x - 1; newY = y - 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._diagonalCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._diagonalCost), currentNode, 'NW');
				list.push(newNode);
			}

			newX = x + 1; newY = y - 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._diagonalCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._diagonalCost), currentNode, 'NE');
				list.push(newNode);
			}

			newX = x - 1; newY = y + 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._diagonalCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._diagonalCost), currentNode, 'SW');
				list.push(newNode);
			}

			newX = x + 1; newY = y + 1;
			tileData = mapData[newY] && mapData[newY][newX] ? mapData[newY][newX] : null;
			if (comparisonCallback(tileData, newX, newY, currentNodeData, x, y)) {
				newNode = new IgePathNode(newX, newY, currentNode.g, this._diagonalCost, this._heuristic(newX, newY, endPoint.x, endPoint.y, this._diagonalCost), currentNode, 'SE');
				list.push(newNode);
			}
		}

		return list;
	},

	/**
	 * The heuristic to calculate the rough cost of pathing from the
	 * x1, y1 to x2, y2.
	 * @param {Number} x1 The first x co-ordinate.
	 * @param {Number} y1 The first y co-ordinate.
	 * @param {Number} x2 The second x co-ordinate.
	 * @param {Number} y2 The second y co-ordinate.
	 * @param {Number} moveCost The cost multiplier to multiply by.
	 * @return {Number} Returns the heuristic cost between the co-ordinates specified.
	 * @private
	 */
	_heuristic: function (x1, y1, x2, y2, moveCost) {
		return moveCost * (Math.abs(x1 - x2) + Math.abs(y1 - y2));
	},

	as: function (map, fromNode, toNode) {
		var openList = [],
			closedList = [];

		// Add start point to open list
		openList.push(fromNode);


	},

	_as: function (openList, closedList, currentNode, toNode) {

	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = IgePathFinder; }