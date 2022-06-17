import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, innerWidth / innerHeight, 0.1, 1000 );
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
    antialias: true,
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

class Card {
    constructor(group, position) {
        this.group = group;
        this.anchor = position;
        this.hasMoved = false;

        this.count = Math.random() * 1000;
        this.lastTime = Date.now();
    }

    shake() {
        const deltaTime = Date.now() - this.lastTime;
        this.lastTime = Date.now();

        this.count += .001 * deltaTime;

        if (this.hasMoved) {
            this.x = this.anchor.x + Math.cos(this.count) / 20;
            this.y = this.anchor.y + Math.cos(this.count) / 20;
        }
    }

    set hasMoved(value) {
        if (value) {
            const position = { 
                x: this.anchor.x + Math.cos(this.count) / 20, 
                y: this.anchor.y + Math.cos(this.count) / 20 
            };

            new TWEEN.Tween(this.group.position)
                .to(position, 80)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();
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

let cards = []
let cubes = []

animate();

const result = await getCards();
placeCamera()
cards = result.instances;
cubes = result.objects;
await PlaceCards();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
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
renderer.domElement.addEventListener('mousedown', onClick);

function onCardClick(object) {
    const card = cards.find(c => c.mesh === object);
    new TWEEN.Tween(object.rotation)
        .to({
            x: 0,
            y: -Math.PI,
            z: 0
        }, 1500)
        .easing(TWEEN.Easing.Elastic.InOut)
        .start();
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
    requestAnimationFrame( animate );

    TWEEN.update();

    for (let i = 0; i < cards.length; i++) {
        cards[i].shake();
    }

    renderer.render( scene, camera );
};