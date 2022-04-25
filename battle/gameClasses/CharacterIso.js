// Define our player character container classes
var Character = IgeEntity.extend({
	classId: 'Character',
	hasAttacked: function (hasAttacked) {
        if (hasAttacked === undefined) {
            return (this.getStat('hasAttackedThisTurn') === 'true');
        }
        this.setStat('hasAttackedThisTurn', hasAttacked);
        return this;
    },
    canMove: function() {
        return this.getStat('stepsTakenThisTurn') < this.getStat('agility');
    },
    canAct: function() {
        return !this.hasAttacked() || this.canMove();
    },
	init: function () {
		IgeEntity.prototype.init.call(this);

		var self = this;
		this._charData = {};
		// Create a character entity as a child of this container
		self.addComponent(PlayerComponent)
            .isometric(true)
            .isometricMounts(true)
			.addComponent(IgeAnimationComponent)
			.addComponent(IgeVelocityComponent)
			.depth(1)
			.setType(3)
			.bounds3d(60, 60, 60);

	},
    nextTurn: function() {
        this.hasAttacked(false);
        this.setStat('stepsTakenThisTurn', 0);
    },
    clientIsOwner: function (isOwner) {
        if (isOwner === undefined) {
            return this._clientIsOwner;
        }
        this._clientIsOwner = isOwner;
        return this;
    },
	/* Function for setting the token id */
    setTokenId: function (id) {
        this._tokenId = id;
        this._characterTexture = new IgeTexture('../TroopNFTs/thumbs/ct_'+id+'.png');
        var self = this;
        this._characterTexture.on('loaded', function () {
			/*self.texture(self._characterTexture)
				.dimensionsFromCell();*/
            self.texture(self._characterTexture).width(76);
            self.texture(self._characterTexture).height(76);
            self.texture(self._characterTexture).localAabb(true);
		}, false, true);

		return this;
    },
    setCharData: function (data) {
        this._charData = data;
        return this;
    },
    // add getter for character data
    getStat: function (statName) {
        return this._charData[statName];
    },
    // add setter for character data
    setStat: function (statName, value) {
        this._charData[statName] = value;
        return this;
    },
    /* Function for setting the char id */
    setCharId: function (id) {
        this._charId = id;
        return this;
    },

    getCharId: function () {
        return this._charId;
    },
	
	kill: function () {
		this.rotate().z(Math.radians(85));
	},
	/**
	 * Sets the type of character which determines the character's
	 * animation sequences and appearance.
	 * @param {Number} type From 0 to 7, determines the character's
	 * appearance.
	 * @return {*}
	 */
	setType: function (type) {
        // TODO: add this back when we have sprite sheet animations
		return this;
	},

	/**
	 * Tweens the character to the specified world co-ordinates.
	 * @param x
	 * @param y
	 * @return {*}
	 */
	walkTo: function (x, y) {
		var self = this,
			distX = x - this.translate().x(),
			distY = y - this.translate().y(),
			distance = Math.distance(
				this.translate().x(),
				this.translate().y(),
				x,
				y
			),
			speed = 0.1,
			time = (distance / speed),
			direction = '';

		// Start tweening the little person to their destination
		this._translate.tween()
			.stopAll()
			.properties({x: x, y: y})
			.duration(time)
			.afterTween(function () {
				self.animation.stop();
			})
			.start();

		return this;
	},

	tick: function (ctx) {
		// Set the depth to the y co-ordinate which basically
		// makes the entity appear further in the foreground
		// the closer they become to the bottom of the screen
		this.depth(this._translate.y);
		IgeEntity.prototype.tick.call(this, ctx);
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Character; }