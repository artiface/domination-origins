#!/usr/bin/env python

# WS server example

import asyncio
import websockets
import json
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder
import math
from skillhandler import SkillHandler
from common import *
from vector import Vector
from gamemap import GameMap

class GameServer:

    def __init__(self, hostname, port):
        self.knownRemotes = {}
        self.connected = set()
        self.gameMap = GameMap(10, 10)  # TODO: load map data from somewhere        
        self.gameMap.setTexture(1, 1, 1)
        self.gameMap.setTexture(1, 2, 1)
        self.gameMap.setTexture(1, 3, 1)
        self.wallData = self.gameMap.getWallMap()

        self.gameMap.addChar(Character(0, 0, 0, 0))
        self.gameMap.addChar(Character(1, 0, 2, 0))
        self.gameMap.addChar(Character(2, 1, 0, 2))
        self.gameMap.addChar(Character(3, 1, 0, 4))
        
        self.turnOfPlayer = 0
        self.skillHandler = SkillHandler(self)
        print("Server Init")
        print(self.gameMap.toString())
        
    def charById(self, charId):
        return self.gameMap.allCharacters[charId]

    def charByPos(self, x, y):
        return self.gameMap.getTile(x, y).character

    def findPath(self, startX, startY, endX, endY):
        grid = Grid(matrix=self.gameMap.getNavigationMap())
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
        charData = [char.toObject() for char in self.gameMap.allCharacters]
        state = {'message': 'initialize', 'error': '', 'map_data': {'texture_data': self.gameMap.getTextureMap(), 'size': {'width': self.gameMap.width, 'height': self.gameMap.height}, 'wall_data': self.wallData }, 'char_data': charData}
        return state

    def startTurnOfNextPlayer(self):
        playerCount = len(self.connected)
        self.turnOfPlayer = (self.turnOfPlayer + 1) % playerCount
        
        # reset steps
        for char in self.gameMap.allCharacters:
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
        char = charById(charId)
        
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
        self.gameMap.moveChar(char, Vector(dest['x'], dest['y']))
        response = {'message': messageType, 'error': '', 'characterId': charId, 'destination': dest}        
        await self.broadcast(response)

    async def handleUseSkill(self, player, char, message):
        isBroadCast, response = self.skillHandler.handleSkillUsage(char, message)
        if isBroadCast:
            await self.broadcast(response)
        else:
            await player.respond(response)
            
    async def handleAttack(self, player, charId, target):
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

        otherChar = self.charByPos(target['x'], target['y'])
        if otherChar:
            char.hasAttackedThisTurn = True
            response = {'message': 'attack', 'error': '', 'characterId': charId, 'target': target, 'victimId': otherChar.charId }
            await self.broadcast(response)
            await asyncio.sleep(0.5)
            await self.killCharacter(otherChar.charId, charId)                
            return

        await player.respond({'message': 'attack', 'error': 'no target.'})

    async def handleRequest(self, socket, request):
        player = self.playerBySocket(socket)
        messageType = request['message']
        response = {'error': 'unknown message.'}
        
        if messageType == 'initialize':
            response = self.getCurrentState()
            response['yourPlayerId'] = player.index
            await player.respond(response)

        elif len(self.connected) < 2:
            await player.respond({'message': messageType, 'error': 'waiting for other players.'})
            return
        elif self.turnOfPlayer != player.index:
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
            char = charById(charId)
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
        if len(self.connected) >= 2:
            await websocket.send(json.dumps({'error': 'Too many players.'}))
            await websocket.close()
            return

        username = websocket.username
        remote = websocket.remote_address

        if username in self.knownRemotes:
            playerIndex = self.knownRemotes[username]
            print('Known Player {} re-connected from {} with ID {}!'.format(username, remote, playerIndex))
        else:
            playerIndex = len(self.connected)
            self.knownRemotes[username] = playerIndex
            print('The Player {} connected from {} with ID {}!'.format(username, remote, playerIndex))
        
        self.connected.add(Player(playerIndex, websocket))

        try:
            while True:
                payload = await websocket.recv()
                print('Request: {}'.format(payload))
                request = json.loads(payload)
                await self.handleRequest(websocket, request)

        except (websockets.exceptions.ConnectionClosedOK, asyncio.exceptions.IncompleteReadError) as e:
            print("Connection lost: " + str(e))
        finally:
            playerToRemove = self.playerBySocket(websocket)
            self.connected.remove(playerToRemove)
            print("Player with ID {} removed.".format(playerToRemove.index))       

    def run(self):
        start_server = websockets.serve(self.messageLoop, hostname, port,
            create_protocol=websockets.basic_auth_protocol_factory(
            realm="CryptoG4N9 Battle Server",
            check_credentials=self.authenticate
        ))
        print("Starting server on {}:{}..".format(hostname, port))
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

hostname = "localhost"
port = 2000

server = GameServer(hostname, port)
server.run()