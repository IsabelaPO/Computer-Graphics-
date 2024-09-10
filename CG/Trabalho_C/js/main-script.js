import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import * as Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';


//////////////////////
/* GLOBAL VARIABLES */
//////////////////////
var scene, renderer;
var perspectiveCamera;

var g_cylinder, g_mediumRing, g_biggerRing, g_smallerRing;
var cylinder_material, ring_material, fig_material;
var parm_materials;

var mediumSpeed = 1.5, biggerSpeed = 2, smallerSpeed = 2;
var mediumMove = true, biggerMove = true, smallerMove = true;
var mediumDirection = 1, biggerDirection = 1, smallerDirection = 1;


var directionalLight, ambientLight;
var directionalLightOff = false;
var spotLights = [];
var spotLightOn = true;

var pointLights = [];
var pointLightOn = true;

var materials = {};
var currentMaterial = '';
var changeMaterial = false;

var paramFigures = []; 

var clock = new THREE.Clock();

var curve;

let skydome;

var materials = {
    cylinder: {
        lambert: new THREE.MeshLambertMaterial({ color: 0xF96C4D, emissive: 0xF96C4D, side: THREE.DoubleSide }),
        phong: new THREE.MeshPhongMaterial({ color: 0xF96C4D, side: THREE.DoubleSide }),
        toon: new THREE.MeshToonMaterial({ color: 0xF96C4D, side: THREE.DoubleSide }),
        normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
        basic: new THREE.MeshBasicMaterial({color: 0x9cb5d0, wireframe: false, side: THREE.DoubleSide})
    },
    ring: {
        lambert: new THREE.MeshLambertMaterial({ color: 0x43D143 , emissive: 0x43D143 , side: THREE.DoubleSide }),
        phong: new THREE.MeshPhongMaterial({ color: 0x43D143 , side: THREE.DoubleSide }),
        toon: new THREE.MeshToonMaterial({ color: 0x43D143 , side: THREE.DoubleSide }),
        normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }),
        basic: new THREE.MeshBasicMaterial({ color: 0x628b8d, side: THREE.DoubleSide })
    },
    paramFigures: {
        lambert: new THREE.MeshLambertMaterial({ color: 0xFF2B2B, emissive: 0xFF2B2B, side: THREE.DoubleSide }),
        phong: new THREE.MeshPhongMaterial({ color: 0xFF2B2B, side: THREE.DoubleSide }),
        toon: new THREE.MeshToonMaterial({ color: 0xFF2B2B, side: THREE.DoubleSide }),
        normal: new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    },
    skydome: {
        lambert: new THREE.MeshLambertMaterial({ color: 0x4D4BF1, emissive: 0x4D4BF1, side: THREE.BackSide }),
        phong: new THREE.MeshPhongMaterial({ color: 0x4D4BF1, side: THREE.BackSide }),
        toon: new THREE.MeshToonMaterial({ color: 0x4D4BF1, side: THREE.BackSide }),
        normal: new THREE.MeshNormalMaterial({ side: THREE.BackSide }),
        basic: new THREE.MeshBasicMaterial({ map: null, side: THREE.BackSide }) 
    }
};


/////////////////////
/* CREATE SCENE(S) */
/////////////////////
function createScene(){
    'use strict';

    scene = new THREE.Scene();

    scene.add(new THREE.AxesHelper(10));

    cylinder_material = new THREE.MeshBasicMaterial({color: 0x9cb5d0, wireframe: false});
    ring_material = new THREE.MeshBasicMaterial({ color: 0x628b8d, side: THREE.DoubleSide });
    fig_material = new THREE.MeshBasicMaterial({color: 0x3d85c6, wireframe: false, side: THREE.DoubleSide});
    parm_materials = [ new THREE.MeshBasicMaterial({color: 0xfed85d, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0x2abcd9, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0xeb8b42, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0x93c47d, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0xf97b7b, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0xf93f9b, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0x218dd9, wireframe: false, side: THREE.DoubleSide}),
        new THREE.MeshBasicMaterial({color: 0x674ea7, wireframe: false, side: THREE.DoubleSide})
        
    ];

    var pos1 = new THREE.Vector3(0,0,0);
    var pos2 = new THREE.Vector3(0,1,0);

    curve = new THREE.LineCurve3(pos1, pos2);

    createCylinder();
    createConcentricRings();
    createSkydome();
    createLights();
}


//////////////////////
/* CREATE CAMERA(S) */
//////////////////////
function createFixedCamera(){
    'use strict';

    // perspective camera
    perspectiveCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    perspectiveCamera.position.set(20, 20, 20);
    perspectiveCamera.lookAt(scene.position);

    scene.add(perspectiveCamera);


}

/////////////////////
/* CREATE LIGHT(S) */
/////////////////////


function addPointLights(mobius) {
    const lightPositions = [
        [1, 0, 0],
        [0.707, 0.707, 0],
        [ 0, 1, 0],
        [ -0.707, 0.707, 0],
        [ -1, 0, 0],
        [-0.707, -0.707, 0],
        [0, -1, 0],
        [0.707, -0.707, 0]
    ];

    lightPositions.forEach(position => {
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(position[0], position[1], position[2]);
        mobius.add(light);
        pointLights.push(light);
    });
}


function createLights() {
    // directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(15, 15, 15);
    directionalLight.target.position.set(0,8,0);
    
    directionalLight.castShadow = true;
    
    scene.add(directionalLight);
    scene.add(directionalLight.target); 
    
    // ambient light
    ambientLight = new THREE.AmbientLight(0xffa500, 5); // orange tone with low intensity
    scene.add(ambientLight);
}

function changeDirectionalLight(){
    if(directionalLight.visible){ //turn the light off
        directionalLight.visible = false;
    } else { //turn the light on
        directionalLight.visible = true;
    } 
    directionalLightOff = false;
}


function createSpotLights(x,y) {
    var spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(x, y, 0); 
    spotLight.angle = Math.PI ;
    scene.add(spotLight);
    spotLights.push(spotLight);
    return spotLight;
}

////////////////////////
/* CREATE OBJECT3D(S) */
////////////////////////

function createCylinder(){
    g_cylinder = new THREE.Object3D();

    var cylinder = new THREE.CylinderGeometry(2.5, 2.5, 16);
    var cylinderMesh = new THREE.Mesh(cylinder, cylinder_material);
    cylinderMesh.position.set(0, 8, 0);
    g_cylinder.add(cylinderMesh);

    var mobius_geometry = createMobiusStripGeometry();
    var mobiusStrip = new THREE.Mesh(mobius_geometry, fig_material);
    mobiusStrip.position.set(0, 18, 0);
    g_cylinder.add(mobiusStrip);

    addPointLights(mobiusStrip);

    scene.add(g_cylinder);

    g_cylinder.position.x = 0;
    g_cylinder.position.y = 0;
    g_cylinder.position.z = 0;
}

function createMobiusStripGeometry() {
    const numSegments = 12; 

    const positions = [];
    const indices = [];

    positions.push( 0.5 , 0 , 0 );
    positions.push( 1.5 , 0 , 0 );
    positions.push( 0.45 , 0.26 , -0.13 );
    positions.push( 1.28 , 0.74 , 0.13 );
    positions.push( 0.28 , 0.49 , -0.25 );
    positions.push( 0.72 , 1.24 , 0.25 );
    positions.push( 0 , 0.65 , -0.35 );
    positions.push( 0 , 1.35 , 0.35 );
    positions.push( -0.37 , 0.65 , -0.43 );
    positions.push( -0.62 , 1.08 , 0.43 );
    positions.push( -0.75 , 0.44 , -0.48 );
    positions.push( -0.98 , 0.56 , 0.48 );
    positions.push( -1 , 0 , -0.5 );
    positions.push( -1.0 , 0 , 0.5 );
    positions.push( -0.98 , -0.57 , -0.49 );
    positions.push( -0.75 , -0.44 , 0.49 );
    positions.push( -0.63 , -1.08 , -0.435 );
    positions.push( -0.38 , -0.65 , 0.435 );
    positions.push( 0, -1.35 , -0.35 );
    positions.push( 0 , -0.65 , 0.35 );
    positions.push( 0.72 , -1.24 , -0.25 );
    positions.push( 0.28 , -0.49 , 0.25 );
    positions.push( 1.28 , -0.74 , -0.13 );
    positions.push( 0.45 , -0.26 , 0.13 );

    for (let i = 0; i < numSegments; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i * 2 + 2) % (numSegments * 2);
        const d = (i * 2 + 3) % (numSegments * 2);
        indices.push(a, b, d);
        indices.push(d, c, a);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);

    return geometry;
}

function createMediumRing(g_mediumRing){
    var mediumRingGeometry1 = new THREE.RingGeometry(3.5, 4.5, 32);
    var mediumRingGeometry2 = new THREE.RingGeometry(3.5, 4.5, 32);

    var ring1 = new THREE.Mesh(mediumRingGeometry1,ring_material);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 12, 0);
    g_mediumRing.add(ring1);

    var ring2 = new THREE.Mesh(mediumRingGeometry2,ring_material);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 11, 0);
    g_mediumRing.add(ring2);

    var tubeGeometry = new THREE.TubeGeometry(curve, 64, 4.5, 20, false);
    var tube = new THREE.Mesh(tubeGeometry,ring_material);
    tube.position.set(0, 11, 0);
    g_mediumRing.add(tube);

    var shapes = createParametric(4,12);
    g_mediumRing.add(shapes);

    scene.add(g_mediumRing);
    g_mediumRing.position.set(0,0,0);
}

function createBiggerRing(g_biggerRing){
    var biggerRingGeometry1 = new THREE.RingGeometry(4.5, 5.5, 32);
    var biggerRingGeometry2 = new THREE.RingGeometry(4.5, 5.5, 32);

    var ring1 = new THREE.Mesh(biggerRingGeometry1, ring_material);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0,3,0);
    g_biggerRing.add(ring1);

    var ring2 = new THREE.Mesh(biggerRingGeometry2, ring_material);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 2, 0);
    g_biggerRing.add(ring2);

    var tubeGeometry = new THREE.TubeGeometry(curve, 64, 5.5, 20, false);
    var tube = new THREE.Mesh(tubeGeometry, ring_material);
    tube.position.set(0, 2, 0);
    g_biggerRing.add(tube);
    
    var shapes = createParametric(5,3);
    g_biggerRing.add(shapes);

    scene.add(g_biggerRing);
    g_biggerRing.position.set(0,0,0);
}

function createSmallerRing(g_smallerRing){
    var smallerRingGeometry1 = new THREE.RingGeometry(2.5, 3.5, 32);
    var smallerRingGeometry2 = new THREE.RingGeometry(2.5, 3.5, 32);

    var ring1 = new THREE.Mesh(smallerRingGeometry1, ring_material);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0,8,0);
    g_smallerRing.add(ring1);

    var ring2 = new THREE.Mesh(smallerRingGeometry2, ring_material);
    ring2.rotation.x = Math.PI / 2;
    ring2.position.set(0, 7, 0);
    g_smallerRing.add(ring2);

    var tubeGeometry = new THREE.TubeGeometry(curve, 64, 3.5, 20, false);
    var tube = new THREE.Mesh(tubeGeometry, ring_material);
    tube.position.set(0, 7, 0);
    g_smallerRing.add(tube);

    var shapes = createParametric(3,8);
    g_smallerRing.add(shapes);

    scene.add(g_smallerRing);
    g_smallerRing.position.set(0,0,0);
}

function createConcentricRings() {
    g_mediumRing = new THREE.Object3D();
    g_biggerRing = new THREE.Object3D();
    g_smallerRing = new THREE.Object3D();

    createMediumRing(g_mediumRing);
    createBiggerRing(g_biggerRing);
    createSmallerRing(g_smallerRing);
}

//Toroide
function parametricFunction1(u, v, target) {
    var radiusTorus = 0.5;
    var tubeRadius = 0.4; 

    var theta = u * Math.PI * 2;
    var phi = v * Math.PI * 2;

    var x = (radiusTorus + tubeRadius * Math.cos(phi)) * Math.cos(theta);
    var y = (radiusTorus + tubeRadius * Math.cos(phi)) * Math.sin(theta);
    var z = tubeRadius * Math.sin(phi);

    target.set(x, y, z);
}


//Hiperbolóide de 1 folha
function parametricFunction2(u, v, target) {
    var a = 0.5; 
    var b = 0.5; 
    var c = 0.6;

    var theta = u * Math.PI * 2;
    var phi = (v - 0.5) * 2;

    var x = a * Math.cosh(phi) * Math.cos(theta);
    var y = b * Math.cosh(phi) * Math.sin(theta);
    var z = c * Math.sinh(phi);

    z-=0.25;
    target.set(x, y, z);
}


// Helicoide
function parametricFunction3(u, v, target) {
    var a = 0.6; 
    var b = 1; 

    var theta = u * Math.PI * 2;
    var z = v * b - b / 2;

    var x = a * Math.cos(theta);
    var y = a * Math.sin(theta);

    target.set(x, y, z);
}


//Esfera
function parametricFunction4(u, v, target) {
    var radius = 0.8;

    var theta = u * Math.PI;
    var phi = v * Math.PI * 2;

    var x = radius * Math.sin(theta) * Math.cos(phi);
    var y = radius * Math.sin(theta) * Math.sin(phi);
    var z = radius * Math.cos(theta);

    target.set(x, y, z);
}


//Parabolóide hiperbólico
function parametricFunction5(u, v, target) {
    
    var radius = 0.5; // Raio da base


    var theta = u * Math.PI * 2;
    var phi = v * Math.PI;

    var x = radius * Math.cosh(phi) * Math.cos(theta);
    var y = radius * Math.cosh(phi) * Math.sin(theta);
    var z = radius * Math.sinh(phi);

    // Reduzindo a escala
    x /= 5;
    y /= 5;
    z /= 5;
    z -= 0.6;
    // Definindo as coordenadas do ponto alvo
    target.set(x, y, z);
}

//Cone
function parametricFunction6(u, v, target) {
    var height = 1.25; 
    var radius = 0.9;

    var theta = v * Math.PI * 2;
    var r = (1 - u) * radius;

    var x = r * Math.cos(theta);
    var y = r * Math.sin(theta);
    var z = u * height;

    z-=0.7;

    target.set(x, y, z);
}


//Toroide torcido
function parametricFunction7(u, v, target) {
    var radiusTorus = 0.65; 
    var tubeRadius = 0.45; 

    var theta = u * Math.PI * 2;
    var phi = v * Math.PI * 2;

    var x = (radiusTorus + tubeRadius * Math.cos(phi + Math.sin(3 * theta))) * Math.cos(theta);
    var y = (radiusTorus + tubeRadius * Math.cos(phi + Math.sin(3 * theta))) * Math.sin(theta);
    var z = tubeRadius * Math.sin(phi + Math.sin(3 * theta));

    target.set(x, y, z);
}

//Superfície de Boy
function parametricFunction8(u, v, target) {
    var scale = 0.5; 

    u = (u - 0.5) * 2 * Math.PI;
    v = (v - 0.5) * 2 * Math.PI;

    var x = (Math.cos(u) * Math.cos(2 * v) + Math.sqrt(2) * Math.sin(u) * Math.cos(v)) * scale;
    var y = (Math.cos(u) * Math.sin(2 * v) - Math.sqrt(2) * Math.sin(u) * Math.sin(v)) * scale;
    var z = Math.sin(u) * scale;

    target.set(x, y, z);
}

function getRandomAxis() {
    const x = Math.random() * 2 - 1;
    const y = Math.random() * 2 - 1;
    const z = Math.random() * 2 - 1;
    const axis = new THREE.Vector3(x, y, z);
    axis.normalize();
    return axis;
}

function createParametric(radius, y_position) {

    var g_paramFigures = new THREE.Object3D(); 
    var geometries = [
        new ParametricGeometry(parametricFunction1, 10, 10),
        new ParametricGeometry(parametricFunction2, 10, 10),
        new ParametricGeometry(parametricFunction3, 10, 10),
        new ParametricGeometry(parametricFunction4, 10, 10),
        new ParametricGeometry(parametricFunction5, 10, 10),
        new ParametricGeometry(parametricFunction6, 10, 10),
        new ParametricGeometry(parametricFunction7, 10, 10),
        new ParametricGeometry(parametricFunction8, 10, 10)
    ];

    var rotationSpeeds = [
        0.015, 0.012, 0.015, 0.014, 0.015, 0.012, 0.012, 0.013
    ];

    for (let i = 0; i < geometries.length; i++) {
        var figure = new THREE.Mesh(geometries[i], parm_materials[i]);
        figure.userData.rotationSpeed = rotationSpeeds[i];
        figure.userData.rotationAxis = getRandomAxis();
        figure.userData.centroid = figure.position.clone();

        var angle = (Math.PI / 4) * i;
        var x = Math.cos(angle) * radius;
        var y = Math.sin(angle) * radius;

        var scaleFactor = radius / 5; // 5 é o raio inicial do anel médio
        figure.scale.set(scaleFactor, scaleFactor, scaleFactor);
        figure.position.set(x, y, -1/5);
        
        g_paramFigures.add(createSpotLights(x, y));
        g_paramFigures.add(figure);
        paramFigures.push(figure); // Adiciona a figura ao array global
    }

    // Lay the group down by rotating it around the x-axis
    g_paramFigures.rotation.x = Math.PI / 2;
    g_paramFigures.position.set(0, y_position + 0.5, 0);

    return g_paramFigures;
}

function createSkydome() {
    const skydomeGeometry = new THREE.SphereGeometry(20, 32, 16, Math.PI / 2, Math.PI * 2, 0 , 1.1 * Math.PI / 2); 
    const loader = new THREE.TextureLoader();
    loader.load('js/video_frame.png', function (texture) {        
        materials.skydome.basic.map = texture;
        skydome = new THREE.Mesh(skydomeGeometry, materials.skydome.basic);
        skydome.position.set(0, 0, 0);
        scene.add(skydome);
    });
}


//////////////////
/* MOVEMENTS */
/////////////////

function rotateCylinder(){
    g_cylinder.rotation.y += 0.01;
}

function rotateMediumRing(){
    g_mediumRing.rotation.y += 0.01;
}

function rotateBiggerRing(){
    g_biggerRing.rotation.y += 0.01;
}

function rotatesSmallerRing(){
    g_smallerRing.rotation.y -= 0.01;
}

function moveRings() {
    var deltaTime = clock.getDelta();

    if (smallerMove) {
        var position = new THREE.Vector3();
        g_smallerRing.children[0].getWorldPosition(position);
        
        if (position.y >= 16) {
            smallerDirection = -1;
        } else if (position.y <= 0) {
            smallerDirection = 1;
        }
        g_smallerRing.position.y += smallerDirection * smallerSpeed * deltaTime;
    }

    if (mediumMove) {
        var position = new THREE.Vector3();
        g_mediumRing.children[0].getWorldPosition(position);

        if (position.y >= 16) {
            mediumDirection = -1;
        } else if (position.y <= 0) {
            mediumDirection = 1;
        }
        g_mediumRing.position.y += mediumDirection * mediumSpeed * deltaTime;
    }

    if (biggerMove) {
        var position = new THREE.Vector3();
        g_biggerRing.children[0].getWorldPosition(position);

        if (position.y >= 16) {
            biggerDirection = -1;
        } else if (position.y <= 0) {
            biggerDirection = 1;
        }
        g_biggerRing.position.y += biggerDirection * biggerSpeed * deltaTime;
    }

    requestAnimationFrame(moveRings);
}


function animateParametricFigures() {
    paramFigures.forEach(figure => {
        var axis = figure.userData.rotationAxis;
        var speed = figure.userData.rotationSpeed;
        var centroid = figure.userData.centroid;
        
        figure.position.sub(centroid);
        figure.rotateOnAxis(axis, speed);
        figure.position.add(centroid);
    });
}

////////////
/* UPDATE */
////////////
function update(){
    'use strict';

    if(directionalLightOff){
        changeDirectionalLight();
    }

    if(changeMaterial){
        setMaterial(currentMaterial);
        changeMaterial = false;
    }

    rotateCylinder();
    moveRings();
    rotateMediumRing();
    rotateBiggerRing();
    rotatesSmallerRing();
    animateParametricFigures();
}


function setMaterial(type) {
    currentMaterial = type;

    if(currentMaterial == 'basic'){
        paramFigures.forEach((mesh, index) => {
            mesh.material = parm_materials[index % parm_materials.length];
        });
    } else {
        paramFigures.forEach(function(mesh) {
            mesh.material = materials.paramFigures[type];
        });
    }

    g_cylinder.children.forEach(function(mesh) {
        mesh.material = materials.cylinder[type];
    });

    g_smallerRing.children.forEach(function(mesh) {
        mesh.material = materials.ring[type];
    });

    g_biggerRing.children.forEach(function(mesh) {
        mesh.material = materials.ring[type];
    });

    g_mediumRing.children.forEach(function(mesh) {
        mesh.material = materials.ring[type];
    });
    if (skydome) {
        if (type === 'basic') {
            skydome.material = materials.skydome.basic;
            skydome.material.map.needsUpdate = true; 
        } else {
            skydome.material = materials.skydome[type];
        }
    }
}
/////////////
/* DISPLAY */
/////////////
function render() {
    'use strict';

    renderer.render(scene,perspectiveCamera);
}


////////////////////////////////
/* INITIALIZE ANIMATION CYCLE */
////////////////////////////////
function init() {
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setClearColor(0xe1ecd7);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.xr.enabled = true;  // Enable VR
    document.body.appendChild(VRButton.createButton(renderer));  // Add the VR button
    document.body.appendChild(renderer.domElement);
    
    createScene();
    createFixedCamera();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

}

/////////////////////
/* ANIMATION CYCLE */
/////////////////////
function animate() {
    'use strict';

    update();
    render();

    requestAnimationFrame(animate);
}

////////////////////////////
/* RESIZE WINDOW CALLBACK */
////////////////////////////
function onResize(){
    'use strict';

    renderer.setSize(window.innerWidth, window.innerHeight);
    if (window.innerHeight > 0 && window.innerWidth > 0) {         
        perspectiveCamera.aspect = window.innerWidth / window.innerHeight;
        perspectiveCamera.updateProjectionMatrix();
    }

}

///////////////////////
/* KEY DOWN CALLBACK */
///////////////////////
function onKeyDown(e) {
    'use strict';

    switch(e.keyCode){
        case 81: //key Q
        case 113: //key q
            changeMaterial = true;
            currentMaterial = 'lambert';
            break;
        case 87: //key W
        case 119: //key w
            changeMaterial = true;
            currentMaterial = 'phong';
            break;
        case 69: //key E
        case 101: //key e
            changeMaterial = true;
            currentMaterial = 'toon';
            break;
        case 82: //key R
        case 114: //key r
            changeMaterial = true;
            currentMaterial = 'normal';
            break;
        case 49:{ //key 1
            smallerMove = !smallerMove;
            break;
        }
        case 50:{ //key 2
            mediumMove = !mediumMove;
            break;
        }
        case 51:{ //key 3
            biggerMove = !biggerMove;
            break;
        }
        case 68: //key D
        case 100: //key d
            directionalLightOff = true;
            break;
        case 84: //key T
        case 116: //key t
            changeMaterial = true;
            currentMaterial = 'basic';
            break;
        case 80: //key P
        case 112: //key p
            pointLightOn = !pointLightOn;
            pointLights.forEach(light => light.visible = pointLightOn);
            break;
        case 83: //key S
        case 115: //key s
            spotLightOn = !spotLightOn;
            spotLights.forEach(light => light.visible = spotLightOn);
            break;
    }

}


init();
animate();