
from doserve.common.enums import DamageType
from doserve.skills.skill import Skill, SkillType


class SnakeBite(Skill):
    def __init__(self):
        super().__init__(
            "snake_bite",
            "Snake Bite",
            "Poisonous melee attack",
            SkillType.ACTIVE,
            cooldown=3,
            cost=3
        )

    def activate(self, state, char, arguments):
        # gather the required data
        target_tile = arguments["target_tile"]
        tile = state.getTile(target_tile['x'], target_tile['y'])
        target_char = tile.character
        damage = 20
        damage_type = DamageType.Poison

        # apply changes to world state
        char.currentFocus -= self.cost
        killed, damage = state.dealDamage(char, target_char, damage, damage_type)
        # TODO: add status effect

        # return the resulting delta
        response = {
            'attacker': char.charId,
            'defender': target_char.charId,
            'attacker_tile': char.position.toObject(),
            'defender_tile': target_char.position.toObject(),
            'attacker_health': char.currentHealth,
            'defender_health': target_char.currentHealth,
            'damage': damage,
            'damage_type': damage_type,
            'killed': killed,
            'effects': ['melee_attack', 'poison_defender']
        }
        return response

