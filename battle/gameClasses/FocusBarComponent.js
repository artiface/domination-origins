"use strict";
var FocusBarComponent = IgeEntity.extend({
	classId: 'FocusBarComponent',
    componentId: 'focusbar',
	init: function (entity, options) {
		IgeEntity.prototype.init.call(this);
        this._entity = entity;

        this.layer(10)
            .mount(entity);

		var self = this;
		self.isometric(true)
			.depth(10)
			.bounds3d(60, 60, 0)
			.anchor(0, 10);
		var self = this;

		this._barTexture = new IgeTexture('../assets/smart/FocusBar.js');
        this._barTexture.on('loaded', function () {
			self.texture(self._barTexture).width(120);
            self.texture(self._barTexture).height(20);
            self.texture(self._barTexture).localAabb(true);
		}, false, true);
		return this;
	},
	getCurrentFocus: function () {
        return this._entity.getStat('currentFocus');
    },
    getMaxFocus: function () {
        return this._entity.getStat('maxFocus');
    },
	changeFocus: function(byAmount) {
        let newFocusValue = this.getCurrentFocus() + byAmount;
        this.setCurrentFocus(newFocusValue);
        return this;
    },
    setCurrentFocus: function(focus) {
        this._entity.setStat('currentFocus', focus);
        return this;
    },
    getFocusAsPercent: function () {
        if (this.getCurrentFocus() <= 0) {
            return 0;
        }
        return this.getCurrentFocus() / this.getMaxFocus();
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = FocusBarComponent; }