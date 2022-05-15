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
        this.cards.forEach(card => {
            let data = `
            <div class="card">
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
        });
    }
}

const i = new Cards();
i.renderCards();

class Modal {
    constructor() {
        
    }
}