"use strict";
var Label = IgeEntity.extend({
	classId: 'Label',

	init: function () {
		IgeEntity.prototype.init.call(this);
		var self = this;
		this.depth(20).layer(20);
		this.hide();
		//this.cache(true);

		this._labelTexture = new IgeTexture('../assets/smart/Label.js');
        this._labelTexture.on('loaded', function () {
			self.texture(self._labelTexture).width(120);
            self.texture(self._labelTexture).height(20);
            self.texture(self._labelTexture).localAabb(true);
		}, false, true);
	},
	setTextFunction: function(textFunction) {
        this._textFunction = textFunction;
        return this;
    },
	getLabelOptions: function () {
        return {
            fontFamily: 'Arial',
            fontSize: 12,
            offsetX: 0,
            offsetY: -80,
            text: this._textFunction(),
        };
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Label; }