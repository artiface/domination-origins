"use strict";

import { ethers } from "./ethers-5.1.esm.min.js";

window.chain_provider = new ethers.providers.Web3Provider(window.ethereum);
await window.chain_provider.send("eth_requestAccounts", []);
window.chain_signer = window.chain_provider.getSigner();

const network = await window.chain_provider.getNetwork();
if (network.chainId !== 137)
{
    alert("Please connect to the Polygon main network");
}

window.chain_user_address = await window.chain_signer.getAddress();

var getContract = function(type) {
	const addressMap = {
		'troops': "0xb195991d16c1473bdF4b122A2eD0245113fCb2F9",
		'items': "0x70242aAa2a2e97Fa71936C8ED0185110cA23B866",
	};
	const contractAddress = addressMap[type];

	const contractAbi = [
		"function name() external view returns (string memory)",
		"function symbol() external view returns (string memory)",
		"function tokenURI(uint256 tokenId) external view returns (string memory)",
		"function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256 tokenId)",
		"function balanceOf(address account) external view returns (uint256)",
		"function getTokenPrice() public view returns (uint256)",
		"function buyToken(uint256 numberOfTokens) public payable returns(bool success)"
	];

	const contract = new ethers.Contract(contractAddress, contractAbi, window.chain_signer);

	return contract;
};

window.items_contract = getContract("items");

const template = document.createElement('template');
template.innerHTML = `
    <style>
    span {
      width: 4rem;
      display: inline-block;
      text-align: center;
    }

    /*button {
      width: 4rem;
      height: 4rem;
      border: none;
      border-radius: 10px;
      background-color: seagreen;
      color: white;
    }*/
    /* The Modal (background) */
    .modal {
      display: none; /* Hidden by default */
      position: fixed; /* Stay in place */
      z-index: 1; /* Sit on top */
      padding-top: 100px; /* Location of the box */
      left: 0;
      top: 0;
      width: 100%; /* Full width */
      height: 100%; /* Full height */
      overflow: auto; /* Enable scroll if needed */
      background-color: rgb(0,0,0); /* Fallback color */
      background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
    }

    /* Modal Content */
    .modal-content {
      background-color: #fefefe;
      margin: auto;
      padding: 20px;
      border: 1px solid #888;
      width: 80%;
    }

    /* The Close Button */
    .close {
      color: #aaaaaa;
      float: right;
      font-size: 28px;
      font-weight: bold;
    }

    .close:hover,
    .close:focus {
      color: #000;
      text-decoration: none;
      cursor: pointer;
    }
    </style>
    <button id="buy-coins">Buy</button>
    <div id="buy-pop-up" class="modal">
        <!-- Modal content -->
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Buy Coins</h2>
            <input type="number" id="buy-coins-amount" placeholder="Amount" />
            <span>coins for <span id="buy-coins-price">0</span> MATIC</span>
            <button class="cancel">Cancel</button>
            <button id="buy-coins-submit">Buy</button>
        </div>
    </div>`;

class BuyCoinsButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.tokenPrice = undefined;
        this.contract = window.items_contract;
    }
    connectedCallback() {
        var self = this;
        this.contract.getTokenPrice().then(price => {
            self.tokenPrice = price;
        });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.shadowRoot.getElementById('buy-coins').innerText = this.getAttribute('label');
        var modal = this.shadowRoot.getElementById('buy-pop-up');
        this.shadowRoot.getElementById('buy-coins').addEventListener('click', () => {
            modal.style.display = 'block';
        });
        var close = this.shadowRoot.querySelectorAll("span.close")[0];
        close.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        var cancel = this.shadowRoot.querySelectorAll("button.cancel")[0];
        cancel.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        const numberField = this.shadowRoot.getElementById('buy-coins-amount');
        numberField.addEventListener('keyup', () => {
            if (numberField.value) {
                const amount = ethers.utils.parseUnits(numberField.value);
                const price = self.tokenPrice;
                const totalPrice = (numberField.value * price) / 1e18;
                self.shadowRoot.getElementById('buy-coins-price').innerText = totalPrice;
            }
        });
        const submit = this.shadowRoot.getElementById('buy-coins-submit');
        submit.addEventListener('click', async function() {
            const amount = parseInt(numberField.value);
            const price = self.tokenPrice;
            const totalPrice = (amount * price);

            const gasEstimated = await self.contract.estimateGas.buyToken(amount, { value: totalPrice.toString() });

            const options = {
                value: totalPrice.toString(),
                gasLimit: gasEstimated * 1.2
            };
            await self.contract.buyToken(amount, options);
        });
    }
}
window.customElements.define('buy-coins', BuyCoinsButton);