"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, getTokensStaked, unstakeMul } from "./chainload.js";


try {
    const unstakeFunc = async function() {
        await connect();
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
    alert("Error during the transaction: " + e);
}