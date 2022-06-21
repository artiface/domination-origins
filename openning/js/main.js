import CSS from "../css/style.css"
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { getContract } from "./chainload";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, innerWidth / innerHeight, 0.1, 1000 );
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});
renderer.setSize( innerWidth, innerHeight );
document.body.appendChild( renderer.domElement );
window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( innerWidth, innerHeight);
})

const loader = new THREE.TextureLoader();
let dummyTexture = new Promise((resolve, reject) => {
    loader.load(
        '../assets/dummy.jpeg',
        (texture) => {
            resolve(texture);
        }
    )
});
let theRockTexture = new Promise((resolve, reject) => {
    loader.load(
        '../assets/dummy2.jpg',
        (texture) => {
            resolve(texture);
        }
    )
});

let cards = []
let cubes = []
let raycaster;
let pointer;

animate();

class Card {
    static revealCount = 0;
    constructor(group, position) {
        this.group = group;
        this.anchor = position;
        this.hasMoved = false;

        this.sleepTime = Math.random() * 1000;

        this.count = 0;
        this.lastTime = Date.now();
        this.clicked = false;
    }

    shake() {
        const deltaTime = Date.now() - this.lastTime;
        this.lastTime = Date.now();

        if (this.sleepTime < 0) 
            this.count += .001 * deltaTime;
        else 
            this.sleepTime -= 5;
        

        if (this.hasMoved) {
            this.x = this.anchor.x + Math.cos(this.count) / 30;
            this.y = this.anchor.y + Math.cos(this.count) / 30;
        }
    }

    set hasMoved(value) {
        if (value) {

        }

        this._hasMoved = value;
    }

    get hasMoved() {
        return this._hasMoved;
    }

    get x() {
        return this.group.position.x;
    }

    set x(x) {
        this.group.position.x = x;
    }

    get y() {
        return this.group.position.y;
    }

    set y(y) {
        this.group.position.y = y;
    }
}

async function getCards() {
    const cards = [];
    const cubes = [];
    let x = 0;
    let y = 0;
    let xOffset = 1.5;
    let yOffset = 3;
    let maxX = 5 * xOffset;
    for (let i = 0; i < 10; i++) {
        const group = new THREE.Group();

        const geometry = new THREE.BoxGeometry( 1, 2, .01 );
		const material = new THREE.MeshBasicMaterial({
            map: await dummyTexture,
        });
        const back = new THREE.Mesh(geometry, material);
        group.add(back);

		const material2 = new THREE.MeshBasicMaterial({
            map: await theRockTexture,
        });
        const face = new THREE.Mesh(geometry, material2);
        group.add(face);
    
        if (x >= maxX) {
            x = 0;
            y += yOffset; 
        }
        face.position.z -= .001;

        group.position.x = maxX / 2;
        group.position.y = yOffset / 2;

        x += xOffset;

        const card = new Card(group, {x, y});
    
        cards.push(card);
        cubes.push(group);
        scene.add(group);
    }
    return { instances: cards, objects: cubes };
}

function placeCamera() {
    let x = .5, y = .5;
    for (let i = 0; i < cards.length; i++) {
        x += cards[i].x;
        y += cards[i].y;
    }

    x /= cards.length;
    y /= cards.length;

    camera.position.x = x;
    camera.position.y = y;
}

function onClick(event) {
	// calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components
	pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(cubes);
    if (intersects.length > 0) {
        onCardClick(intersects[0].object.parent);
    }
}

function onCardClick(object) {
    const card = cards.find(c => c.group === object);

    if (card.clicked) return;

    new TWEEN.Tween(object.rotation)
        .to({
            x: 0,
            y: -Math.PI,
            z: 0
        }, 1500)
        .easing(TWEEN.Easing.Elastic.InOut)
        .onComplete(() => {
            Card.revealCount++
            card.clicked = true;
            if (Card.revealCount === cards.length) displayExitButton();
        })
        .start();
}

function displayExitButton() {
    document.getElementById("exit-container").style.pointerEvents = "all";
    document.getElementById("exit-container").style.opacity = "1";
    document.getElementById("exit-button").addEventListener("click", () => {
        closeCardMenu();
    })
}

async function PlaceCards() {
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];

        await sleep(100);

        new TWEEN.Tween(card.group.position)
            .to(card.anchor, 1000)
            .easing(TWEEN.Easing.Elastic.InOut)
            .start()
            .onUpdate(() => placeCamera())
            .onComplete(() => card.hasMoved = true);
    }
}


function animate() {
    TWEEN.update();

    for (let i = 0; i < cards.length; i++) {
        cards[i].shake();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
};

function reset() {
    Card.revealCount = 0;
    cards = []
    cubes = []

    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
}

function initCards() {
    reset();

    getCards().then(result => {
        placeCamera()
        cards = result.instances;
        cubes = result.objects;
        PlaceCards().then(() => {
            raycaster = new THREE.Raycaster();
            pointer = new THREE.Vector2();
            renderer.domElement.addEventListener('click', onClick);
        });
    });
}

class Tile {
    constructor(packType) {
        console.log(packType);

        this.buyButton = document.getElementById(`buy-${packType}`)
        this.openButton = document.getElementById(`open-${packType}`)
        this._amount = 0;

        this.loadPrice().then((price) => {
            console.log(price)
            if (price?._isBigNumber) console.log(price.toNumber())
            //console.log(this.price.toNumber())
            this.buyButton.addEventListener("click", () => {
                openModal(`${packType} pack`, price, this);
            })
    
            this.openButton.addEventListener("click", () => {
                openCardMenu();
                initCards();
            })
        }).catch(err => {
            alert(err)
        });
    }

    async buy(tokenID) {
        const amount = parseInt(document.getElementById("input-number-field").innerText);
        const price = this.price;
        const totalPrice = price.mul(amount);
        const gasEstimated = await this.contract.estimateGas.buyStarter(this.tokenID, amount, { value: totalPrice.toString() });

        const options = {
            value: totalPrice,
            gasLimit: gasEstimated.mul(120).div(100)
        };

        await this.contract.buyStarter(starterTokenId, amount, options);
    }
}

class Booster extends Tile {
    constructor(packType) {
        super(packType);
        this.tokenID = 500;
    }

    async loadPrice() {
        this.contract = getContract('erc1155');
        return new Promise((resolve, reject) => {
            this.contract.BOOSTER_PRICE().then(price => {
                resolve(price);
            }).catch(err => {
                reject(err);
            }); 
        })

    }
}

class Starter extends Tile {
    constructor(packType) {
        super(packType);
        this.tokenID = 1;
    }

    async loadPrice() {
        this.contract = getContract('erc1155');
        this.contract.STARTER_PRICE().then(price => {
            this.price = price;
        });
    }
}

function openModal(title, price, tile) {
    document.getElementById("modal-title").innerText = title;
    console.log(price.toNumber())
    document.getElementById("article-price").innerText = `Price : ${price.toNumber()} MATIC`;
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

function closeCardMenu() {
    document.getElementById("container").style.filter = "blur(0px)";
    document.getElementById("container").style.pointerEvents = "all";
    document.getElementById("exit-container").style.pointerEvents = "none";
    document.getElementById("exit-container").style.opacity = "0";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.opacity = "0";
}

window.onload = () => {
    document.getElementById("exit-container").style.display = "flex";
    document.getElementById("modal-container").style.display = "flex";

    const field = document.getElementById("input-number-field");

    document.getElementById("buy-decrease").addEventListener("click", () => {
        field.innerText = Math.max(parseInt(field.innerText) - 1, 0);
    })

    document.getElementById("buy-increase").addEventListener("click", () => {
        field.innerText = parseInt(field.innerText) + 1;
    })

    const starterPack = new Starter("starter")
    const boosterPack = new Booster("booster")
}
