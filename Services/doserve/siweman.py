import os
import string
import random
import datetime
from datetime import timedelta

from siwe import siwe
from siwe.siwe import SiweMessage

from config import BATTLE_DATA_DIRECTORY
from storage import Storage

class SignInManager:
    def __init__(self):
        self.sqlite_file = os.path.join(BATTLE_DATA_DIRECTORY, 'battles.sqlite')
        self.db = Storage(self.sqlite_file)
        self.authCounter = 0

    def getRandomString(self):
        letters = string.ascii_letters + string.digits + string.punctuation
        randomEnough = ''.join(random.choice(letters) for i in range(16))
        return randomEnough

    def createSiweMessage(self, wallet, loadoutString):
        expirationTime = datetime.datetime.utcnow() + timedelta(hours=2)
        message = {
            "domain": "cryptog4n9.online", 
            "address": wallet, 
            "statement": "Please sign this message to authenticate.\nYou will be using the following loadout:\n\n{}".format(loadoutString),
            "uri": "https://cryptog4n9.online/battle/",
            "version": "%s" % self.authCounter,
            "chain_id": 137, # 137 = polygon mainnet, # 80001 = mumbai testnet
            "nonce": self.getRandomString(),
            "issued_at": datetime.datetime.utcnow().isoformat(),
            "expiration_time": expirationTime.isoformat()
        }
        self.authCounter += 1

        self.db.setSiweCache(wallet, message)

        siweMessage = SiweMessage(message)
        return siweMessage

    def getSiweMessage(self, wallet):
        siweMessage = self.db.getSiweCache(wallet)
        return siweMessage

    def delSiweMessage(self, wallet):
        self.db.delSiweCache(wallet)

    def authenticate(self, address):
        storage = self.db
        storage.insertPlayer(address, "TODO")

    def validate(self, address, signature):
        siweData = self.getSiweMessage(address)
        if not siweData:
            print('No Siwe data found for {}'.format(address))
            return False

        siweMessage = SiweMessage(siweData)
        try:
            siweMessage.validate(signature)
        except siwe.ValidationError:
            # no dice..
            print('Invalid signature for {}'.format(address))
            return False

        self.authenticate(address)
        return True