from doserve.common.enums import DamageType


class Poisoned:
    def __init__(self, state, source_char, target_char, turns):
        self.source_char = source_char
        self.turns = turns
        self.target_char = target_char
        self.state = state

    def nextTurn(self):
        damage_type = DamageType.Poison
        killed, damage = self.state.dealDamage(self.source_char, self.target_char, 20, damage_type)
        self.turns -= 1
        response = {
            'source': self.source_char.charId,
            'source_tile': self.source_char.position.toObject(),
            'aoe': [{
                'tile': self.target_char.position.toObject(),
                'damage': damage,
                'damage_type': damage_type,
                'killed': killed,
                'effects': ['melee_attack', 'poison_defender']
            }],
        }
        return response

    def isExpired(self):
        return self.turns <= 0
