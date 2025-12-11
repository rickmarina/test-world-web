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
        45,
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

    // Load real Earth textures from NASA's public repository
    // Using high-quality day texture from Natural Earth
    const earthTexture = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
    );

    // Optional: Load bump map for more realistic surface detail
    const bumpMap = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
    );

    // Optional: Load specular map to make oceans shiny
    const specularMap = textureLoader.load(
        'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'
    );

    // Create material with real Earth textures
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        bumpMap: bumpMap,
        bumpScale: 0.15,
        specularMap: specularMap,
        specular: new THREE.Color('grey'),
        shininess: 5
    });

    const earth = new THREE.Mesh(geometry, material);
    scene.add(earth);

    // Store country labels for visibility management
    const countryLabels = [];
    
    // Store country data for click detection
    const countryData = [];

    // Add country borders
    async function loadCountryBorders() {
        try {
            // Load GeoJSON data with country borders
            const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
            const geojsonData = await response.json();
            
            // Create lines for each country border
            geojsonData.features.forEach(feature => {
                const coordinates = feature.geometry.coordinates;
                const countryName = feature.properties.ADMIN || feature.properties.name;
                
                // Store country boundaries for click detection
                const countryBounds = {
                    name: countryName,
                    coordinates: coordinates,
                    type: feature.geometry.type
                };
                countryData.push(countryBounds);
                
                // Handle different geometry types
                if (feature.geometry.type === 'Polygon') {
                    drawPolygon(coordinates);
                } else if (feature.geometry.type === 'MultiPolygon') {
                    coordinates.forEach(polygon => {
                        drawPolygon(polygon);
                    });
                }
                
                // Add country label at centroid
                if (countryName) {
                    addCountryLabel(countryName, coordinates, feature.geometry.type);
                }
            });
        } catch (error) {
            console.error('Error loading country borders:', error);
        }
    }
    
    function addCountryLabel(name, coordinates, geometryType) {
        // Calculate approximate centroid
        let lat = 0, lon = 0, count = 0;
        
        const coords = geometryType === 'Polygon' ? coordinates[0] : coordinates[0][0];
        
        coords.forEach(coord => {
            lon += coord[0];
            lat += coord[1];
            count++;
        });
        
        if (count > 0) {
            lon /= count;
            lat /= count;
            
            // Convert lat/lon to 3D coordinates
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            
            const x = -1.02 * Math.sin(phi) * Math.cos(theta);
            const y = 1.02 * Math.cos(phi);
            const z = 1.02 * Math.sin(phi) * Math.sin(theta);
            
            // Create text sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 512;
            canvas.height = 128;
            
            context.fillStyle = 'rgba(255, 255, 255, 0.9)';
            context.font = 'Bold 40px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(name, 256, 64);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0.8
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(x, y, z);
            sprite.scale.set(0.15, 0.035, 1);
            sprite.visible = false; // Start hidden
            
            earth.add(sprite);
            
            // Store label with its position for visibility checks
            countryLabels.push({
                sprite: sprite,
                position: new THREE.Vector3(x, y, z)
            });
        }
    }
    
    // Update label visibility based on camera position and zoom
    function updateLabelVisibility() {
        const zoomThreshold = 2.5; // Show labels when zoomed in closer than this
        const isZoomed = camera.position.z < zoomThreshold;
        
        countryLabels.forEach(label => {
            if (!isZoomed) {
                label.sprite.visible = false;
                return;
            }
            
            // Get label position in world coordinates
            const worldPosition = label.position.clone();
            earth.localToWorld(worldPosition);
            
            // Calculate direction from camera to label
            const directionToLabel = worldPosition.clone().sub(camera.position).normalize();
            const cameraDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            
            // Check if label is facing the camera (dot product)
            const dotProduct = directionToLabel.dot(cameraDirection);
            
            // Show label if it's facing the camera (visible hemisphere)
            // Also check if it's in front of the earth center
            const labelDistance = worldPosition.distanceTo(camera.position);
            const earthCenterDistance = earth.position.distanceTo(camera.position);
            
            label.sprite.visible = dotProduct > 0.3 && labelDistance < earthCenterDistance + 1.5;
        });
    }

    function drawPolygon(coordinates) {
        coordinates.forEach(ring => {
            const points = [];
            
            ring.forEach(coord => {
                const [lon, lat] = coord;
                
                // Convert lat/lon to 3D sphere coordinates
                const phi = (90 - lat) * (Math.PI / 180);
                const theta = (lon + 180) * (Math.PI / 180);
                
                const x = -1.01 * Math.sin(phi) * Math.cos(theta);
                const y = 1.01 * Math.cos(phi);
                const z = 1.01 * Math.sin(phi) * Math.sin(theta);
                
                points.push(new THREE.Vector3(x, y, z));
            });
            
            if (points.length > 1) {
                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    opacity: 0.3,
                    transparent: true,
                    linewidth: 1
                });
                
                const line = new THREE.Line(lineGeometry, lineMaterial);
                earth.add(line); // Add to earth so it rotates with it
            }
        });
    }

    // Load borders
    loadCountryBorders();

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
    let mouseDownPos = { x: 0, y: 0 };

    // Raycaster for click detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Visualize raycaster
    const rayOrigin = new THREE.Vector3();
    const rayDirection = new THREE.Vector3();
    const rayLength = 10;
    
    // Create arrow helper for raycaster visualization
    const arrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 0),
        rayLength,
        0xff0000,
        0.2,
        0.1
    );
    arrowHelper.visible = false;
    scene.add(arrowHelper);
    
    // Create a small sphere to show intersection point
    const intersectionSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    intersectionSphere.visible = false;
    scene.add(intersectionSphere);

    // Function to check if a point is inside a country
    function getCountryAtClick(intersectionPoint) {
        // Convert 3D point to lat/lon
        const x = intersectionPoint.x;
        const y = intersectionPoint.y;
        const z = intersectionPoint.z;
        
        const lat = Math.asin(y) * 180 / Math.PI;
        const lon = Math.atan2(z, -x) * 180 / Math.PI;
        
        // Check each country to see if the point is inside
        for (let country of countryData) {
            if (isPointInCountry(lon, lat, country)) {
                return country.name;
            }
        }
        return null;
    }
    
    // Point-in-polygon algorithm
    function isPointInCountry(lon, lat, country) {
        const coords = country.type === 'Polygon' ? [country.coordinates] : country.coordinates;
        
        for (let polygon of coords) {
            for (let ring of polygon) {
                if (isPointInPolygon(lon, lat, ring)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function isPointInPolygon(lon, lat, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];
            
            const intersect = ((yi > lat) !== (yj > lat))
                && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // Mouse event handlers
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
        mouseDownPos = { x: e.clientX, y: e.clientY };
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
        } else {
            // Update raycaster visualization when not dragging
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            
            // Update arrow helper
            arrowHelper.position.copy(raycaster.ray.origin);
            arrowHelper.setDirection(raycaster.ray.direction);
            arrowHelper.visible = true;
            
            // Check for intersection
            const intersects = raycaster.intersectObject(earth);
            if (intersects.length > 0) {
                intersectionSphere.position.copy(intersects[0].point);
                intersectionSphere.visible = true;
            } else {
                intersectionSphere.visible = false;
            }
        }
    });

    renderer.domElement.addEventListener('mouseup', (e) => {
        isDragging = false;
        
        // Check if it was a click (not a drag)
        const dragDistance = Math.sqrt(
            Math.pow(e.clientX - mouseDownPos.x, 2) + 
            Math.pow(e.clientY - mouseDownPos.y, 2)
        );
        
        if (dragDistance < 5) { // Threshold for click vs drag
            // Convert mouse position to normalized device coordinates
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            // Update the raycaster
            raycaster.setFromCamera(mouse, camera);
            
            // Check for intersection with earth
            const intersects = raycaster.intersectObject(earth);
            
            if (intersects.length > 0) {
                const intersectionPoint = intersects[0].point;
                const countryName = getCountryAtClick(intersectionPoint);
                
                if (countryName) {
                    console.log('Clicked on:', countryName);
                    alert('País: ' + countryName);
                } else {
                    console.log('Clicked on ocean or unknown area');
                }
            }
        }
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
        arrowHelper.visible = false;
        intersectionSphere.visible = false;
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
        // if (!isDragging) {
        //     rotation.y += 0.001;
        // }
        
        // Update label visibility
        updateLabelVisibility();
        
        renderer.render(scene, camera);
    }

    animate();
}
