class PushingBlow:
	def __init__(self, gameMap, executingCharacter):
		self.char = executingCharacter
		self.gameMap = gameMap
		self.tilesToPushBack = 3

	def execute(self, targetPos):
		direction = targetPos - self.char.position
		direction.normalize()
		
		previousPosition = targetPos
		endPosition = targetPos + direction

		for i in range(self.tilesToPushBack):
			if self.gameMap.isWallAt(endPosition):
				endPosition = previousPosition
			else:
				previousPosition = endPosition
				endPosition = targetPos + direction

	def canBeExecuted(self, targetPos):
		return self.gameMap.isCharacterOnTile(targetPos) and self.char.isNextTo(targetPos)