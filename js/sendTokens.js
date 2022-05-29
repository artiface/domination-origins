"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, sendTokens } from "./chainload.js";

try {
    const sendStarterKit = async function() {
        const amount = parseInt(document.getElementById("token_amount").value);

        // send starter kit tokens to the token receiver..
        const token_receiver = '0x4059A7Cceb0A65f1Eb3Faf19BD76259a99919571';
        const tokenId = 1;
        const tx = await sendTokens(token_receiver, tokenId, amount);
    };
    const sendButton = document.getElementById("send");
    sendButton.addEventListener("click", sendStarterKit);
}
catch (e) {
    alert("Error during the transaction: " + e);
}