from vector import Vector
from common import Character

class Tile:
	def __init__(self, position):
		self.position = position
		self.textureIndex = 0
		self.isWall = False
		self.character = None

class GameState:

	def __init__(self, width, height):
		self.width = width
		self.height = height
		self.tileMap = []
		self.allCharacters = []
		self.turnOfPlayerIndex = -1
		self.wallData = None
		self.clear()
		self.teamSpawns = dict()
		self.players = []

	def startGame(self):
		self.turnOfPlayerIndex = 0

	def turnOfPlayer(self):
		return self.players[self.turnOfPlayerIndex]

	def addSpawn(self, team, position):
		# check if there is a list for this team
		if team not in self.teamSpawns:
			self.teamSpawns[team] = []
		self.teamSpawns[team].append(position)

	def nextTurn(self):
		self.turnOfPlayerIndex = (self.turnOfPlayerIndex + 1) % len(self.players)
		# reset steps
		for char in self.allCharacters:
			if char.owner == self.turnOfPlayer():
				char.stepsTakenThisTurn = 0
				char.hasAttackedThisTurn = False

	def spawnTeam(self, player, characters):
		if player in self.players or len(self.teamSpawns) == 0:
			return False

		playerIndex = len(self.players)
		spawnIndex = playerIndex + 1
		spawns = self.teamSpawns[spawnIndex]
		for index, spawnPosition in enumerate(spawns):
			if index >= len(characters):
				break
			character = characters[index]
			character.position = spawnPosition
			self.addChar(character)

		player.playerIndex = playerIndex
		self.players.append(player)

	def updatePlayerAfterReconnect(self, player):
		for index, playerInList in enumerate(self.players):
			if playerInList.wallet == player.wallet:
				self.players[index] = player
				player.playerIndex = index

	def clear(self):
		for y in range(self.height):
			self.tileMap.append([])
			for x in range(self.width):
				self.tileMap[y].append(Tile(Vector(x,y)))

	def inBounds(self, x, y):
		return 0 <= x < self.width and 0 <= y < self.height

	def getTile(self, x, y):
		if not self.inBounds(x, y):
			return False
		return self.tileMap[y][x]

	def isWallAt(self, x, y):
		if not self.inBounds(x, y):
			return True
		tile = self.getTile(x, y)
		return tile.isWall

	def isCharacterOnTile(self, x, y):
		if not self.inBounds(x, y):
			return False
		tile = self.getTile(x, y)
		return tile.character is not None

	def setWall(self, x, y, isWall):
		destTile = self.getTile(x, y)
		destTile.isWall = isWall

	def setTexture(self, x, y, textureIndex):
		destTile = self.getTile(x, y)
		destTile.textureIndex = textureIndex

	def charById(self, charId):
		if charId >= len(self.allCharacters) or charId < 0:
			return None
		return self.allCharacters[charId]

	def addChar(self, char):
		destTile = self.getTile(char.position[0], char.position[1])
		destTile.character = char
		char.charId = len(self.allCharacters)
		self.allCharacters.append(char)

	def moveChar(self, char: Character, destination: Vector):
		oldTile = self.getTile(char.position[0], char.position[1])	
		newTile = self.getTile(destination[0], destination[1])		
		char.position = destination
		oldTile.character = None
		newTile.character = char

	def getTextureMap(self):
		textMap = []
		for y in range(self.height):
			textMap.append([])
			for x in range(self.width):				
				textMap[y].append(self.getTile(x, y).textureIndex)

		return textMap

	# > 0 => Navigation Cost of this walkable tile
	# <= 0 => An obstacle (Wall)
	def getNavigationMap(self):
		navMap = []
		for y in range(self.height):
			navMap.append([])
			for x in range(self.width):
				isFree = not self.isWallAt(x, y) and not self.isCharacterOnTile(x, y)
				navMap[y].append(1 if isFree else -1)

		return navMap

	def updateWallMap(self):
		wallMap = {}
		for y in range(self.height):
			xWalls = {}
			for x in range(self.width):
				if self.isWallAt(x, y):
					xWalls[x] = 1
			if len(xWalls) > 0:
				wallMap[y] = xWalls
		self.wallData = {"data": wallMap, "dataXY": [0,0]}

	def toString(self):
		mapString = ''
		for y in range(self.height):
			for x in range(self.width):
				tileChar = '.'
				if self.isWallAt(x, y):
					tileChar = '#'
				if self.isCharacterOnTile(x, y):
					tileChar = str(self.getTile(x, y).character.tokenId)
				mapString += tileChar
			mapString += '\n'

		return mapString