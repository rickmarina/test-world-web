import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 3;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('container').appendChild(renderer.domElement);

// Add orbit controls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 1.5;
controls.maxDistance = 5;

// Create Earth sphere
const geometry = new THREE.SphereGeometry(1, 64, 64);

// Create texture loader
const textureLoader = new THREE.TextureLoader();

// Load Earth texture from NASA's public domain images
const earthTexture = textureLoader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
    // Success callback
    () => {
        console.log('Earth texture loaded successfully');
    },
    // Progress callback
    undefined,
    // Error callback
    (error) => {
        console.error('Error loading texture:', error);
    }
);

// Optional: Load bump map for more detail
const bumpTexture = textureLoader.load(
    'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
);

// Create material with texture
const material = new THREE.MeshPhongMaterial({
    map: earthTexture,
    bumpMap: bumpTexture,
    bumpScale: 0.05,
    shininess: 5
});

const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambientLight);

// Add directional light (sun)
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// Add point light for better illumination
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(-5, 3, -5);
scene.add(pointLight);

// Add stars in the background
function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.02,
        transparent: true,
        opacity: 0.8
    });

    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(starVertices, 3)
    );

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

createStars();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate earth slowly
    earth.rotation.y += 0.001;
    
    // Update controls
    controls.update();
    
    renderer.render(scene, camera);
}

animate();
