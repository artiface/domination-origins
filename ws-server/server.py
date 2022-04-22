#!/usr/bin/env python

import asyncio
import os

import websockets
from siweman import SignInManager
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder

from skillhandler import SkillHandler
from common import *
from vector import Vector
from gamestate import GameState
from storage import Storage

from chain import ChainLoader

class GameServer:

    def __init__(self, hostname, port):
        self.battlecache = './battlecache/'
        self.siwe = SignInManager()
        self.port = port
        self.hostname = hostname
        self.connected = set()
        self.playersLookingForBattle = set()
        self.storage = Storage('battles.sqlite')
        self.matches = {}
        self.skillHandler = SkillHandler(self)
        print("Server Init")
        if self.battlesAreOnDisk():
            print("Loading existing battles from disk")
            self.loadBattles()
  
    def charById(self, player: Player, charId: int):
        return self.state(player).charById(charId)

    def charByPos(self, player, x, y):
        return self.state(player).getTile(x, y).character

    def findPath(self, player, startX, startY, endX, endY):
        grid = Grid(matrix=self.state(player).getNavigationMap())
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

    async def handleMovement(self, player, charId, dest):
        char = self.charById(player, charId)
        
        if char.stepsTakenThisTurn >= char.agility:
            create_task(player.respond({'message': 'movement', 'error': 'has moved already.'}))
            return

        path = self.findPath(player, char.position[0], char.position[1], dest['x'], dest['y'])
        stepsLeft = char.agility - char.stepsTakenThisTurn
        stepsNeeded = len(path) - 1

        if len(path) == 0:
            create_task(player.respond({'message': 'movement', 'error': 'no path.'}))
            return

        if stepsNeeded > stepsLeft:
            create_task(player.respond({'message': 'movement', 'error': 'too far away.'}))
            return

        char.stepsTakenThisTurn += stepsNeeded
        create_task(self.moveChar(player, 'movement', char, dest))

    async def handleSprint(self, player, charId, dest):
        char = self.charById(player, charId)
        
        if char.hasSprinted:
            create_task(player.respond({'message': 'sprint', 'error': 'has sprinted already.'}))
            return

        path = self.findPath(player, char.x, char.y, dest['x'], dest['y'])
        stepsNeeded = len(path) - 1

        if len(path) == 0:
            create_task(player.respond({'message': 'sprint', 'error': 'no path.'}))
            return

        if stepsNeeded > char.agility:
            create_task(player.respond({'message': 'sprint', 'error': 'too far away.'}))
            return

        create_task(self.moveChar(player, 'sprint', char, dest))

    async def moveChar(self, player, messageType, char: Character, dest):
        self.state(player).moveChar(char, Vector(dest['x'], dest['y']))
        response = {'message': messageType, 'error': '', 'characterId': char.charId, 'destination': dest, 'stepsTakenThisTurn': char.stepsTakenThisTurn}
        create_task(self.state(player).broadcast(response))

    async def handleUseSkill(self, player, char, message):
        isBroadCast, response = self.skillHandler.handleSkillUsage(char, message)
        if isBroadCast:
            create_task(self.state(player).broadcast(response))
        else:
            create_task(player.respond(response))
            
    async def handleAttack(self, player, charId, targetPos):
        char = self.charById(player, charId)
        if char.hasAttackedThisTurn:
            create_task(player.respond({'message': 'attack', 'error': 'attacked already.'}))
            return

        isMeleeAttack = char.isNextTo(targetPos)

        if not char.canAttackMelee() and isMeleeAttack:
            create_task(player.respond({'message': 'attack', 'error': 'no melee weapon.'}))
            return

        if not char.canAttackRanged() and not isMeleeAttack:
            create_task(player.respond({'message': 'attack', 'error': 'no ranged weapon.'}))
            return

        otherChar = self.charByPos(player, targetPos['x'], targetPos['y'])
        if otherChar:
            if isMeleeAttack:
                create_task(self.state(player).meleeAttack(char, otherChar))
            else:
                create_task(self.state(player).rangedAttack(char, otherChar))
        else:
            create_task(player.respond({'message': 'attack', 'error': 'no target.'}))

    async def isOwnerOfLoadout(self, player, loadout: LoadOut):
        chain = ChainLoader()
        for slot, troopInfo in loadout.troopselection.items():
            troopTokenId = troopInfo['troops']
            if not chain.isOwnerOf(player.wallet, 'char', troopTokenId):
                return False
        return True

    async def createNewBattle(self, playerOne, playerTwo):
        battleId = self.storage.createBattle()
        state = GameState(battleId, 10, 10)
        state.loadMap()
        self.matches[battleId] = state
        self.playersLookingForBattle.remove(playerOne)
        self.playersLookingForBattle.remove(playerTwo)
        playerOne.currentBattle = battleId
        playerTwo.currentBattle = battleId
        state.spawnTroopsOfPlayer(playerOne, playerOne.loadout.troopselection)
        state.spawnTroopsOfPlayer(playerTwo, playerTwo.loadout.troopselection)
        state.startGame()
        create_task(state.broadcastState())
        create_task(state.saveToDisk())
        print('battle {} created and saved to disk!\nassigned battleId and playerIndex to players..\n{}: {}\n{}: {}'.format(battleId, playerOne.playerIndex, playerOne.wallet, playerTwo.playerIndex, playerTwo.wallet))

    def state(self, player: Player) -> GameState:
        return self.matches[player.currentBattle]

    async def handleRequest(self, player, request):
        messageType = request['message']
        print('{}({}): {}'.format(player.wallet, player.playerIndex, messageType))
        response = {'error': 'unknown message.'}
        if messageType == 'auth':
            create_task(self.handleAuth(player, request))
            return
        elif messageType == 'siwe':
            create_task(self.handleSiwe(player, request))
            return
        elif not player.currentBattle:
            create_task(player.respond({'message': messageType, 'error': 'not part of a battle.'}))
            return
        elif len(self.state(player).connectedPlayers) < 2:
            create_task(player.respond({'message': messageType, 'error': 'waiting for other players.'}))
            return
        elif self.state(player).turnOfPlayer() != player:
            create_task(player.respond({'message': messageType, 'error': 'It is the turn of {}.'.format(self.state(player).turnOfPlayerIndex)}))
            return
        elif 'characterId' in request and self.charById(player, request['characterId']).ownerWallet != player.wallet:
            create_task(player.respond({'message': messageType, 'error': 'not your character'}))
            return
        elif 'characterId' in request and self.charById(player, request['characterId']).state == CharacterState.Dead:
            create_task(player.respond({'message': messageType, 'error': 'character cannot act.'}))
            return
        elif messageType == 'movement':
            dest = request['destination']
            charId = request['characterId']
            create_task(self.handleMovement(player, charId, dest))
            return
        elif messageType == 'sprint':
            dest = request['destination']
            charId = request['characterId']
            create_task(self.handleSprint(player, charId, dest))
            return

        elif messageType == 'useSkill':
            charId = request['characterId']
            char = self.state(player).charById(charId)
            create_task(self.handleUseSkill(player, char, request))
            return

        elif messageType == 'attack':
            target = request['target']
            charId = request['characterId'] 
            create_task(self.handleAttack(player, charId, target))
            return
    
        elif messageType == 'endTurn':
            winner = self.state(player).battleEndCondition()
            if winner:
                create_task(self.state(player).sendBattleEnd(winner))
            else:
                self.state(player).nextTurn()
                response = {'message': messageType, 'error': '', 'turnOfPlayer': self.state(player).turnOfPlayer().wallet}
                create_task(self.state(player).broadcast(response))
            return

    async def globalBroadcast(self, message):
        responseAsJson = json.dumps(message)
        #print('Broadcast: {}'.format(responseAsJson))
        create_task(asyncio.wait([player.socket.send(responseAsJson) for player in self.connected]))

    async def messageLoop(self, websocket, path):
        wallet_address = websocket.username
        remote = websocket.remote_address
        player = Player(wallet_address, websocket)

        self.connected.add(player)

        try:
            while True:
                payload = await websocket.recv()
                #print('Request: {}'.format(payload))
                request = json.loads(payload)
                await self.handleRequest(player, request)

        except (websockets.exceptions.ConnectionClosedOK, websockets.exceptions.ConnectionClosedError) as e:
            print("Connection lost: " + str(e))
        finally:
            # playerToRemove = self.playerBySocket(websocket)
            self.connected.discard(player)
            print("Player with ID {} removed from battle {}.".format(player.wallet, player.currentBattle))

    def run(self):
        start_server = websockets.serve(self.messageLoop, self.hostname, self.port,
            create_protocol=websockets.basic_auth_protocol_factory(
            realm="CryptoG4N9 Battle Server",
            check_credentials=self.authenticate
        ))
        print("Starting server on {}:{}..".format(self.hostname, self.port))
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()

    async def handleAuth(self, player, request):
        user_wallet = request['user_wallet']
        loadout = LoadOut(request['troop_selection'])
        siweMessage = self.siwe.createSiweMessage(user_wallet, loadout.toString())
        create_task(player.respond({'message': 'auth', 'siwe_message': siweMessage.prepare_message()}))

    async def handleSiwe(self, player: Player, request):
        user_wallet = request['user_wallet']
        signature = request['signature']
        loadout = LoadOut(request['troop_selection'])

        validated = self.siwe.validate(user_wallet, signature)
        is_owner_of_loadout = await self.isOwnerOfLoadout(player, loadout)
        # TODO: add further checks for the loadout
        #  - check for duplicate troops

        if not validated or not is_owner_of_loadout:
            create_task(player.respond({'message': 'siwe', 'error': 'Login failed.'}))
            return

        create_task(self.postAuthentication(player, loadout))

    async def postAuthentication(self, player: Player, loadout: LoadOut):
        print('Player {} authenticated! Loadout verified and assigned:\n\n{}'.format(player.wallet, loadout.toString()))
        create_task(player.respond({'message': 'siwe', 'success': 'Welcome to the battle'}))
        player.loadout = loadout

        runningBattle = self.findRunningBattle(player)
        if runningBattle:
            runningBattle.reconnectPlayer(player)
            print('reconnected player {} to battle {}'.format(player.wallet, runningBattle.battleId))
            create_task(runningBattle.sendPlayerState(player))
        else:
            self.playersLookingForBattle.add(player)
            create_task(self.startMatchMaking())

    async def startMatchMaking(self):
        if len(self.playersLookingForBattle) <= 1:
            return

        pit = iter(self.playersLookingForBattle)
        first = next(pit)
        second = next(pit)
        print('Starting match between {} and {}'.format(first.wallet, second.wallet))
        create_task(self.createNewBattle(first, second))

    def findRunningBattle(self, player) -> GameState:
        for battleId, battle in self.matches.items():
            disconnectedPlayers = battle.disconnectedPlayers()
            if player in disconnectedPlayers:
                return battle
        return None

    def battlesAreOnDisk(self):
        if len(os.listdir(self.battlecache)) > 0:
            return True
        return False

    def loadBattles(self):
        for path in os.listdir(self.battlecache):
            state = GameState.fromFile(self.battlecache + path)
            self.matches[state.battleId] = state
            print('Restored battle {} from disk'.format(state.battleId))


server = GameServer("localhost", 2000)
server.run()
