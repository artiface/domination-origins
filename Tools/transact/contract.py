import json
import os
from getpass import getpass

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware


class Contract:
    def __init__(self):
        self.abi_path = './abi/'
        self.block_explorer = 'https://mumbai.polygonscan.com/'
        mumbai = 'https://matic-mumbai.chainstacklabs.com'
        self.web3 = Web3(Web3.HTTPProvider(mumbai), middlewares=[])
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.chain_id = self.web3.toHex(self.web3.eth.chain_id)
        self.contract = self.getContract('g4n9-erc1155-test')

    def abiFromFile(self, filename):
        abi = None
        cwd = os.path.dirname(os.path.realpath(__file__))
        abi_path = os.path.join(cwd, self.abi_path, filename)
        with open(abi_path, 'r') as f:
            abi = json.load(f)
        return abi

    def getMainContract(self):
        return self.contract

    def getContract(self, name):
        addressMap = {
            'troop': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'weapon': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
            'g4n9-erc1155-test': '0x5E52b90Ce1796155f4571f07987F03672115B59e'
        }

        address = addressMap[name]

        abiMap = {
            'g4n9-erc1155-test': self.abiFromFile('erc1155.json')
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance


class WritableContract(Contract):
    def __init__(self, private_key):
        super().__init__()
        self.account = Account.from_key(private_key=private_key)
        self.web3.eth.defaultAccount = self.account.address

    def mint(self, target_address, token_id, dna, amount):
        tx = self.contract.functions.mint(target_address, token_id, amount, dna).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

    def mintBatch(self, target_address, token_ids, dna_list, amounts):
        tx = self.contract.functions.mintBatch(target_address, token_ids, amounts, dna_list).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return self.web3.toHex(tx_hash)

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


if __name__ == '__main__':
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
        ct = WritableContract(private_key)
        #tx = ct.transferFrom(from_address, to_address, token_id, amount)
        #tx = ct.mint(to_address, token_id, amount)
        #print(ct.txLink(tx))
