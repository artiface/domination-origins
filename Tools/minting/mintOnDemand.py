# The plan
# 1. Listen for open starter kit events
# 2. Assign tokenIds to the new troops
# 3. Check if metadata and image for this tokenId is available
# 4. If no, create metadata and image
# 5. Mint the tokens by sending a transaction
import json
import os
import pathlib
import subprocess
from getpass import getpass

from Tools.chainlisten.listener import Listener
from Tools.transact.contract import WritableContract


class OnDemandMinter:
    def __init__(self, writable_contract):
        self.metadata_dir = './metadata'
        self.image_dir = './images'
        self.contract = writable_contract
        self.listener = Listener(self.on_event)

    def startListening(self):
        print("Listening for open starter kit events")
        self.listener.listen([self.contract.events.Received, self.contract.events.ReceivedBatch])

    def on_event(self, event):
        opener_wallet = event['sender']
        self.onOpenStarterKit(opener_wallet)

    def onOpenStarterKit(self, opener_wallet):
        print("Open starter kit event received from " + opener_wallet)
        troopTokenIds = self.selectTroopTokens()
        dnaList = self.getTroopDNA(troopTokenIds)
        self.mintTokens(opener_wallet, troopTokenIds, dnaList)

        weaponTokenIds = self.selectWeaponTokens()
        dnaList = self.getWeaponDNA(weaponTokenIds)
        self.mintTokens(opener_wallet, weaponTokenIds, dnaList)

    def selectTroopTokens(self):
        return [1002, 1003, 1004]

    def selectWeaponTokens(self):
        return [10001, 10002, 10003]

    def getWeaponDNA(self, weaponTokenIds):
        dnaList = []
        for weaponTokenId in weaponTokenIds:
            dna = self.readDNAFromMetadata(weaponTokenId)
            dnaList.append(dna)
        return dnaList

    def getTroopDNA(self, troopTokenIds):
        dnaList = []
        for troopTokenId in troopTokenIds:
            dna = self.readDNAFromMetadata(troopTokenId)
            if not dna:
                dna = self.createTroopMetadata(troopTokenId)
            dnaList.append(dna)
        return dnaList

    def mintTokens(self, receiving_wallet, tokenIds, dna_list):
        amounts = [1 for _ in tokenIds]
        # convert the hex strings in dna_list to integers
        dna_list = [int(dna, 16) for dna in dna_list]
        tx = self.contract.mintBatch(receiving_wallet, tokenIds, dna_list, amounts)
        print("Minting tokens {}".format(tx))

    def readDNAFromMetadata(self, tokenId):
        # check if file in metadata dir exists
        json_path = self.metadata_dir + '/' + str(tokenId) + '.json'
        image_path = self.image_dir + '/' + str(tokenId) + '.png'
        token_exists = pathlib.Path(json_path).is_file()
        image_exists = pathlib.Path(image_path).is_file()
        if not token_exists or not image_exists:
            return False
        # read metadata from json file
        metadata = None
        with open(json_path, 'r') as f:
            metadata = json.load(f)
        return metadata['dna']

    def createTroopMetadata(self, troopTokenId):
        # the called script must create the metadata and the image
        # and also move them to the appropriate directories
        #subprocess.run(["mintTroopToken.sh", str(troopTokenId)])
        stream = os.popen('mintTroopToken.sh ' + str(troopTokenId) + ' starter')
        dna = stream.read().strip()
        return dna



if __name__ == '__main__':
    private_key = None
    try:
        private_key = getpass('Private Key for transfers:')
    except Exception as error:
        print('ERROR', error)
    else:
        ct = WritableContract(private_key)
        om = OnDemandMinter(ct)
        #om.startListening()
        om.onOpenStarterKit('0xddf047721E8d9996E74325145c31da14bCFB093E')
