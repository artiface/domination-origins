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
            'attacker': self.source_char.charId,
            'defender': self.target_char.charId,
            'attacker_tile': self.source_char.position.toObject(),
            'defender_tile': self.target_char.position.toObject(),
            'attacker_health': self.source_char.currentHealth,
            'defender_health': self.target_char.currentHealth,
            'damage': damage,
            'damage_type': damage_type,
            'killed': killed,
            'effects': ['melee_attack', 'poison_defender']
        }
        return response

    def isExpired(self):
        return self.turns <= 0
