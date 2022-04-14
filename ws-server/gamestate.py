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
		self.turnOfPlayer = 0
		self.wallData = None
		self.clear()

	def clear(self):
		for y in range(self.height):
			self.tileMap.append([])
			for x in range(self.width):
				self.tileMap[y].append(Tile(Vector(x,y)))

	def inBounds(self, x, y):
		return x >= 0 and x < self.width and y >= 0 and y < self.height

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
		return tile.character != None

	def setWall(self, x, y, isWall):
		destTile = self.getTile(x, y)
		destTile.isWall = isWall

	def setTexture(self, x, y, textureIndex):
		destTile = self.getTile(x, y)
		destTile.textureIndex = textureIndex

	def charById(self, charId):
		for char in self.allCharacters:
			if char.charId == charId:
				return char
		return None

	def addChar(self, char):
		destTile = self.getTile(char.position[0], char.position[1])
		destTile.character = char
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
					tileChar = str(self.getTile(x, y).character.charId)
				mapString += tileChar
			mapString += '\n'

		return mapString