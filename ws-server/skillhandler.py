from common import Character

class SkillHandler:

	def __init__(self, gameServer):
		self.gameServer = gameServer

	def handleSkillUsage(self, char, message):
		charId = char.charId
		skillId = message['skill_id']

		
		isAllowed = True
		response = {'message': 'useSkill', 'characterId': charId, 'skill_id': skillId, 'error': ''}

		return isAllowed, response