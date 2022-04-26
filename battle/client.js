"use strict";

const Move = 0
const Attack = 1

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

const matchData = JSON.parse(window.localStorage.getItem('match_data') || '{}')

if (isEmpty(matchData)) {
    window.location.href = '/loadout/';
}

var provider = window.chain_provider;
var signer = window.chain_signer;
var userAddress = window.chain_user_address;

var Client = IgeClass.extend({
	classId: 'Client',
	pathFinder: new IgePathFinder().neighbourLimit(100),
	loadTextures: function () {
		this.gameTexture.tiles = [];
		this.gameTexture.effects = [];

        this.gameTexture.effects.push(new IgeCellSheet('../assets/sprites/bullet_sheet.png', 4, 1));

		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Ceramic Tile.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Clay Brick - A.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Clay Brick - B.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Grass.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Ice - 2.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Lava 2.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Lava Stone.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Magma.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Refine Stone - A.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Refine Stone - B.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Sand Stone.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Sand.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Soil.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Stone.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Water - 2A.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Water - 2B.png'));
		this.gameTexture.tiles.push(new IgeTexture('../assets/tiles/Water - 2C.png'));

        this.buttonTexture = new IgeTexture('../assets/ui/EmptyButton.png');
        this.attackButonTexture = new IgeTexture('../assets/ui/Attack.png');
        this.moveButtonTexture = new IgeTexture('../assets/ui/Move.png');
        this.endTurnButtonTexture = new IgeTexture('../assets/ui/End_Turn.png');
        this.sprintButtonTexture = new IgeTexture('../assets/ui/Sprint.png');
	},

	init: function () {
		//ige.addComponent(IgeEditorComponent);
		ige.globalSmoothing(true);

		// Load our textures
		var self = this;
		this.obj = [];
		this.gameTexture = {};

        self.implement(Network);
        self.implement(GameWorld);
        self.implement(Input);

        self.highlightedCharacter = undefined;
		self.isInitialized = false;
		self.currentAction = Move;

		self.startSetup = function(mapData, charData) {

		    self.createWorld(mapData, charData);
            self.addListeners();

			self.vp1.camera.translateTo(0, 300, 0);
			self.vp1._resizeEvent(null);
		};

		self.characters = [];
		self.ownCharacters = [];
		self.selectedCharacter = null;

		// Wait for our textures to load before continuing
		ige.on('texturesLoaded', function () {
			// Create the HTML canvas
			ige.createFrontBuffer(true);

			// Start the engine
			ige.start(function (success) {
				// Check if the engine started successfully
				if (userAddress !== matchData['user_wallet']) {
				    alert('Loadout has been created for a different wallet.');
				}
				else if (success) {
                    self.connectToServer();
				}
			});
		});

		this.loadTextures();
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }