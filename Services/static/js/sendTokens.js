"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, sendTokens, onTokensReceived, txlink } from "./chainload.js";

const result = document.getElementById("result");

async function onReceived(tx_hash, token_list) {
    console.log("Received", token_list, "different tokens");
    const txAnchor = txlink(tx_hash);
    result.innerHTML += `<p>Received ${token_list.length} tokens</p>`;
    result.innerHTML += `<p>TX: ${txAnchor}</p><ul>`;
    for (let i = 0; i < token_list.length; i++) {
        const token = token_list[i];
        result.innerHTML += `<li>${token.amount}x ${token.id}</li>`;
    }
    result.innerHTML += "</ul>";
}

try {
    const sendStarterKit = async function() {
        result.innerHTML = "Sending starter kit...";
        const amount = parseInt(document.getElementById("token_amount").value);
        // send starter kit tokens to the token receiver..
        const erc1155_token_receiver = '0x37FD34a131b07ce495f7D16275B6dc4Ed1Bbd8C5';
        const tokenId = 1;
        const tx = await sendTokens(erc1155_token_receiver, tokenId, amount);
        result.innerHTML = "<p>Sent " + amount + " tokens to " + erc1155_token_receiver + " with tx " + txlink(tx.hash) + "</p>";
    };
    const sendButton = document.getElementById("send");
    sendButton.addEventListener("click", sendStarterKit);
    onTokensReceived(onReceived);
}
catch (e) {
    alert("Error during the transaction: " + e);
}