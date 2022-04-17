import { ethers } from "./ethers-5.1.esm.min.js";
window.chain_provider = new ethers.providers.Web3Provider(window.ethereum);
window.chain_signer = window.chain_provider.getSigner();

const network = await window.chain_provider.getNetwork();
if (network.chainId !== 137)
{
    alert("Please connect to the Polygon main network")
    window.location.href = '/loadout/';
}

