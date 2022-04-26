"use strict";
var Label = IgeEntity.extend({
	classId: 'Label',

	init: function () {
		IgeEntity.prototype.init.call(this);
		var self = this;
	},
    tick: function (ctx) {
		ctx.save();
        var mp = {'x': 20, 'y': 20},
            text,
            mx,
            my,
            textMeasurement;

        // Re-scale the context to ensure that output is always 1:1
        ctx.scale(1, 1);

        // Work out the re-scale mouse position
        mx = Math.floor(mp.x);
        my = Math.floor(mp.y);
        ctx.font = '20px Arial';
        text = "HALLO\nWELT";
        textMeasurement = ctx.measureText(text);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(Math.floor(mx - textMeasurement.width / 2 - 5), Math.floor(my - 25), Math.floor(textMeasurement.width + 10), 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, mx - textMeasurement.width / 2, my - 15);
        ctx.restore();
	},
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Label; }