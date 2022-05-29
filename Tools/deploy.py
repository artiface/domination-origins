import sys

from Tools.transact.contract import deploy_contract
from Tools.wallets import get_account

if __name__ == '__main__':
    contract_name = sys.argv[1]
    private_key = get_account('mmx').privateKey
    deploy_contract(contract_name, private_key, testnet=True)
