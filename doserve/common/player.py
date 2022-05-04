import json
import secrets
from asyncio import create_task

from doserve.chain import loadLocalNFT
from doserve.common.enums import DamageType


class Player:
    def __init__(self, wallet, websocket):
        self.wallet = wallet
        self.currentBattle = None
        self.socket = websocket
        self.playerIndex = -1

    def toObject(self):
        return {
            'wallet': self.wallet,
            'playerIndex': self.playerIndex,
            'currentBattle': self.currentBattle
        }

    async def respond(self, response):
        if self.socket is not None and self.socket.open:
            jsonResponse = json.dumps(response)
            create_task(self.socket.send(jsonResponse))
            print('Sent to player with wallet: ' + self.wallet)
            print('Response: {}'.format(jsonResponse))

    def __hash__(self):
        """Overrides the default implementation"""
        return hash(self.wallet)

    def __eq__(self, other):
        """Overrides the default implementation"""
        if isinstance(other, Player):
            return self.wallet == other.wallet
        return False

class Weapon:
    def __init__(self, ownerWallet: str, tokenId):
        self.name = None
        self.ownerWallet = ownerWallet
        self.tokenId = tokenId
        self.weaponType = None
        self.effect = None
        self.minimumDamage = 0
        self.maximumDamage = 0
        self.levelRequirement = 0
        self.criticalChance = 0
        self.accuracy = 0

        self.loadTokenData()

    def loadTokenData(self):
        tokenData = loadLocalNFT('weapon', self.tokenId)

        self.name = tokenData['name']
        self.weaponType = tokenData['attributes']['Weapon Type']
        self.effect = tokenData['attributes']['Effect']
        self.minimumDamage = tokenData['attributes']['Minimum Damage']
        self.maximumDamage = tokenData['attributes']['Maximum Damage']
        self.levelRequirement = tokenData['attributes']['Level Requirement']
        self.criticalChance = tokenData['attributes']['Crit Chance']
        self.accuracy = tokenData['attributes']['Accuracy']
        self.damageType = DamageType.Melee  # TODO: adjust this

    def damage(self):
        multiplier = 1
        if secrets.randbelow(100) < self.criticalChance:
            multiplier = 2
        damage = (secrets.randbelow(self.maximumDamage - self.minimumDamage) + self.minimumDamage) * multiplier
        return damage, self.damageType
