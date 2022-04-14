from vector import Vector
import math
from enum import IntEnum
import json

class CharacterState(IntEnum):
    Dead = 0
    Alive = 1

class Player:
    def __init__(self, wallet, websocket):
        self.wallet = wallet
        self.currentBattle = None
        self.socket = websocket

    async def respond(self, response):        
        jsonResponse = json.dumps(response)
        await self.socket.send(jsonResponse)
        print('Response: {}'.format(jsonResponse))

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.wallet)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Player):
            return self.wallet == other.wallet
        return False

class Character:
    def __init__(self, charId, owner, x, y):
        self.owner = owner
        self.charId = charId        
        self.position = Vector(x,y)
        self.state = CharacterState.Alive
        self.stepsTakenThisTurn = 0
        self.hasAttackedThisTurn = False
        self.hasSprinted = False

        self.level = 2

        self.focus = 8

        self.agility = 5
        self.intelligence = 4
        self.strength = 7
        self.dexteriry = 8

        self.attributeBoost = 1
        self.powerBoost = 1
        self.staminaBoost = 1

        self.weapon = {}
        self.armor = {}
        self.items = []
        self.skills = []

    def isNextTo(self, position):
        return math.dist(self.position[0], self.position[1], position[0], position[1]) < 1.5

    def canAttackMelee(self):
        return True

    def canAttackRanged(self):
        return True

    def toObject(self):
        return {
            'owner': self.owner,
            'charId': self.charId,
            'pos': {'x': self.position[0], 'y': self.position[1]},
            'state': self.state
        }
