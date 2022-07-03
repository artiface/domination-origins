"use strict";
// Define our player character container classes
var MessageText = IgeEntity.extend({
	classId: 'MessageText',

	init: function (displayText) {
		IgeEntity.prototype.init.call(this);
        this._text = displayText;
		var self = this;
		// Create a character entity as a child of this container
		self.addComponent(IgeAnimationComponent)
		    .isometric(false)
			.depth(30)
			.layer(30);
        this._borderColor = false;
        this._clipping = false;
		this._labelTexture = new IgeTexture('../assets/smart/Label.js');
        this._labelTexture.on('loaded', function () {
			self.texture(self._labelTexture).width(120);
            self.texture(self._labelTexture).height(20);
            self.texture(self._labelTexture).localAabb(true);
		}, false, true);

		let duration = 5000;

		self._translate.tween()
            .stepBy({
                y: -200
            })
            .duration(duration)
            .afterTween(function () {
                self.destroy();
            })
            .start();
        self.tween()
            .properties({
                _opacity: 0.5
            })
            .duration(duration)
            .start();




	},
	getLabelOptions: function () {
        return {
            fontFamily: 'Arial',
            fontSize: '28',
            text: [this._text],
            fontColor: '#ff0011',
            offsetX: 0,
            offsetY: 0,
            strokeColor: '#fff',
        };
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = MessageText; }