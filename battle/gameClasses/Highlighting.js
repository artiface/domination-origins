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
            }
        }
    },
    showPossibleTargets: function(allCharacters) {
        this.updatePossibleTargets(allCharacters);
        const tilemap = this._parent;
        for (let tile of this._possibleTargets)
        {
            tilemap.map.layerData(tile.x, tile.y, 2);
        }
    },
	updatePossibleTargets: function(allCharacters)
	{
        this.hidePossibleTargets();
        this._possibleTargets = [];
        const currentPosition = this._translate;
        const tile = this._parent.pointToTile(currentPosition);
        const tilemap = this._parent;
        for (let character of allCharacters)
        {
            if (character.clientIsOwner())
            {
                continue;
            }
            const characterTile = character._parent.pointToTile(character._translate);
            this._possibleTargets.push(characterTile);
        }
	}
};