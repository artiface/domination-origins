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
        this.clusterize = null;
        this.rendered = false;
        this.selectedNode = null;
        this.refreshing = false;
    }

    renderModal() {
        this.modalParent.style.display = "flex";
        let data = `
        <div id="modal">
            <img src="./svgs/circle-xmark.svg" id="close-modal">
        </div>
        `
        this.modalParent.insertAdjacentHTML('beforeend', data);
        document.getElementById("close-modal").addEventListener("click", () => {
            this.modalParent.style.display = "none"
            this.firstTime = true;
        })
    }

    async renderPlayerModal() {
        if (this.rendered) {
            this.modalParent.style.display = "flex"
            return;
        }
        this.rendered = true;
        this.renderModal();

        let data = `
        <div class="modal-left-side">
            <div class="modal-list-filter">
                <input type="text" placeholder="filter: Origin" class="filter-input">
                <input type="text" placeholder="filter: Faction" class="filter-input">
                <input type="text" placeholder="filter: Level" class="filter-input">
            </div>
            <div id="modal-list">
            </div>
        </div>

        <div id="modal-description">
        </div>
        `
        document.getElementById("modal").insertAdjacentHTML('beforeend', data);

        const list = document.getElementById("modal-list");
        
        await this.crypto.addTroops();

        list.insertAdjacentHTML('beforeend', await this.renderPlayerList(0, 10));

        let first = 0;
        let last = 10;

        list.addEventListener("click", async (e) => {
            if (e.target.classList.contains("modal-list-node")) {
                document.querySelectorAll(".node-selected").forEach(el => el.classList.remove("node-selected"));
                e.target.classList.add("node-selected");
                this.selectedNode = e.target.id;
                this.renderPlayerDescription(this.crypto.troops[e.target.id.split("-")[1] - 1]);
            }
        });

        list.addEventListener("scroll", async () => {
            const fakeDocument = document.createElement("div");
            fakeDocument.classList.add("modal-list-node");
            list.appendChild(fakeDocument);
            const nodeHeight = fakeDocument.clientHeight;
            fakeDocument.remove();

            const newLast = Math.ceil((list.scrollTop + nodeHeight * 7) / nodeHeight);

            if (newLast === last) return; 

            if (!this.refreshing && last + 10 > this.crypto.troops.length) {
                this.refreshing = true;
                await this.crypto.addTroops();
                this.refreshing = false;
            }

            last = Math.min(newLast, this.crypto.troops.length - 1);
            first = Math.max(last - 10, 0);

            list.innerHTML = "";
            const top = document.createElement("div");
            top.classList.add("modal-list-node");
            top.style.height = `${first * nodeHeight}px`;
            list.appendChild(top);
            list.insertAdjacentHTML('beforeend', await this.renderPlayerList(first, last));
            const bottom = document.createElement("div");
            bottom.classList.add("modal-list-node");
            bottom.style.height = `${(this.crypto.troops.length - 1 - last) * nodeHeight }px`;
            list.appendChild(bottom);

            if (this.selectedNode) {
                const doc = document.getElementById(this.selectedNode);
                if (doc) doc.classList.add("node-selected");
            } 
        });
    }

    async renderPlayerList(first, last) {
        if (this.firstTime) {
            await this.crypto.load();
            this.firstTime = false;
        }

        let data = '';

        for (let i = first; i <= last; i++) {
            const player = this.crypto.troops[i];
            data += `
            <div id="player-${player.LABEL}" class="modal-list-node">
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
            `;
        }

        return data;
    }

    renderPlayerDescription(player) {
        const data = `
        <img class="img-vertical-responsive modal-left-side-image" src="${player.IMAGE_SRC}">
        <div>${player.LABEL}</div>
        <div id="modal-info-2">
        Faction Icon, Origin, Level, Health, Focus, Battle Points, Skills, Attributes (Strength, Agility, Dexterity, Intelligence) 

        </div>
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
        this.pageAmount = -1;
        this.pageCount = 0;
    }

    async loadPageNFT(type, count) {
        const response = await fetch(`http://localhost:9000/api/${type}/1/${count}`);
        return await response.json();
    };

    async load() {
        await connect();
        this.userAdress = await signer.getAddress();
    }

    async addTroops() {
        this.pageCount++;
        const page = await this.loadPageNFT("troops", this.pageCount);
        for (let j = 0; j < page.troops.length; j++) {
            const troop = {
                LABEL: page.troops[j].tokenId,
                IMAGE_SRC: `${this.types["troops"].dir}t_${page.troops[j].tokenId}.png`,
                MAX_HEALTH: page.troops[j].maxHealth,
                ORIGIN: page.troops[j].origin,
                BATTLE_POINTS: page.troops[j].battlePointValue,
                FACTION: page.troops[j].faction,
            }

            this.troops.push(troop);
        }
    }
}

const crypto = new Crypto();

const cards = new Cards(crypto);
cards.renderCards();

const modal = new Modal(cards, crypto);