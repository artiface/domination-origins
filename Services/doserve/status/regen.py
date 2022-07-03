from doserve.common.enums import DamageType

# for now just focus regen
class Regenerate:
    def __init__(self, state, source_char):
        self.source_char = source_char
        self.state = state
        self.expired = False

    def nextTurn(self):
        response = None
        if self.source_char.currentFocus < self.source_char.maxFocus:
            self.source_char.currentFocus += 1
            response = {
                'source': self.source_char.charId,
                'source_tile': self.source_char.position.toObject(),
                'stat_changes': {'focus': 1}
            }
        return response

    def isExpired(self):
        return self.expired

    def onDeath(self):
        self.expired = True
