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
            for (let char of this._possibleTargets)
            {
                const tile = tilemap.pointToTile(char._translate);
                tilemap.map.layerData(tile.x, tile.y, 0);
                char._headLabel.hide();
            }
        }
    },
    chanceToHit: function(targetCharacter) {
        const ourPos = this.tilePosition();
        const targetPos = targetCharacter.tilePosition();
        const distance = Math.distance(ourPos.x, ourPos.y, targetPos.x, targetPos.y);
        const dexterity = this.getStat('dexterity');
        const level = this.getStat('level');
        const chanceToHit = (2 * dexterity * (level + 2)) - 5 * distance;
        return chanceToHit;
    },
    showPossibleTargets: function(allCharacters) {
        this.updatePossibleTargets(allCharacters);
        const tilemap = this._parent;
        var self = this;
        for (let char of this._possibleTargets)
        {
            const tile = tilemap.pointToTile(char._translate);
            tilemap.map.layerData(tile.x, tile.y, 2);
            char._headLabel.showText(Math.floor(self.chanceToHit(char)) + '%');
        }
    },
	updatePossibleTargets: function(allCharacters)
	{
        this.hidePossibleTargets();
        this._possibleTargets = [];
        const currentPosition = this._translate;
        const tilemap = this._parent;
        const tile = tilemap.pointToTile(currentPosition);

        for (let character of allCharacters)
        {
            if (character.clientIsOwner())
            {
                continue;
            }
            this._possibleTargets.push(character);
        }
	}
};