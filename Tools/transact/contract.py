import json
import os
from getpass import getpass

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

from Tools.wallets import get_account


class Contract:
    def __init__(self, name, testnet=False):
        available_networks = {
            'testnet': {
                'provider': 'https://matic-mumbai.chainstacklabs.com/',
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
            'g4n9-erc1155-test': '0x5E52b90Ce1796155f4571f07987F03672115B59e',
            'erc721': '0x430a7dE60D42014D6E22064417A3D09634725367',
        }

        address = addressMap[name]

        abiMap = {
            'troops': self.abiFromFile('troops.json'),
            'items': self.abiFromFile('items.json'),
            'g4n9-erc1155-test': self.abiFromFile('erc1155.json'),
            'erc721': self.abiFromFile('erc721.json'),
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance


class WritableContract(Contract):
    def __init__(self, name, private_key, testnet=False):
        super().__init__(name, testnet)
        self.account = Account.from_key(private_key=private_key)
        self.web3.eth.defaultAccount = self.account.address

    def safeMint_erc721(self, target_address, nonce):
        contract_call = self.contract.functions.safeMint(target_address)
        return self.send_raw_transaction(contract_call, nonce)

    def mint(self, target_address, token_id, dna, amount):
        contract_call = self.contract.functions.mint(target_address, token_id, amount, dna)
        return self.send_raw_transaction(contract_call)

    def setApprovalForAll(self, target_address):
        contract_call = self.contract.functions.setApprovalForAll(target_address, True)
        return self.send_raw_transaction(contract_call)

    def mintBatch(self, target_address, token_ids, dna_list, amounts):
        contract_call = self.contract.functions.mintBatch(target_address, token_ids, amounts, dna_list)
        return self.send_raw_transaction(contract_call)

    def transferFrom(self, from_address, to_address, token_id, amount):
        data = b''
        contract_call = self.contract.functions.safeTransferFrom(from_address, to_address, token_id, amount, data)
        return self.send_raw_transaction(contract_call)

    def send_raw_transaction(self, contract_call, nonce=None):
        nonce = self.web3.eth.getTransactionCount(self.account.address) if nonce is None else nonce
        print('Using nonce:', nonce)
        unsigned_tx = contract_call.buildTransaction(
            {
                'nonce': nonce,
            })
        unsigned_tx['chainId'] = self.chain_id
        unsigned_tx['from'] = self.account.address

        # estimate gas
        gas_estimate = self.web3.eth.estimateGas(unsigned_tx)
        print('Gas estimate:', gas_estimate)
        unsigned_tx['gas'] = gas_estimate

        signed_tx = self.account.signTransaction(unsigned_tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        human_readable_hash = self.web3.toHex(tx_hash)

        tx_cost, gas_price, gas_used = self.getTransactionCost(tx_hash)
        # print the price up to 2 decimal places
        print('Paid', '{:.5f}'.format(tx_cost), 'MATIC @', '{:.5f}'.format(gas_price), 'Gwei per gas using', gas_used,
              'gas in transaction', human_readable_hash)

        return human_readable_hash, nonce + 1

    def txLink(self, tx_hash):
        return self.block_explorer + 'tx/' + tx_hash

    def getTransaction(self, tx_hash):
        return self.web3.eth.getTransaction(tx_hash)

    def getTransactionReceipt(self, tx_hash):
        return self.web3.eth.getTransactionReceipt(tx_hash)

    def getGasPrice(self, tx_hash):
        tx = self.getTransaction(tx_hash)
        gas_price = tx['gasPrice']
        return gas_price

    # in Gwei
    def getTransactionCost(self, tx_hash):
        tx = self.getTransaction(tx_hash)
        gas_used = tx['gas']
        gas_price_gwei = tx['gasPrice'] / 10 ** 9
        gwei = gas_price_gwei * gas_used
        # convert to MATIC
        return gwei / 10 ** 9, gas_price_gwei, gas_used

if __name__ == '__main__':
    private_key = None
    try:
        private_key = get_account('tohol').privateKey #getpass('Private Key:')
    except Exception as error:
        print('ERROR', error)
    else:
        # erc721 token contract:0x430a7dE60D42014D6E22064417A3D09634725367
        # swap contract: https://mumbai.polygonscan.com/address/0xd0c3aa4d7e629c1b186f239e4168dc1218391e30#writeContract
        from_address = '0xddf047721E8d9996E74325145c31da14bCFB093E'
        to_address = '0x4059A7Cceb0A65f1Eb3Faf19BD76259a99919571'
        #token_id = 3
        #amount = 123
        ct = WritableContract('erc721', private_key, testnet=True)
        nonce = None
        ct.setApprovalForAll('0xd0C3AA4d7E629C1B186F239E4168DC1218391E30')
        #tx_info = ct.getTransaction('0x0fb3a7d172b6172d76fb36d2f9988e264b5778c135e2b3f6f0a4ca738e2ef2b3')
        #print(tx_info)
        #for i in range(1, 10):
        #    tx, nonce = ct.safeMint_erc721(to_address, nonce)
            #tx = ct.transferFrom(from_address, to_address, token_id, amount)
            #tx = ct.mint(to_address, token_id, amount)
        #    print(ct.txLink(tx))
