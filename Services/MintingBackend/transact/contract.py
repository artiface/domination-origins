import json
import os

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

from Tools.wallets import get_account

class Contract:
    def __init__(self, name, testnet=True):
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
        self.testnet = testnet
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
        if name == '+deploy+':
            return None

        addressMap = {
            'troops': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'items': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
            'erc1155': '0xc6aC1a63fbD7a843cf4F364177CD16eB0112dC09',
        }

        addressMapTest = {
            'troops': "0x430a7dE60D42014D6E22064417A3D09634725367",
            'items': "0x430a7dE60D42014D6E22064417A3D09634725367",
            'erc1155': '0x37FD34a131b07ce495f7D16275B6dc4Ed1Bbd8C5',
            'erc721batch': '0xf86a72c5d9245c43e9d13cbc4cb0b49a869571b5'
        }

        address = addressMapTest[name] if self.testnet else addressMap[name]

        abiMap = {
            'troops': self.abiFromFile('troops.json'),
            'items': self.abiFromFile('items.json'),
            'erc1155': self.abiFromFile('erc1155.json'),
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance


class WritableContract(Contract):
    def __init__(self, name, private_key, testnet=True):
        super().__init__(name, testnet)
        self.next_nonce = False
        self.account = Account.from_key(private_key=private_key)
        self.web3.eth.defaultAccount = self.account.address

    def safeMint_erc721(self, target_address, nonce):
        contract_call = self.contract.functions.safeMint(target_address)
        return self.send_raw_transaction(contract_call, nonce)

    def setContractUri(self, uri):
        contract_call = self.contract.functions.setContractURI(uri)
        return self.send_raw_transaction(contract_call)

    def setURI(self, uri):
        contract_call = self.contract.functions.setURI(uri)
        return self.send_raw_transaction(contract_call)

    def setGasReceiver(self, new_gas_receiver, part_of_thousand):
        contract_call = self.contract.functions.setGasReceiver(new_gas_receiver, part_of_thousand)
        return self.send_raw_transaction(contract_call)

    def setBuyPrices(self, new_starter_price, new_booster_price):
        contract_call = self.contract.functions.setPrices(new_starter_price, new_booster_price)
        return self.send_raw_transaction(contract_call)

    def setTokenReceiver(self, new_token_receiver):
        contract_call = self.contract.functions.setTokenReceiver(new_token_receiver)
        return self.send_raw_transaction(contract_call)

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
        nonce = max(self.web3.eth.getTransactionCount(self.account.address), self.next_nonce or 0) if nonce is None else nonce
        print('Using nonce:', nonce)
        unsigned_tx = contract_call.buildTransaction(
            {
                'nonce': nonce,
                'from': self.account.address,
                'chainId': self.chain_id,
            })
        # estimate gas
        gas_estimate = self.web3.eth.estimateGas(unsigned_tx)
        print('Gas estimate:', gas_estimate)
        unsigned_tx['gas'] = gas_estimate

        signed_tx = self.account.signTransaction(unsigned_tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        human_readable_hash = self.web3.toHex(tx_hash)

        tx_receipt = self.web3.eth.waitForTransactionReceipt(tx_hash)
        tx_cost, gas_price, gas_used = self.getCostFromReceipt(tx_receipt)
        # print the price up to 2 decimal places
        print('Paid', '{:.5f}'.format(tx_cost), 'MATIC @', '{:.5f}'.format(gas_price), 'Gwei per gas using', gas_used,
              'gas in transaction', human_readable_hash)

        self.next_nonce = nonce + 1

        return human_readable_hash, tx_receipt

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

    def getCostFromReceipt(self, tx_receipt):
        #print('Transaction receipt:', tx_receipt)
        gas_used = tx_receipt['gasUsed']
        gas_price_gwei = tx_receipt['effectiveGasPrice'] / 10 ** 9
        gwei = gas_price_gwei * gas_used
        # convert to MATIC
        total_price_matic = gwei / 10 ** 9
        return total_price_matic, gas_price_gwei, gas_used


class Deployer(WritableContract):
    def __init__(self, contract_abi, contract_bytecode, private_key, testnet=True):
        super().__init__('+deploy+', private_key, testnet)
        self.contract_abi = contract_abi
        self.contract_bytecode = contract_bytecode

    def deploy(self):
        contract = self.web3.eth.contract(abi=self.contract_abi, bytecode=self.contract_bytecode)
        contract_call = contract.constructor()
        tx_hash, receipt = self.send_raw_transaction(contract_call)
        contract_address = receipt['contractAddress']
        print('Deployed Contract address:', contract_address)
        return contract_address


def deploy_contract(name, private_key, testnet=True):
    print('Deploying contract {} to {}'.format(name, 'test net' if testnet else 'MAIN NET'))
    parent_path = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir, os.pardir))
    contract_path = os.path.join(parent_path, 'contracts', 'output', name)
    contract_abi = json.loads(open(contract_path + '.abi').read())
    contract_bytecode = open(contract_path + '.bin').read()
    deployer = Deployer(contract_abi, contract_bytecode, private_key, testnet)
    return deployer.deploy()

if __name__ == '__main__':
    private_key = None
    try:
        private_key = get_account('mmx').privateKey #getpass('Private Key:')
    except Exception as error:
        print('ERROR', error)
    else:
        deploy_contract('TestTokenFX', private_key)
        # erc721 token contract:0x430a7dE60D42014D6E22064417A3D09634725367
        # swap contract: https://mumbai.polygonscan.com/address/0xd0c3aa4d7e629c1b186f239e4168dc1218391e30#writeContract
        #from_address = '0xddf047721E8d9996E74325145c31da14bCFB093E'
        #to_address = '0x4059A7Cceb0A65f1Eb3Faf19BD76259a99919571'
        #token_id = 3
        #amount = 123
        #ct = WritableContract('erc721', private_key, testnet=True)
        #nonce = None
        #ct.setApprovalForAll('0xd0C3AA4d7E629C1B186F239E4168DC1218391E30')
        #tx_info = ct.getTransaction('0x0fb3a7d172b6172d76fb36d2f9988e264b5778c135e2b3f6f0a4ca738e2ef2b3')
        #print(tx_info)
        #for i in range(1, 10):
        #    tx, nonce = ct.safeMint_erc721(to_address, nonce)
            #tx = ct.transferFrom(from_address, to_address, token_id, amount)
            #tx = ct.mint(to_address, token_id, amount)
        #    print(ct.txLink(tx))
