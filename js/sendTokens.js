"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, sendTokens } from "./chainload.js";

try {
    const sendStarterKit = async function() {
        const amount = parseInt(document.getElementById("token_amount").value);

        // send starter kit tokens to the token receiver..
        const erc1155_token_receiver = '0x37FD34a131b07ce495f7D16275B6dc4Ed1Bbd8C5';
        const tokenId = 1;
        const tx = await sendTokens(erc1155_token_receiver, tokenId, amount);
    };
    const sendButton = document.getElementById("send");
    sendButton.addEventListener("click", sendStarterKit);
}
catch (e) {
    alert("Error during the transaction: " + e);
}