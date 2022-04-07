/**
 * Adds mouse control to the entity this component is added to.
 * @type {IgeClass}
 */
var PlayerComponent = IgeClass.extend({
	classId: 'PlayerComponent',
	componentId: 'player',
	
	init: function (entity, options) {
		var self = this;

		// Store the entity that this component has been added to
		this._entity = entity;

		// Store any options that were passed to us
		this._options = options;		
	},

	moveTo: function (toTileX, toTileY) {
		var currentPosition = this._entity._translate;
		var startTile = this._entity._parent.pointToTile(currentPosition);

		this._entity.path
				.set(startTile.x, startTile.y, 0, toTileX, toTileY, 0)
				.speed(5)
				.start();
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = PlayerComponent; }