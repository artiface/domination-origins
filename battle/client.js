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
		this.defaultFont = new IgeFontSheet('../assets/textures/fonts/verdana_12pt.png', 0);		
	},
	init: function () {
		//ige.addComponent(IgeEditorComponent);
		ige.globalSmoothing(true);

		// Load our textures
		var self = this;
		this.obj = [];
		this.gameTexture = {};

        self.highlightedCharacter = undefined;
		self.isInitialized = false;
		self.currentAction = Move;
        self.characterById = function(charId) {
            for (var i = 0; i < self.characters; i++) {
                if (self.characters[i].getCharId() == charId) {
                    return self.characters[i];
                }
            }
            return null;
        };

        self.loadCharacters = function(charData) {
            // call destroy() on all existing characters
            for (var i = 0; i < self.characters.length; i++) {
                self.characters[i].destroy();
            }
            for (var i = 0; i < charData.length; i++) {
                self.createCharacter(charData[i]);
            }
        };

        self.createCharacter = function(charData) {
            const pos = charData['pos'];
            const state = charData['state'];
            const troopTokenId = charData['tokenId'];
            const charId = charData['charId'];
            // check if we are the owner of the character
            const isOwner = charData['ownerWallet'] == userAddress;

            const char = new Character()
                .layer(1)
                .id('char_' + charId.toString())
                .setTokenId(troopTokenId)
                .setCharId(charId)
                .setCharData(charData)
                .drawBounds(false)
                .drawBoundsData(false)
                .mount(self.tilemap)
                .translateToTile(pos.x, pos.y, 0);

            self.tilemap.occupyTile(pos.x, pos.y, 1, 1, char);

            const boardPiece = new CharacterPiece()
                .layer(1)
                .clientIsOwner(isOwner)
                .mount(char);

            const statString =
            'Level: ' + char.getStat('level') + '\n' +
            'Agility: ' + char.getStat('agility') + '\n' +
            'Strength: ' + char.getStat('strength') + '\n' +
            'Intelligence: ' + char.getStat('intelligence');

            const toolTip = new IgeUiTooltip(char, 100, 90, ['#' + troopTokenId, statString]).layer(22);

            if (state === 0)
                char.kill();
            self.characters.push(char);

            char.addComponent(IgePathComponent).path
                .finder(self.pathFinder)
                .tileMap(self.tilemap)
                .tileChecker(function (tileData, tileX, tileY, node, prevNodeX, prevNodeY, dynamic) {
                    const bounds = self.tilemap._gridSize;
                    // check if the tile is in bounds
                    if (tileX < 0 || tileX >= bounds.x || tileY < 0 || tileY >= bounds.y) {
                        return false;
                    }
                    return tileData === null;
                })
                .lookAheadSteps(3)
                .dynamic(true)
                .allowSquare(true) // Allow north, south, east and west movement
                .allowDiagonal(false) // Allow north-east, north-west, south-east, south-west movement
                .drawPath(true) // Enable debug drawing the paths
                .drawPathGlow(true) // Enable path glowing (eye candy)
                .drawPathText(false); // Enable path text output

            char.path.on('pathComplete', function(){
                char.player.showReachableTiles();
                const pos = char.player.tilePosition();
                self.tilemap.occupyTile(pos.x, pos.y, 1, 1, this._entity);
            });
        };



		self.startSetup = function(mapData, charData) {
			var wallData = mapData['wall_data'];
			var mapSize = mapData['size'];
			var textureMapData = mapData['texture_data'];
            const tileWidth = 60;
            const tileHeight = 60;

			self.gridSize = mapSize;

			// Create the scene
			self.mainScene = new IgeScene2d()
				.id('mainScene')
				.autoSize(true)
				.drawBounds(false)
				.drawBoundsData(false);

			self.objectScene = new IgeScene2d()
				.id('objectScene')
				.depth(0)
				.autoSize(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.depthSortMode(2)
				.mount(self.mainScene);

			self.uiScene = new IgeScene2d()
				.id('uiScene')
				.depth(1)
				.autoSize(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.ignoreCamera(true) // We don't want the UI scene to be affected by the viewport's camera
				.mount(self.mainScene);

			// Create the main viewport
			self.vp1 = new IgeViewport()
				.id('vp1')
				.autoSize(true)
				.scene(self.mainScene)
				.drawMouse(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.mount(ige);

			self.textureMap1 = new IgeTextureMap()
				.depth(-2)
//				.translateTo(200, 0, 0)
				.tileWidth(tileWidth)
				.tileHeight(tileHeight)
				.gridSize(self.gridSize.width, self.gridSize.height)
				.drawGrid(true)
				//.drawMouse(true)
				.drawBounds(true)
				.isometricMounts(true)
				.autoSection(3)
				.mount(self.objectScene);

			// Create an isometric tile map
			self.tilemap = new IgeTileMap2d()
				.id('tilemap')
				.isometricMounts(true)
				.tileWidth(tileWidth)
				.tileHeight(tileHeight)
				.gridSize(self.gridSize.width, self.gridSize.height)
//				.drawGrid(5)
				.loadMap(wallData)
				.highlightOccupied(true) // Draws a red tile wherever a tile is "occupied"			
				.highlightTiles(true)
//				.backgroundPattern(self.gameTexture.grassTile, 'repeat', true, true)			
				.drawMouse(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.mount(self.objectScene);

			for (let i = 0; i < self.gameTexture.tiles.length; i++)
			{
				self.textureMap1.addTexture(self.gameTexture.tiles[i]);
			}

			for (let x = 0; x < self.gridSize.width; x++)
			{
				for (let y = 0; y < self.gridSize.height; y++)
				{	
					var textureIndex = textureMapData[y][x];
					self.textureMap1.paintTile(x, y, textureIndex, 1);
				} 
			}


			// Define a function that will be called when the
			// mouse cursor moves over one of our entities
			let overFunc = function () {
				this.highlight(true);
				ige.input.stopPropagation();
			};

			// Define a function that will be called when the
			// mouse cursor moves away from one of our entities
			let outFunc = function () {
				this.highlight(false);
				ige.input.stopPropagation();
			};

			// Create the 3d container that the player
			// entity will be mounted to

			self.loadCharacters(charData);

	
			// Create a UI entity so we can test if clicking the entity will stop
			// event propagation down to moving the player. If it's working correctly
			// the player won't move when the entity is clicked.
			
			self.endTurnButton = new IgeUiLabel()
				.id('endTurnButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.right(20)
				.width(60)
				.height(60)
				.texture(self.endTurnButtonTexture)
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { self.requestEndTurn(); ige.input.stopPropagation(); })
				.mount(self.uiScene);

			self.attackButton = new IgeUiLabel()
				.id('attackButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.left(70)
				.width(60)
				.height(60)
				.texture(self.attackButonTexture)
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.currentAction = Attack;
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);

			self.sprintButton = new IgeUiLabel()
				.id('sprintButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.left(140)
				.width(60)
				.height(60)
				.texture(self.sprintButtonTexture)
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
    			.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.debugText.value("Sprint Activated!");
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);

			self.skillOneButton = new IgeUiLabel()
				.id('skillOneButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.left(210)
				.width(60)
				.height(60)
				.texture(self.buttonTexture)
				.value('Skill 1')
				.color('white')
				.font('12px Verdana')
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.debugText.value("Skill 1 Activated!");
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);

			self.skillTwoButton = new IgeUiLabel()
				.id('skillTwoButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.left(280)
				.width(60)
				.height(60)
				.texture(self.buttonTexture)
				.value('Skill 2')
				.color('white')
				.font('12px Verdana')
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.debugText.value("Skill 2 Activated!");
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);

			self.skillThreeButton = new IgeUiLabel()
				.id('skillThreeButton')
				.depth(1)
				.paddingLeft(0)
				.bottom(3)
				.left(350)
				.width(60)
				.height(60)
				.texture(self.buttonTexture)
				.value('Skill 3')
				.color('white')
				.font('12px Verdana')
				.allowHover(true)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.debugText.value("Skill 3 Activated!");
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);
			self.skillOneButton._fontEntity.textAlignX(1).textAlignY(1).left(5).top(1);
			self.skillTwoButton._fontEntity.textAlignX(1).textAlignY(1).left(5).top(1);
			self.skillThreeButton._fontEntity.textAlignX(1).textAlignY(1).left(5).top(1);

			
			ige.ui.style('#debugText', {
				'top': 0,
				'left': 0,
				'backgroundColor': '#ccc'
			});
		
			self.debugText = new IgeUiLabel()
				.cache(true)
				.id('debugText')
				.depth(1)
				.width(280)
				.height(50)
				.value('Verdana 10px and this is not a native font :)')
				.top(1)
				.drawBounds(false)
				.drawBoundsData(false)
				.mount(self.uiScene);

            const charTooltipDelay = 800;
			var onMouseOnCharacter = function(char){
			    if (!char.highlight())
			    {
                    char.highlight(true);
                    self.highlightedCharacter = char;
                    // delay showing the tooltip
                    char._tooltip._timeout = setTimeout(function() {
                        // if the mouse is still over that character..
                        const mouseTile = self.tilemap.mouseToTile();
                        const charUnderMouse = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                        if (char === charUnderMouse)
                        {
                            char._tooltip.show();
                        }
                    }, charTooltipDelay);
                }
			};

			var onMouseLeavingCharacter = function(char){
			    char.highlight(false);
                char._tooltip.hide();
			};

			ige.input.on('mouseMove', function (event, x, y, button) {
			    const mouseTile = self.tilemap.mouseToTile();

				if (self.tilemap.isTileOccupied(mouseTile.x, mouseTile.y))
                {
                    const char = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                    if (self.highlightedCharacter && self.highlightedCharacter !== char)
                    {
                        onMouseLeavingCharacter(self.highlightedCharacter);
                    }
                    onMouseOnCharacter(char);
                }
                else
                {
                    if (self.highlightedCharacter)
                    {
                        onMouseLeavingCharacter(self.highlightedCharacter);
                    }
                }
			});

			document.addEventListener("keypress", function onEvent(event) {
                if (event.key === "f") {
                    // Toggle the stats
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                    } else {
                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        }
                    }
                }
            });

			ige.input.on('mouseUp', function (event, x, y, button) {
				const mouseTile = self.tilemap.mouseToTile();

				if (self.tilemap.isTileOccupied(mouseTile.x, mouseTile.y))
                {
                    const char = self.tilemap.tileOccupiedBy(mouseTile.x, mouseTile.y);
                    if (self.currentAction == Move)
                    {
                        if (self.selectedCharacter)
                        {
                            self.selectedCharacter.player.hideReachableTiles();
                        }
                        self.selectedCharacter = char;
                        self.selectedCharacter.player.showReachableTiles();

                        self.debugText.value("Selected: " + self.selectedCharacter.getCharId());
                    }
                    else if (self.currentAction == Attack && self.selectedCharacter)
                    {
                        self.requestAttack(self.selectedCharacter.getCharId(), mouseTile.x, mouseTile.y);
                    }
                }
                else
                {
                    if (self.currentAction == Move && self.selectedCharacter)
                    {
                        self.requestMovement(self.selectedCharacter.getCharId(), mouseTile.x, mouseTile.y);
                    }
                }
			});

			self.vp1.camera.translateTo(0, 300, 0);
			self.vp1._resizeEvent(null);
		};

		self.requestEndTurn = function(){
			var request = {
				'message': 'endTurn',		
			};
			var requestAsJson = JSON.stringify(request);
	  		self.socket.send(requestAsJson);
		};


		self.requestMovement = function(characterId, tileX, tileY){
			var request = {
				'message': 'movement',
				'characterId': characterId,
				'destination': {'x': tileX, 'y': tileY}				
			};
			var requestAsJson = JSON.stringify(request);
	  		self.socket.send(requestAsJson);
		};

		self.requestAttack = function(characterId, tileX, tileY){
			var request = {
				'message': 'attack',
				'characterId': characterId,
				'target': {'x': tileX, 'y': tileY}				
			};
			var requestAsJson = JSON.stringify(request);
	  		self.socket.send(requestAsJson);
		};

		self.handleServerResponse = async function(message) {
			if (message['error'])
			{
				alert(message['message'] + ': ' + message['error']);
				return;
			}
			switch (message['message'])
			{
		        case 'auth':
                    const flatSig = await signer.signMessage(message['siwe_message']);

                    const siweData = matchData;
                    siweData['message'] = 'siwe';
                    siweData['signature'] = flatSig;

                    const siweString = JSON.stringify(siweData);

                    window.localStorage.setItem('match_data', siweString);
                    self.socket.send(siweString);
                    break;
                case 'siwe':
                    alert('Matchup created! You should wait for your opponent to accept the match.');
                    break;
				case 'initialize':
					var mapData = message['map_data'];
					var charData = message['char_data'];
					var playerId = message['playerId'];

					var wallet = message['user_wallet'];
					if (!self.isInitialized)
					{
						self.isInitialized = true;
						self.playerId = playerId;
						self.startSetup(mapData, charData);
					}
					else
					{
					    // we might need to update some data since the server is sending us a full state update
					    self.loadCharacters(charData);
					}
					break;
				case 'movement':
					var charIndex = message['characterId'];
					var destination = message['destination'];
					self.characters[charIndex].setStat('stepsTakenThisTurn', message['stepsTakenThisTurn']);
					self.characters[charIndex].player.moveTo(destination.x, destination.y);

					break;
				case 'death':
					var charIndex = message['characterId'];
					self.characters[charIndex].kill();
					break;
				case 'endTurn':
					var turnOfPlayer = message['turnOfPlayer'];
					var nextTurnText = 'It is now the turn of player ' + turnOfPlayer;
					if (turnOfPlayer === matchData['user_wallet'])
					{
						nextTurnText = 'IT IS YOUR TURN!';

					}
					// reset the steps taken this turn stat for each character where the ownerWallet matches the turnOfPlayer
                    for (var i = 0; i < self.characters.length; i++)
                    {
                        if (self.characters[i].getStat('ownerWallet') === turnOfPlayer)
                        {
                            self.characters[i].setStat('stepsTakenThisTurn', 0);
                        }
                    }
					self.debugText.value(nextTurnText);

					break;
			}
		};
		

		self.characters = [];
		self.selectedCharacter = null;


		// Wait for our textures to load before continuing
		ige.on('texturesLoaded', function () {
			// Create the HTML canvas
			ige.createFrontBuffer(true, false);

			// Start the engine
			ige.start(function (success) {
				// Check if the engine started successfully
				if (userAddress !== matchData['user_wallet'])
				{
				    alert('Loadout has been created for a different wallet.');
				}
				else if (success) {
                    function sendBeginAuthMessage(socket) {
                        const authMessage = {
                            'message': 'auth',
                            'troop_selection': matchData['troop_selection'],	// eg. {'1': {'troops': 111, 'weapons': 134}, '2': {'troops': 114, 'weapons': 1134}}
                            'user_name': matchData['user_name'],
                            'user_wallet': userAddress,
                        };
                        const requestAsJson = JSON.stringify(authMessage);
                        socket.send(requestAsJson);
                    }

                    const loc = window.location;
                    var socket_uri;
                    if (loc.protocol === "https:") {
                        socket_uri = "wss:";
                    } else {
                        socket_uri = "ws:";
                    }
                    socket_uri += "//" + userAddress + ":none@" + loc.host;
                    socket_uri += "/socket/";

					self.socket = new WebSocket(socket_uri);
					self.socket.onopen = function (event) {
						sendBeginAuthMessage(self.socket);
					};
					self.socket.onmessage = function (event) {
						var msg = JSON.parse(event.data);
					  	self.handleServerResponse(msg);
					};
				}
			});
		});

		this.loadTextures();
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }