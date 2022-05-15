"use strict";

import { ethers } from "./ethers-5.1.esm.min.js";

export const provider = new ethers.providers.Web3Provider(window.ethereum);
export const signer = provider.getSigner();

function getContract(type) {
	const addressMap = {
		'troops': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
		'weapons': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
		'staking': '0x1F827D438EeA6F06C034bf354243AB9b7B8cbB7f'
	};
	const contractAddress = addressMap[type];

	const mintingAbi = [
		"function name() external view returns (string memory)",
		"function symbol() external view returns (string memory)",
		"function tokenURI(uint256 tokenId) external view returns (string memory)",
		"function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)",
		"function balanceOf(address account) external view returns (uint256)"
	];

	const stakingAbi = [
		"function getTokensStaked(address query) public view returns(uint256[] memory)",
		"function unstakeMul(uint256[] memory tokenIds) external nonReentrant"
	];

	const abis = {
	    'troops': mintingAbi,
        'weapons': mintingAbi,
        'staking': stakingAbi
	}
    const contractAbi = abis[type];

	const contract = new ethers.Contract(contractAddress, contractAbi, signer);

	return contract;
};

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