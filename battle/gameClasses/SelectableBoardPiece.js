"use strict";
var SelectableBoardPiece = IgeEntity.extend({
	classId: 'SelectableBoardPiece',

	init: function () {
		IgeEntity.prototype.init.call(this);
		var self = this;
		self.isometric(true)
			.depth(1)
			.bounds3d(60, 60, 60)
			.anchor(0, 10);
	},

	setSelected: function(selected) {
        if (selected) {
            this.cell(2);
        } else {
            this.cell(1);
        }
    },

	/* Function for setting the token id */
    clientIsOwner: function (ownedByClientPlayer) {
        const colorString = ownedByClientPlayer ? 'Blue' : 'Red';
        this._characterTexture = new IgeCellSheet('../assets/sprites/Hero_Icon_'+colorString+'_Sheet.png', 2, 1);
        var self = this;
        this._characterTexture.on('loaded', function () {
			self.texture(self._characterTexture).width(130);
            self.texture(self._characterTexture).height(124);
            self.texture(self._characterTexture).localAabb(true);
            self.cell(0);
		}, false, true);
		return this;
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = SelectableBoardPiece; }