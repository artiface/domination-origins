"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { signer, provider, connect, mintNFTCollection } from "./chainload.js";


try {
    const mintCollection = async function() {
        await connect();
        const account = document.getElementById("account").value;
        const startId = parseInt(document.getElementById("start_id").value);
        const amount = parseInt(document.getElementById("amount").value);

        await mintNFTCollection(account, startId, amount);
    };
    const mintBtn = document.getElementById("mint");
    mintBtn.addEventListener("click", mintCollection);
}
catch (e) {
    alert("Error during the transaction: " + e);
}