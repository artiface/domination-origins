import { getContract } from "./chainload.js";
import { ethers } from "./ethers-5.1.esm.min.js";

const template = document.createElement('template');
template.innerHTML = `
    <style>
    span {
      width: 4rem;
      display: inline-block;
      text-align: center;
    }

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
            <h2 id="modal-title">Buy Coins</h2>
            <input type="number" id="buy-coins-amount" placeholder="Amount" />
            <span><span id="product-name">coins</span> for <span id="buy-coins-price">0</span> MATIC</span>
            <button class="cancel">Cancel</button>
            <button id="buy-coins-submit">Buy</button>
        </div>
    </div>`;

class BuyButton extends HTMLElement {
    constructor() {
        super();
        this.tokenPrice = undefined;
        this.loadPriceFunc();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {
        var self = this;
        this.shadowRoot.getElementById('buy-coins').innerText = "Buy " + this.productName;
        this.shadowRoot.getElementById('modal-title').innerText = "Buy " + this.productName;
        this.shadowRoot.getElementById('product-name').innerText = this.productName;
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
            self.buyFunc(amount, price);
        });
    }
}

class BuyCoinsButton extends BuyButton {
    constructor() {
        super();
        this.productName = "coins";
    }
    async loadPriceFunc() {
        var self = this;
        this.contract = getContract('weapons');
        this.contract.getTokenPrice().then(price => {
            self.tokenPrice = price;
        });
    }
    async buyFunc(amount, price) {
        const totalPrice = (amount * price);

        const gasEstimated = await this.contract.estimateGas.buyToken(amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice.toString(),
            gasLimit: gasEstimated * 1.2
        };
        await this.contract.buyToken(amount, options);
    }
}

class BuyStarterButton extends BuyButton {
    constructor() {
        super();
        this.productName = "starter";
    }
    async loadPriceFunc() {
        var self = this;
        this.contract = getContract('erc1155');
        this.contract.STARTER_PRICE().then(price => {
            self.tokenPrice = price;
        });
    }
    async buyFunc(amount, price) {
        const starterTokenId = 1;
        const totalPrice = (amount * price);

        const gasEstimated = await this.contract.estimateGas.buyStarter(starterTokenId, amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice.toString(),
            gasLimit: gasEstimated * 1.2
        };
        await this.contract.buyStarter(starterTokenId, amount, options);
    }
}

class BuyBoosterButton extends BuyButton {
    constructor() {
        super();
        this.productName = "booster";
    }
    async loadPriceFunc() {
        var self = this;
        this.contract = getContract('erc1155');
        this.contract.BOOSTER_PRICE().then(price => {
            self.tokenPrice = price;
        });
    }
    async buyFunc(amount, price) {
        const starterTokenId = 1;
        const totalPrice = (amount * price);

        const gasEstimated = await this.contract.estimateGas.buyBooster(starterTokenId, amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice.toString(),
            gasLimit: gasEstimated * 1.2
        };
        await this.contract.buyBooster(starterTokenId, amount, options);
    }
}

window.customElements.define('buy-coins', BuyCoinsButton);
window.customElements.define('buy-starter', BuyStarterButton);
window.customElements.define('buy-booster', BuyBoosterButton);

