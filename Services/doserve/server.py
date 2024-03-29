#!/usr/bin/env python

import asyncio
import json
import os
from asyncio import create_task

import websockets

from doserve.config import BATTLE_DATA_DIRECTORY
from doserve.common.character import Character
from doserve.common.enums import CharacterState
from doserve.common.loadout import LoadOut
from doserve.common.player import Player
from siweman import SignInManager
from pathfinding.core.grid import Grid
from pathfinding.finder.a_star import AStarFinder

from skillhandler import SkillHandler
from vector import Vector
from gamestate import GameState
from storage import Storage

from chain import ChainLoader

class GameServer:

    def __init__(self, hostname, port):
        self.ownershipChecks = False
        self.battlecache = os.path.join(BATTLE_DATA_DIRECTORY, 'running')
        self.battlearchive = os.path.join(BATTLE_DATA_DIRECTORY, 'archive')
        self.siwe = SignInManager()
        self.port = port
        self.hostname = hostname
        self.connected = set()
        self.playersLookingForBattle = set()
        self.storage = Storage(os.path.join(BATTLE_DATA_DIRECTORY, 'battles.sqlite'))
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
        if not self.state(player).inBounds(dest['x'], dest['y']):
            create_task(player.respond({'message': 'movement', 'error': 'out of bounds.'}))
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

        path = self.findPath(player, char.position[0], char.position[1], dest['x'], dest['y'])
        stepsNeeded = len(path) - 1

        if len(path) == 0:
            create_task(player.respond({'message': 'sprint', 'error': 'no path.'}))
            return

        if stepsNeeded > char.agility:
            create_task(player.respond({'message': 'sprint', 'error': 'too far away.'}))
            return

        char.hasSprinted = True
        create_task(self.moveChar(player, 'sprint', char, dest))

    async def moveChar(self, player, messageType, char: Character, dest):
        self.state(player).moveChar(char, Vector(dest['x'], dest['y']))
        response = {'message': messageType, 'error': '', 'characterId': char.charId, 'destination': dest, 'stepsTakenThisTurn': char.stepsTakenThisTurn}
        create_task(self.state(player).broadcast(response))

    async def handleUseSkill(self, player, char, message):
        state = self.state(player)
        isBroadCast, response = self.skillHandler.handleSkillUsage(state, char, message)
        if isBroadCast:
            create_task(state.broadcast(response))
        else:
            create_task(player.respond(response))
            
    async def handleAttack(self, player, charId, targetPos):
        char = self.charById(player, charId)
        if char.hasAttackedThisTurn:
            create_task(player.respond({'message': 'attack', 'error': 'attacked already.'}))
            return

        if char.position[0] == targetPos['x'] and char.position[1] == targetPos['y']:
            create_task(player.respond({'message': 'attack', 'error': 'cannot attack self.'}))
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
            if otherChar.ownerWallet == player.wallet:
                create_task(player.respond({'message': 'attack', 'error': 'this unit is friendly.'}))
                return
            if isMeleeAttack:
                create_task(self.state(player).meleeAttack(char, otherChar))
            else:
                create_task(self.state(player).rangedAttack(char, otherChar))
        else:
            create_task(player.respond({'message': 'attack', 'error': 'no target.'}))

    async def isOwnerOfLoadout(self, player, loadout: LoadOut):
        if not self.ownershipChecks:
            return True
        chain = ChainLoader()
        for slot, troopInfo in loadout.troopselection.items():
            troopTokenId = troopInfo['troops']
            if not chain.isOwnerOf(player.wallet, 'char', troopTokenId):
                return False
        return True

    async def createNewBattle(self, playerOne, playerTwo):
        battleId = self.storage.insertBattle(playerOne.wallet, playerTwo.wallet)
        state = GameState(battleId, 10, 10)
        state.loadMap()
        self.matches[battleId] = state
        self.playersLookingForBattle.remove(playerOne)
        self.playersLookingForBattle.remove(playerTwo)
        playerOne.currentBattle = battleId
        playerTwo.currentBattle = battleId
        state.spawnTroopsOfPlayer(playerOne, playerOne.loadout.troopselection)
        state.spawnTroopsOfPlayer(playerTwo, playerTwo.loadout.troopselection)
        state.startBattle()
        create_task(state.broadcastState())
        create_task(state.saveToDisk(self.battlecache))
        print('battle {} created and saved to disk!\nassigned battleId and playerIndex to players..\n{}: {}\n{}: {}'.format(battleId, playerOne.playerIndex, playerOne.wallet, playerTwo.playerIndex, playerTwo.wallet))

    def state(self, player: Player) -> GameState:
        return self.matches[player.currentBattle]

    async def handleRequest(self, player, request):
        messageType = request['message']
        print('{}({}): {}'.format(player.wallet, player.playerIndex, messageType))
        if messageType == 'auth':
            create_task(self.handleAuth(player, request))
            return
        elif messageType == 'siwe':
            create_task(self.handleSiwe(player, request))
            return
        elif not player.currentBattle:
            create_task(player.respond({'message': messageType, 'error': 'not part of a battle.'}))
            return
        elif len(self.state(player).connectedPlayers()) < 2:
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
            winner = await self.state(player).endBattle()
            if winner:
                create_task(self.endBattle(self.state(player).battleId, winner))
            else:
                effectMessages = self.state(player).nextTurn()
                response = {'message': messageType, 'effects': effectMessages, 'turnOfPlayer': self.state(player).turnOfPlayer().wallet}
                create_task(self.state(player).broadcast(response))
            return

    async def globalBroadcast(self, message):
        responseAsJson = json.dumps(message)
        #print('Broadcast: {}'.format(responseAsJson))
        create_task(asyncio.wait([player.socket.send(responseAsJson) for player in self.connected]))

    async def messageLoop(self, websocket):
        wallet_address = websocket.username
        remote = websocket.remote_address
        player = Player(wallet_address, websocket)
        print('New connection from {}'.format(remote))
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

    async def run(self):
        async with websockets.serve(self.messageLoop, self.hostname, self.port,
            create_protocol=websockets.basic_auth_protocol_factory(
            realm="CryptoG4N9 Battle Server",
            check_credentials=self.authenticate
        )):
            print("Starting server on {}:{}..".format(self.hostname, self.port))
            await asyncio.Future()

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
        #  - check for duplicate tokens

        if not validated:
            create_task(player.respond({'message': 'siwe', 'error': 'Login failed. (siwe)'}))
            return
        if not is_owner_of_loadout:
            create_task(player.respond({'message': 'siwe', 'error': "You don't own all the tokens in this loadout."}))
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
            print('adding player {} to matchmaking queue.'.format(player.wallet))
            self.playersLookingForBattle.add(player)
            create_task(self.startMatchMaking())

    async def startMatchMaking(self):
        print('starting matchmaking with {} players'.format(len(self.playersLookingForBattle)))
        if len(self.playersLookingForBattle) <= 1:
            return

        pit = iter(self.playersLookingForBattle)
        first = next(pit)
        second = next(pit)
        print('Starting match between {} and {}'.format(first.wallet, second.wallet))
        create_task(self.createNewBattle(first, second))

    def findRunningBattle(self, player) -> GameState:
        print('looking for running battle for player {}'.format(player.wallet))
        for battleId, battle in self.matches.items():
            if player in battle.disconnectedPlayers() and len(battle.connectedPlayers()) == 1:
                print('found running battle {} for player {}'.format(battleId, player.wallet))
                return battle
        return None

    def battlesAreOnDisk(self):
        # check if directory exists
        if not os.path.exists(self.battlecache):
            return False
        if len(os.listdir(self.battlecache)) > 0:
            return True
        return False

    def loadBattles(self):
        for path in os.listdir(self.battlecache):
            if not path.endswith(".json"):
                continue
            state = GameState.fromFile(os.path.join(self.battlecache, path))
            self.matches[state.battleId] = state
            print('Restored battle {} from disk'.format(state.battleId))

    async def endBattle(self, battleId, winner_wallet):
        looser_wallet = self.matches[battleId].loser
        self.storage.setWinnerAndLoser(battleId, winner_wallet, looser_wallet)
        await self.moveBattleToArchive(battleId)
        create_task(self.matches[battleId].sendBattleEnd())

    async def moveBattleToArchive(self, battleId):
        basename = 'bs_' + str(battleId) + '.json'
        filename = os.path.join(self.battlecache, basename)

        if not os.path.isdir(self.battlearchive):
            os.makedirs(self.battlearchive, exist_ok=True)

        create_task(self.matches[battleId].saveToDisk(self.battlearchive))

        if os.path.isfile(filename):
            os.remove(filename)


if __name__ == "__main__":
    server = GameServer("0.0.0.0", 2000)
    asyncio.run(server.run())
