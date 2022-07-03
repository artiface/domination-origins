"use strict";
var HealthBarComponent = IgeEntity.extend({
	classId: 'HealthBarComponent',
    componentId: 'healthbar',
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

		this._barTexture = new IgeTexture('../assets/smart/HealthBar.js');
        this._barTexture.on('loaded', function () {
			self.texture(self._barTexture).width(120);
            self.texture(self._barTexture).height(20);
            self.texture(self._barTexture).localAabb(true);
		}, false, true);
		return this;
	},
	getCurrentHealth: function () {
        return this._entity.getStat('currentHealth');
    },
    getMaxHealth: function () {
        return this._entity.getStat('maxHealth');
    },
	changeHealth: function(byAmount) {
        let newHealthValue = this.getCurrentHealth() + byAmount;
        this.setCurrentHealth(newHealthValue);
        return this;
    },
    setCurrentHealth: function(health) {
        this._entity.setStat('currentHealth', health);
        return this;
    },
    getHealthAsPercent: function () {
        if (this.getCurrentHealth() <= 0) {
            return 0;
        }
        return this.getCurrentHealth() / this.getMaxHealth();
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = HealthBarComponent; }