from doserve.common.character import Character
from doserve.gamestate import GameState


class SkillHandler:

	def __init__(self, gameServer):
		self.gameServer = gameServer

	def handleSkillUsage(self, state: GameState, char: Character, message):
		isAllowed = False
		charId = char.tokenId
		skillId = message['skill_id']
		skill = char.getSkill(skillId)
		if not skill:
			return isAllowed, {'message': 'useSkill', 'error': 'no such skill.'}
		if not skill.canBePaid(char):
			return isAllowed, {'message': 'useSkill', 'error': 'you do not have enough focus.'}
		if not skill.isReady():
			return isAllowed, {'message': 'useSkill', 'error': 'skill is not ready.'}
		if not skill.hasValidTarget(message):
			return isAllowed, {'message': 'useSkill', 'error': 'invalid target.'}

		isAllowed = True

		skill_effect = skill.activate(state, char, message)

		response = {'message': 'useSkill', 'characterId': charId, 'skill_id': skillId, 'skill_effect': skill_effect}

		return isAllowed, response
