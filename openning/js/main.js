import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

const sleep = ms => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, innerWidth / innerHeight, 0.1, 1000 );
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
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

class Card {
    constructor(mesh) {
        this.mesh = mesh;
        this.anchor = {
            x: mesh.position.x,
            y: mesh.position.y
        }

        this.count = Math.random() * 1000;
    }

    shake() {
        this.count += .01;

        this.x = this.anchor.x + Math.cos(this.count) / 20;
        this.y = this.anchor.y + Math.cos(this.count) / 20;
    }

    get x() {
        return this.mesh.position.x;
    }

    set x(x) {
        this.mesh.position.x = x;
    }

    get y() {
        return this.mesh.position.y;
    }

    set y(y) {
        this.mesh.position.y = y;
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
        const geometry = new THREE.BoxGeometry( 1, 2, .1 );
		const material = new THREE.MeshBasicMaterial({
            map: await dummyTexture,
        });
        const cube = new THREE.Mesh(geometry, material);
    
        if (x >= maxX) {
            x = 0;
            y += yOffset; 
        }
    
        cube.position.x = x;
        cube.position.y = y;
        x += xOffset;

        const card = new Card(cube);
    
        cards.push(card);
        cubes.push(cube);
        scene.add(cube);
    }
    return { instances: cards, objects: cubes };
}

function placeCamera() {
    let x = 0, y = 0;
    for (let i = 0; i < cards.length; i++) {
        x += cards[i].x;
        y += cards[i].y;
    }

    x /= cards.length;
    y /= cards.length;

    camera.position.x = x;
    camera.position.y = y;
}

const result = await getCards();
const cards = result.instances;
const cubes = result.objects;

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
        onCardClick(intersects[0]);
    }
}
renderer.domElement.addEventListener('mousedown', onClick);

placeCamera();

function onCardClick({ object }) {
    const card = cards.find(c => c.mesh === object);
    new TWEEN.Tween(object.rotation)
        .to({
            x: 0,
            y: Math.PI,
            z: 0
        }, 1500)
        .easing(TWEEN.Easing.Elastic.InOut)
        .start();
}


function animate() {
    requestAnimationFrame( animate );

    TWEEN.update();

    for (let i = 0; i < cards.length; i++) {
        cards[i].shake();
    }

    renderer.render( scene, camera );
};

animate();


const tick = () => {
	requestAnimationFrame( tick );
	renderer.render( scene, camera );
}

tick();