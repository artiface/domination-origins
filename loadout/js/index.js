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
            document.getElementById(`card-${i}`).addEventListener('click', () => {
                this.clickedCard = i;
                j.renderPlayerModal();
            });
        }
    }
}

class Modal {
    constructor(cards, crypto) {
        this.crypto = crypto;
        this.cards = cards;
        this.modalParent = document.getElementById('modal-parent');

        this.players = crypto.troops;
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

    renderPlayerModal() {
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

        this.renderPlayerList();
    }

    renderPlayerList() {
        const listParent = document.getElementById('modal-list');
        this.players.forEach((player, i) => {
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
        //Image, TokenID, Faction Icon, Origin, Level, Health, Focus, Battle Points 
            listParent.insertAdjacentHTML('beforeend', data);

            document.getElementById(`player-${i}`).addEventListener("click" , () => {
                this.cards.changePlayer(player);
                this.modalParent.style.display = "none";
            });
        });
    }

    renderRightInfo() {
        const data = `
        <img class="img-horizontal-responsive" src="../assets/ui/browse.png">
        <div class="horizontal-wrapper">
            <div id="modal-info-1">Hey</div>
            <div id="modal-info-2">Hey</div>
        </div>
        `

        document.getElementById("modal-description")
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
    }

    async loadLocalNFT(type, tokenId) {
        const response = await fetch(`http://127.0.0.1:5000/api/${type}/1/${tokenId}`)
        const data = await response.json()
        console.log(data)
        return {
            LABEL: data.tokenId,
            IMAGE_SRC: `${this.types[type].dir}t_${data.tokenId}.png`,
            MAX_HEALTH: data.maxHealth,
            ORIGIN: data.origin,
            BATTLE_POINTS: data.battlePointValue,
            FACTION: data.faction,
        }
    };

    async load() {
        await connect();
        this.userAdress = await signer.getAddress();

        const isTraining = true;
        const troops = [];
        if (isTraining) {
            for (let i = 0; i < 10000; i++) {
                troops.push((i+1).toString());
            }
        }
        else {
            troops = await getWallet(this.userAdress, "troops");
        }

        for (let i = 0; i < troops.length; i++) 
            this.troops.push(await this.loadLocalNFT("troops", troops[i].toString()));
    }
}

const k = new Crypto();
await k.load();

const i = new Cards(k);
i.renderCards();

const j = new Modal(i, k);