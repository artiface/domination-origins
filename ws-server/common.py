import math
import random
from asyncio import create_task

from vector import Vector

from enum import IntEnum, Enum
import json
from chain import loadLocalNFT


def valueFromBinary(binary_dna, start, min, max):  # 100..200
    resolution = (max - min) # 100
    length = math.floor(math.log2(resolution)) + 1 # 7
    binary_part = binary_dna[start:start + length]
    dna_raw_value = int(binary_part, base=2)  # 0..127
    max_value = 2 ** length - 1
    value = (dna_raw_value / max_value) * resolution # 0..100
    value += min  # 100..200
    return length, int(value)


class Faction(Enum):
    Wolf = 1,
    Dragon = 2,
    Snake = 3,

def manhattan(a, b):
    return sum(abs(val1-val2) for val1, val2 in zip(a, b))

def dist(a, b):
    return math.sqrt(sum((val1-val2)**2 for val1, val2 in zip(a, b)))

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
        if self.socket is not None and self.socket.open:
            jsonResponse = json.dumps(response)
            create_task(self.socket.send(jsonResponse))
            print('Sent to player with wallet: ' + self.wallet)
            print('Response: {}'.format(jsonResponse))

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.wallet)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Player):
            return self.wallet == other.wallet
        return False

class Weapon:
    def __init__(self, ownerWallet: str, tokenId):
        self.name = None
        self.ownerWallet = ownerWallet
        self.tokenId = tokenId
        self.weaponType = None
        self.effect = None
        self.minimumDamage = 0
        self.maximumDamage = 0
        self.levelRequirement = 0
        self.criticalChance = 0
        self.accuracy = 0

        self.loadTokenData()

    def loadTokenData(self):
        tokenData = loadLocalNFT('weapon', self.tokenId)

        self.name = tokenData['name']
        self.weaponType = tokenData['attributes']['Weapon Type']
        self.effect = tokenData['attributes']['Effect']
        self.minimumDamage = tokenData['attributes']['Minimum Damage']
        self.maximumDamage = tokenData['attributes']['Maximum Damage']
        self.levelRequirement = tokenData['attributes']['Level Requirement']
        self.criticalChance = tokenData['attributes']['Crit Chance']
        self.accuracy = tokenData['attributes']['Accuracy']

    def damage(self):
        multiplier = 1
        if random.randint(0, 100) < self.criticalChance:
            multiplier = 2
        return random.randint(self.minimumDamage, self.maximumDamage) * multiplier

class Character:
    def __init__(self, ownerWallet: str, tokenId):
        self.maxHealth = 0
        self.currentHealth = 0
        self.ownerWallet = ownerWallet
        self.charId = -1

        self.tokenId = tokenId
        self.position = Vector(-1, -1)
        self.state = CharacterState.Alive
        self.stepsTakenThisTurn = 0
        self.backgroundHint = None
        self.origin = None
        self.faction = None
        self.hasAttackedThisTurn = False
        self.hasSprinted = False
        self.level = 0
        self.dna = None
        self.maxFocus = 1
        self.currentFocus = 1

        self.agility = 1
        self.intelligence = 1
        self.strength = 1
        self.dexterity = 1

        self.attributeBoost = 1
        self.powerBoost = 1
        self.staminaBoost = 1

        self.weapon = None
        self.armor = {}
        self.items = []
        self.skills = []

        self.loadTokenData()
        self.startDNADerivation()

    def startDNADerivation(self):
        integer_dna = int(self.dna, base=16)
        binary_dna = str(bin(integer_dna))[2:]
        startingBit = 2
        bits_used, factionDice = valueFromBinary(binary_dna, startingBit, 0, 2)
        startingBit += bits_used
        bits_used, self.maxHealth = valueFromBinary(binary_dna, startingBit, 100, 200)
        self.currentHealth = self.maxHealth
        startingBit += bits_used
        bits_used, self.maxFocus = valueFromBinary(binary_dna, startingBit, 1, 10)
        self.currentFocus = self.maxFocus
        startingBit += bits_used

        bits_used, factionSkillAssignmentCode = valueFromBinary(binary_dna, startingBit, 0, 3)
        startingBit += bits_used
        if not self.faction:
            #print('Faction not set, choosing DNA faction from factionDice: {}'.format(factionDice))
            self.faction = [Faction.Wolf, Faction.Dragon, Faction.Snake][factionDice]

        if self.faction == Faction.Wolf:
            self.assignWolfFactionSkills(factionSkillAssignmentCode)
        elif self.faction == Faction.Dragon:
            self.assignDragonFactionSkills(factionSkillAssignmentCode)
        elif self.faction == Faction.Snake:
            self.assignSnakeFactionSkills(factionSkillAssignmentCode)

    def getBattlePointValue(self):
        healthValue = (self.maxHealth / 200) * 10
        focusValue = self.maxFocus
        strengthValue = self.strength
        agilityValue = self.agility
        dexterityValue = self.dexterity
        intelligenceValue = self.intelligence
        attributeBoostValue = self.attributeBoost
        powerBoostValue = (self.powerBoost / 100) * 10
        staminaBoostValue = (self.staminaBoost / 100) * 10
        levelValue = self.level
        skillsValue = len(self.skills) * 10

        # sum all values
        bp = healthValue + focusValue + strengthValue + agilityValue + dexterityValue + intelligenceValue + attributeBoostValue + powerBoostValue + staminaBoostValue + levelValue + skillsValue
        return int(bp)

    def setWeapon(self, weaponTokenId):
        self.weapon = Weapon(self.ownerWallet, weaponTokenId)

    def toObject(self):
        return {
            'ownerWallet': self.ownerWallet,
            'tokenId': self.tokenId,
            'charId': self.charId,
            'faction': self.faction,
            'origin': self.origin,
            'pos': {'x': self.position[0], 'y': self.position[1]},
            'state': self.state,
            'stepsTakenThisTurn': self.stepsTakenThisTurn,
            'hasAttackedThisTurn': self.hasAttackedThisTurn,
            'hasSprinted': self.hasSprinted,
            'level': self.level,
            'dna': self.dna,
            'maxHealth': self.maxHealth,
            'currentHealth': self.currentHealth,
            'maxFocus': self.maxFocus,
            'currentFocus': self.currentFocus,
            'agility': self.agility,
            'intelligence': self.intelligence,
            'strength': self.strength,
            'dexterity': self.dexterity,
            'attributeBoost': self.attributeBoost,
            'powerBoost': self.powerBoost,
            'staminaBoost': self.staminaBoost,
            'weapon': self.weapon.tokenId if self.weapon else None,
            'armor': self.armor,
            'items': self.items,
            'skills': self.skills,
            'battlePointValue': self.getBattlePointValue(),
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
        char.maxHealth = objData['maxHealth']
        char.currentHealth = objData['currentHealth']
        char.maxFocus = objData['maxFocus']
        char.currentFocus = objData['currentFocus']
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
        char.origin = objData['origin']
        char.faction = objData['faction']
        if objData['weapon']:
            char.setWeapon(objData['weapon'])
        return char

    def loadTokenData(self):
        # we just load the token data from the local directory and json file
        # load a file from disk
        tokenData = loadLocalNFT('char', self.tokenId)
        self.backgroundHint = tokenData['attributes']['Background Pattern'] if 'Background Pattern' in tokenData['attributes'] else False
        self.level = tokenData['attributes']['Level']
        self.origin = tokenData['attributes']['Origin']
        self.dna = tokenData['dna']
        self.agility = tokenData['attributes']['Agility']
        self.intelligence = tokenData['attributes']['Intelligence']
        self.strength = tokenData['attributes']['Strength']
        self.dexterity = tokenData['attributes']['Dexterity']
        self.attributeBoost = tokenData['attributes']['Attributes Increase']
        self.powerBoost = tokenData['attributes']['Power Increase']
        self.staminaBoost = tokenData['attributes']['Stamina Increase']

        factionMap = {
            'Ryu': Faction.Dragon,
            'Hebi': Faction.Snake,
            'Kaze': Faction.Wolf
        }

        if self.backgroundHint and self.backgroundHint in factionMap:
            self.faction = factionMap[self.backgroundHint]

    def isNextTo(self, position):
        return manhattan(self.position, [position['x'], position['y']]) <= 1

    def canAttackMelee(self):
        return True  # TODO: check if we can attack

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


    def assignWolfFactionSkills(self, factionSkillAssignmentCode):
        if factionSkillAssignmentCode == 0:
            self.skills = []
        elif factionSkillAssignmentCode == 1:
            self.skills = ['WolfClaws()']
        elif factionSkillAssignmentCode == 2:
            self.skills = ['WolfProtection()']
        elif factionSkillAssignmentCode == 3:
            self.skills = ['WolfClaws()', 'WolfProtection()']

    def assignSnakeFactionSkills(self, factionSkillAssignmentCode):
        if factionSkillAssignmentCode == 0:
            self.skills = []
        elif factionSkillAssignmentCode == 1:
            self.skills = ['PoisonCloud()']
        elif factionSkillAssignmentCode == 2:
            self.skills = ['SnakeBite()']
        elif factionSkillAssignmentCode == 3:
            self.skills = ['PoisonCloud()', 'SnakeBite()']

    def assignDragonFactionSkills(self, factionSkillAssignmentCode):
        if factionSkillAssignmentCode == 0:
            self.skills = []
        elif factionSkillAssignmentCode == 1:
            self.skills = ['DragonHide()']
        elif factionSkillAssignmentCode == 2:
            self.skills = ['DragonStrike()']
        elif factionSkillAssignmentCode == 3:
            self.skills = ['DragonHide()', 'DragonStrike()']

if __name__ == '__main__':
    _, zero = valueFromBinary('00', 0, 0, 3)
    assert zero == 0
    _, one = valueFromBinary('01', 0, 0, 3)
    assert one == 1
    _, two = valueFromBinary('10', 0, 0, 3)
    assert two == 2
    _, three = valueFromBinary('11', 0, 0, 3)
    assert three == 3
    for i in range(1, 10000):
        c = Character('', i)
        print(c.faction)
