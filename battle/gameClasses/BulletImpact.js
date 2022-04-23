// Define our player character container classes
var BulletImpact = IgeEntity.extend({
	classId: 'BulletImpact',

	init: function (bulletSheet) {
		IgeEntity.prototype.init.call(this);

		var self = this;
		// Create a character entity as a child of this container
		self.addComponent(IgeAnimationComponent)
		    .isometric(true)
			.depth(1)
			.bounds3d(60, 60, 60)
			.anchor(0, 10);

		self._bulletSheet = bulletSheet;
        self.texture(self._bulletSheet).width(40);
        self.texture(self._bulletSheet).height(48);
        self.texture(self._bulletSheet).localAabb(true);

		self.animation.define('impact', [1, 2, 3, 4], 8, -1)
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

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = BulletImpact; }