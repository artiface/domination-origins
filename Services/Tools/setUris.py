from MintingBackend.transact import WritableContract
from MintingBackend.helper.wallets import get_account

if __name__ == '__main__':
    mmx = get_account('mmx')
    private_key = mmx.privateKey
    c = WritableContract('erc1155', private_key, testnet=True)
    #c.setGasReceiver(mmx.address, 100)
    #c.setTokenReceiver(mmx.address)
    price = 0.1 # MATIC
    # convert to wei
    price = int(price * 10**18)
    #c.setBuyPrices(price, price)
    c.setURI('https://g4n9.site/opensea/')
    c.setContractUri('https://g4n9.site/opensea/contract.json')
