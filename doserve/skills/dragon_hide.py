from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType

class DragonHide(Skill):
    def __init__(self):
        super().__init__("dragon_hide", "Dragon Hide", "(P) Poison resistance", SkillType.PASSIVE, 0, 0)

    def getResistance(self, damage_type: DamageType):
        if damage_type == DamageType.Poison:
            return 2
        return 0