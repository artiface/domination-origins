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
from Tools.transact.contract import Contract, WritableContract

class OnDemandMinter:
    def __init__(self, private_key_for_transactions):
        self.metadata_dir = './metadata'
        self.image_dir = './images'
        self.main_contract = WritableContract('erc1155', private_key_for_transactions, testnet=True)

        # We listen to transfer events to this address
        self.erc721_token_receiver_wallet = '0x4059A7Cceb0A65f1Eb3Faf19BD76259a99919571'

        self.troops_contract = Contract('troops')
        self.items_contract = Contract('items')

        self.listener = Listener(self.on_event)

    def startListening(self):
        print("Listening for open starter kit events")
        self.listener.listen([
            self.main_contract.contract.events.Received,         # 0
            self.main_contract.contract.events.ReceivedBatch,    # 1
            self.items_contract.contract.events.Transfer,        # 2
            self.troops_contract.contract.events.Transfer,       # 3
        ])

    def on_event(self, event_index, event):
        if event_index < 2:
            sender_wallet = event['_sender']
            tokenIds = event['_tokenId']
            amounts = event['_value']
            if event_index == 0:
                tokenIds = [event['_tokenId']]
                amounts = [event['_value']]
            self.handle_erc1155_tokens_received(sender_wallet, tokenIds, amounts)
        else:
            from_wallet = event['args']['from']
            to_wallet = event['args']['to']
            tokenId = event['args']['tokenId']
            if to_wallet == self.erc721_token_receiver_wallet:
                if event_index == 2:
                    self.handle_erc721_item_received(from_wallet, tokenId)
                elif event_index == 3:
                    self.handle_erc721_troop_received(from_wallet, tokenId)

    def handle_erc1155_tokens_received(self, sender_wallet, tokenIds, amounts):
        dnaList = []
        mintIds = []
        for tokenId, amount in zip(tokenIds, amounts):
            print("Received {} erc1155 tokens with tokenId {} from {}".format(amount, tokenId, sender_wallet))
            if tokenId == 1:
                starterToken, starterDna = self.onOpenStarterKit(sender_wallet, amount)
                dnaList.append(starterDna)
                mintIds.append(starterToken)

            if 10001 <= tokenId <= 20000:
                for _ in range(amount):
                    self.onOpenStarterKit(sender_wallet)

        self.mintTokens(sender_wallet, mintIds, dnaList)

    def onOpenStarterKit(self, opener_wallet, amount):
        print("Received open pack {} for {} starter kits".format(opener_wallet, amount))
        dnaList = []
        tokenIds = []
        for _ in range(amount):
            troopTokenIds = self.selectTroopTokens()
            troopDnaList = self.getTroopDNA(troopTokenIds)

            weaponTokenIds = self.selectWeaponTokens()
            weaponDnaList = self.getWeaponDNA(weaponTokenIds)

            dnaList.append(troopDnaList + weaponDnaList)
            tokenIds.append(troopTokenIds + weaponTokenIds)

        return tokenIds, dnaList

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
        tx = self.main_contract.mintBatch(receiving_wallet, tokenIds, dna_list, amounts)
        print("Minting tokens {}".format(tx))

    def mintToken(self, receiving_wallet, tokenId, dna):
        # convert the hex strings in dna_list to integers
        dna = int(dna, 16)
        tx = self.main_contract.mint(receiving_wallet, tokenId, dna, 1)
        print("Minting token {}".format(tx))

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

    # requires existing metadata with dna and image
    def handle_erc721_item_received(self, from_wallet, tokenId):
        print("Received item token {} from {}".format(tokenId, from_wallet))
        new_token_id = tokenId + 20000
        print("Minting new item token {}".format(new_token_id))
        self.mintToken(from_wallet, new_token_id, self.readDNAFromMetadata(new_token_id))

    def handle_erc721_troop_received(self, from_wallet, tokenId):
        print("Received troop token {} from {}".format(tokenId, from_wallet))
        new_token_id = tokenId + 10000
        print("Minting new troop token {}".format(new_token_id))
        self.mintToken(from_wallet, new_token_id, self.readDNAFromMetadata(new_token_id))

if __name__ == '__main__':
    private_key = None
    try:
        private_key = getpass('Private Key for transfers:')
    except Exception as error:
        print('ERROR', error)
    else:
        om = OnDemandMinter(private_key)
        om.startListening()
        #om.onOpenStarterKit('0xddf047721E8d9996E74325145c31da14bCFB093E')
