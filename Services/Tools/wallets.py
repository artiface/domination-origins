import json
import os.path

from eth_account import Account
import secrets

from doserve.config import ACCOUNTS_DIRECTORY

def create_wallet():
    priv = secrets.token_hex(32)
    private_key = "0x" + priv
    acct = Account.from_key(private_key)
    return acct.address, private_key

def add_account(name):
    account_file = os.path.join(ACCOUNTS_DIRECTORY, 'ethereum.json')
    accounts = None
    with open(account_file, "r") as f:
        accounts = json.load(f)
    pub, priv = create_wallet()
    accounts[name] = priv
    with open(account_file, "w") as f:
        json.dump(accounts, f)

def get_account(name):
    account_file = os.path.join(ACCOUNTS_DIRECTORY, "ethereum.json")
    accounts = None
    with open(account_file, "r") as f:
        accounts = json.load(f)
    return Account.from_key(accounts[name])

if __name__ == "__main__":
    pub, priv = create_wallet()
    print("Public key:", pub)
    print("Private key:", priv)