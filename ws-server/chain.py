from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware
from web3.exceptions import ContractLogicError
import requests
import urllib.request
import json
from pathlib import Path
import os

class ChainLoader:
    def __init__(self):
        targetPath = './WeaponNFTs'
        self.targetPath = targetPath
        self.chainProvider = 'https://rpc.ankr.com/polygon'
        self.ipfsGateway = 'https://gateway.ipfs.io/' #'https://ipfs.io/'

    def flattenAttributes(self, attributes):
        flat = {}
        for item in attributes:
            key = item['trait_type']
            value = item['value']
            flat[key] = value
        return flat

    def getContract(self, tokenType):
        addressMap = {
            'char': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'item': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866"
        }

        w3 = Web3(Web3.HTTPProvider(self.chainProvider), middlewares=[])
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)

        address = addressMap[tokenType]
        abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"owner","type":"address"},{"indexed":True,"internalType":"address","name":"approved","type":"address"},{"indexed":True,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"owner","type":"address"},{"indexed":True,"internalType":"address","name":"operator","type":"address"},{"indexed":False,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":False,"inputs":[{"indexed":False,"internalType":"bool","name":"result","type":"bool"},{"indexed":False,"internalType":"string","name":"message","type":"string"}],"name":"BuyResult","type":"event"},{"anonymous":False,"inputs":[{"indexed":False,"internalType":"bool","name":"result","type":"bool"},{"indexed":False,"internalType":"uint256","name":"itemId","type":"uint256"}],"name":"OperationResult","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":True,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"from","type":"address"},{"indexed":True,"internalType":"address","name":"to","type":"address"},{"indexed":True,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseExtension","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"baseURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"blackHoleAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"burnItem","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"numberOfTokens","type":"uint256"}],"name":"buyToken","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"chestContract","outputs":[{"internalType":"contract ERC721","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMintPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTokenPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTokenUnitVal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"_chestId","type":"uint256"}],"name":"mintItem","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"mintPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_chestId","type":"uint256"}],"name":"openChest","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newuri","type":"string"}],"name":"setBASEURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_addresList","type":"address[]"},{"internalType":"uint256[]","name":"_balanceList","type":"uint256[]"}],"name":"setBalances","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_blackHoleAddress","type":"address"}],"name":"setBlackHoleAddress","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ERC721","name":"_chestContractAddress","type":"address"}],"name":"setChestContractAddress","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_mintPrice","type":"uint256"}],"name":"setMintPrice","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_storageAddress","type":"address"}],"name":"setStorageAddress","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20","name":"_tokenContractAddress","type":"address"}],"name":"setTokenContractAddress","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenPrice","type":"uint256"}],"name":"setTokenPrice","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_tokenUnitVal","type":"uint256"}],"name":"setTokenUnitVal","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenContract","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenStorage","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenUnitVal","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdraw","outputs":[],"stateMutability":"payable","type":"function"}]

        contract_instance = w3.eth.contract(address=address, abi=abi)
        return contract_instance

    def isOwnerOf(self, address, token_type, token_id):
        contract = self.getContract(token_type)
        print("Checking ownership of token {} of type {} for adress {}".format(token_id, token_type, address))
        owner_of_token_id = contract.functions.ownerOf(int(token_id)).call()
        return owner_of_token_id == address

    def loadFromChain(self, tokenType, tokenId):
        contract = self.getContract(tokenType)
        ipfsUrl = contract.functions.tokenURI(tokenId).call()
        httpIpfs = ipfsUrl.replace("ipfs://", self.ipfsGateway + "ipfs/")
        print('loading ipfs data from %s' % httpIpfs)
        jsonMeta = requests.get(httpIpfs).text
        meta_data = json.loads(jsonMeta)
        #meta_data['image'] = meta_data['image'].replace("ipfs://", self.ipfsGateway + "ipfs/")
        return meta_data

    def loadToken(self, tokenType, tokenId):
        tokenFile = Path("%s/%s.json" % (self.targetPath, tokenId))
        imagePath = "%s/%s.png" % (self.targetPath, tokenId)

        tokenExists = tokenFile.exists()
        imageExists = Path(imagePath).exists()
        if tokenExists and imageExists:
            metaData = json.loads(tokenFile.read_text())
            metaData['image'] = imagePath
            return metaData
        return self.storeToken(tokenType, tokenId)
        
    def storeToken(self, tokenType, tokenId):
        tokenFile = Path("%s/%s.json" % (self.targetPath, tokenId))
        #imagePath = "%s/%s.png" % (self.targetPath, tokenId)

        tokenExists = tokenFile.exists()
        #imageExists = Path(imagePath).exists()

        if tokenExists:# and imageExists:
            print('%s Exists' % tokenId)
            return
        try:
            data = {}
            #if tokenExists:
            #    data = json.loads(tokenFile.read_text())
            #else:
            data = self.loadFromChain(tokenType, tokenId)
            tokenFile.write_text(json.dumps(data))

            #urllib.request.urlretrieve(data['image'], imagePath)
            print('Saved token %s' % tokenId)
            return data
        except (json.decoder.JSONDecodeError, urllib.error.ContentTooShortError, urllib.error.HTTPError) as e:
            #if Path(imagePath).exists():
            #    Path(imagePath).unlink()
            if tokenFile.exists():
                tokenFile.unlink()
            return False

    def loadLocalNFT(self, type, tokenId):
        dirmap = {
            'char': 'TroopNFTs',
            'weapon': 'WeaponNFTs',
        }
        dir = dirmap[type]
        try:
            with open('./{}/{}.json'.format(dir, tokenId), 'r') as f:
                data = json.load(f)
                # flatten attributes
                data['attributes'] = self.flattenAttributes(data['attributes'])
                return data
        except FileNotFoundError:
            return False


if __name__ == "__main__":
    Path('./WeaponNFTs').mkdir(parents=True, exist_ok=True)

    loader = ChainLoader()

    for i in range(10000):
        try:
            loader.storeToken('item', i)
        except ContractLogicError as e:
            print('No token for id %s' % i)