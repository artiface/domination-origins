import CSS from "../css/style.css"
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { getContract } from "./chainload";
import { ethers } from "ethers";

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
        'https://i.imgur.com/CkmEmKk.jpeg',
        (texture) => {
            resolve(texture);
        }
    )
});
let theRockTexture = new Promise((resolve, reject) => {
    loader.load(
        'https://i.imgur.com/CkmEmKk.jpeg',
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

class Pack {
    constructor(packType) {
        this.packType = packType;
        this.init()
    }

    init() {
        this.openButton = document.getElementById(`open-${this.packType}`)

        this.openButton.addEventListener("click", () => {
            openCardMenu();
            initCards();
        })
    }
}

class Booster extends Pack {
    constructor(packType) {
        super(packType);
    }
}

class Starter extends Pack {
    constructor(packType) {
        super(packType);
    }
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

document.getElementById("exit-container").style.display = "flex";

const starterPack = new Starter("starter")
const boosterPack = new Booster("booster")
