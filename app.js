// Wait for Three.js to load
if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded');
} else {
    initApp();
}

function initApp() {
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

    // Create Earth sphere
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Create texture loader
    const textureLoader = new THREE.TextureLoader();

    // Create a basic earth-like material without external textures
    // Using a gradient texture created programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Create ocean blue base
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a5f7a');
    gradient.addColorStop(0.5, '#2d8ca8');
    gradient.addColorStop(1, '#1a5f7a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some land-like patterns
    ctx.fillStyle = '#3d7a47';
    // North America
    ctx.beginPath();
    ctx.arc(300, 400, 200, 0, Math.PI * 2);
    ctx.fill();
    
    // South America
    ctx.beginPath();
    ctx.arc(450, 700, 150, 0, Math.PI * 2);
    ctx.fill();
    
    // Europe/Africa
    ctx.beginPath();
    ctx.arc(1100, 450, 250, 0, Math.PI * 2);
    ctx.fill();
    
    // Asia
    ctx.beginPath();
    ctx.arc(1500, 350, 300, 0, Math.PI * 2);
    ctx.fill();
    
    // Australia
    ctx.beginPath();
    ctx.arc(1650, 750, 100, 0, Math.PI * 2);
    ctx.fill();

    // Add some clouds/white areas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 30; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 50 + 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    const earthTexture = new THREE.CanvasTexture(canvas);

    // Create material with texture
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
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

    // Mouse interaction variables
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 };

    // Mouse event handlers
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };

            rotation.y += deltaMove.x * 0.005;
            rotation.x += deltaMove.y * 0.005;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    // Touch support for mobile
    renderer.domElement.addEventListener('touchstart', (e) => {
        isDragging = true;
        previousMousePosition = { 
            x: e.touches[0].clientX, 
            y: e.touches[0].clientY 
        };
    });

    renderer.domElement.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const deltaMove = {
                x: e.touches[0].clientX - previousMousePosition.x,
                y: e.touches[0].clientY - previousMousePosition.y
            };

            rotation.y += deltaMove.x * 0.005;
            rotation.x += deltaMove.y * 0.005;

            previousMousePosition = { 
                x: e.touches[0].clientX, 
                y: e.touches[0].clientY 
            };
        }
        e.preventDefault();
    }, { passive: false });

    renderer.domElement.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Zoom with mouse wheel
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z += e.deltaY * 0.001;
        camera.position.z = Math.max(1.5, Math.min(5, camera.position.z));
    }, { passive: false });

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Apply rotation from mouse interaction
        earth.rotation.y = rotation.y;
        earth.rotation.x = rotation.x;
        
        // Auto-rotate slowly if not dragging
        if (!isDragging) {
            rotation.y += 0.001;
        }
        
        renderer.render(scene, camera);
    }

    animate();
}
