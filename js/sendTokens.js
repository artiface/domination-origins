"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, mintNFTCollection } from "./chainload.js";


try {
    const sendTokens = async function() {
        await connect();
        const amount = parseInt(document.getElementById("token_amount").value);

        await mintNFTCollection(account, startId, amount);
    };
    const sendButton = document.getElementById("send");
    sendButton.addEventListener("click", sendTokens);
}
catch (e) {
    alert("Error during the transaction: " + e);
}