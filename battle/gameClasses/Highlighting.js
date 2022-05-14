"use strict";
var Highlighting = {
	showReachableTiles: function() {
	    this.updateReachableTiles();
	    const tilemap = this._parent;
        for (let tile of this._reachableTiles)
        {
            tilemap.map.layerData(tile.x, tile.y, 1);
        }
	},

	hideReachableTiles: function() {
	    if (this._reachableTiles)
	    {
            const tilemap = this._parent;
            for (let tile of this._reachableTiles)
            {
                tilemap.map.layerData(tile.x, tile.y, 0);
            }
        }
	},
	updateReachableTiles: function() {
	    this.hideReachableTiles();
        const currentPosition = this._translate;
		const tile = this._parent.pointToTile(currentPosition);
	    const tilemap = this._parent;
	    const maxSteps = this.getStat('agility') - this.getStat('stepsTakenThisTurn');
	    this._reachableTiles = this.path._finder.getReachableTiles(tilemap, {x: tile.x, y: tile.y}, maxSteps); // TODO: put agility of character here
	},
	hidePossibleTargets: function() {
	    if (this._possibleTargets) {
            const tilemap = this._parent;
            for (let tile of this._possibleTargets)
            {
                tilemap.map.layerData(tile.x, tile.y, 0);
                if (tilemap.isTileOccupied(tile.x, tile.y))
                {
                    const char = tilemap.tileOccupiedBy(tile.x, tile.y);
                    char._headLabel.hide();
                }
            }
        }
    },
    rangedChanceToHit: function(targetCharacter) {
        const ourPos = this.tilePosition();
        const targetPos = targetCharacter.tilePosition();
        const distance = Math.distance(ourPos.x, ourPos.y, targetPos.x, targetPos.y);
        const dexterity = this.getStat('dexterity');
        const level = this.getStat('level');
        return 20 + (2 * dexterity * (level + 2)) - 5 * distance;
    },
    meleeChanceToHit: function(targetCharacter) {
        const intelligence = this.getStat('intelligence');
        const level = this.getStat('level');
        return intelligence * level;
    },
    chanceToHit: undefined,
    setRangedChanceToHit: function() {
        this.chanceToHit = this.rangedChanceToHit;
    },
    setMeleeChanceToHit: function() {
        this.chanceToHit = this.meleeChanceToHit;
    },
    showPossibleTargets: function(isValidTargetFunc) {
        this.updatePossibleTargets(isValidTargetFunc);
        const tilemap = this._parent;
        var self = this;
        for (let tile of this._possibleTargets)
        {
            tilemap.map.layerData(tile.x, tile.y, 2);
            if (tilemap.isTileOccupied(tile.x, tile.y))
            {
                const char = tilemap.tileOccupiedBy(tile.x, tile.y);
                char._headLabel.showText(Math.floor(self.chanceToHit(char)) + '%');
            }
        }
    },
	updatePossibleTargets: function(isValidTargetFunc) {
        this.hidePossibleTargets();
        this._possibleTargets = [];
        const currentPosition = this._translate;
        const tilemap = this._parent;
        //const tile = tilemap.pointToTile(currentPosition);
        // iterate over all tiles in the map
        const bounds = tilemap._gridSize;
        for (let x = 0; x < bounds.x; x++) {
            for (let y = 0; y < bounds.y; y++) {
                const tile = {x: x, y: y};
                if (isValidTargetFunc(tile)) {
                    this._possibleTargets.push(tile);
                }
            }
        }
	}
};