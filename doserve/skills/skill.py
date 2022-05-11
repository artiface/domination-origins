import enum

from doserve.common.enums import DamageType

class SkillType(enum.IntEnum):
    PASSIVE = 1,
    ACTIVE = 2

class TargetMode(enum.IntEnum):
    ENEMIES_ONLY = 1,
    ALLIES_ONLY = 2,
    EMPTY_TILES_ONLY = 3,




class Skill:
    def __init__(self, identifier: str, name: str, description: str, skill_type: SkillType, target_mode: TargetMode, cooldown: int, cost: int):
        self.identifier = identifier
        self.name = name
        self.description = description
        self.skill_type = skill_type
        self.cooldown = cooldown
        self.cooldownCounter = 0
        self.cost = cost
        self.targetMode = target_mode

    def __str__(self):
        return self.identifier

    def getResistance(self, damage_type: DamageType):
        return 0

    def activate(self, state, char, arguments):
        self.startCooldown()
        return self.use(state, char, arguments)

    def use(self, state, char, arguments):
        return None

    def startCooldown(self):
        self.cooldownCounter = self.cooldown

    def canBePaid(self):
        return True

    def isReady(self):
        return self.cooldownCounter == 0

    def hasValidTarget(self, arguments):
        return True

    def toObject(self):
        return {
            'identifier': self.identifier,
            'targetMode': self.targetMode,
            'type': self.skill_type,
        }

    def nextTurn(self):
        if self.cooldownCounter > 0:
            self.cooldownCounter -= 1


