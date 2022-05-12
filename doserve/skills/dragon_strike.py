from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType, TargetMode


class DragonStrike(Skill):
    def __init__(self):
        super().__init__(
            "dragon_strike",
            "Dragon Strike",
            "Massive melee damage.",
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

        damage = 60
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

