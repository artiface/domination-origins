"use strict";
var Label = IgeEntity.extend({
	classId: 'Label',
    _showFunction: true,
	init: function () {
		IgeEntity.prototype.init.call(this);
		var self = this;
		this._fontSize = 14;
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
    setStrokeColor: function(color) {
        this._strokeColor = color;
        return this;
    },
    setFontSize: function(fontSize) {
        this._fontSize = fontSize;
        return this;
    },
    showText: function(text) {
        this._text = [text];
        this._showFunction = false;
        this.show();
        return this;
    },
	getLabelOptions: function () {
        return {
            fontFamily: 'Arial',
            fontSize: this._fontSize,
            offsetX: 0,
            offsetY: -80,
            strokeColor: this._strokeColor,
            text: this._showFunction ? this._textFunction() : this._text,
        };
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Label; }