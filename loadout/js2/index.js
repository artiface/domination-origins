class Cards {
    constructor() {
        this.cardParent = document.getElementById('card-parent');

        this.cards = [
        {
            LABEL: 'Card 1',
            HEALTH: '75', // health/100
            IMAGE_SRC: '../assets/ui/browse.png',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'Card 2',
            HEALTH: '50', // health/100
            IMAGE_SRC: '../assets/ui/browse.png',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'Card 3',
            HEALTH: '20', // health/100
            IMAGE_SRC: '../assets/ui/browse.png',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'Card 4',
            HEALTH: '100', // health/100
            IMAGE_SRC: '../assets/ui/browse.png',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        },
        {
            LABEL: 'Card 5',
            HEALTH: '40', // health/100
            IMAGE_SRC: '../assets/ui/browse.png',
            STATS: {
                STRENGTH: '10',
                AGILITY: '10',
                INTELLIGENCE: '10'
            }
        }]
    }

    renderCards() {
        this.cards.forEach((card, i) => {
            let data = `
            <div id="card-${i}" class="card">
                <img class="info" src="./svgs/circle-info.svg">
                <div class="info-bubble">
            `;

            for (let stat in card.STATS) {
                data += `<div class="info-bubble-text">${stat}: ${card.STATS[stat]}</div>`;
            }

            data += `</div>
                <img class="img-vertical-responsive" id="image" src="${card.IMAGE_SRC}">
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
                j.renderPlayerModal();
            });
        });
    }
}

class Modal {
    constructor() {
        this.modalParent = document.getElementById('modal-parent');

        this.players = [{
            LABEL: 'Player 1',
            HEALTH: '75', // health/100
            LEVEL: '1',
        }]
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

        <div class="modal-description">
            <img class="img-horizontal-responsive" src="../assets/ui/browse.png">
            <div class="horizontal-wrapper">
                <div id="modal-info-1">Hey</div>
                <div id="modal-info-2">Hey</div>
            </div>
        </div>
        `
        document.getElementById("modal").insertAdjacentHTML('beforeend', data);

        this.renderPlayerList();
    }

    renderPlayerList() {
        const listParent = document.getElementById('modal-list');
        this.players.forEach(player => {
            let data = `
            <div class="modal-list-node">
                <img class="img-horizontal-responsive" src="../assets/ui/browse.png">
                <div class="node-text">${player.LABEL}</div>
                <div class="node-stats">
                    <div class="horizontal-wrapper">
                        <div class="node-text">Health</div>
                        <div class="bar-container">
                            <div class="bar" style="width: ${player.HEALTH}%"></div>
                        </div>
                    </div>
                    <div class="horizontal-wrapper">
                        <div class="node-text">Level</div>
                        <div class="bar-container">
                            <div class="bar" style="width: ${75}%"></div>
                        </div>
                    </div>
                </div>
                <div class="node-text">Skills: None</div>
            </div>
            `

            listParent.insertAdjacentHTML('beforeend', data);
        });
    }
}

const i = new Cards();
i.renderCards();

const j = new Modal();