// Define our player character container classes
var FocusBar = IgeEntity.extend({
	classId: 'FocusBar',

	init: function () {
		IgeEntity.prototype.init.call(this);

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
	character: function (character) {
        this._character = character;
        return this;
    },
	changeFocus: function(byAmount) {
        this._focus += byAmount;
        return this;
    },
    setCurrentFocus: function(focus) {
        this._focus = focus;
        return this;
    },
	setMaxFocus: function(maxFocus) {
	    this._maxFocus = maxFocus;
        this._focus = maxFocus;
        return this;
	},
    getFocusAsPercent: function () {
        return this._focus / this._maxFocus;
    },
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = FocusBar; }