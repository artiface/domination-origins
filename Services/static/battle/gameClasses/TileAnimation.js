"use strict";

const range = (start, stop, step) => Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));

// Define our player character container classes
var TileAnimation = IgeEntity.extend({
	classId: 'TileAnimation',

	init: function (bulletSheet, frameCount) {
		IgeEntity.prototype.init.call(this);

		var self = this;
		// Create a character entity as a child of this container
		self.addComponent(IgeAnimationComponent)
		    .isometric(true)
			.depth(1)
			.bounds3d(60, 60, 60)
			.anchor(0, 10);

		self._bulletSheet = bulletSheet;
        self.texture(self._bulletSheet).width(120);
        self.texture(self._bulletSheet).height(120);
        self.texture(self._bulletSheet).localAabb(true);
        const frameList = range(0, frameCount, 1);
		self.animation.define('impact', frameList, 8, -1)
            .cell(1);
        self.animation.select('impact');

        self.animation.on('loopComplete', function (anim) {
            // Now we've completed a single loop, stop the animation
            this.stop();
            // And stop the entity from walking around
            this._entity.destroy();
        });
	},
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = TileAnimation; }