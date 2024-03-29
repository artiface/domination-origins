"use strict";
import { ethers } from "/js/ethers-5.1.esm.min.js";
import { getTokenCount, loadUserNFTs, loadNFT, connect, signer, provider } from "/js/chainload.js";

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
    
    openModal() {
        this.modalParent.style.display = "flex";
        setTimeout(() => {
            document.getElementById("modal").style.transform = "scale(1)";
        }, 20);
        setTimeout(() => {
            this.modalParent.style.opacity = 1;
        }, 50);
    }

    closeModal() {
        this.modalParent.style.opacity = 0;
        document.getElementById("modal").style.transform = "scale(0)";
        setTimeout(() => {
            this.modalParent.style.display = "none";
        }, 100);
    }

    renderModal() {
        let data = `
        <div id="modal">
            <img src="./svgs/circle-xmark.svg" id="close-modal">
        </div>
        `
        this.modalParent.insertAdjacentHTML('beforeend', data);
        this.openModal();
        document.getElementById("close-modal").addEventListener("click", () => {
            this.closeModal();
            this.firstTime = true;
        })
    }

    async renderPlayerModal() {
        if (this.rendered) {
            this.openModal();
            if (this.selectedNode) this.renderPlayerDescription(this.crypto.troops[this.selectedNode.split("-")[1] - 1]);
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

    isPlayerAlreadySelected(player) {
        let alreadyChose = false;
        for (let i = 0; i < this.cards.cards.length; i++) 
            if (this.cards.cards[i].LABEL === player.LABEL) alreadyChose = true;
        return alreadyChose;
    }

    renderPlayerDescription(player) {
        let data = `
        <div class="img-horizontal-responsive" style="background-image: url(${player.IMAGE_SRC})"></div>
        <div>${player.LABEL}</div>
        <div id="modal-info">
            <div class="modal-info-node">
                <img class="svg-horizontal-responsive" src="./svgs/person.svg">
                <div>${player.ORIGIN}</div>
            </div>
            <div class="modal-info-node">
                <img class="svg-horizontal-responsive" src="./svgs/helmet-battle.svg">
                <div>${player.BATTLE_POINTS}</div>
            </div>
            <div class="modal-info-node">
                <img class="svg-horizontal-responsive" src="./svgs/briefcase-medical.svg">
                <div class="bar-container">
                    <div class="bar" style="width: ${(player.MAX_HEALTH / 200) * 100}%"></div>
                </div>
            </div>
            <div class="modal-info-node">
                <img class="svg-horizontal-responsive" src="./svgs/chart-simple-solid.svg">
                <div class="bar-container">
                    <div class="bar" style="width: ${(player.LEVEL / 10) * 100}%"></div>
                </div>
            </div>
            <div class="modal-info-node-title">Skills</div>
            `

            for (let i = 0; i < player.SKILLS.length; i++) {
                const skill = player.SKILLS[i];
                data += `
                <div class="modal-info-node">
                    <div>${skill.LABEL}</div>
                </div>`
            }

            if (player.SKILLS.length === 0) {
                data += `
                <div class="modal-info-node">
                    <div>No skills</div>
                </div>`
            }

            const isAlreadySelected = this.isPlayerAlreadySelected(player);

            data += `
                <!--<div class="modal-info-node">INDENTIFIER - ${player.SKILLS.INDENTIFIER}</div>
                <div class="modal-info-node">TARGET MODE - ${player.SKILLS.TARGET_MODE}</div>
                <div class="modal-info-node">TYPE - ${player.SKILLS.TYPE}</div>
                <div class="modal-info-node">NAME - ${player.SKILLS.NAME}</div>
                <div class="modal-info-node">DESCRIPTION - ${player.SKILLS.DESCRIPTION}</div>
                <div class="modal-info-node">COOLDOWN - ${player.SKILLS.COOLDOWN}</div>
                <div class="modal-info-node">COST - ${player.SKILLS.COST}</div>-->
                <div class="modal-info-node-title">Attributes</div>
                <div class="modal-info-node">STRENGTH - ${player.ATTRIBUTES.STRENGTH}</div>
                <div class="modal-info-node">AGILITY - ${player.ATTRIBUTES.AGILITY}</div>
                <div class="modal-info-node">DEXTERITY - ${player.ATTRIBUTES.DEXTERITY}</div>
                <div class="modal-info-node">INTELLIGENCE - ${player.ATTRIBUTES.INTELLIGENCE}</div>
            </div>
            <div id="modal-info-select-button">${isAlreadySelected ? 'Already Selected' : 'Select'}</div>
            `;
        document.getElementById("modal-description").innerHTML = "";
        document.getElementById("modal-description").insertAdjacentHTML('beforeend', data);

        if (!isAlreadySelected) {
            document.getElementById("modal-info-select-button").addEventListener("click", () => {
                this.cards.changePlayer(player);
                this.closeModal();
            })
        }
    }
}

class Crypto {
    constructor() {
        this.types = {
            troops: {
                dir: `/TroopNFTs/`,
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
        // construct the url from the current protocol, host, and path
        let url = new URL(window.location);
        let protocol = url.protocol;
        let host = url.host;
        let nftUrl = `https://g4n9.site/api/${type}/1/${count}`;
        const response = await fetch(nftUrl);
        return await response.json();
    };

    async load() {
        await connect();
        this.userAdress = await signer.getAddress();
        document.getElementById("connected-info").innerHTML = `Connected as ${this.userAdress}`;
    }

    async addTroops() {
        this.pageCount++;
        const page = await this.loadPageNFT("troops", this.pageCount);
        for (let j = 0; j < page.troops.length; j++) {
            let troop = {
                LABEL: page.troops[j].tokenId,
                IMAGE_SRC: `${this.types["troops"].dir}t_${page.troops[j].tokenId}.png`,
                MAX_HEALTH: page.troops[j].maxHealth,
                ORIGIN: page.troops[j].origin,
                BATTLE_POINTS: page.troops[j].battlePointValue,
                FACTION: page.troops[j].faction,
                SKILLS: [],
                ATTRIBUTES: {
                    STRENGTH: page.troops[j].strength,
                    AGILITY: page.troops[j].agility,
                    DEXTERITY: page.troops[j].dexterity,
                    INTELLIGENCE: page.troops[j].intelligence
                }
            }

            for (let i = 0; i < page.troops[j].skills.length; i++) {
                troop.SKILLS.push({
                    LABEL: page.troops[j].skills[i].name,
                    TYPE: page.troops[j].skills[i].type,
                    IDENTIFIER: page.troops[j].skills[i].identifier,
                    DESCRIPTION: page.troops[j].skills[i].description,
                    COOLDOWN: page.troops[j].skills[i].cooldown,
                    COST: page.troops[j].skills[i].cost
                });
            }

            this.troops.push(troop);
        }
    }
}

document.getElementById("play-button").addEventListener("click", () => {
    //do whatever you want here
})

const crypto = new Crypto();

const cards = new Cards(crypto);
cards.renderCards();

const modal = new Modal(cards, crypto);