import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer;
var frontCamera, topCamera, sideCamera,  perspectiveCamera, orthoCamera, mobileCamera;
var activeCamera, cameraPositionReference;

var material, material1, material2, mesh ;
var g, groupBase, groupTop, groupCar, groupCable, groupClaw, groupContentor, groupCargo;

var cargoCube1, cargoCube2, cargoDodecahedron1, cargoDodecahedron2, cargoIcosahedron1, cargoIcosahedron2, 
    cargoTorus1, cargoTorus2, cargoTorusK1, cargoTorusK2;

var craneRotationAngle = 0;
var rotationSpeed = 1, rotationDirection = 0;
var translationSpeed = 17.5, translationDirection = 0; 
var translationDirectionClaw = 0;
var clawSpeed = 20, clawRotationDirection = 0;
var translationDropSpeed = 0.25;

var changeWireframe = false;

var clock = new THREE.Clock();

var materialList = [];
var cargoList = [];

var activateAnimation = false;
var transportedCargo = null;

const keyMap = {
    'Digit1': 'key1',
    'Digit2': 'key2',
    'Digit3': 'key3',
    'Digit4': 'key4',
    'Digit5': 'key5',
    'Digit6': 'key6',
    'Digit7': 'key7',
    'KeyW': 'keyW',
    'KeyS': 'keyS',
    'KeyA': 'keyA',
    'KeyQ': 'keyQ',
    'KeyE': 'keyE',
    'KeyD': 'keyD',
    'KeyR': 'keyR',
    'KeyF': 'keyF',
};

/////////////
/* DISPLAY */
/////////////
function render(){
    'use strict';
    renderer.render(scene,activeCamera);
}

function updateActiveCamera() {
    'use strict';

    var highlight = "";
    if (activeCamera == frontCamera) { highlight = 'key1'; }
    else if (activeCamera == sideCamera) { highlight = 'key2'; }
    else if (activeCamera == topCamera) { highlight = 'key3'; }
    else if (activeCamera == orthoCamera) { highlight = 'key4'; }
    else if (activeCamera == perspectiveCamera) { highlight = 'key5'; }
    else if (activeCamera == mobileCamera) { highlight = 'key6'; }
    
    // Remove 'active' class from all key containers
     document.querySelectorAll('.key-row').forEach(function(container) {
        container.classList.remove('activeON');
    });

    // Add 'active' class only to the corresponding key container
    var activeContainer = document.getElementById(highlight);
    if (activeContainer) {
        activeContainer.classList.add('activeON');
    }
}

//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createFixedCameras(){
    'use strict';

    // perspective camera
    perspectiveCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    perspectiveCamera.position.set(25, 25, 25);
    perspectiveCamera.lookAt(scene.position);

    // orthographic camera
    orthoCamera = new THREE.OrthographicCamera(window.innerWidth/-35, window.innerWidth/35, window.innerHeight/35, window.innerHeight/-35, 1, 1000);
    orthoCamera.position.set(25, 25, 25);
    orthoCamera.lookAt(scene.position);

}

function createOrthographicCameras() {
    'use strict';
    
    // Frontal Camera
    frontCamera = new THREE.OrthographicCamera(
        -window.innerWidth / 32, window.innerWidth / 32,
        window.innerHeight / 32, -window.innerHeight / 32,
        1, 1000
    );
    frontCamera.position.set(20, 0, 0); 
    frontCamera.lookAt(scene.position); 

    // Lateral Camera
    sideCamera = new THREE.OrthographicCamera(
        -window.innerWidth / 32, window.innerWidth / 32,
        window.innerHeight / 32, -window.innerHeight / 32,
        1, 1000
    );
    sideCamera.position.set(0, 0, 20);
    sideCamera.lookAt(scene.position); 

    // Top Camera
    topCamera = new THREE.OrthographicCamera(
        -window.innerWidth / 32, window.innerWidth / 32,
        window.innerHeight / 32, -window.innerHeight / 32,
        1, 1000
    );
    topCamera.position.set(0, 30, 0); 
    topCamera.lookAt(0, 0, 0); 

}

function createMobileCamera() {
    'use strict';

    // Create a new empty object to serve as the camera's reference point
    cameraPositionReference = new THREE.Object3D();
    groupClaw.add(cameraPositionReference); // Add it as a child of groupClaw (the crane's hook)

    mobileCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);

    // Calculate the position of the camera relative to the hook of the crane
    var craneHookPosition = new THREE.Vector3();
    groupClaw.children[0].getWorldPosition(craneHookPosition);

    mobileCamera.position.copy(craneHookPosition);

    // Set the camera to look directly onto the xOz plane
    mobileCamera.rotation.set(-Math.PI / 2, 0, 0);

    cameraPositionReference.add(mobileCamera);
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////
function createBase(){
    'use strict';

    groupBase = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({color: 0x9b9b9b, wireframe: false});
    materialList.push(material);

    var base = new THREE.BoxGeometry(4,2,4);
    mesh = new THREE.Mesh(base, material);
    mesh.position.set(0,0,0);
    groupBase.add(mesh);

    var tower = new THREE.BoxGeometry(2,15,2);
    mesh = new THREE.Mesh(tower, material);
    mesh.position.set(0,8.5,0);
    groupBase.add(mesh);
    
    scene.add(groupBase);

    groupBase.position.x = 0;
    groupBase.position.y = 0;
    groupBase.position.z = 0;
}

function createTetrahedron(){
    'use strict';

    g = new THREE.Object3D();

    var vertices = [
        1, -1.5, 1,   // vertex 0
        -1, -1.5, 1,  // vertex 1
        0, -1.5, -1,  // vertex 2
        0, Math.sqrt(2), 0  // vertex 3
    ];

    var indices = [
        0, 1, 2, // Face 0
        0, 3, 1, // Face 1
        0, 2, 3, // Face 2
        1, 3, 2  // Face 3
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);

    material = new THREE.MeshBasicMaterial({color: 0x144E68, wireframe: false});
    materialList.push(material);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,20,0);

    g.add(mesh);
    scene.add(g);

    g.position.x = 0;
    g.position.y = 0;
    g.position.z = 0;

    groupTop.add(g);
}

function createTop(){
    'use strict';

    groupTop = new THREE.Object3D();

    material1 = new THREE.MeshBasicMaterial({color: 0xc3f8ff, wireframe: false});
    material2 = new THREE.MeshBasicMaterial({color: 0x144E68, wireframe: false});
    materialList.push(material1);
    materialList.push(material2);

    var cabine = new THREE.BoxGeometry(3,1,2); //cabine
    mesh = new THREE.Mesh(cabine, material1);
    mesh.position.set(0,16.5,0);
    groupTop.add(mesh);

    var l = new THREE.BoxGeometry(16,1.5,2); //lanca
    mesh = new THREE.Mesh(l, material1);
    mesh.position.set(8,17.75,0);
    groupTop.add(mesh);

    var cl = new THREE.BoxGeometry(7,1.5,2); //contra-lanca
    mesh = new THREE.Mesh(cl, material1);
    mesh.position.set(-3.5,17.75,0);
    groupTop.add(mesh);

    var cp = new THREE.BoxGeometry(2,0.5,2); //contrapeso
    mesh = new THREE.Mesh(cp, material2);
    mesh.position.set(-5,16.75,0);
    groupTop.add(mesh);

    var tirante1 = new THREE.CylinderGeometry(0.125, 0.125, 5.8);
    mesh = new THREE.Mesh(tirante1, material2);
    mesh.rotation.set(0,0,THREE.MathUtils.degToRad(-59.5));
    mesh.position.set(-2.5,19.5,0);
    groupTop.add(mesh);

    var tirante2= new THREE.CylinderGeometry(0.125,0.125, 10.44);
    mesh = new THREE.Mesh(tirante2, material2);
    mesh.rotation.set(0,0,THREE.MathUtils.degToRad(73.3));
    mesh.position.set(5,19.5,0);
    groupTop.add(mesh);
    
    scene.add(groupTop);

    groupTop.position.x = 0;
    groupTop.position.y = 0;
    groupTop.position.z = 0;

    groupBase.add(groupTop);

}

function createCar(){
    'use strict';

    groupCar = new THREE.Object3D();

    var carro = new THREE.BoxGeometry(2,1,2);
    mesh = new THREE.Mesh(carro, material2);
    mesh.position.set(14.5, 16.5,0);
    groupCar.add(mesh);

    scene.add(groupCar);

    groupCar.position.x = 0;
    groupCar.position.y = 0;
    groupCar.position.z = 0;

    groupTop.add(groupCar);
}

function createCable(){
    'use strict';

    groupCable = new THREE.Object3D();

    material = new THREE.MeshBasicMaterial({color: 0x9b9b9b, wireframe: false});
    materialList.push(material);

    var cabo = new THREE.CylinderGeometry(0.5,0.5,7); //default position
    mesh = new THREE.Mesh(cabo, material);
    mesh.position.set(14.5,0,0);
    groupCable.add(mesh);

    scene.add(groupCable);

    groupCable.position.x = 0;
    groupCable.position.y = 12.5;
    groupCable.position.z = 0;

    groupCar.add(groupCable);
}

function createIndividualClaw(x, y, z){
    'use strict';

    var gClaw = new THREE.Object3D();

    var vertices = [
        0.25, 0.25, 0.25,   // vertex 0
        -0.25, 0.25, 0.25,  // vertex 1
        0, 0.25, -0.25,  // vertex 2
        0, -0.5, 0  // vertex 3
    ];

    var indices = [
        0, 1, 2, // Face 0
        0, 3, 1, // Face 1
        0, 2, 3, // Face 2
        1, 3, 2  // Face 3
    ];

    var geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setIndex(indices);

    material = new THREE.MeshBasicMaterial({color: 0x144E68, wireframe: false});
    materialList.push(material);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0,0,0);

    gClaw.add(mesh);
    scene.add(g);

    gClaw.position.x = x;
    gClaw.position.y = y;
    gClaw.position.z = z;

    groupClaw.add(gClaw);
    return gClaw;
}

function createClaws(){
    'use strict';
    //create the entire claw, base plus each indivdual claw

    groupClaw = new THREE.Object3D();

    var hook = new THREE.CylinderGeometry(1,1,1);
    mesh = new THREE.Mesh(hook, material1);
    mesh.position.set(14.5, 8.5, 0);
    groupClaw.add(mesh);

    groupClaw.claw1 = createIndividualClaw(14, 7.75, 0.5);
    groupClaw.claw2 = createIndividualClaw(15, 7.75, 0.5);
    groupClaw.claw3 = createIndividualClaw(14, 7.75, -0.5);
    groupClaw.claw4 = createIndividualClaw(15, 7.75, -0.5);

    scene.add(groupClaw);

    groupClaw.position.x = 0;
    groupClaw.position.y = 0;
    groupClaw.position.z = 0;

    groupCar.add(groupClaw);
}

////////////////////////
/* CREATE CONTENTOR */
////////////////////////
function createContentor(){
    'use strict';

    groupContentor = new THREE.Object3D();

    var material = new THREE.MeshBasicMaterial({color: 0x9b9b9b, wireframe: false});
    var materialBase = new THREE.MeshBasicMaterial({color: 0x000000, wireframe: false});
    materialList.push(material);
    materialList.push(materialBase);

    var contentorBottom = new THREE.BoxGeometry(6,0.5,4);
    mesh = new THREE.Mesh(contentorBottom, materialBase);
    mesh.position.set(14,-0.5 , 0);
    groupContentor.add(mesh);

    var contentorSide1 = new THREE.BoxGeometry(0.5,4,4);
    mesh = new THREE.Mesh(contentorSide1,material);
    mesh.position.set(11.26,1.5, 0);
    groupContentor.add(mesh);

    var contentorSide2 = new THREE.BoxGeometry(0.5,4,4);
    mesh = new THREE.Mesh(contentorSide2,material);
    mesh.position.set(16.76,1.5, 0);
    groupContentor.add(mesh);

    var contentorSide3 = new THREE.BoxGeometry(0.5,4,6);
    mesh = new THREE.Mesh(contentorSide3,material);
    mesh.position.set(14,1.5, 2);
    mesh.rotation.set(0,THREE.MathUtils.degToRad(90),0);
    groupContentor.add(mesh);

    var contentorSide4 = new THREE.BoxGeometry(0.5,4,6);
    mesh = new THREE.Mesh(contentorSide4,material);
    mesh.position.set(14,1.5, -2);
    mesh.rotation.set(0,THREE.MathUtils.degToRad(90),0);
    groupContentor.add(mesh);

    scene.add(groupContentor);
    
    groupContentor.position.x = 0;
    groupContentor.position.y = 0;
    groupContentor.position.z = 0;
}

function createCube(x,y,z,n){
    'use strict';

    var material4 = new THREE.MeshBasicMaterial({color: 0xf67828, wireframe: false});
    materialList.push(material4);

    if (n!=2){ //first cube
        cargoCube1 = new THREE.BoxGeometry(x,y,z);
        mesh = new THREE.Mesh(cargoCube1,material4);

        //check collision of the first cube cargo with the other objects in the scene
        var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
        var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
        while (collisionBase || collisionContentor) {
            mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            collisionBase = checkCollision(mesh,groupBase.children[0], 1);
            collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        }

        return mesh;
    }
    //second cube
    cargoCube2 = new THREE.BoxGeometry(x,y,z);
    mesh = new THREE.Mesh(cargoCube2,material4);
    
    //check collision of the second cube cargo with the other objects in the scene
    var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
    var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
    var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
    while (collisionBase || collisionContentor || collisionCube1) {
        mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
        collisionBase = checkCollision(mesh,groupBase.children[0], 1);
        collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
    }

    return mesh;
}

function createCargoDodecahedron(m,n){
    'use strict';

    var material4 = new THREE.MeshBasicMaterial({color: 0x77dd77, wireframe: false});
    materialList.push(material4);

    if (n!=2){ //first dodecahedron
        cargoDodecahedron1 = new THREE.DodecahedronGeometry(m);
        mesh = new THREE.Mesh(cargoDodecahedron1,material4);

        //check collision of the first dodecahedron cargo with the other objects in the scene
        var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
        var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
        var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
        var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
        while (collisionBase || collisionContentor || collisionCube1 || collisionCube2) {
            mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            collisionBase = checkCollision(mesh,groupBase.children[0], 1);
            collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
            collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
            collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
        }

        return mesh;
    }
    
    //second dodecahedron
    cargoDodecahedron2 = new THREE.DodecahedronGeometry(m);
    mesh = new THREE.Mesh(cargoDodecahedron2,material4);

    //check collision of the second dodecahedron cargo with the other objects in the scene
    var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
    var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
    var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
    var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
    var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
    while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1) {
        mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
        collisionBase = checkCollision(mesh,groupBase.children[0], 1);
        collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
        collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
        collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
    }

    return mesh;
}

function createCargoIcosahedron(m,n){
    'use strict';

    var material4 = new THREE.MeshBasicMaterial({color: 0x3065ac, wireframe: false});
    materialList.push(material4);

    if (n!=2){ //first icosahedron
        cargoIcosahedron1 = new THREE.IcosahedronGeometry(m);
        mesh = new THREE.Mesh(cargoIcosahedron1,material4);

        //check collision of the first icosahedron cargo with the other objects in the scene
        var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
        var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
        var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
        var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
        var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
        var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
        while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 || collisionDodecahedron2) {
            mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            collisionBase = checkCollision(mesh,groupBase.children[0], 1);
            collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
            collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
            collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
            collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
            collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
        }

        return mesh;
    }

    //second icosahedron
    cargoIcosahedron2 = new THREE.DodecahedronGeometry(m);
    mesh = new THREE.Mesh(cargoIcosahedron2,material4);

    //check collision of the second icosahedron cargo with the other objects in the scene
    var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
    var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
    var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
    var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
    var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
    var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
    var collisionicosahedron1 = checkCollision(mesh,groupCargo.children[4], 1);
    while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 || collisionDodecahedron2 || collisionicosahedron1) {
        mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
        collisionBase = checkCollision(mesh,groupBase.children[0], 1);
        collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
        collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
        collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
        collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
        collisionicosahedron1 = checkCollision (mesh,groupCargo.children[4], 1);
    }

    return mesh;
}

function createCargoTorus(m,k,p,q, n){
    'use strict';

    var material4 = new THREE.MeshBasicMaterial({color: 0x3065ff, wireframe: false});
    materialList.push(material4);

    if (n!=2){ //first torus
        cargoTorus1 = new THREE.TorusGeometry(m,k,p,q);
        mesh = new THREE.Mesh(cargoTorus1,material4);

        //check collision of the first torus cargo with the other objects in the scene
        var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
        var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
        var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
        var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
        var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
        var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
        var collisionicosahedron1 = checkCollision(mesh,groupCargo.children[4], 1);
        var collisionicosahedron2 = checkCollision(mesh,groupCargo.children[5], 1);
        while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 || collisionDodecahedron2 || collisionicosahedron1 || collisionicosahedron2) {
            mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            collisionBase = checkCollision(mesh,groupBase.children[0], 1);
            collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
            collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
            collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
            collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
            collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
            collisionicosahedron1 = checkCollision (mesh,groupCargo.children[4], 1);
            collisionicosahedron2 = checkCollision (mesh,groupCargo.children[5], 1);
        }

        return mesh;
    }

    //second torus
    cargoTorus2 = new THREE.TorusGeometry(m,k,p,q);
    mesh = new THREE.Mesh(cargoTorus2,material4);

    //check collision of the second torus cargo with the other objects in the scene
    var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
    var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
    var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
    var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
    var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
    var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
    var collisionicosahedron1 = checkCollision(mesh,groupCargo.children[4], 1);
    var collisionicosahedron2 = checkCollision(mesh,groupCargo.children[5], 1);
    var collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
    while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 || collisionDodecahedron2 || collisionicosahedron1 || collisionicosahedron2 || collisionTorus1) {
        mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
        collisionBase = checkCollision(mesh,groupBase.children[0], 1);
        collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
        collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
        collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
        collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
        collisionicosahedron1 = checkCollision (mesh,groupCargo.children[4], 1);
        collisionicosahedron2 = checkCollision (mesh,groupCargo.children[5], 1);
        collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
    }

        return mesh;
}

function createCargoTorusK(m,k,p,q,r,s, n){
    'use strict';

    var material4 = new THREE.MeshBasicMaterial({color: 0xff6961, wireframe: false});
    materialList.push(material4);

    if (n!=2){ //first torus knot
        cargoTorusK1 = new THREE.TorusKnotGeometry(m,k,p,q,r,s);
        mesh = new THREE.Mesh(cargoTorusK1,material4);

        //check collision of the first torus knot cargo with the other objects in the scene
        var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
        var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
        var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
        var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
        var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
        var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
        var collisionicosahedron1 = checkCollision(mesh,groupCargo.children[4], 1);
        var collisionicosahedron2 = checkCollision(mesh,groupCargo.children[5], 1);
        var collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
        var collisionTorus2 = checkCollision(mesh,groupCargo.children[7], 1);
        while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 || collisionDodecahedron2 || collisionicosahedron1 || collisionicosahedron2 || collisionTorus1 || collisionTorus2) {
            mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
            collisionBase = checkCollision(mesh,groupBase.children[0], 1);
            collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
            collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
            collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
            collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
            collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
            collisionicosahedron1 = checkCollision (mesh,groupCargo.children[4], 1);
            collisionicosahedron2 = checkCollision (mesh,groupCargo.children[5], 1);
            collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
            collisionTorus2 = checkCollision(mesh,groupCargo.children[7], 1);
        }

        return mesh;
    }

    //second torus knot
    cargoTorusK2 = new THREE.TorusKnotGeometry(m,k,p,q,r,s);
    mesh = new THREE.Mesh(cargoTorusK2,material4);

    //check collision of the second torus knot cargo with the other objects in the scene
    var collisionBase = checkCollision(mesh, groupBase.children[0], 1);
    var collisionContentor = checkCollision(mesh, groupContentor.children[0], 1);
    var collisionCube1 = checkCollision(mesh,groupCargo.children[0], 1);
    var collisionCube2 = checkCollision(mesh,groupCargo.children[1], 1);
    var collisionDodecahedron1 = checkCollision(mesh,groupCargo.children[2], 1);
    var collisionDodecahedron2 = checkCollision(mesh,groupCargo.children[3], 1);
    var collisionicosahedron1 = checkCollision(mesh,groupCargo.children[4], 1);
    var collisionicosahedron2 = checkCollision(mesh,groupCargo.children[5], 1);
    var collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
    var collisionTorus2 = checkCollision(mesh,groupCargo.children[7], 1);
    var collisionTorusK1 = checkCollision(mesh,groupCargo.children[8], 1);
    while (collisionBase || collisionContentor || collisionCube1 || collisionCube2 || collisionDodecahedron1 
        || collisionDodecahedron2 || collisionicosahedron1 || collisionicosahedron2 || collisionTorus1 || 
        collisionTorus2 || collisionTorusK1) {
        mesh.position.set(Math.random() * 20 - 10, 0.5, Math.random() * 20 - 10);
        collisionBase = checkCollision(mesh,groupBase.children[0], 1);
        collisionContentor = checkCollision(mesh,groupContentor.children[0], 1);
        collisionCube1 = checkCollision (mesh,groupCargo.children[0], 1);
        collisionCube2 = checkCollision (mesh,groupCargo.children[1], 1);
        collisionDodecahedron1 = checkCollision (mesh,groupCargo.children[2], 1);
        collisionDodecahedron2 = checkCollision (mesh,groupCargo.children[3], 1);
        collisionicosahedron1 = checkCollision (mesh,groupCargo.children[4], 1);
        collisionicosahedron2 = checkCollision (mesh,groupCargo.children[5], 1);
        collisionTorus1 = checkCollision(mesh,groupCargo.children[6], 1);
        collisionTorus2 = checkCollision(mesh,groupCargo.children[7], 1);
        collisionTorus2 = checkCollision(mesh,groupCargo.children[7], 1);
        collisionTorusK1 = checkCollision(mesh,groupCargo.children[8], 1);
    }
        return mesh;
}

function createAllCargo(){
    'use strict';

    groupCargo = new THREE.Object3D();

    var material4 = new THREE.MeshBasicMaterial({color: 0x9370DB, wireframe: false});
    materialList.push(material4);
    
    var mesh = createCube(1.5,1.5,1.5,1);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCube(2,2,2,2);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoDodecahedron(1,1);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoDodecahedron(1.5,2);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoIcosahedron(1,1);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoIcosahedron(1.5,2);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoTorus(0.7,1,3,4, 1);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoTorus(1,0.5,6,7, 2);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoTorusK(0.5,0.2,32,4,1,1.5, 1);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    mesh = createCargoTorusK(1,0.4,64,8,2,3,2);
    cargoList.push(mesh);
    groupCargo.add(mesh);

    scene.add(groupCargo);
    
    groupCargo.position.x = 0;
    groupCargo.position.y = 0;
    groupCargo.position.z = 0;
}

//////////////////
/* MOVEMENTS */
/////////////////
function rotateCrane() {
    //rotate the entire top part of the crane 360 degrees
    var deltaTime = clock.getDelta();
    craneRotationAngle += rotationSpeed * rotationDirection * deltaTime;
    groupTop.rotation.y = craneRotationAngle;

    //automatic animation is happening
    if(transportedCargo != null){
        // Get the world position and rotation of the crane's claw
        var clawPosition = new THREE.Vector3();
        var clawRotation = new THREE.Quaternion();
        groupClaw.children[0].getWorldPosition(clawPosition);
        groupClaw.children[0].getWorldQuaternion(clawRotation);

        // Set the cargo's position and rotation relative to the claw
        transportedCargo.position.copy(clawPosition);
        transportedCargo.quaternion.copy(clawRotation);

        // Rotate the cargo along with the crane
        const boundingSphere1 = computeBoundingSphere(transportedCargo.geometry);
        const radius1 = boundingSphere1.radius;
        transportedCargo.position.y -= radius1;
    }
    
    requestAnimationFrame(rotateCrane);
}

function controlClaw(){
    //open and close claws
    var deltaTime = clock.getDelta();
    var delta = clawSpeed * clawRotationDirection * deltaTime;
    if((groupClaw.claw2.rotation.z + delta)<=Math.PI*(50)/180 && (groupClaw.claw2.rotation.z + delta) >= 0){
        groupClaw.claw1.rotation.z-=delta;
        groupClaw.claw2.rotation.z+=delta;
        groupClaw.claw3.rotation.z-=delta;
        groupClaw.claw4.rotation.z+=delta;
    }

    requestAnimationFrame(controlClaw);
}

function moveCarTranslation() {
    //move car forwards and backwards
    var maxCarPosition = groupTop.position.x;
    var minCarPosition = groupTop.position.x - 12;
    
    var deltaTime = clock.getDelta();

    if (groupCar.position.x + translationSpeed * translationDirection * deltaTime <= maxCarPosition &&
        groupCar.position.x + translationSpeed * translationDirection * deltaTime >= minCarPosition) {
        groupCar.position.x += translationSpeed * translationDirection * deltaTime;
            
        //automatic animation is happening
        if(transportedCargo != null){
            var clawPosition = new THREE.Vector3();
            
            groupClaw.children[0].getWorldPosition(clawPosition);

            // Set the cargo's position and rotation relative to the claw
            transportedCargo.position.copy(clawPosition);

            const boundingSphere1 = computeBoundingSphere(transportedCargo.geometry);
            const radius1 = boundingSphere1.radius;
            transportedCargo.position.y -= radius1;
        }
    }
    requestAnimationFrame(moveCarTranslation);
}

function moveClawTranslation() {
    //move claw upwards and downwards
    const minClawPosition = -7.5;
    const maxClawPosition = 7;
    
    var deltaTime = clock.getDelta();
    if (groupClaw.position.y + translationSpeed * translationDirectionClaw * deltaTime <= maxClawPosition &&
        groupClaw.position.y + translationSpeed * translationDirectionClaw * deltaTime >= minClawPosition) {
        groupClaw.position.y += translationSpeed * translationDirectionClaw * deltaTime;
        groupCable.position.y += (translationSpeed * translationDirectionClaw/2) * deltaTime;
        groupCable.scale.y -= (translationSpeed * translationDirectionClaw/7) * deltaTime;

        //automatic animation is happening
        if(transportedCargo != null){
            var clawPosition = new THREE.Vector3();
            var clawRotation = new THREE.Quaternion();
            groupClaw.children[0].getWorldPosition(clawPosition);
            groupClaw.children[0].getWorldQuaternion(clawRotation);

            // Set the cargo's position and rotation relative to the claw
            transportedCargo.position.copy(clawPosition);
            transportedCargo.quaternion.copy(clawRotation);

            const boundingSphere1 = computeBoundingSphere(transportedCargo.geometry);
            const radius1 = boundingSphere1.radius;
            transportedCargo.position.y -= radius1;
        }
    }
    
    requestAnimationFrame(moveClawTranslation);
}

function dropCargo(){
    //automatic animation is happening, drop cargo alone
    if(transportedCargo != null){
        transportedCargo.position.y -= translationDropSpeed ;
    }
    
    requestAnimationFrame(dropCargo);
}


//////////////////////
/* CHECK COLLISIONS */
//////////////////////
function computeBoundingSphere(geometry) {
    const boundingSphere = { center: new THREE.Vector3(), radius: 0 };
    const center = boundingSphere.center;

    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3; 

    // Calculate the center of the sphere bounding the object with the average of the vertex positions
    for (let i = 0; i < positions.length; i += 3) {
        center.x += positions[i];
        center.y += positions[i + 1];
        center.z += positions[i + 2];
    }

    center.divideScalar(vertexCount);

    // Find the biggest squared distance from each vertex to the center to find radius of object
    let maxRadiusSq = 0;
    for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - center.x;
        const dy = positions[i + 1] - center.y;
        const dz = positions[i + 2] - center.z;
        const radiusSq = dx * dx + dy * dy + dz * dz;
        maxRadiusSq = Math.max(maxRadiusSq, radiusSq);
    }
    // Converts the squared distance to actual distance
    boundingSphere.radius = Math.sqrt(maxRadiusSq);

    return boundingSphere;
}


function checkCollision(mesh1, mesh2, flag) {
    const boundingSphere1 = computeBoundingSphere(mesh1.geometry);
    const boundingSphere2 = computeBoundingSphere(mesh2.geometry);

    const radius1 = boundingSphere1.radius;
    const radius2 = boundingSphere2.radius;

    if (flag == 1){ //creation of cargo
        const center1 = mesh1.position;
        const center2 = mesh2.position;
        const distance = center1.distanceTo(center2);
        if (radius1 + radius2 >= distance) { //colision exists
            return true;
        }
        return false;

    } else if(flag == 2){ //claws picking cargo
        var center1 = new THREE.Vector3();
        mesh1.getWorldPosition(center1);

        const center2 = mesh2.position;
        const distance = center1.distanceTo(center2);
        if (radius1 + radius2 >= distance && groupClaw.claw2.rotation.z > Math.PI*(25)/180) { //colision exists
            //handle colision
            rotationDirection = 0;
            translationDirection = 0; 
            translationDirectionClaw = 0;
            clawRotationDirection = 0;
            activateAnimation = true;
            handleCollisions();
            return true;
        }
        return false;
    }
}

///////////////////////
/* HANDLE COLLISIONS */
///////////////////////
function handleCollisions(){ 
    'use strict';
    //collision was detected, do automatic animation
    var finish = "claw";

    if(finish == "claw"){
        //close claw to "grab object"
        if(groupClaw.claw2.rotation.z > Math.PI*15/180){
            clawRotationDirection = -1;
            clawSpeed = 5 ;
            controlClaw();
        } else {
            //claw is closed
            finish = "translation";
            clawRotationDirection = 0;
            clawSpeed = 20 ;
        }
    }
    finish = "translation";
    
    //move claw upwards automatically
    if(finish == "translation"){
        var worldPosition = new THREE.Vector3();
        groupClaw.getWorldPosition(worldPosition);
        if(worldPosition.y <= 1){
            //claw needs to go up one unit above its original position
            translationDirectionClaw = 1;
            moveClawTranslation();
        } else {
            //claw has finished going up to the desired position
            finish = "crane";
            translationDirectionClaw = 0;
        }
    }

    if(finish == "crane"){
        //crane has no rotation
        var threshold = Math.PI*(0.5)/180
        if(Math.abs(groupTop.rotation.y) < threshold){
            finish = "car";
            rotationDirection = 0;
        }  
        //rotate crane to the original position 
        else{
            if(groupTop.rotation.y < Math.PI*(0)/180){
                rotationSpeed = 2.5;
                rotationDirection = 1;
            }else{
                rotationSpeed = 2;
                rotationDirection = -1;
            } 
            rotateCrane();
        }
    }

    if(finish == "car"){
        //move car forward to its original position
        var worldPosition = new THREE.Vector3();
        groupCar.getWorldPosition(worldPosition);
        if(worldPosition.x < -0.5){
            translationDirection = 1;
            moveCarTranslation();
        } else {
            //car has reached the original position
            finish = "open claw";
            translationDirection = 0;
        }
    }

    if(finish == "open claw"){
        //open claw to drop the object grabbed
        if(groupClaw.claw2.rotation.z < Math.PI*49.5/180){
            clawRotationDirection = 1;
            clawSpeed = 5;
            controlClaw();
        }else {
            //claw has been fully opened
            finish = "drop";
            clawRotationDirection = 0;
            clawSpeed = 20;
        }
    }

    if(finish == "drop"){
        //drop the cargo that was grabbed
        if(transportedCargo.position.y > 0.5){
            dropCargo();
        }else{
            //cargo has been dropped to its original height, remove the object from the scene
            groupCargo.remove(transportedCargo);
            activateAnimation = false;
            transportedCargo = null;
        }   
        // animation has been completed
    }     
}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    if(changeWireframe){
        changeMaterialWireframe();
        changeWireframe = false;
    }
    //automatic animation is occurring
    if(activateAnimation){
        handleCollisions(transportedCargo);
        return;
    }
    for(var i=0 ; i< cargoList.length ; i++){
        //check collision of cargos with claw
        activateAnimation = checkCollision(groupClaw.children[0], cargoList[i], 2);
        if(activateAnimation){
            //register cargo that was grabbed
            transportedCargo = cargoList[i];
            break;
        }
    }
    rotateCrane();
    moveCarTranslation();
    moveClawTranslation();
    controlClaw();
    updateActiveCamera(); 
}

function changeMaterialWireframe(){
    materialList.forEach(object => {
        object.wireframe = !object.wireframe;
    });
}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e){
    'use strict';

    const keyId = keyMap[e.code];
    if (keyId) {
        document.getElementById(keyId).classList.add('active');
    }
    if(activateAnimation == true){
        //cargo animation is active
        //only keys active are cameras and wireframe

        switch(e.keyCode){
            case 49:{ //tecla 1
                activeCamera = frontCamera;
                break;
            }
            case 50:{ //tecla 2
                activeCamera = sideCamera;
                break;
            }
            case 51:{ //tecla 3
                activeCamera = topCamera;
                break;
            }
            case 52:{ //tecla 4
                activeCamera = orthoCamera;
                break;
            }
            case 53:{ //tecla 5
                activeCamera = perspectiveCamera;
                break;
            }
            case 54: //tecla 6
                activeCamera = mobileCamera;
                break;
            case 55:{ //tecla 7
                changeWireframe = true;
                
                break;
            }
        }
    }else{
        //no animation is happening
        //all keys can be pressed
        switch(e.keyCode){
            case 49:{ //tecla 1
                activeCamera = frontCamera;
                break;
            }
            case 50:{ //tecla 2
                activeCamera = sideCamera;
                break;
            }
            case 51:{ //tecla 3
                activeCamera = topCamera;
                break;
            }
            case 52:{ //tecla 4
                activeCamera = orthoCamera;
                break;
            }
            case 53:{ //tecla 5
                activeCamera = perspectiveCamera;
                break;
            }
            case 54: //tecla 6
                activeCamera = mobileCamera;
                break;
            case 55:{ //tecla 7
                changeWireframe = true;
                break;
            }
            case 83: // S
            case 115:{ //s
                translationDirection = -1;
                break;
            }
            case 87: // W 
            case 119:{ //w
                translationDirection = 1;
                break;
            }
            case 81: // Q
            case 113:{ // q
                rotationDirection = 1; 
                break;
            }
            case 65: // A
            case 97:{ // a
                rotationDirection = -1; 
                break;
            }
            case 68: // D
            case 100:{ // d
                translationDirectionClaw = 1; 
                break;
            }
            case 69: // E
            case 101:{ // e
                translationDirectionClaw = -1; 
                break;
            }
            case 70: //F
            case 102:{ // f
                clawRotationDirection = -1;
                break;
            }

            case 82: //R
            case 114:{ // r
                clawRotationDirection = 1;
                break;
            }
        }
    }
}


///////////////////////
/* KEY UP CALLBACK */
///////////////////////
function onKeyUp(e) {
    'use strict';

    const keyId = keyMap[e.code];
    if (keyId) {
        document.getElementById(keyId).classList.remove('active');
    }
   
    switch(e.keyCode) {
        case 81: // Q 
        case 113: //q
        case 65: // A
        case 97:{ //a
            rotationDirection = 0;
            break;
        }
        case 87: // W 
        case 119: //w
        case 83: // S
        case 115:{ //s
            translationDirection = 0;
            break;
        }
        case 68: // D
        case 100: // d
        case 69: // E
        case 101:{ //e
            translationDirectionClaw = 0; 
            break;
        }

        case 70: //F
        case 102:  //f
        case 82: //R
        case 114: //r
            clawRotationDirection = 0;
            break;
    }
}


////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize(){
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {        

        // check if the camera is perspective or orthographic
        if (activeCamera == perspectiveCamera || activeCamera == mobileCamera) {
            activeCamera.aspect = window.innerWidth / window.innerHeight;
            activeCamera.updateProjectionMatrix();
        } else {
            // for orthographic camera, update left, right, top, bottom
            const aspect = window.innerWidth / window.innerHeight;
            const height = activeCamera.top - activeCamera.bottom;
            activeCamera.left = -0.5 * aspect * height;
            activeCamera.right = 0.5 * aspect * height;
            activeCamera.updateProjectionMatrix();
        }
    }

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate(){
    'use strict';

    update();
    render();

    requestAnimationFrame(animate);
}

/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    createBase();
    createTop();
    createTetrahedron();
    createContentor();
    createCar();
    createCable();
    createClaws();
    createAllCargo();
}

////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init(){
    'use strict';
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setClearColor(0xe5d1e0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    createOrthographicCameras();
    createFixedCameras();
    createMobileCamera();

    activeCamera = perspectiveCamera;

    render(); 

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", onResize);

} 

init();

animate()