"use strict";
// Define our player character container classes
var FloatingText = IgeEntity.extend({
	classId: 'FloatingText',

	init: function (displayText) {
		IgeEntity.prototype.init.call(this);
        this._text = displayText;
		var self = this;
		// Create a character entity as a child of this container
		self.addComponent(IgeAnimationComponent)
		    .isometric(true)
			.depth(30)
			.layer(30)
			.bounds3d(40, 40, 20)
			.anchor(0, 0);

		this._labelTexture = new IgeTexture('../assets/smart/Label.js');
        this._labelTexture.on('loaded', function () {
			self.texture(self._labelTexture).width(120);
            self.texture(self._labelTexture).height(20);
            self.texture(self._labelTexture).localAabb(true);
		}, false, true);
		let duration = 1700;
        this._translate.tween()
            .stepBy({
                z: 50
            })
            .duration(duration)
            .start();

		this.tween()
            .properties({
                _opacity: 0.0
            })
            .duration(duration)
            .afterTween(function () {
                self.destroy();
            })
            .start();
	},
	getLabelOptions: function () {
        return {
            fontFamily: 'Arial',
            fontSize: '28',
            text: [this._text],
            fontColor: '#ff0011',
            offsetX: 0,
            offsetY: -60,
        };
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = FloatingText; }