import { ethers } from "./ethers-5.1.esm.min.js";
const provider = new ethers.providers.Web3Provider(window.ethereum)

await provider.send("eth_requestAccounts", []);

const signer = provider.getSigner();

export async function loadFromChain(type, tokenId) {
	
	const addressMap = {
		'char': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
		'item': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866"
	};
	const contractAddress = addressMap[type];

	const abiMap = {
		'char': [
			"function name() external view returns (string memory)",
			"function symbol() external view returns (string memory)",
			"function tokenURI(uint256 tokenId) external view returns (string memory)"
		],
		'item': [
			"function name() external view returns (string memory)",
			"function symbol() external view returns (string memory)",
			"function tokenURI(uint256 tokenId) external view returns (string memory)"
		]
	};
	const contractAbi = abiMap[type];

	const contract = new ethers.Contract(contractAddress, contractAbi, provider);

	var collectionName = await contract.name();


	var tokenUri = await contract.tokenURI(tokenId);
	var tokenInfo = {
		'id': tokenId,
		'collection_name': collectionName,
		'uri': tokenUri
	}

	var httpIpfs = tokenUri.replace("ipfs://", "https://ipfs.io/ipfs/");

	var metaData = await fetch(httpIpfs)
	  .then(response => {
	    // indicates whether the response is successful (status code 200-299) or not
	    if (!response.ok) {
	      throw new Error(`Request failed with status ${reponse.status}`)
	    }
	    return response.json()
	  });

	tokenInfo['meta_data'] = metaData;

	return tokenInfo;
};