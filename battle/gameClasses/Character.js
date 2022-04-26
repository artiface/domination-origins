"use strict";
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
		this._charData = {};
		// Create a character entity as a child of this container
		this.addComponent(HealthBarComponent)
		    .addComponent(FocusBarComponent)
            .isometric(true)
            .isometricMounts(true)
			.addComponent(IgeAnimationComponent)
			.addComponent(IgeVelocityComponent)
			.depth(1)
			//.compositeCache(true)
			.bounds3d(60, 60, 60);

		this.implement(Highlighting);
	},
	getToolTipText: function () {
	    return [
	        '#' + this._tokenId,
	        'Level: ' + this.getStat('level'),
	        'Health: ' + this.getStat('currentHealth') + '/' + this.getStat('maxHealth'),
	        'Focus: ' + this.getStat('currentFocus') + '/' + this.getStat('maxFocus'),
            'Strength: ' + this.getStat('strength'),
            'Agility: ' + this.getStat('agility'),
            'Intelligence: ' + this.getStat('intelligence'),
            'Dexterity: ' + this.getStat('dexterity'),
	    ];
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
	moveTo: function (toTileX, toTileY) {
	    const tilemap = this._parent;
		var startTile = this.tilePosition();
        tilemap.unOccupyTile(startTile.x, startTile.y, 1, 1);

		this.path.set(startTile.x, startTile.y, 0, toTileX, toTileY, 0)
            .speed(5)
            .start();
	},
	setBoardPiece: function (boardPiece) {
        this._boardPiece = boardPiece;
        return this;
    },
    setInfoLabel: function (infoLabel) {
        this._infoLabel = infoLabel;
        return this;
    },
    setHeadLabel: function (headLabel) {
        this._headLabel = headLabel;
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
    tilePosition: function()
    {
        return this._parent.pointToTile(this._translate);
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