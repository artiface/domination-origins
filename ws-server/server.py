#!/usr/bin/env python

# WS server example

import asyncio
import websockets
import json
from enum import IntEnum
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder

class CharacterState(IntEnum):
    Dead = 0
    Alive = 1

class Player:
    def __init__(self, playerIndex, websocket):
        self.index = playerIndex
        self.socket = websocket

    async def respond(self, response):        
        jsonResponse = json.dumps(response)
        await self.socket.send(jsonResponse)
        print('Response: {}'.format(jsonResponse))

class Character:
    def __init__(self, charId, owner, x, y):
        self.owner = owner
        self.charId = charId
        self.x = x
        self.y = y
        self.state = CharacterState.Alive

    def moveTo(self, dest):
        self.x = dest['x']
        self.y = dest['y']

    def toObject(self):
        return {
            'owner': self.owner,
            'charId': self.charId,
            'pos': {'x': self.x, 'y': self.y},
            'state': self.state
        }

class GameServer:

    def __init__(self, hostname, port):
        self.knownRemotes = {}
        self.connected = set()
        self.mapSize = {'width': 10, 'height': 10}
        self.mapData = {"data":{"1":{"1":1,"2":1,"3":1,"4":1,"5":1},"2":{"1":1,"5":1},"3":{"1":1,"3":1,"6":1},"4":{"1":1,"3":1,"4":1,"6":1},"5":{"1":1,"4":1,"6":1},"6":{"1":1,"2":1,"4":1}},"dataXY":[0,0]}
        self.characters = [Character(0, 0, 0, 0), Character(1, 0, 2, 0), Character(2, 1, 0, 2), Character(3, 1, 0, 4)]
        self.turnOfPlayer = 0
        self.flatMap = []
        self.navMap = []
        print("Server Init")
        self.updateMaps()
        self.printFlatMap()
        self.printNavMap()

    def findCharByPos(self, x, y):
        for char in self.characters:
            if char.x == x and char.y == y:
                return char
        return False

    def printFlatMap(self):        
        for y in range(self.mapSize['height']):
            for x in range(self.mapSize['width']):                        
                print(self.flatMap[y][x], end='')
            print()

    def printNavMap(self):        
        for y in range(self.mapSize['height']):
            for x in range(self.mapSize['width']):                        
                print(self.navMap[y][x], end='')
            print()

    def findPath(self, startX, startY, endX, endY):
        grid = Grid(matrix=self.navMap)
        start = grid.node(startX, startY)
        end = grid.node(endX, endY)
        finder = AStarFinder()
        path, runs = finder.find_path(start, end, grid)
        print('operations:', runs, 'path length:', len(path))
        print(grid.grid_str(path=path, start=start, end=end))
        return path

    def updateMaps(self):
        self.flatMap = []
        self.navMap = []
        for y in range(self.mapSize['height']):               
            row = []
            navRow = []         
            for x in range(self.mapSize['width']): 
                tile = '.'
                navTile = 1
                if str(y) in self.mapData['data']:
                    if str(x) in self.mapData['data'][str(y)]:
                        tile = '#'
                        navTile = 0
                charAtTile = self.findCharByPos(x, y)
                if charAtTile:
                    tile = charAtTile.charId
                    navTile = -1
                row.append(tile)
                navRow.append(navTile)
            self.flatMap.append(row)
            self.navMap.append(navRow)



    async def authenticate(self, user, password):
        return True

    def run(self):

        start_server = websockets.serve(self.messageLoop, hostname, port,
            create_protocol=websockets.basic_auth_protocol_factory(
            realm="CryptoG4N9 Battle Server",
            check_credentials=self.authenticate
        ))
        print("Starting server on {}:{}..".format(hostname, port))
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

    def playerBySocket(self, websocket):
        for player in self.connected:
            if player.socket == websocket:
                return player

    def getCurrentState(self):
        charData = [char.toObject() for char in self.characters]
        state = {'message': 'initialize', 'error': '', 'map_size': self.mapSize, 'map_data': self.mapData, 'char_data': charData}
        return state

    def startTurnOfNextPlayer(self):
        playerCount = len(self.connected)
        self.turnOfPlayer = (self.turnOfPlayer + 1) % playerCount


    async def killCharacter(self, charId, killerId):
        characterToKill = self.characters[charId]
        characterToKill.state = CharacterState.Dead
        response = {'message': 'death', 'error': '', 'characterId': charId, 'killerId': killerId }
        await self.broadcast(response)

    async def handleMovement(self, player, charId, dest):
        char = self.characters[charId]
        path = self.findPath(char.x, char.y, dest['x'], dest['y'])
        if len(path) > 0:
            char.moveTo(dest)
            self.updateMaps()
            self.printFlatMap()
            response = {'message': 'movement', 'error': '', 'characterId': charId, 'destination': dest}        
            await self.broadcast(response)
        else:
            await player.respond({'message': 'movement', 'error': 'no path.'})

    async def handleAttack(self, player, charId, target):
        for otherChar in self.characters:
            if otherChar.x == target['x'] and otherChar.y == target['y']:
                response = {'message': 'attack', 'error': '', 'characterId': charId, 'target': target, 'victimId': otherChar.charId }
                await self.broadcast(response)
                await asyncio.sleep(0.5)
                await self.killCharacter(otherChar.charId, charId)                
                return
        await player.respond({'message': messageType, 'error': 'no target.'})

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
        elif 'characterId' in request and self.characters[request['characterId']].owner != player.index:
            await player.respond({'message': messageType, 'error': 'not your character'})
            return
        elif 'characterId' in request and self.characters[request['characterId']].state == CharacterState.Dead:
            await player.respond({'message': messageType, 'error': 'character cannot act.'})
            return
        elif messageType == 'movement':
            dest = request['destination']
            charId = request['characterId']
            await self.handleMovement(player, charId, dest)            

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

        except websockets.exceptions.ConnectionClosedOK:
            print("Connection lost")
        finally:
            playerToRemove = self.playerBySocket(websocket)
            self.connected.remove(playerToRemove)
            print("Player with ID {} removed.".format(playerToRemove.index))       

hostname = "localhost"
port = 2000

server = GameServer(hostname, port)
server.run()