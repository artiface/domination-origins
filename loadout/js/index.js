"use strict";
import { ethers } from "./ethers-5.1.esm.min.js";
import { getTokenCount, loadUserNFTs, loadNFT, connect, signer, provider, getWallet } from "./chainload.js";

class Cards {
    constructor(crypto) {
        this.crypto = crypto;
        this.cardParent = document.getElementById('card-parent');
        this.clickedCard = null;
        this.cards = [
        {
            LABEL: 'None',
            HEALTH: '0', // health/100
            IMAGE_SRC: './svgs/circle-plus.svg',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'None',
            HEALTH: '0', // health/100
            IMAGE_SRC: './svgs/circle-plus.svg',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'None',
            HEALTH: '0', // health/100
            IMAGE_SRC: './svgs/circle-plus.svg',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'None',
            HEALTH: '0', // health/100
            IMAGE_SRC: './svgs/circle-plus.svg',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'None',
            HEALTH: '0', // health/100
            IMAGE_SRC: './svgs/circle-plus.svg',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        }]
    }

    changePlayer(player) {
        this.cards[this.clickedCard] = player;
        this.renderCards();
    }

    renderCards() {
        this.cardParent.innerHTML = "";
        for (let i = 0; i < 5; i++) {
            const card = this.cards[i];
            let data = `
            <div id="card-${i}" class="card">
                <img class="info" src="./svgs/circle-info.svg">
                <div class="info-bubble">
            `;

            for (let stat in card.STATS) {
                data += `<div class="info-bubble-text">${stat}: ${card.STATS[stat]}</div>`;
            }

            data += `</div>
                <img class="image-card-preview" id="image" src="${card.IMAGE_SRC}">
                <div class="card-title">${card.LABEL}</div>
                <div class="button-container">
                    <div class="button">W</div>
                    <div class="button">A</div>
                    <div class="button">I1</div>
                    <div class="button">I2</div>
                </div>
                <div class="bar-container">
                    <div class="bar" style="width: ${card.HEALTH}%"></div>
                </div>
            </div>`
            this.cardParent.insertAdjacentHTML('beforeend', data);
            document.getElementById(`card-${i}`).addEventListener('click', async () => {
                this.clickedCard = i;
                await modal.renderPlayerModal();
            });
        }
    }
}

class Modal {
    constructor(cards, crypto) {
        this.crypto = crypto;
        this.cards = cards;
        this.modalParent = document.getElementById('modal-parent');
        this.firstTime = true;
    }

    renderModal() {
        this.modalParent.style.display = "flex";
        let data = `
        <div id="modal">
            <img src="./svgs/circle-xmark.svg" id="close-modal">
        </div>
        `
        this.modalParent.innerHTML = "";
        this.modalParent.insertAdjacentHTML('beforeend', data);
        document.getElementById("close-modal").addEventListener("click", () => this.modalParent.style.display = "none")
    }

    async renderPlayerModal() {
        this.renderModal();

        let data = `
        <div class="modal-left-side">
            <div class="modal-list-filter">
                <input type="text" placeholder="filter: Origin" class="filter-input">
                <input type="text" placeholder="filter: Faction" class="filter-input">
                <input type="text" placeholder="filter: Level" class="filter-input">
            </div>
            <div id="modal-list"></div>
        </div>

        <div id="modal-description">
        </div>
        `
        document.getElementById("modal").insertAdjacentHTML('beforeend', data);

        await this.renderPlayerList();
    }

    async renderPlayerList() {
        if (this.firstTime) {
            await this.crypto.load();
            this.firstTime = false;
        }

        const listParent = document.getElementById('modal-list');
        listParent.innerHTML = "";
        this.crypto.troops.forEach((player, i) => {
            let data = `
            <div id="player-${i}" class="modal-list-node">
                <img class="img-horizontal-responsive" src="${player.IMAGE_SRC}">
                <div class="node-name">
                    ${player.LABEL}
                </div>
                <div class="node-stats">
                    <div class="horizontal-wrapper">
                        <img class="svg-horizontal-responsive" src="./svgs/briefcase-medical.svg">
                        <div class="bar-container">
                        <div class="bar" style="width: ${(player.MAX_HEALTH / 200) * 100}%"></div>
                        </div>
                    </div>
                    <div class="horizontal-wrapper">
                        <img class="svg-horizontal-responsive" src="./svgs/chart-simple-solid.svg">
                        <div class="bar-container">
                            <div class="bar" style="width: ${(player.LEVEL / 10) * 100}%"></div>
                        </div>
                    </div>
                </div>
                <div class="node-stats">
                    <div class="horizontal-wrapper">
                        <img class="svg-horizontal-responsive" src="./svgs/person.svg">
                        <div class="node-text">${player.ORIGIN}</div>
                    </div>
                    <div class="horizontal-wrapper">
                        <img class="svg-horizontal-responsive" src="./svgs/helmet-battle.svg">
                        <div class="node-text">${player.BATTLE_POINTS}</div>
                    </div>
                </div>
                <img class="img-horizontal-responsive" src="${this.crypto.factions[player.FACTION]}">
            </div>
            `
            listParent.insertAdjacentHTML('beforeend', data);
            const node = document.getElementById(`player-${i}`);
            node.addEventListener("click" , () => {
                document.querySelectorAll(".modal-list-node").forEach(node => node.classList.remove("node-selected"));
                node.classList.add("node-selected");
                this.renderRightInfo(player);
                //this.cards.changePlayer(player);
                //this.modalParent.style.display = "none";
            });
        });

        let added = false;
        const cb = async () => {
            if (!added && listParent.scrollTop > (listParent.scrollHeight - listParent.clientHeight) - 200) {
                listParent.removeEventListener("scroll", cb);
                await this.crypto.addTroops();
                this.renderPlayerList();
            }
        }
        listParent.addEventListener("scroll", cb);
    }

    renderRightInfo(player) {
        const data = `
        <img class="img-horizontal-responsive modal-left-side-image" src="${player.IMAGE_SRC}">
        <div id="modal-info-2">Hey</div>
        `
        document.getElementById("modal-description").innerHTML = "";
        document.getElementById("modal-description").insertAdjacentHTML('beforeend', data);
    }
}

class Crypto {
    constructor() {
        this.types = {
            troops: {
                dir: `${window.location}TroopNFTs/`,
            },
            weapons:{
                dir: `${window.location}/WeaponsNFTs/`,
            },
        }

        this.factions = {
            Snake: `${window.location}images/Snake.png`,
            Wolf: `${window.location}images/Wolf.png`,
            Dragon: `${window.location}images/Dragon.png`
        }

        this.userAdress = "";
        this.troops = [];
        this.weapons = [];
        this.testMode = true;
        this.pageAmount = 0;
        this.pageCount = 1;
    }

    async loadPageNFT(type, count) {
        const response = await fetch(`http://127.0.0.1:5000/api/${type}/1/${count}`)
        return await response.json()
    };

    async load() {
        await connect();
        this.userAdress = await signer.getAddress();

        let tokenAmount = 0;
        if (this.testMode)  {
            tokenAmount = 100;
        } //else troops = await getWallet(this.userAdress, "troops");

        const type = "troops";
        const page = await this.loadPageNFT(type, 1);
        this.pageAmount = Math.ceil((tokenAmount * 20) / 20) + 1;
        
        for (let j = 0; j < page.troops.length; j++) this.troops.push({
            LABEL: page.troops[j].tokenId,
            IMAGE_SRC: `${this.types[type].dir}t_${page.troops[j].tokenId}.png`,
            MAX_HEALTH: page.troops[j].maxHealth,
            ORIGIN: page.troops[j].origin,
            BATTLE_POINTS: page.troops[j].battlePointValue,
            FACTION: page.troops[j].faction,
        });
    }

    async addTroops() {
        if (this.pageAmount <= this.pageCount) return;
        this.pageCount++;
        console.log(this.pageCount)
        const page = await this.loadPageNFT("troops", this.pageCount);
        console.log(page.troops.length)

        for (let j = 0; j < page.troops.length; j++) this.troops.push({
            LABEL: page.troops[j].tokenId,
            IMAGE_SRC: `${this.types["troops"].dir}t_${page.troops[j].tokenId}.png`,
            MAX_HEALTH: page.troops[j].maxHealth,
            ORIGIN: page.troops[j].origin,
            BATTLE_POINTS: page.troops[j].battlePointValue,
            FACTION: page.troops[j].faction,
        });
    }
}

const crypto = new Crypto();

const cards = new Cards(crypto);
cards.renderCards();

const modal = new Modal(cards, crypto);