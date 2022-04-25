/**
 * Adds mouse control to the entity this component is added to.
 * @type {IgeClass}
 */
var PlayerComponent = IgeClass.extend({
	classId: 'PlayerComponent',
	componentId: 'player',
	
	init: function (entity, options) {
		var self = this;
        this._reachableTiles = new Set();
		// Store the entity that this component has been added to
		this._entity = entity;

		// Store any options that were passed to us
		this._options = options;
	},
	showReachableTiles: function() {
	    this.updateReachableTiles();
	    const tilemap = this._entity._parent;
        for (let tile of this._reachableTiles)
        {
            tilemap.map.layerData(tile.x, tile.y, 1);
        }
	},

	hideReachableTiles: function() {
	    const tilemap = this._entity._parent;
        for (let tile of this._reachableTiles)
        {
            tilemap.map.layerData(tile.x, tile.y, 0);
        }
	},

	updateReachableTiles: function()
	{
	    this.hideReachableTiles();
        const currentPosition = this._entity._translate;
		const tile = this._entity._parent.pointToTile(currentPosition);
	    const tilemap = this._entity._parent;
	    const maxSteps = this._entity.getStat('agility') - this._entity.getStat('stepsTakenThisTurn');
	    this._reachableTiles = this._entity.path._finder.getReachableTiles(tilemap, {x: tile.x, y: tile.y}, maxSteps); // TODO: put agility of character here
	},
    tilePosition: function()
    {
        return this._entity._parent.pointToTile(this._entity._translate);
    },
	moveTo: function (toTileX, toTileY) {
	    const tilemap = this._entity._parent;
		var startTile = this.tilePosition();
        tilemap.unOccupyTile(startTile.x, startTile.y, 1, 1);

		this._entity.path
				.set(startTile.x, startTile.y, 0, toTileX, toTileY, 0)
				.speed(5)
				.start();
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = PlayerComponent; }