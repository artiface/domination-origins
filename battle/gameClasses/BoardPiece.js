"use strict";
// Define our player character container classes
var BoardPiece = IgeEntity.extend({
	classId: 'BoardPiece',

	init: function () {
		IgeEntity.prototype.init.call(this);

		var self = this;
		// Create a character entity as a child of this container
		self.isometric(true)
			.depth(1)
			.bounds3d(60, 60, 60)
			.anchor(0, 10);
	},

	/* Function for setting the token id */
    clientIsOwner: function (ownedByClientPlayer) {
        const colorString = ownedByClientPlayer ? 'Blue' : 'Red';
        this._characterTexture = new IgeTexture('../assets/sprites/Hero_Icon_'+colorString+'_240.png');
        var self = this;
        this._characterTexture.on('loaded', function () {
			self.texture(self._characterTexture).width(120);
            self.texture(self._characterTexture).height(112);
            self.texture(self._characterTexture).localAabb(true);
		}, false, true);
		return this;
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = BoardPiece; }