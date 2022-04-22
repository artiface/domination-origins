import asyncio
import json
import math
import pickle
import secrets
from asyncio import create_task

from pytmx import pytmx

from vector import Vector
from common import Character, CharacterState, Player


class Tile:
	def __init__(self, position):
		self.position = position
		self.textureIndex = 0
		self.isWall = False
		self.character = None

	def toObject(self):
		return {
			'position': {'x': self.position[0], 'y': self.position[1]},
			'textureIndex': self.textureIndex,
			'isWall': self.isWall,
			'character': self.character.toObject() if self.character is not None else None
		}

	@classmethod
	def fromObject(cls, obj):
		tile = Tile(Vector(obj['position']['x'], obj['position']['y']))
		tile.textureIndex = obj['textureIndex']
		tile.isWall = obj['isWall']
		tile.character = Character.fromObject(obj['character']) if obj['character'] is not None else None

class GameState:
	def __init__(self, battleId, width, height):
		self.battleId = battleId
		self.width = width
		self.height = height
		self.tileMap = []
		self.allCharacters = []
		self.turnOfPlayerIndex = -1
		self.teamSpawns = dict()
		self.playerMap = dict()

		self.wallData = None
		self.connectedPlayers = []
		self.clearMap()

	def battleEndCondition(self):
		# check if there is only one team left
		playersWithLivingCharacters = set()
		for char in self.allCharacters:
			if char.state == CharacterState.Dead:
				continue
			playersWithLivingCharacters.add(char.ownerWallet)

		if len(playersWithLivingCharacters) == 1:
			return playersWithLivingCharacters.pop()
		return False

	def startGame(self):
		self.turnOfPlayerIndex = 0

	def turnOfPlayer(self):
		return self.connectedPlayers[self.turnOfPlayerIndex]

	def addSpawn(self, team, position):
		# check if there is a list for this team
		if team not in self.teamSpawns:
			self.teamSpawns[team] = []
		self.teamSpawns[team].append(position)

	def nextTurn(self):
		self.turnOfPlayerIndex = (self.turnOfPlayerIndex + 1) % len(self.connectedPlayers)
		# reset steps
		for char in self.allCharacters:
			if char.ownerWallet == self.turnOfPlayer().wallet:
				char.stepsTakenThisTurn = 0
				char.hasAttackedThisTurn = False

	def spawnTroopsOfPlayer(self, player, troops):
		if player in self.connectedPlayers or len(self.teamSpawns) == 0:
			return False

		troopList = []
		for slot, troopInfo in troops.items():
			troopTokenId = troopInfo['troops']
			troopList.append(Character(player.wallet, troopTokenId))

		playerIndex = len(self.connectedPlayers)
		spawnIndex = playerIndex + 1
		spawns = self.teamSpawns[spawnIndex]
		for index, spawnPosition in enumerate(spawns):
			if index >= len(troopList):
				break
			character = troopList[index]
			character.position = spawnPosition
			self.addChar(character)

		player.playerIndex = playerIndex
		self.connectedPlayers.append(player)
		self.playerMap[player.wallet] = player.playerIndex

	def updatePlayerAfterReconnect(self, player):
		for index, playerInList in enumerate(self.connectedPlayers):
			if playerInList.wallet == player.wallet:
				self.connectedPlayers[index] = player
				player.playerIndex = index

	def clearMap(self):
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

	def loadMap(self):
		tiled_map = pytmx.TiledMap('../assets/maps/lava01.tmx')
		# iterate over the tiles in the map
		gidmap = dict()
		for tileIndex, flags in tiled_map.gidmap.items():
			gidmap[flags[0][0]] = tileIndex - 1

		for x in range(self.width):
			for y in range(self.height):
				for layerIndex, layer in enumerate(tiled_map.layers):
					if layer.name == "Spawns_N_Walls":
						tile = tiled_map.get_tile_gid(x, y, layerIndex)
						if tile:
							tileIndex = gidmap[tile]
							if tileIndex in [3, 4]:
								self.addSpawn(tileIndex - 2, Vector(x, y))
					elif layer.name == "GroundTiles":
						tile = tiled_map.get_tile_gid(x, y, layerIndex)
						if tile:
							self.setTexture(x, y, gidmap[tile])
		self.updateWallMap()

	async def broadcast(self, message):
		responseAsJson = json.dumps(message)
		# remove all players that are not connected
		for player in self.connectedPlayers:
			if player.socket.closed:
				self.connectedPlayers.remove(player)
		# print('Broadcast: {}'.format(responseAsJson))
		create_task(asyncio.wait([player.socket.send(responseAsJson) for player in self.connectedPlayers]))

	async def broadcastState(self):
		for player in self.connectedPlayers:
			if player.socket.closed:
				self.connectedPlayers.remove(player)
			else:
				print('Broadcast state to player with index {}'.format(player.playerIndex))
				create_task(self.sendPlayerState(player))

	async def sendPlayerState(self, player):
		state = self.getCurrentState()
		state['playerId'] = player.playerIndex
		create_task(player.respond(state))

	def getCurrentState(self):
		charData = [char.toObject() for char in self.allCharacters]
		state = {
			'message': 'initialize',
			'turnOfPlayer': self.turnOfPlayerIndex,
			'error': '',
			'map_data': {
				'texture_data': self.getTextureMap(),
				'size': {'width': self.width, 'height': self.height},
				'wall_data': self.wallData
			},
			'char_data': charData
		}
		return state

	# use pickle to serialize the complete class to a file
	async def saveToDisk(self):
		with open('./battlecache/bs_{}.json'.format(self.battleId), 'w', encoding='utf-8') as f:
			json.dump(self.toObject(), f, ensure_ascii=False, indent=4)

	@staticmethod
	def fromFile(filename):
		# load json data from file
		with open(filename, 'r', encoding='utf-8') as f:
			gameStateObj = json.load(f)
			state = GameState(gameStateObj['battleId'], gameStateObj['width'], gameStateObj['height'])
			state.playerMap = gameStateObj['playerMap']
			state.turnOfPlayerIndex = gameStateObj['turnOfPlayerIndex']
			state.allCharacters = [Character.fromObject(char) for char in gameStateObj['allCharacters']]
			state.tileMapFromObject(gameStateObj['tileMap'])
			return state

	def toObject(self):
		return {
			'battleId': self.battleId,
			'width': self.width,
			'height': self.height,
			'playerMap': self.playerMap,
			'turnOfPlayerIndex': self.turnOfPlayerIndex,
			'allCharacters': [char.toObject() for char in self.allCharacters],
			'tileMap': self.tileMapToObject(),
		}

	def tileMapToObject(self):
		return [[tile.toObject() for tile in row] for row in self.tileMap]

	def tileMapFromObject(self, tileMapObj):
		self.tileMap = [[Tile.fromObject(tile) for tile in row] for row in tileMapObj]

	def reconnectPlayer(self, player):
		for inPlayer in self.connectedPlayers:
			if inPlayer.socket.closed and inPlayer == player and not player.socket.closed:
				inPlayer.socket = player.socket
				player.playerIndex = inPlayer.playerIndex
				player.currentBattle = self.battleId

	def disconnectedPlayers(self):
		discPlayers = []
		for player in self.connectedPlayers:
			if player.socket.closed:
				discPlayers.append(player)
		return discPlayers

	def dealDamage(self, attacker, defender, damage):
		defender.currentHealth -= damage
		if defender.currentHealth <= 0:
			defender.state = CharacterState.Dead
			return True
		return False

	async def meleeAttack(self, attacker, defender):
		chanceToHit = attacker.intelligence * attacker.level

		attacker.hasAttackedThisTurn = True
		damage = attacker.weapon.damage()
		hit = secrets.randbelow(100) < chanceToHit
		killed = False
		if hit:
			killed = self.dealDamage(attacker, defender, damage)
		response = {
			'message': 'meleeAttack',
			'error': '',
			'attacker_tile': attacker.position,
			'attacker': attacker.charId,
			'attacker_health': attacker.currentHealth,
			'defender_tile': defender.position,
			'defender': defender.charId,
			'defender_health': defender.currentHealth,
			'hit': hit,
			'damage': damage if hit else 0,
			'killed': killed
		}
		create_task(self.broadcast(response))

	async def rangedAttack(self, attacker, defender):
		dist = math.dist(attacker.position, defender.position)
		chanceToHit = (attacker.dexterity * attacker.level) - 5 * dist

		attacker.hasAttackedThisTurn = True
		damage = attacker.weapon.damage()
		hit = secrets.randbelow(100) < chanceToHit
		killed = False
		if hit:
			killed = self.dealDamage(attacker, defender, damage)
		response = {
			'message': 'rangedAttack',
			'error': '',
			'attacker_tile': attacker.position,
			'attacker': attacker.charId,
			'attacker_health': attacker.currentHealth,
			'defender_tile': defender.position,
			'defender': defender.charId,
			'defender_health': defender.currentHealth,
			'hit': hit,
			'damage': damage if hit else 0,
			'killed': killed
		}
		create_task(self.broadcast(response))

	async def sendBattleEnd(self, winner):
		response = {
			'message': 'battleEnd',
			'error': '',
			'winner': winner
		}
		create_task(self.broadcast(response))