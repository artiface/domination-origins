import binascii
import json
from getpass import getpass

from eth_account import Account
from web3 import Web3
from web3.middleware import geth_poa_middleware

class Contract:
    def __init__(self, private_key):
        self.account = Account.from_key(private_key=private_key)
        mumbai = 'https://matic-mumbai.chainstacklabs.com'
        self.web3 = Web3(Web3.HTTPProvider(mumbai), middlewares=[])
        self.web3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.web3.eth.defaultAccount = self.account.address
        self.chain_id = self.web3.toHex(self.web3.eth.chain_id)

    def getContract(self, name):
        addressMap = {
            'troop': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
            'weapon': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
            'erc1155-test': '0xB3f5900562b8944025e7303CD6B0520a42599513'
        }

        address = addressMap[name]
        troopAbi = [{"inputs": [{"internalType": "string", "name": "_name", "type": "string"},
                                {"internalType": "string", "name": "_symbol", "type": "string"},
                                {"internalType": "string", "name": "_initBaseURI", "type": "string"},
                                {"internalType": "string", "name": "_initNotRevealedUri", "type": "string"}],
                     "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": False, "inputs": [
            {"indexed": True, "internalType": "address", "name": "owner", "type": "address"},
            {"indexed": True, "internalType": "address", "name": "approved", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Approval",
                                                                               "type": "event"}, {"anonymous": False,
                                                                                                  "inputs": [
                                                                                                      {"indexed": True,
                                                                                                       "internalType": "address",
                                                                                                       "name": "owner",
                                                                                                       "type": "address"},
                                                                                                      {"indexed": True,
                                                                                                       "internalType": "address",
                                                                                                       "name": "operator",
                                                                                                       "type": "address"},
                                                                                                      {"indexed": False,
                                                                                                       "internalType": "bool",
                                                                                                       "name": "approved",
                                                                                                       "type": "bool"}],
                                                                                                  "name": "ApprovalForAll",
                                                                                                  "type": "event"},
                    {"anonymous": False,
                     "inputs": [{"indexed": True, "internalType": "address", "name": "previousOwner", "type": "address"},
                                {"indexed": True, "internalType": "address", "name": "newOwner", "type": "address"}],
                     "name": "OwnershipTransferred", "type": "event"}, {"anonymous": False, "inputs": [
                {"indexed": True, "internalType": "address", "name": "from", "type": "address"},
                {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
                {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Transfer",
                                                                        "type": "event"},
                    {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "addressMintedBalance",
                     "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [{"internalType": "address", "name": "to", "type": "address"},
                                                      {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                                           "name": "approve", "outputs": [], "stateMutability": "nonpayable",
                                           "type": "function"},
                    {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}], "name": "balanceOf",
                     "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [], "name": "baseExtension",
                                           "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                                           "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "baseURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "cost", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "getApproved",
                     "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [{"internalType": "address", "name": "owner", "type": "address"},
                                                      {"internalType": "address", "name": "operator", "type": "address"}],
                                           "name": "isApprovedForAll",
                                           "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                                           "stateMutability": "view", "type": "function"},
                    {"inputs": [{"internalType": "address", "name": "_user", "type": "address"}], "name": "isWhitelisted",
                     "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [], "name": "maxMintAmount",
                                           "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                           "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "maxSupply",
                     "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                     "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "_mintAmount", "type": "uint256"}], "name": "mint",
                     "outputs": [], "stateMutability": "payable", "type": "function"},
                    {"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                     "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "nftPerAddressLimit",
                                                                      "outputs": [{"internalType": "uint256", "name": "",
                                                                                   "type": "uint256"}],
                                                                      "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "notRevealedUri",
                     "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [], "name": "onlyWhitelisted",
                                           "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                                           "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "ownerOf",
                     "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view",
                     "type": "function"},
                    {"inputs": [{"internalType": "bool", "name": "_state", "type": "bool"}], "name": "pause", "outputs": [],
                     "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [], "name": "paused", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable",
                     "type": "function"},
                    {"inputs": [], "name": "reveal", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [], "name": "revealed", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                     "stateMutability": "view", "type": "function"}, {
                        "inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                   {"internalType": "address", "name": "to", "type": "address"},
                                   {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                        "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
                        "inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                   {"internalType": "address", "name": "to", "type": "address"},
                                   {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                                   {"internalType": "bytes", "name": "_data", "type": "bytes"}], "name": "safeTransferFrom",
                        "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
                        "inputs": [{"internalType": "address", "name": "operator", "type": "address"},
                                   {"internalType": "bool", "name": "approved", "type": "bool"}],
                        "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "string", "name": "_newBaseExtension", "type": "string"}],
                     "name": "setBaseExtension", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "string", "name": "_newBaseURI", "type": "string"}], "name": "setBaseURI",
                     "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "_newCost", "type": "uint256"}], "name": "setCost",
                     "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "_limit", "type": "uint256"}],
                     "name": "setNftPerAddressLimit", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "string", "name": "_notRevealedURI", "type": "string"}],
                     "name": "setNotRevealedURI", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "bool", "name": "_state", "type": "bool"}], "name": "setOnlyWhitelisted",
                     "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "_newmaxMintAmount", "type": "uint256"}],
                     "name": "setmaxMintAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
                     "name": "supportsInterface", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                     "stateMutability": "view", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "index", "type": "uint256"}], "name": "tokenByIndex",
                     "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [{"internalType": "address", "name": "owner", "type": "address"},
                                                      {"internalType": "uint256", "name": "index", "type": "uint256"}],
                                           "name": "tokenOfOwnerByIndex",
                                           "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                           "stateMutability": "view", "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenURI",
                     "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [], "name": "totalSupply",
                                           "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                           "stateMutability": "view", "type": "function"}, {
                        "inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                   {"internalType": "address", "name": "to", "type": "address"},
                                   {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                        "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
                     "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                    {"inputs": [{"internalType": "address", "name": "_owner", "type": "address"}], "name": "walletOfOwner",
                     "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}], "stateMutability": "view",
                     "type": "function"}, {"inputs": [{"internalType": "address[]", "name": "_users", "type": "address[]"}],
                                           "name": "whitelistUsers", "outputs": [], "stateMutability": "nonpayable",
                                           "type": "function"},
                    {"inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "name": "whitelistedAddresses",
                     "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view",
                     "type": "function"},
                    {"inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "payable", "type": "function"}]
        itemAbi = [{"inputs": [], "stateMutability": "nonpayable", "type": "constructor"}, {"anonymous": False, "inputs": [
            {"indexed": True, "internalType": "address", "name": "owner", "type": "address"},
            {"indexed": True, "internalType": "address", "name": "approved", "type": "address"},
            {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "Approval",
                                                                                            "type": "event"},
                   {"anonymous": False,
                    "inputs": [{"indexed": True, "internalType": "address", "name": "owner", "type": "address"},
                               {"indexed": True, "internalType": "address", "name": "operator", "type": "address"},
                               {"indexed": False, "internalType": "bool", "name": "approved", "type": "bool"}],
                    "name": "ApprovalForAll", "type": "event"}, {"anonymous": False, "inputs": [
                {"indexed": False, "internalType": "bool", "name": "result", "type": "bool"},
                {"indexed": False, "internalType": "string", "name": "message", "type": "string"}], "name": "BuyResult",
                                                                 "type": "event"}, {"anonymous": False, "inputs": [
                {"indexed": False, "internalType": "bool", "name": "result", "type": "bool"},
                {"indexed": False, "internalType": "uint256", "name": "itemId", "type": "uint256"}],
                                                                                    "name": "OperationResult",
                                                                                    "type": "event"}, {"anonymous": False,
                                                                                                       "inputs": [
                                                                                                           {"indexed": True,
                                                                                                            "internalType": "address",
                                                                                                            "name": "previousOwner",
                                                                                                            "type": "address"},
                                                                                                           {"indexed": True,
                                                                                                            "internalType": "address",
                                                                                                            "name": "newOwner",
                                                                                                            "type": "address"}],
                                                                                                       "name": "OwnershipTransferred",
                                                                                                       "type": "event"},
                   {"anonymous": False,
                    "inputs": [{"indexed": True, "internalType": "address", "name": "from", "type": "address"},
                               {"indexed": True, "internalType": "address", "name": "to", "type": "address"},
                               {"indexed": True, "internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                    "name": "Transfer", "type": "event"}, {
                       "inputs": [{"internalType": "address", "name": "to", "type": "address"},
                                  {"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "approve",
                       "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "address", "name": "owner", "type": "address"}], "name": "balanceOf",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                    "type": "function"}, {"inputs": [], "name": "baseExtension",
                                          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                                          "stateMutability": "view", "type": "function"},
                   {"inputs": [], "name": "baseURI", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                    "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "blackHoleAddress", "outputs": [
                {"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "burn",
                    "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}], "name": "burnItem",
                    "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "numberOfTokens", "type": "uint256"}],
                    "name": "buyToken", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "payable", "type": "function"}, {"inputs": [], "name": "chestContract", "outputs": [
                {"internalType": "contract ERC721", "name": "", "type": "address"}], "stateMutability": "view",
                                                                        "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "getApproved",
                    "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view",
                    "type": "function"}, {"inputs": [], "name": "getMintPrice",
                                          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                          "stateMutability": "view", "type": "function"},
                   {"inputs": [], "name": "getTokenPrice",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                    "type": "function"}, {"inputs": [], "name": "getTokenUnitVal",
                                          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                          "stateMutability": "view", "type": "function"}, {
                       "inputs": [{"internalType": "address", "name": "owner", "type": "address"},
                                  {"internalType": "address", "name": "operator", "type": "address"}],
                       "name": "isApprovedForAll", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                       "stateMutability": "view", "type": "function"}, {
                       "inputs": [{"internalType": "address", "name": "account", "type": "address"},
                                  {"internalType": "uint256", "name": "_chestId", "type": "uint256"}], "name": "mintItem",
                       "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [], "name": "mintPrice",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                    "type": "function"},
                   {"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                    "stateMutability": "view", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "_chestId", "type": "uint256"}], "name": "openChest",
                    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}], "stateMutability": "payable",
                    "type": "function"},
                   {"inputs": [], "name": "owner", "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                    "stateMutability": "view", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "ownerOf",
                    "outputs": [{"internalType": "address", "name": "", "type": "address"}], "stateMutability": "view",
                    "type": "function"},
                   {"inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable",
                    "type": "function"}, {"inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                                     {"internalType": "address", "name": "to", "type": "address"},
                                                     {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                                          "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable",
                                          "type": "function"}, {
                       "inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                  {"internalType": "address", "name": "to", "type": "address"},
                                  {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
                                  {"internalType": "bytes", "name": "_data", "type": "bytes"}], "name": "safeTransferFrom",
                       "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
                       "inputs": [{"internalType": "address", "name": "operator", "type": "address"},
                                  {"internalType": "bool", "name": "approved", "type": "bool"}],
                       "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "string", "name": "newuri", "type": "string"}], "name": "setBASEURI",
                    "outputs": [], "stateMutability": "nonpayable", "type": "function"}, {
                       "inputs": [{"internalType": "address[]", "name": "_addresList", "type": "address[]"},
                                  {"internalType": "uint256[]", "name": "_balanceList", "type": "uint256[]"}],
                       "name": "setBalances", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                       "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "address", "name": "_blackHoleAddress", "type": "address"}],
                    "name": "setBlackHoleAddress", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "contract ERC721", "name": "_chestContractAddress", "type": "address"}],
                    "name": "setChestContractAddress",
                    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "_mintPrice", "type": "uint256"}],
                    "name": "setMintPrice", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "address", "name": "_storageAddress", "type": "address"}],
                    "name": "setStorageAddress", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "contract IERC20", "name": "_tokenContractAddress", "type": "address"}],
                    "name": "setTokenContractAddress",
                    "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "_tokenPrice", "type": "uint256"}],
                    "name": "setTokenPrice", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "_tokenUnitVal", "type": "uint256"}],
                    "name": "setTokenUnitVal", "outputs": [{"internalType": "bool", "name": "success", "type": "bool"}],
                    "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "bytes4", "name": "interfaceId", "type": "bytes4"}],
                    "name": "supportsInterface", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                    "stateMutability": "view", "type": "function"},
                   {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}],
                    "stateMutability": "view", "type": "function"}, {"inputs": [], "name": "tokenContract", "outputs": [
                {"internalType": "contract IERC20", "name": "", "type": "address"}], "stateMutability": "view",
                                                                     "type": "function"},
                   {"inputs": [], "name": "tokenPrice",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view",
                    "type": "function"}, {"inputs": [], "name": "tokenStorage",
                                          "outputs": [{"internalType": "address", "name": "", "type": "address"}],
                                          "stateMutability": "view", "type": "function"},
                   {"inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}], "name": "tokenURI",
                    "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view",
                    "type": "function"}, {"inputs": [], "name": "tokenUnitVal",
                                          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                                          "stateMutability": "view", "type": "function"}, {
                       "inputs": [{"internalType": "address", "name": "from", "type": "address"},
                                  {"internalType": "address", "name": "to", "type": "address"},
                                  {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
                       "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
                    "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
                   {"inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "payable", "type": "function"}]
        erc1155abi = json.loads(
            '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"indexed":false,"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"TransferBatch","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"TransferSingle","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"string","name":"value","type":"string"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"URI","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GOLD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PAUSER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SHIELD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SILVER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"SWORD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"THORS_HAMMER","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"URI_SETTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address[]","name":"accounts","type":"address[]"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"}],"name":"balanceOfBatch","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"values","type":"uint256[]"}],"name":"burnBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"exists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"mintBatch","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeBatchTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"newuri","type":"string"}],"name":"setURI","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"uri","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"}]')

        abiMap = {
            'troop': troopAbi,
            'weapon': itemAbi,
            'erc1155-test': erc1155abi
        }
        abi = abiMap[name]

        contract_instance = self.web3.eth.contract(address=address, abi=abi)
        return contract_instance


    def transferFrom(self, contract, from_address, to_address, token_id, amount):
        data = b''
        print('From:', from_address)
        tx = contract.functions.safeTransferFrom(from_address, to_address, token_id, amount, data).buildTransaction(
            {
                'nonce': self.web3.eth.getTransactionCount(self.account.address),
                #'chain_id': self.chain_id
            })
        tx['chainId'] = self.chain_id
        tx['from'] = self.account.address
        signed_tx = self.account.signTransaction(tx)
        print(signed_tx)
        tx_hash = self.web3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return tx_hash

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
    c = ct.getContract('erc1155-test')
    tx = ct.transferFrom(c, from_address, to_address, token_id, amount)
    print(tx)
