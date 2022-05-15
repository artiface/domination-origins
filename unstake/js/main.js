"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import {getTokensStaked, unstakeMul, signer, provider} from "./chainload.js";

const network = await provider.getNetwork();
const chainId = network.chainId;

if (chainId === 137)
{
    var itemsPerPage = 10;
    try {
        const unstakeFunc = async function() {
            var userAddress = await signer.getAddress();
            var tokens = await getTokensStaked(userAddress);
            for (let i = 0; i < tokens.length; i += 40)
            {
                var batch = tokens.slice(i, i + 40);
                await unstakeMul(batch);
            }
        };
        const unstakeBtn = document.getElementById("unstake");
        unstakeBtn.addEventListener("click", unstakeFunc);
    }
    catch (e) {
        alert("Please login to MetaMask: " + e);
    }
};
