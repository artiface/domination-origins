from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType, TargetMode


class PackClaws(Skill):
    def __init__(self):
        super().__init__(
            "pack_claws",
            "Pack Claws",
            "More damage for each nearby ally.",
            SkillType.ACTIVE,
            TargetMode.ENEMIES_ONLY,
            cooldown=3,
            cost=3
        )

    def use(self, state, char, arguments):
        # gather the required data
        target_tile = arguments["target_tile"]
        tile = state.getTile(target_tile['x'], target_tile['y'])
        target_char = tile.character

        charsNearby = state.getCharsInRadius(char.position[0], char.position[1], 2)
        alliesNearby = 0
        for c in charsNearby:
            if c.ownerWallet == char.ownerWallet:
                alliesNearby += 1

        damage = 20 + alliesNearby * 10
        damage_type = DamageType.Melee

        # apply changes to world state
        char.currentFocus -= self.cost
        killed, damage = state.dealDamage(char, target_char, damage, damage_type)

        # return the resulting delta
        response = {
            'attacker': char.charId,
            'attacker_tile': char.position.toObject(),
            'aoe': [{
                'tile': target_char.position.toObject(),
                'damage': damage,
                'damage_type': damage_type,
                'killed': killed,
                'effects': ['melee_attack', 'claws']
            }],
        }
        return response

