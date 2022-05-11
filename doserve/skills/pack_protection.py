from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType, TargetMode


class PackProtection(Skill):
    def __init__(self):
        super().__init__("pack_protection", "Protection of the Pack", "(P) Nearby allies reduced damage", SkillType.PASSIVE, TargetMode.ALLIES_ONLY, 0, 0)

    def getResistance(self, char, damage_type: DamageType):
        if damage_type == DamageType.Melee:
            state = char.parent_gamestate
            charsNearby = state.getCharsInRadius(char.position[0], char.position[1], 2)
            alliesNearby = 0
            for c in charsNearby:
                if c.ownerWallet == char.ownerWallet:
                    alliesNearby += 1

            return 5 * alliesNearby
        return 0
