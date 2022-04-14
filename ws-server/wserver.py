#!/usr/bin/env python

# WS server example

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
        state = {'message': 'initialize', 'error': '', 'map_data': {'texture_data': self.state().getTextureMap(), 'size': {'width': self.state().width, 'height': self.state().height}, 'wall_data': self.state().wallData}, 'char_data': charData}
        return state

    def startTurnOfNextPlayer(self):
        playerCount = len(self.connected)
        self.turnOfPlayer = (self.state().turnOfPlayer + 1) % playerCount
        
        # reset steps
        for char in self.state().allCharacters:
            if char.owner == self.turnOfPlayer:
                char.stepsTakenThisTurn = 0
                char.hasAttackedThisTurn = False


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
            response = {'message': 'attack', 'error': '', 'characterId': charId, 'target': targetPos , 'victimId': otherChar.charId }
            await self.broadcast(response)
            await asyncio.sleep(0.5)
            await self.killCharacter(otherChar.charId, charId)                
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

        battle = self.storage.findBattle(battleId)
        playerData = self.storage.findPlayer(address)

        if not battle or not playerData or battle['id'] != playerData['current_battle']:
            await player.respond({'message': 'init', 'error': 'not part of this battle or battle not found.'})
            return

        player.currentBattle = battleId

        if battleId in self.matches:
            # battle is running already, re-connect the player to it
            response = self.getCurrentState()
            await player.respond(response)

        # Create a new battle now
        state = GameState(10, 10)

        self.matches[battleId] = {
            'knownRemotes': {},
            'connected': set(),
            'state': state
        }

        # TODO: load map data from somewhere
        state.setTexture(1, 1, 1)
        state.setTexture(1, 2, 1)
        state.setTexture(1, 3, 1)

        # TODO: verify loadout ownership
        # TODO: add characters to map, if the battle has not yet begun
        #       and the units of this player aren't on the map already
        troops = message['troop_selection']

        state.addChar(Character(0, 0, 0, 0))
        state.addChar(Character(1, 0, 2, 0))
        state.addChar(Character(2, 1, 0, 2))
        state.addChar(Character(3, 1, 0, 4))
        
        state.turnOfPlayer = 0

        state.updateWallMap()

        response = self.getCurrentState()
        await player.respond(response)

    def state(self):
        return self.matches[self.currentPlayer.currentBattle]['state']

    async def handleRequest(self, socket, request):
        player = self.playerBySocket(socket)
        self.currentPlayer = player

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
        elif self.state().turnOfPlayer != player.index:
            await player.respond({'message': messageType, 'error': 'not your turn.'})
            return
        elif 'characterId' in request and self.charById(request['characterId']).owner != player.index:
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
            self.startTurnOfNextPlayer()
            response = {'message': messageType, 'error': '', 'turnOfPlayer': self.turnOfPlayer}
            await self.broadcast(response)

    async def broadcast(self, message):
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

        except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError, asyncio.exceptions.IncompleteReadError) as e:
            print("Connection lost: " + str(e))
        finally:
            playerToRemove = self.playerBySocket(websocket)
            self.connected.remove(playerToRemove)
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

server = GameServer("localhost", 2000)
server.run()