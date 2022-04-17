from vector import Vector
import math
from enum import IntEnum
import json
from chain import ChainLoader

class LoadOut:
    def __init__(self, troopselection):
        self.troopselection = troopselection

    def toString(self):
        return json.dumps(self.__dict__)


class CharacterState(IntEnum):
    Dead = 0
    Alive = 1

class Player:
    def __init__(self, wallet, websocket):
        self.wallet = wallet
        self.currentBattle = None
        self.socket = websocket
        self.playerIndex = -1

    def toObject(self):
        return {
            'wallet': self.wallet,
            'playerIndex': self.playerIndex,
            'currentBattle': self.currentBattle
        }

    async def respond(self, response):        
        jsonResponse = json.dumps(response)
        await self.socket.send(jsonResponse)
        #print('Response: {}'.format(jsonResponse))

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.wallet)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Player):
            return self.wallet == other.wallet
        return False


class Character:
    def __init__(self, ownerWallet: str, tokenId):
        self.ownerWallet = ownerWallet
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

    def toObject(self):
        return {
            'ownerWallet': self.ownerWallet,
            'tokenId': self.tokenId,
            'charId': self.charId,
            'pos': {'x': self.position[0], 'y': self.position[1]},
            'state': self.state,
            'stepsTakenThisTurn': self.stepsTakenThisTurn,
            'hasAttackedThisTurn': self.hasAttackedThisTurn,
            'hasSprinted': self.hasSprinted,
            'level': self.level,
            'dna': self.dna,
            'focus': self.focus,
            'agility': self.agility,
            'intelligence': self.intelligence,
            'strength': self.strength,
            'dexterity': self.dexterity,
            'attributeBoost': self.attributeBoost,
            'powerBoost': self.powerBoost,
            'staminaBoost': self.staminaBoost,
            'weapon': self.weapon,
            'armor': self.armor,
            'items': self.items,
            'skills': self.skills
        }

    @classmethod
    def fromObject(cls, objData):
        char = Character(objData['ownerWallet'], objData['tokenId'])
        char.charId = objData['charId']
        char.position = Vector(objData['pos']['x'], objData['pos']['y'])
        char.state = objData['state']
        char.stepsTakenThisTurn = objData['stepsTakenThisTurn']
        char.hasAttackedThisTurn = objData['hasAttackedThisTurn']
        char.hasSprinted = objData['hasSprinted']
        char.level = objData['level']
        char.dna = objData['dna']
        char.focus = objData['focus']
        char.agility = objData['agility']
        char.intelligence = objData['intelligence']
        char.strength = objData['strength']
        char.dexterity = objData['dexterity']
        char.attributeBoost = objData['attributeBoost']
        char.powerBoost = objData['powerBoost']
        char.staminaBoost = objData['staminaBoost']
        char.weapon = objData['weapon']
        char.armor = objData['armor']
        char.items = objData['items']
        char.skills = objData['skills']
        return char

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

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.tokenId)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Character):
            return self.tokenId == other.tokenId
        return False