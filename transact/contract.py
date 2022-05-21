import binascii
import json
from getpass import getpass

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

class Contract:
    def __init__(self, private_key):
        self.account = Account.from_key(private_key=private_key)
        self.abi_path = './abi/'
        self.block_explorer = 'https://mumbai.polygonscan.com/'
        mumbai = 'https://matic-mumbai.chainstacklabs.com'
        self.web3 = Web3(Web3.HTTPProvider(mumbai), middlewares=[])
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.web3.eth.defaultAccount = self.account.address
        self.chain_id = self.web3.toHex(self.web3.eth.chain_id)
        self.contract = self.getContract('erc1155-test')

    def abiFromFile(self, filename):
        abi = None
        with open(self.abi_path + filename, 'r') as f:
            abi = json.load(f)
        return abi

    def getContract(self, name):
        addressMap = {
            'troop': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'weapon': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
            'erc1155-test': '0xB3f5900562b8944025e7303CD6B0520a42599513'
        }

        address = addressMap[name]

        abiMap = {
            'erc1155-test': self.abiFromFile('erc1155.json')
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance

    def mint(self, target_address, token_id, amount):
        data = b''
        tx = self.contract.functions.mint(target_address, token_id, amount, data).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

    def mintBatch(self, target_address, token_ids, amounts):
        data = b''
        tx = self.contract.functions.mintBatch(target_address, token_ids, amounts, data).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

    def createNFTCollection(self, target_address, start_id, count):
        token_ids = []
        token_counts = []
        for i in range(count):
            token_ids.append(start_id + i)
            token_counts.append(1)
        return self.mintBatch(target_address, token_ids, token_counts)

    def transferFrom(self, from_address, to_address, token_id, amount):
        data = b''
        tx = self.contract.functions.safeTransferFrom(from_address, to_address, token_id, amount, data).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

    def txLink(self, tx_hash):
        return self.block_explorer + 'tx/' + tx_hash

private_key = None
try:
    private_key = getpass('Private Key:')
except Exception as error:
    print('ERROR', error)
else:
    from_address = '0xddf047721E8d9996E74325145c31da14bCFB093E'
    to_address = '0x8080af9644fe17FE58BEaa798BCfb4e66F526e10'
    token_id = 3
    amount = 123
    ct = Contract(private_key)
    #tx = ct.transferFrom(from_address, to_address, token_id, amount)
    #tx = ct.mint(to_address, token_id, amount)
    tx = ct.createNFTCollection(to_address, 10000, 5000)
    print(ct.txLink(tx))
