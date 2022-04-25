// Define our player character container classes
var HealthBarComponent = IgeEntity.extend({
	classId: 'HealthBarComponent',
    componentId: 'healthbar',
	init: function (entity, options) {
		IgeEntity.prototype.init.call(this);
        this._entity = entity;

        this.setMaxHealth(entity.getStat('maxHealth'))
            .layer(10)
            .character(entity)
            .mount(entity)
            .setCurrentHealth(entity.getStat('currentHealth'));

		var self = this;
		self.isometric(true)
			.depth(10)
			.bounds3d(60, 60, 0)
			.anchor(0, 10);
		var self = this;

		this._barTexture = new IgeTexture('../assets/smart/HealthBar.js');
        this._barTexture.on('loaded', function () {
			self.texture(self._barTexture).width(120);
            self.texture(self._barTexture).height(20);
            self.texture(self._barTexture).localAabb(true);
		}, false, true);
		return this;
	},
	character: function (character) {
        this._character = character;
        return this;
    },
	changeHealth: function(byAmount) {
        this._health += byAmount;
        return this;
    },
    setCurrentHealth: function(health) {
        this._health = health;
        return this;
    },
	setMaxHealth: function(maxHealth) {
	    this._maxHealth = maxHealth;
        this._health = maxHealth;
        return this;
	},
    getHealthAsPercent: function () {
        if (this._health <= 0) {
            return 0;
        }
        return this._health / this._maxHealth;
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = HealthBarComponent; }