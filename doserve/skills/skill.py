import enum

from doserve.common.enums import DamageType

class SkillType(enum.Enum):
    PASSIVE = 1,
    ACTIVE = 2


class Skill:
    def __init__(self, identifier: str, name: str, description: str, skill_type: SkillType, cooldown: int, cost: int):
        self.identifier = identifier
        self.name = name
        self.description = description
        self.skill_type = skill_type
        self.cooldown = cooldown
        self.cost = cost

    def __str__(self):
        return self.name

    def getResistance(self, damage_type: DamageType):
        return 0

    def activate(self, state, char, arguments):
        return {'success': True}

    def canBePaid(self):
        return True

    def isReady(self):
        return True

    def hasValidTarget(self, arguments):
        return True