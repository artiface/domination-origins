import json
import os
from getpass import getpass

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware


class Contract:
    def __init__(self, name, testnet=False):
        available_networks = {
            'testnet': {
                'provider': 'https://matic-mumbai.chainstacklabs.com',
                'block_explorer': 'https://mumbai.polygonscan.com/',
            },
            'mainnet': {
                'provider': 'https://matic-mainnet.chainstacklabs.com/', #/'https://polygon-rpc.com/',
                'block_explorer': 'https://polygonscan.com/',
            }
        }
        network = available_networks['testnet'] if testnet else available_networks['mainnet']
        base_path = os.path.realpath(__file__)
        self.abi_path = os.path.join(os.path.dirname(base_path), 'abi')
        self.block_explorer = network['block_explorer']
        self.web3 = Web3(Web3.HTTPProvider(network['provider']), middlewares=[])
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.chain_id = self.web3.toHex(self.web3.eth.chain_id)
        self.contract = self.getContract(name)

    def abiFromFile(self, filename):
        abi = None
        abi_path = os.path.join(self.abi_path, filename)
        with open(abi_path, 'r') as f:
            abi = json.load(f)
        return abi

    def getMainContract(self):
        return self.contract

    def getContract(self, name):
        addressMap = {
            'troops': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'items': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
            'g4n9-erc1155-test': '0x5E52b90Ce1796155f4571f07987F03672115B59e'
        }

        address = addressMap[name]

        abiMap = {
            'troops': self.abiFromFile('troops.json'),
            'items': self.abiFromFile('items.json'),
            'g4n9-erc1155-test': self.abiFromFile('erc1155.json'),
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance


class WritableContract(Contract):
    def __init__(self, name, private_key, testnet=False):
        super().__init__(name, testnet)
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
        ct = WritableContract('g4n9-erc1155-test', private_key)
        #tx = ct.transferFrom(from_address, to_address, token_id, amount)
        #tx = ct.mint(to_address, token_id, amount)
        #print(ct.txLink(tx))
