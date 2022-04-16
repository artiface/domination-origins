from vector import Vector
import math
from enum import IntEnum
import json
from chain import ChainLoader

class CharacterState(IntEnum):
    Dead = 0
    Alive = 1

class Player:
    def __init__(self, wallet, websocket):
        self.wallet = wallet
        self.currentBattle = None
        self.socket = websocket
        self.playerIndex = -1

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
    def __init__(self, owner, tokenId):
        self.owner = owner
        self.charId = -1
        self.tokenId = tokenId
        self.position = Vector(-1, -1)
        self.state = CharacterState.Alive
        self.stepsTakenThisTurn = 0
        self.hasAttackedThisTurn = False
        self.hasSprinted = False
        self.level = 0
        self.dna = None
        self.focus = 1

        self.agility = 1
        self.intelligence = 1
        self.strength = 1
        self.dexterity = 1

        self.attributeBoost = 1
        self.powerBoost = 1
        self.staminaBoost = 1

        self.weapon = {}
        self.armor = {}
        self.items = []
        self.skills = []

        self.loadTokenData()

    def loadTokenData(self):
        # we just load the token data from the local directory and json file
        # load a file from disk
        chain = ChainLoader()
        tokenData = chain.loadLocalNFT(self.tokenId)

        self.level = tokenData['attributes']['Level']
        self.dna = tokenData['dna']
        self.agility = tokenData['attributes']['Agility']
        self.intelligence = tokenData['attributes']['Intelligence']
        self.strength = tokenData['attributes']['Strength']
        self.dexterity = tokenData['attributes']['Dexterity']
        self.attributeBoost = tokenData['attributes']['Attributes Increase']
        self.powerBoost = tokenData['attributes']['Power Increase']
        self.staminaBoost = tokenData['attributes']['Stamina Increase']

    def isNextTo(self, position):
        return math.dist(self.position[0], self.position[1], position[0], position[1]) < 1.5

    def canAttackMelee(self):
        return True

    def canAttackRanged(self):
        return True

    def toObject(self):
        return {
            'owner': self.owner.playerIndex,
            'tokenId': self.tokenId,
            'charId': self.charId,
            'pos': {'x': self.position[0], 'y': self.position[1]},
            'state': self.state
        }

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.tokenId)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Character):
            return self.tokenId == other.tokenId
        return False