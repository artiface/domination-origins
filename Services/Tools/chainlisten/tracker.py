import os
import sys

from web3 import Web3
from web3.middleware import geth_poa_middleware

from doserve.config import BATTLE_DATA_DIRECTORY, TEST_NETWORK
from listener import Listener
from MintingBackend.transact.contract import Contract
from storage import Storage
from scanner import JSONifiedState, EventScanner


class Tracker:
    def __init__(self):
        polymain = 'https://rpc.ankr.com/polygon'
        mumbai = 'https://matic-mumbai.chainstacklabs.com'
        rpc_endpoint = mumbai if TEST_NETWORK else polymain
        network_name = 'test network' if TEST_NETWORK else 'MAIN NET'
        print('Tracker running on %s' % network_name)
        self.ipfsGateway = 'https://gateway.ipfs.io/' #'https://ipfs.io/'
        self.web3 = Web3(Web3.HTTPProvider(rpc_endpoint), middlewares=[])
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.db = Storage(os.path.join(BATTLE_DATA_DIRECTORY, 'balances.db'))
        self.listener = Listener(self.on_raw_event)
        #currentBlock = self.web3.eth.blockNumber

    def on_raw_event(self, event_index, event):
        print("Raw Event of type %s" % event_index)
        tx_hash = event["transactionHash"].hex()
        args = event["args"]
        is_batch = 'id' not in args and 'ids' in args
        tokenIds = args["ids"] if is_batch else [args["id"]]
        from_address = args["from"]
        to_address = args["to"]
        values = args["values"] if is_batch else [args["value"]]

        for tokenId, value in zip(tokenIds, values):
            self.on_transfer(tx_hash, tokenId, from_address, to_address, value)

        return {
            'tx_hash': tx_hash,
            'tokenIds': tokenIds,
            'from': from_address,
            'to': to_address,
            'values': values
        }

    def on_transfer(self, tx_hash, token_id, from_address, to_address, value):
        print('new transfer (tx: {}): {} of tokens with id {} from {} to {}'.format(tx_hash, value, token_id, from_address, to_address))
        if from_address == '0x0000000000000000000000000000000000000000':
            self.db.mintToken(token_id, to_address, value)
        else:
            self.db.transferToken(token_id, from_address, to_address, value)

    def listen(self, event_list):
        self.listener.listen(event_list)

    def scan(self, contract, event_list, start_block, end_block=None):
        #start_block = 26395546
        if not end_block:
            end_block = self.web3.eth.blockNumber

        state = JSONifiedState(self.on_raw_event)
        state.restore()

        scanner = EventScanner(
            web3=self.web3,
            contract=contract,
            state=state,
            events=event_list,
            filters={"address": contract.address},
            # How many maximum blocks at the time we request from JSON-RPC
            # and we are unlikely to exceed the response size limit of the JSON-RPC server
            max_chunk_scan_size=10000
        )
        result, total_chunks_scanned = scanner.scan(start_block, end_block)
        state.save()
        return result

    def getBalance(self, address):
        return self.db.getAllBalances(address)

    def getCurrentBlock(self):
        return self.web3.eth.blockNumber


if __name__ == '__main__':
    # check if argument is "listen"
    if len(sys.argv) > 1 and sys.argv[1] == 'listen':
        t = Tracker()
        c = Contract('erc1155', testnet=TEST_NETWORK)
        contract = c.getMainContract()
        event_list = [contract.events.TransferSingle, contract.events.TransferBatch]
        block = t.getCurrentBlock()
        print('Listening for txs on contract %s starting from block %s' % (contract.address, block))
        t.listen(event_list)
    # check if argument is "scan"
    elif len(sys.argv) > 1 and sys.argv[1] == 'scan':
        # get start and end block from the command line arguments
        end_block = 'latest' #int(sys.argv[2])
        t = Tracker()
        c = Contract('erc1155', testnet=TEST_NETWORK)
        contract = c.getMainContract()
        start_block = 26409555
        event_list = [contract.events.TransferSingle, contract.events.TransferBatch]
        block = t.getCurrentBlock()
        print('Scanning from block {} to {}'.format(start_block, end_block))
        t.scan(contract, event_list, start_block)
    # check if argument is "balance"
    elif len(sys.argv) > 1 and sys.argv[1] == 'balance':
        #get wallet address from the command line arguments
        address = sys.argv[2]
        t = Tracker()
        balance = t.getBalance(address)
        print('Balance for {} is\n\n{}'.format(address, balance))