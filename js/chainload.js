"use strict";

import { ethers } from "./ethers-5.1.esm.min.js";

if (!window.ethereum) {
    alert("Please install MetaMask or another Wallet Software to use this dApp!\nCould not access window.ethereum");
}

export let provider = undefined;
export let signer = undefined;

// Auto-connect to MetaMask
await connectTest();

export async function connect() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    await ensureNetwork(provider);
}

export async function connectTest() {
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    await ensureTestNetwork(provider);
}

async function ensureNetwork(provider) {
    const network = await provider.getNetwork();
    const chainId = network.chainId;

    if (chainId !== 137)
    {
        window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
                chainId: "0x89",
                rpcUrls: ["https://polygon-rpc.com/"],
                chainName: "Polygon Mainnet",
                nativeCurrency: {
                    name: "MATIC",
                    symbol: "MATIC",
                    decimals: 18
                },
                blockExplorerUrls: ["https://polygonscan.com/"]
            }]
        });
    }
}


async function ensureTestNetwork(provider) {
    const network = await provider.getNetwork();
    const chainId = network.chainId;
    if (chainId !== 80001)
    {
        window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
                chainId: "0x13881",
                rpcUrls: ["https://matic-mumbai.chainstacklabs.com"],
                chainName: "Polygon Mumbai",
                nativeCurrency: {
                    name: "MATIC",
                    symbol: "MATIC",
                    decimals: 18
                },
                blockExplorerUrls: ["https://mumbai.polygonscan.com"]
            }]
        });
    }
}

export function getContract(type) {
	const addressMap = {
		'troops': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
		'weapons': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
		'staking': '0x1F827D438EeA6F06C034bf354243AB9b7B8cbB7f',
		'erc1155': '0x5E52b90Ce1796155f4571f07987F03672115B59e',
	};
	const contractAddress = addressMap[type];

	const mintingAbi = [
		"function name() external view returns (string memory)",
		"function symbol() external view returns (string memory)",
		"function tokenURI(uint256 tokenId) external view returns (string memory)",
		"function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)",
		"function balanceOf(address account) external view returns (uint256)",
		"function getTokenPrice() public view returns (uint256)",
		"function buyToken(uint256 numberOfTokens) public payable returns(bool success)",
		"function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public"
	];

	const erc1155ExtendedAbi = [
	    "function buyStarter(uint256 id, uint8 amount) public payable",
	    "function buyBooster(uint256 id, uint8 amount) public payable",
	    "function STARTER_PRICE() public view returns (uint256)",
	    "function BOOSTER_PRICE() public view returns (uint256)",
	];

	const stakingAbi = [
		"function getTokensStaked(address query) public view returns(uint256[] memory)",
		"function unstakeMul(uint256[] memory tokenIds) external"
	];

	const abis = {
	    'troops': mintingAbi,
        'weapons': mintingAbi,
        'staking': stakingAbi,
        'erc1155': erc1155ExtendedAbi
	}
    const contractAbi = abis[type];

	const contract = new ethers.Contract(contractAddress, contractAbi, signer);

	return contract;
};

export async function sendTroop(to_address, amount) {
    const contract = getContract('troops');
    const troop_receiver = '0x4059A7Cceb0A65f1Eb3Faf19BD76259a99919571';
    const tx = await contract.safeTransferFrom(signer.address, troop_receiver, tokenId, []);
    return tx;
}

export async function getTokenCount(wallet_address, type) {
	const contract = getContract(type);	
	var numberOfTokens = await contract.balanceOf(wallet_address);
	return numberOfTokens;
};

export async function getTokensStaked(wallet_address) {
	const contract = getContract('staking');
	var listOfTokens = await contract.getTokensStaked(wallet_address);
	return listOfTokens;
};

export async function unstakeMul(listOfTokens) {
	const contract = getContract('staking');
	await contract.unstakeMul(listOfTokens);
};

export async function loadUserNFTs(wallet_address, type, start, count) {
	const contract = getContract(type);	
	var tokenList = [];
	for (let i = start; i < start + count; i++) {
		var tokenId = await contract.tokenOfOwnerByIndex(wallet_address, i);
		tokenList.push(tokenId.toNumber());
	}

	return tokenList;
};

export async function loadNFT(type, tokenId) {
	const ipfsGateway = 'https://gateway.ipfs.io';
	
	const contract = getContract(type);

	var collectionName = await contract.name();

	var tokenUri = await contract.tokenURI(tokenId);
	var tokenInfo = {
		'id': tokenId,
		'collection_name': collectionName,
		'uri': tokenUri
	}

	var httpIpfs = tokenUri.replace("ipfs://", ipfsGateway + "/ipfs/");

	var metaData = await fetch(httpIpfs)
	  .then(response => {
	    // indicates whether the response is successful (status code 200-299) or not
	    if (!response.ok) {
	      throw new Error(`Request failed with status ${reponse.status}`)
	    }
	    return response.json()
	  });

	var traits = {};
	metaData.attributes.forEach(pair => {
		traits[pair.trait_type] = pair.value;
	});
	
	tokenInfo['meta_data'] = {
		'traits': traits,
		'image': metaData.image.replace("ipfs://", ipfsGateway + "/ipfs/"),
		'name': metaData.name,
		'dna': metaData.dna,
		'edition': metaData.edition
	};

	return tokenInfo;
};