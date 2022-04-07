const Move = 0
const Attack = 1

var Client = IgeClass.extend({
	classId: 'Client',
	init: function () {
		ige.addComponent(IgeEditorComponent);
		ige.globalSmoothing(true);

		// Load our textures
		var self = this;
		this.obj = [];
		self.isInitialized = false;
		self.defaultFont = new IgeFontSheet('../assets/textures/fonts/verdana_12pt.png', 0);
		self.currentAction = Move;

		self.startSetup = function(mapData, charData) {
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
				.autoSize(true)
				.scene(self.mainScene)
				.drawMouse(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.mount(ige);

			// Create an isometric tile map
			self.tilemap = new IgeTileMap2d()
				.id('tilemap')
				.isometricMounts(true)
				.tileWidth(40)
				.tileHeight(40)
				.gridSize(10, 10)
				.drawGrid(5)
				.loadMap(mapData)
				.highlightOccupied(true) // Draws a red tile wherever a tile is "occupied"			
				.drawMouse(true)
				.drawBounds(false)
				.drawBoundsData(false)
				.mount(self.objectScene);

			// Define a function that will be called when the
			// mouse cursor moves over one of our entities
			overFunc = function () {
				this.highlight(true);
			};

			// Define a function that will be called when the
			// mouse cursor moves away from one of our entities
			outFunc = function () {
				this.highlight(false);
			};

			// Create the 3d container that the player
			// entity will be mounted to

			for (let i = 0; i < charData.length; i++) {
				var pos = charData[i]['pos'];
				var state = charData[i]['state'];
				var newChar = new Character()
						.id('char_' + i.toString())
						.addComponent(PlayerComponent)
						.isometric(true)
						.mouseOver(overFunc)
						.mouseOut(outFunc)
						.drawBounds(false)
						.drawBoundsData(false)
						.mount(self.tilemap)
						.translateToTile(pos.x, pos.y, 0);
				if (state === 0)
					newChar.kill();
				self.characters.push(newChar);
			}

			ige.ui.style('#endTurnButton', {
				'top': 0,
				'right': 0,
				'backgroundColor': '#ccc'
			});

			// Create a UI entity so we can test if clicking the entity will stop
			// event propagation down to moving the player. If it's working correctly
			// the player won't move when the entity is clicked.
			
			self.endTurnButton = new IgeUiLabel()
				.id('endTurnButton')
				.depth(1)
				.backgroundColor('#474747')
				.width(120)
				.height(30)
				.top(1)
				.borderTopColor('#666666')
				.borderTopWidth(1)
				.backgroundPosition(0, 0)
				.value('EndTurn')
				.mouseOver(function () {this.backgroundColor('#49ceff'); ige.input.stopPropagation(); })
				.mouseOut(function () {this.backgroundColor('#474747'); ige.input.stopPropagation(); })
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { self.requestEndTurn(); ige.input.stopPropagation(); })
				.mount(self.uiScene);

			self.attackButton = new IgeUiLabel()
				.id('attackButton')
				.depth(1)
				.backgroundColor('#474747')
				.width(120)
				.height(30)
				.top(1)
				.borderTopColor('#666666')
				.borderTopWidth(1)
				.backgroundPosition(0, 0)
				.value('Attack')
				.mouseOver(function () {this.backgroundColor('#49ceff'); ige.input.stopPropagation(); })
				.mouseOut(function () {this.backgroundColor('#474747'); ige.input.stopPropagation(); })
				.mouseMove(function () { ige.input.stopPropagation(); })
				.mouseUp(function () { 
					self.currentAction = Attack;
					ige.input.stopPropagation(); 
				})
				.mount(self.uiScene);
			
			
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

			// Create a path finder
			self.pathFinder = new IgePathFinder()
				.neighbourLimit(100);

			// Set up the chars with pathfinders
			for (let i = 0; i < self.characters.length; i++) {
			  	var char = self.characters[i];

			  	if (self.tilemap.isometricMounts()) {
					// Set the player to move isometrically
					char.isometric(true);
				}

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
					.drawPathText(true); // Enable path text output
			}
			
			// Listen for the mouse up event
			ige.input.on('mouseUp', function (event, x, y, button) {
				var endTile = ige.$('tilemap').mouseToTile();
		  		var characterId = self.characters.indexOf(self.selectedCharacter);

		  		for (let i = 0; i < self.characters.length; i++) {
			  		var char = self.characters[i];
			  		if (char.highlight())
			  		{
			  			self.selectedCharacter = char;
			  			self.debugText.value("Selected: " + self.selectedCharacter.id());	
			  			return;
			  		}
			  	}
		  		

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
					var playerId = message['yourPlayerId'];
					if (!self.isInitialized)
					{
						self.isInitialized = true;
						self.playerId = playerId;
						self.startSetup(mapData, charData);
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
					if (turnOfPlayer === self.playerId)
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
					const username = urlParams.get('u');
					const password = 'TODO';
					// Setup the socket communication to the server
					self.socket = new WebSocket("ws://"+username+":"+password+"@127.0.0.1:2000");
					self.socket.onopen = function (event) {
						var request = {
							'message': 'initialize',				
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
	}
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') { module.exports = Client; }