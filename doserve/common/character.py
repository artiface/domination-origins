from doserve.chain import loadLocalNFT
from doserve.common.enums import Faction, DamageType, CharacterState
from doserve.common.helper import manhattan, valueFromBinary
from doserve.common.player import Weapon
import doserve.skills.dragon_hide
import doserve.skills.snake_bite
import doserve.skills.dragon_strike
import doserve.skills.poison_cloud
import doserve.skills.pack_claws
import doserve.skills.pack_protection
from doserve.skills.skill import Skill
from doserve.status.regen import Regenerate
from doserve.vector import Vector


def assignWolfFactionSkills(char, factionSkillAssignmentCode):
    if factionSkillAssignmentCode == 0:
        char.skills = []
    elif factionSkillAssignmentCode == 1:
        char.skills = [doserve.skills.pack_claws.PackClaws()]
    elif factionSkillAssignmentCode == 2:
        char.skills = [doserve.skills.pack_protection.PackProtection()]
    elif factionSkillAssignmentCode == 3:
        char.skills = [doserve.skills.pack_claws.PackClaws(), doserve.skills.pack_protection.PackProtection()]


def assignSnakeFactionSkills(char, factionSkillAssignmentCode):
    if factionSkillAssignmentCode == 0:
        char.skills = []
    elif factionSkillAssignmentCode == 1:
        char.skills = [doserve.skills.poison_cloud.PoisonCloud()]
    elif factionSkillAssignmentCode == 2:
        char.skills = [doserve.skills.snake_bite.SnakeBite()]
    elif factionSkillAssignmentCode == 3:
        char.skills = [doserve.skills.poison_cloud.PoisonCloud(), doserve.skills.snake_bite.SnakeBite()]


def assignDragonFactionSkills(char, factionSkillAssignmentCode):
    if factionSkillAssignmentCode == 0:
        char.skills = []
    elif factionSkillAssignmentCode == 1:
        char.skills = [doserve.skills.dragon_hide.DragonHide()]
    elif factionSkillAssignmentCode == 2:
        char.skills = [doserve.skills.dragon_strike.DragonStrike()]
    elif factionSkillAssignmentCode == 3:
        char.skills = [doserve.skills.dragon_hide.DragonHide(), doserve.skills.dragon_strike.DragonStrike()]


def createSkillFromIdentifier(skillIdentifier):
    if skillIdentifier == 'dragon_hide':
        return doserve.skills.dragon_hide.DragonHide()
    elif skillIdentifier == 'dragon_strike':
        return doserve.skills.dragon_strike.DragonStrike()
    elif skillIdentifier == 'snake_bite':
        return doserve.skills.snake_bite.SnakeBite()
    elif skillIdentifier == 'poison_cloud':
        return doserve.skills.poison_cloud.PoisonCloud()
    elif skillIdentifier == 'pack_claws':
        return doserve.skills.pack_claws.PackClaws()
    elif skillIdentifier == 'pack_protection':
        return doserve.skills.pack_protection.PackProtection()


class Character:
    def __init__(self, ownerWallet: str, tokenId, parent_state=None):
        self.maxHealth = 0
        self.currentHealth = 0
        self.ownerWallet = ownerWallet
        self.charId = -1
        self.parent_gamestate = parent_state

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
        self.statusEffects = []

        self.poisonLevel = 0
        self.resistance = {
            DamageType.Melee: 0,
            DamageType.Ranged: 0,
            DamageType.Poison: 0
        }

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
            assignWolfFactionSkills(self, factionSkillAssignmentCode)
        elif self.faction == Faction.Dragon:
            assignDragonFactionSkills(self, factionSkillAssignmentCode)
        elif self.faction == Faction.Snake:
            assignSnakeFactionSkills(self, factionSkillAssignmentCode)

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
            'skills': [skill.toObject() for skill in self.skills],
            'battlePointValue': self.getBattlePointValue(),
            'base_resistances:': self.resistance,
            'resistance_poison': self.getResistance(DamageType.Poison),
            'resistance_melee': self.getResistance(DamageType.Melee),
            'resistance_ranged': self.getResistance(DamageType.Ranged),
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
        char.skills = [createSkillFromIdentifier(skillDef['identifier']) for skillDef in objData['skills']]
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

    def addStatusEffect(self, statusEffect):
        self.statusEffects.append(statusEffect)

    def isNextTo(self, position):
        return manhattan(self.position, [position['x'], position['y']]) <= 1

    def canAttackMelee(self):
        return True  # TODO: check if we can attack

    def canAttackRanged(self):
        return True

    def nextTurn(self):
        self.stepsTakenThisTurn = 0
        self.hasAttackedThisTurn = False
        self.currentFocus += 1
        for skill in self.skills:
            skill.nextTurn()

        statusEffectMessages = []

        for i in range(len(self.statusEffects)-1, -1, -1):
            statusEffect = self.statusEffects[i]
            effectMessage = statusEffect.nextTurn()
            if effectMessage:
                statusEffectMessages.append(effectMessage)
            if statusEffect.isExpired():
                self.statusEffects.remove(statusEffect)

        return statusEffectMessages

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.tokenId)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Character):
            return self.tokenId == other.tokenId
        return False

    def getSkill(self, skillId):
        for skill in self.skills:
            if skill.identifier == skillId:
                return skill
        return None

    def getResistance(self, damageType):
        total_resistance = 0
        base_resistance = self.resistance[damageType]
        # TODO: add armor resistances..
        total_resistance += base_resistance
        for skill in self.skills:
            skill_resistance = skill.getResistance(self, damageType)
            total_resistance += skill_resistance
        return total_resistance
