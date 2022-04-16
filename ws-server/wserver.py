#!/usr/bin/env python

import asyncio
import websockets
import json
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder
import math

from siwe import siwe
from siwe.siwe import SiweMessage

from skillhandler import SkillHandler
from common import *
from vector import Vector
from gamestate import GameState
from web3 import Web3
from storage import Storage
import pytmx

from chain import ChainLoader

class GameServer:

    def __init__(self, hostname, port):
        self.port = port
        self.hostname = hostname
        self.connected = set()
        self.storage = Storage('battles.sqlite')
        self.matches = {}
        self.skillHandler = SkillHandler(self)
        print("Server Init")
        #print(self.gameMap.toString())
  
    def charById(self, charId):
        return self.state().charById(charId)

    def charByPos(self, x, y):
        return self.state().getTile(x, y).character

    def findPath(self, startX, startY, endX, endY):
        grid = Grid(matrix=self.state().getNavigationMap())
        start = grid.node(startX, startY)
        end = grid.node(endX, endY)
        finder = AStarFinder()
        path, runs = finder.find_path(start, end, grid)
        print('operations:', runs, 'path length:', len(path))
        print(grid.grid_str(path=path, start=start, end=end))
        return path

    async def authenticate(self, user, password):
        return True

    def playerBySocket(self, websocket):
        for player in self.connected:
            if player.socket == websocket:
                return player

    def getCurrentState(self):
        charData = [char.toObject() for char in self.state().allCharacters]
        state = {'message': 'initialize', 'playerId': self.currentPlayer.playerIndex, 'error': '', 'map_data': {'texture_data': self.state().getTextureMap(), 'size': {'width': self.state().width, 'height': self.state().height}, 'wall_data': self.state().wallData}, 'char_data': charData}
        return state

    async def killCharacter(self, charId, killerId):
        characterToKill = self.charById(charId)
        characterToKill.state = CharacterState.Dead
        response = {'message': 'death', 'error': '', 'characterId': charId, 'killerId': killerId }
        await self.broadcast(response)

    async def handleMovement(self, player, charId, dest):
        char = self.charById(charId)
        
        if char.stepsTakenThisTurn >= char.agility:
            await player.respond({'message': 'movement', 'error': 'has moved already.'})
            return

        path = self.findPath(char.position[0], char.position[1], dest['x'], dest['y'])
        stepsLeft = char.agility - char.stepsTakenThisTurn
        stepsNeeded = len(path) - 1

        if len(path) == 0:
            await player.respond({'message': 'movement', 'error': 'no path.'})
            return

        if stepsNeeded > stepsLeft:
            await player.respond({'message': 'movement', 'error': 'too far away.'})
            return

        char.stepsTakenThisTurn += stepsNeeded
        await self.moveChar('movement', charId, dest)

    async def handleSprint(self, player, charId, dest):
        char = self.charById(charId)
        
        if char.hasSprinted:
            await player.respond({'message': 'sprint', 'error': 'has sprinted already.'})
            return

        path = self.findPath(char.x, char.y, dest['x'], dest['y'])
        stepsLeft = char.agility
        stepsNeeded = len(path) - 1

        if len(path) == 0:
            await player.respond({'message': 'sprint', 'error': 'no path.'})
            return

        if stepsNeeded > stepsLeft:
            await player.respond({'message': 'sprint', 'error': 'too far away.'})
            return

        await self.moveChar('sprint', charId, dest)

    async def moveChar(self, messageType, charId, dest):
        char = self.charById(charId)
        self.state().moveChar(char, Vector(dest['x'], dest['y']))
        response = {'message': messageType, 'error': '', 'characterId': charId, 'destination': dest}        
        await self.broadcast(response)

    async def handleUseSkill(self, player, char, message):
        isBroadCast, response = self.skillHandler.handleSkillUsage(char, message)
        if isBroadCast:
            await self.broadcast(response)
        else:
            await player.respond(response)
            
    async def handleAttack(self, player, charId, targetPos):
        char = self.charById(charId)
        if char.hasAttackedThisTurn:
            await player.respond({'message': 'attack', 'error': 'attacked already.'})
            return

        isMeleeAttack = char.isNextTo(targetPos)

        if not char.canAttackMelee() and isMeleeAttack:
            await player.respond({'message': 'attack', 'error': 'no melee weapon.'})
            return

        if not char.canAttackRanged() and not isMeleeAttack:
            await player.respond({'message': 'attack', 'error': 'no ranged weapon.'})
            return

        otherChar = self.charByPos(targetPos['x'], targetPos['y'])
        if otherChar:
            char.hasAttackedThisTurn = True
            response = {'message': 'attack', 'error': '', 'characterId': charId, 'target': targetPos , 'victimId': otherChar.tokenId}
            await self.broadcast(response)
            await asyncio.sleep(0.5)
            await self.killCharacter(otherChar.tokenId, charId)
            return

        await player.respond({'message': 'attack', 'error': 'no target.'})

    async def handlePlayerInit(self, player, message):
        # this is the first message we receive from the player
        # so check if he is authenticated and for good measure also verify his signature
        # query the database for the battle this player is in
        # if the battle is not found, return an error
        # if the battle is found, check if we initialized the battle already
        # if we did, re-connect the player to the battle
        # if we did not, initialize the battle and connect the player to it

        battleId = message['battle_id']
        address = message['user_wallet']
        signature = message['signature']
        siweData = self.storage.getSiweCache(address)
        if not siweData:
            await player.respond({'message': 'init', 'error': 'no sign-in data for verification.'})
            return

        siweMessage = SiweMessage(siweData)
        try:
            siweMessage.validate(signature)
        except siwe.ValidationError:
            # no dice..
            await player.respond({'message': 'init', 'error': 'signature verification failed.'})
            return

        battle = self.storage.findBattle(battleId)
        playerData = self.storage.findPlayer(address)

        if playerData['wallet'] != player.wallet:
            await player.respond({'message': 'init', 'error': 'wallet mismatch.'})
            return

        if not battle or not playerData or battle['id'] != playerData['current_battle']:
            await player.respond({'message': 'init', 'error': 'not part of this battle or battle not found.'})
            return

        player.currentBattle = battleId

        chain = ChainLoader()
        troops = message['troop_selection']
        for slot, troopInfo in troops.items():
            troopTokenId = troopInfo['troops']
            if not chain.isOwnerOf(player.wallet, 'char', troopTokenId):
                await player.respond({'message': 'init', 'error': 'not owner of all the troops.'})
                return
        ## TODO: Check the ownership of the items in the same way as the troops
        if player.currentBattle not in self.matches or not self.matches[player.currentBattle]['state']:
            # Create a new battle now
            state = GameState(10, 10)
            self.matches[battleId] = {
                'knownRemotes': {},
                'connected': set(),
                'state': state
            }
            self.loadMap()

        if player in self.state().players:
            # battle is running already, re-connect the player to it
            print('re-connecting player with wallet {} to battle {}'.format(player.wallet, battleId))
            self.state().updatePlayerAfterReconnect(player)
            self.matches[player.currentBattle]['connected'].add(player)
            response = self.getCurrentState()
            await player.respond(response)
            return

        troops = message['troop_selection']

        self.spawnTroopsOfPlayer(player, troops)

        if len(self.state().players) == 2:
            # start the game
            self.state().startGame()

        self.matches[player.currentBattle]['connected'].add(player)
        print('player with wallet {} connected to battle {}'.format(player.wallet, battleId))

        response = self.getCurrentState()
        await self.broadcast(response)

    def spawnTroopsOfPlayer(self, player, troops):
        troopList = []
        for slot, troopInfo in troops.items():
            troopTokenId = troopInfo['troops']
            troopList.append(Character(player, troopTokenId))
        self.state().spawnTeam(player, troopList)

    def state(self):
        return self.matches[self.currentPlayer.currentBattle]['state']

    async def handleRequest(self, socket, request):
        player = self.playerBySocket(socket)
        self.currentPlayer = player
        print('got request from player with wallet {} and index {}'.format(player.wallet, player.playerIndex))
        messageType = request['message']
        response = {'error': 'unknown message.'}
        
        if messageType == 'initialize':
            await self.handlePlayerInit(player, request)
        elif not player.currentBattle:
            await player.respond({'message': messageType, 'error': 'not part of a battle.'})
            return
        elif len(self.matches[player.currentBattle]['connected']) < 2:
            await player.respond({'message': messageType, 'error': 'waiting for other players.'})
            return
        elif self.state().turnOfPlayer() != player:
            await player.respond({'message': messageType, 'error': 'It is the turn of {}.'.format(self.state().turnOfPlayerIndex)})
            return
        elif 'characterId' in request and self.charById(request['characterId']).owner != player:
            await player.respond({'message': messageType, 'error': 'not your character'})
            return
        elif 'characterId' in request and self.charById(request['characterId']).state == CharacterState.Dead:
            await player.respond({'message': messageType, 'error': 'character cannot act.'})
            return
        elif messageType == 'movement':
            dest = request['destination']
            charId = request['characterId']
            await self.handleMovement(player, charId, dest)
        elif messageType == 'sprint':
            dest = request['destination']
            charId = request['characterId']
            await self.handleSprint(player, charId, dest)

        elif messageType == 'useSkill':
            charId = request['characterId']
            char = self.state().charById(charId)
            await self.handleUseSkill(player, char, request)

        elif messageType == 'attack':
            target = request['target']
            charId = request['characterId'] 
            await self.handleAttack(player, charId, target)
    
        elif messageType == 'endTurn':
            self.state().nextTurn()
            response = {'message': messageType, 'error': '', 'turnOfPlayer': self.state().turnOfPlayer().wallet}
            await self.broadcast(response)

    async def broadcast(self, message):
        responseAsJson = json.dumps(message)
        # remove all players that are not connected
        for player in self.state().players:
            if player.socket.closed:
                self.state().players.remove(player)
        print('Broadcast: {}'.format(responseAsJson))
        await asyncio.wait([player.socket.send(responseAsJson) for player in self.state().players])
        await asyncio.sleep(0.1)

    async def globalBroadcast(self, message):
        responseAsJson = json.dumps(message)
        print('Broadcast: {}'.format(responseAsJson))
        await asyncio.wait([player.socket.send(responseAsJson) for player in self.connected])
        await asyncio.sleep(0.1)

    async def messageLoop(self, websocket, path):        
        wallet_address = websocket.username
        remote = websocket.remote_address

        if self.storage.isPlayerAuthenticated(wallet_address):
            print('Known Player {} re-connected from {}!'.format(wallet_address, remote))
        else:
            print('The Player {} connected from {}!'.format(wallet_address, remote))
        
        self.connected.add(Player(wallet_address, websocket))

        try:
            while True:
                payload = await websocket.recv()
                print('Request: {}'.format(payload))
                request = json.loads(payload)
                await self.handleRequest(websocket, request)

        except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError) as e:
            print("Connection lost: " + str(e))
        finally:
            playerToRemove = self.playerBySocket(websocket)
            self.connected.remove(playerToRemove)
            self.matches[playerToRemove.currentBattle]['connected'].remove(playerToRemove)
            print("Player with ID {} removed.".format(playerToRemove.wallet))

    def run(self):
        start_server = websockets.serve(self.messageLoop, self.hostname, self.port,
            create_protocol=websockets.basic_auth_protocol_factory(
            realm="CryptoG4N9 Battle Server",
            check_credentials=self.authenticate
        ))
        print("Starting server on {}:{}..".format(self.hostname, self.port))
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

    def loadMap(self):
        tiled_map = pytmx.TiledMap('../assets/maps/lava01.tmx')
        # iterate over the tiles in the map
        gidmap = dict()
        for tileIndex, flags in tiled_map.gidmap.items():
            gidmap[flags[0][0]] = tileIndex - 1

        for x in range(self.state().width):
            for y in range(self.state().height):
                for layerIndex, layer in enumerate(tiled_map.layers):
                    if layer.name == "Spawns_N_Walls":
                        tile = tiled_map.get_tile_gid(x, y, layerIndex)
                        if tile:
                            tileIndex = gidmap[tile]
                            if tileIndex in [3, 4]:
                                self.state().addSpawn(tileIndex - 2, Vector(x, y))
                    elif layer.name == "GroundTiles":
                        tile = tiled_map.get_tile_gid(x, y, layerIndex)
                        if tile:
                            self.state().setTexture(x, y, gidmap[tile])
        self.state().updateWallMap()




server = GameServer("localhost", 2000)
server.run()