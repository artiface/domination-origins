import CSS from "../css/style.css"
import { getContract } from "./chainload";
import { ethers } from "ethers";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class Pack {
    constructor(packType) {
        this.packType = packType;
        this.loadPrice();
    }

    init() {
        this.buyButton = document.getElementById(`buy-${this.packType}`)
        this.openButton = document.getElementById(`open-${this.packType}`)
        this._amount = 0;


        this.buyButton.addEventListener("click", () => {
            openModal(`${this.packType} pack`, 0, this);
        })

        this.openButton.addEventListener("click", () => {
            openCardMenu();
            initCards();
        })
    }

    updatePrice() {
        const amount = parseInt(document.getElementById("input-number-field").innerText);
        const totalPrice = this.tokenPrice.mul(amount);
        console.log(this.tokenPrice._hex)
        console.log(this.tokenPrice.toString())
        document.getElementById("article-price").innerText = `Price : ${ethers.utils.formatUnits(totalPrice, 18)} MATIC`; //price.toNumber()
    }
}

class Booster extends Pack {
    constructor(packType) {
        super(packType);
        this.tokenID = 500;
    }

    loadPrice() {
        this.contract = getContract('erc1155');
        this.contract.BOOSTER_PRICE().then(price => {
            this.tokenPrice = price;
            console.log(this.packType, this.tokenPrice);
            this.init();
        });
    }

    async buy() {
        const amount = parseInt(document.getElementById("input-number-field").innerText);
        const totalPrice = this.tokenPrice.mul(amount);

        const gasEstimated = await this.contract.estimateGas.buyBooster(this.tokenID, amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice,
            gasLimit: gasEstimated.mul(120).div(100)
        };

        await this.contract.buyBooster(this.tokenID, amount, options);
    }
}

class Starter extends Pack {
    constructor(packType) {
        super(packType);
        this.tokenID = 1;
    }

    loadPrice() {
        this.contract = getContract('erc1155');
        this.contract.STARTER_PRICE().then(price => {
            this.tokenPrice = price;
            console.log(this.packType, this.tokenPrice);
            this.init();
        });
    }

    async buy() {
        const amount = parseInt(document.getElementById("input-number-field").innerText);
        const totalPrice = this.tokenPrice.mul(amount);

        const gasEstimated = await this.contract.estimateGas.buyStarter(this.tokenID, amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice,
            gasLimit: gasEstimated.mul(120).div(100)
        };

        await this.contract.buyStarter(this.tokenID, amount, options);
    }
}

function openModal(title, price, tile) {
    document.getElementById("modal-title").innerText = title;
    //console.log(price.toNumber())
    document.getElementById("article-price").innerText = `Price : ${0} MATIC`; //price.toNumber()
    const container = document.getElementById("container");
    container.style.filter = "blur(10px)";
    container.style.pointerEvents = "none";
    const modalContainer = document.getElementById("modal-container");
    modalContainer.style.pointerEvents = "all";
    modalContainer.style.opacity = "1";
    const modal = document.getElementById("modal");
    modal.style.transform = "scale(1.1)";
    const close = document.getElementById("close-modal");

    document.getElementById("input-number-field").innerText = "0";
        
    const buyButton = document.getElementById("buy-article");
    const buyCallback = async () => {
        await tile.buy();
    }
    buyButton.addEventListener("click", buyCallback)

    const modalCloseCallback = (event) => {
        if (event.target !== modalContainer && event.target !== close) return;
        closeModal();
        buyButton.removeEventListener("click", buyCallback);
        modalContainer.removeEventListener("click", event);
    }
    modalContainer.addEventListener("click", modalCloseCallback)
}

function closeModal() {
    const container = document.getElementById("container");
    container.style.filter = "blur(0px)";
    container.style.pointerEvents = "all";
    const modalContainer = document.getElementById("modal-container");
    modalContainer.style.pointerEvents = "none";
    modalContainer.style.opacity = "0";
    const modal = document.getElementById("modal");
    modal.style.transform = "scale(1)";
}

function openCardMenu() {
    document.getElementById("container").style.filter = "blur(10px)";
    document.getElementById("container").style.pointerEvents = "none";
    renderer.domElement.style.pointerEvents = "all";
    renderer.domElement.style.opacity = "1";
}

document.getElementById("modal-container").style.display = "flex";

const field = document.getElementById("input-number-field");

document.getElementById("buy-decrease").addEventListener("click", () => {
    field.innerText = Math.max(parseInt(field.innerText) - 1, 0);
    starterPack.updatePrice();
    boosterPack.updatePrice();
})

document.getElementById("buy-increase").addEventListener("click", () => {
    field.innerText = parseInt(field.innerText) + 1;
    starterPack.updatePrice();
    boosterPack.updatePrice();
})

const starterPack = new Starter("starter")
const boosterPack = new Booster("booster")
