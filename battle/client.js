const Move = 0
const Attack = 1

const matchData = JSON.parse(window.localStorage.getItem('match_data'));

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
		ige.addComponent(IgeEditorComponent);
		ige.globalSmoothing(true);

		// Load our textures
		var self = this;
		this.obj = [];
		this.gameTexture = {};
		
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

        self.reloadCharacters = function(charData) {
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
            const isOwner = charData['owner'] == self.playerId;

            const char = new Character()
                .layer(1)
                .id('char_' + charId.toString())
                .setTokenId(troopTokenId)
                .setCharId(charId)
                .mouseOver(overFunc)
                .mouseOut(outFunc)
                .drawBounds(false)
                .drawBoundsData(false)
                .mount(self.tilemap)
                .translateToTile(pos.x, pos.y, 0);

            const boardPiece = new CharacterPiece()
                .layer(1)
                .clientIsOwner(isOwner)
                .mount(char);

            const toolTip = new IgeUiTooltip(char, char, 100, 80, 'tooltip').layer(22);

            if (state === 0)
                char.kill();
            self.characters.push(char);

            char.addComponent(IgePathComponent).path
                .finder(self.pathFinder)
                .tileMap(ige.$('tilemap'))
                .tileChecker(function (tileData, tileX, tileY, node, prevNodeX, prevNodeY, dynamic) {
                    // If the map tile data is set to 1, don't allow a path along it
                    return tileData !== 1;
                })
                .lookAheadSteps(3)
                .dynamic(true)
                .allowSquare(true) // Allow north, south, east and west movement
                .allowDiagonal(false) // Allow north-east, north-west, south-east, south-west movement
                .drawPath(true) // Enable debug drawing the paths
                .drawPathGlow(true) // Enable path glowing (eye candy)
                .drawPathText(false); // Enable path text output
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
				.drawBounds(false)
				.drawBoundsData(false);

			self.objectScene = new IgeScene2d()
				.id('objectScene')
				.depth(0)
				.drawBounds(false)
				.drawBoundsData(false)
				.depthSortMode(2)
				.mount(self.mainScene);

			self.uiScene = new IgeScene2d()
				.id('uiScene')
				.depth(1)
				.drawBounds(false)
				.drawBoundsData(false)
				.ignoreCamera(true) // We don't want the UI scene to be affected by the viewport's camera
				.mount(self.mainScene);

			// Create the main viewport
			self.vp1 = new IgeViewport()
				.id('vp1')
				.autoSize(false)
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

			self.tilemap.map.layerData(0, 0, 1);
			// Define a function that will be called when the
			// mouse cursor moves over one of our entities
			overFunc = function () {
				this.highlight(true);
				ige.input.stopPropagation();
			};

			// Define a function that will be called when the
			// mouse cursor moves away from one of our entities
			outFunc = function () {
				this.highlight(false);
				ige.input.stopPropagation();
			};

			// Create the 3d container that the player
			// entity will be mounted to

			for (let i = 0; i < charData.length; i++) {
				self.createCharacter(charData[i]);
			}

	
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

			// Listen for the mouse up event
			ige.input.on('mouseUp', function (event, x, y, button) {
				var endTile = ige.$('tilemap').mouseToTile();

		  		for (let i = 0; i < self.characters.length; i++) {
			  		var char = self.characters[i];
			  		if (char.highlight())
			  		{
			  			self.selectedCharacter = char;
			  			self.debugText.value("Selected: " + self.selectedCharacter.id());	
			  			return;
			  		}
			  	}

		  		if (!self.selectedCharacter)
		  		    return;

                var characterId = self.selectedCharacter.getCharId();
			  	switch(self.currentAction)
			  	{
			  		case Move:
						self.requestMovement(characterId, endTile.x, endTile.y);
						break;
			  		case Attack:
						self.requestAttack(characterId, endTile.x, endTile.y);
						break;
			  	}			  					
			});

			self.vp1.camera.translateTo(0, 300, 0);
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

		self.handleServerResponse = function(message) {
			if (message['error'])
			{
				self.debugText.value(message['message'] + ': ' + message['error']);
				return;
			}
			switch (message['message'])
			{
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
					    self.reloadCharacters(charData);
					}
					break;
				case 'movement':
					var charIndex = message['characterId'];
					var destination = message['destination'];
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
					self.debugText.value(nextTurnText);
					break;
			}
		};
		

		self.characters = [];
		self.selectedCharacter = null;


		// Wait for our textures to load before continuing
		ige.on('texturesLoaded', function () {
			// Create the HTML canvas
			ige.createFrontBuffer(true);

			// Start the engine
			ige.start(function (success) {
				// Check if the engine started successfully
				if (success) {
                    const queryString = window.location.search;
                    const urlParams = new URLSearchParams(queryString);

                    const battleId = urlParams.get('b');

					const userAddress = matchData['user_wallet'];
					// Setup the socket communication to the server
					self.socket = new WebSocket("ws://"+userAddress+":none@localhost:9000/socket/");
					self.socket.onopen = function (event) {
						var request = {
							'message': 'initialize',
							'user_name': matchData['user_name'],
							'user_wallet': matchData['user_wallet'],
							'troop_selection': matchData['troop_selection'],
							'signature': matchData['signature'],
							'battle_id': battleId
						};
						var requestAsJson = JSON.stringify(request);
				  		self.socket.send(requestAsJson);
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