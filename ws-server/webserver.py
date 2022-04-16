import json
import string
import random
from flask import Flask, request, jsonify
import datetime
from datetime import timedelta
from flask_classful import FlaskView
from siwe import siwe
from siwe.siwe import SiweMessage
from storage import Storage

api = Flask(__name__)

db = Storage('battles.sqlite')

db.createSiweCacheTable()
db.createBattleTable()
db.createPlayerTable()

class BattleManager:
    def __init__(self):
        self.sqlite_file = 'battles.sqlite'
        self.authCounter = 0

    def tryMatchWithOpenBattle(self, wallet, loadout):
        storage = Storage(self.sqlite_file)
        openBattle = storage.findOpenBattle(wallet)
        if not openBattle:
            return False
        print("Found open battle: %s" % openBattle)
        storage.addSecondPlayer(openBattle['id'], wallet, loadout)
        return self.createSiweMessage(wallet, openBattle['id'])

    def getRandomString(self):
        letters = string.ascii_letters + string.digits + string.punctuation
        randomEnough = ''.join(random.choice(letters) for i in range(16))
        return randomEnough

    def createSiweMessage(self, wallet, battleId):
        expirationTime = datetime.datetime.utcnow() + timedelta(hours=2)
        message = {
            "domain": "cryptog4n9.online", 
            "address": wallet, 
            "statement": "Please sign this message to authenticate.",
            "uri": "https://cryptog4n9.online/battle/%s" % battleId,
            "version": "%s" % self.authCounter,
            "chain_id": 137, # 137 = polygon mainnet, # 80001 = mumbai testnet
            "nonce": self.getRandomString(),
            "issued_at": datetime.datetime.utcnow().isoformat(),
            "expiration_time": expirationTime.isoformat(),
            "battleId": battleId
        }
        self.authCounter += 1

        Storage(self.sqlite_file).setSiweCache(wallet, message)

        siweMessage = SiweMessage(message)
        return siweMessage

    def getSiweMessage(self, wallet):
        siweMessage = Storage(self.sqlite_file).getSiweCache(wallet)
        return siweMessage

    def delSiweMessage(self, wallet):
        Storage(self.sqlite_file).delSiweCache(wallet)

    def createNewBattle(self, wallet, loadout):
        storage = Storage(self.sqlite_file)
        storage.removeOldBattles(wallet)
        battleId = storage.insertNewBattle(wallet, loadout)
        # also delete the old battle sessions for this wallet
        return self.createSiweMessage(wallet, battleId)

    def authenticate(self, address):
        storage = Storage(self.sqlite_file)
        storage.insertPlayer(address, "TODO")
        storage.setPlayerAuthenticated(address, True)

batman = BattleManager()

class AuthServer(FlaskView):
    default_methods = ['GET', 'POST']

    def test(self):
        jsonResponse = jsonify({'message': 'Hello World!'})
        return jsonResponse

    def init(self):
        message = json.loads(request.data)
        user_wallet = message['user_wallet']
        loadout = message['troop_selection']

        siweMessage = batman.tryMatchWithOpenBattle(user_wallet, loadout)
        if not siweMessage:
            print("No open battle found, creating new battle")
            siweMessage = batman.createNewBattle(user_wallet, loadout)

        return jsonify({'siwe_message': siweMessage.prepare_message()})

    def sign(self):
        message = json.loads(request.data)
        user_wallet = message['user_wallet']
        signature = message['signature']

        siweData = batman.getSiweMessage(user_wallet)
        if not siweData:
            return jsonify({'error': 'Invalid wallet'})

        siweMessage = SiweMessage(siweData)
        try:
            siweMessage.validate(signature)
        except siwe.ValidationError:
            # no dice..
            return jsonify({'error': 'Could not validate the SIWE message.'})

        batman.authenticate(user_wallet)

        return jsonify({'success': True, 'battleUrl': 'http://localhost:9000/battle/?b=%s' % siweData['battleId']})

AuthServer.register(api, route_base = '/auth/')

if __name__ == '__main__':
    api.run(debug=True)
