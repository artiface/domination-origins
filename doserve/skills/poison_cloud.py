
from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType, TargetMode
from doserve.status.poisoned import Poisoned


class PoisonCloud(Skill):
    def __init__(self):
        super().__init__(
            "poison_cloud",
            "Poison Cloud",
            "Poisonous ranged attack",
            SkillType.ACTIVE,
            TargetMode.ENEMIES_ONLY,
            cooldown=3,
            cost=3
        )

    def use(self, state, char, arguments):
        # gather the required data
        target_tile = arguments["target_tile"]

        tiles = state.queryMap(target_tile['x'], target_tile['y'], 3)
        aoe_tiles = []

        char.currentFocus -= self.cost

        for tile in tiles:
            if not tile.character:
                continue
            target_char = tile.character
            damage = 20
            damage_type = DamageType.Poison

            # apply changes to world state
            killed, damage = state.dealDamage(char, target_char, damage, damage_type)

            p = Poisoned(state, char, target_char, 2)
            char.addStatusEffect(p)
            aoe_tiles.append({
                'tile': target_char.position.toObject(),
                'damage': damage,
                'damage_type': damage_type,
                'killed': killed,
                'effects': ['melee_attack', 'poison_defender']
            })
        # return the resulting delta
        response = {
            'focus_cost': self.cost,
            'attacker': char.charId,
            'attacker_tile': char.position.toObject(),
            'aoe': aoe_tiles,
        }
        return response

