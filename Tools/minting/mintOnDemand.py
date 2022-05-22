# The plan
# 1. Listen for open starter kit events
# 2. Assign tokenIds to the new troops
# 3. Check if metadata and image for this tokenId is available
# 4. If no, create metadata and image
# 5. Mint the tokens by sending a transaction
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
        troopTokenIds = self.assignTroopTokenIds()
        self.ensureDataForTroops(troopTokenIds)
        self.mintTokens(opener_wallet, troopTokenIds)

    def assignTroopTokenIds(self):
        return [10002, 10003, 10004]

    def ensureDataForTroops(self, troopTokenIds):
        for troopTokenId in troopTokenIds:
            if not self.isMetadataAvailable(troopTokenId):
                self.createTroopMetadata(troopTokenId)

    def mintTokens(self, receiving_wallet, tokenIds):
        amounts = [1 for _ in tokenIds]
        dna = [0 for _ in tokenIds] # TODO: pass DNA
        tx = self.contract.mintBatch(receiving_wallet, tokenIds, dna, amounts)
        print("Minting tokens {}".format(tx))

    def isMetadataAvailable(self, tokenId):
        # check if file in metadata dir exists
        json_path = self.metadata_dir + '/' + str(tokenId) + '.json'
        image_path = self.image_dir + '/' + str(tokenId) + '.png'
        token_exists = pathlib.Path(json_path).is_file()
        image_exists = pathlib.Path(image_path).is_file()
        return token_exists and image_exists

    def createTroopMetadata(self, troopTokenId):
        # the called script must create the metadata and the image
        # and also move them to the appropriate directories
        #subprocess.run(["mintTroopToken.sh", str(troopTokenId)])
        os.system('mintTroopToken.sh ' + str(troopTokenId) + ' starter')


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
