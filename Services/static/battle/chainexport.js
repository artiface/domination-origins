"use strict";

import { ethers } from "./ethers-5.1.esm.min.js";
window.chain_provider = new ethers.providers.Web3Provider(window.ethereum);
await window.chain_provider.send("eth_requestAccounts", []);
window.chain_signer = window.chain_provider.getSigner();
window.chain_user_address = await window.chain_signer.getAddress();

await ensureNetwork(window.chain_provider);

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
