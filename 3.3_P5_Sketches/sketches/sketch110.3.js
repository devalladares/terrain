export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        // Grid settings
        cols: 60,
        rows: 60,
        pointSpacing: 8,
        
        // Noise and height settings
        noiseScale: 0.1,
        heightScale: 200,
        
        // Animation settings
        time: 0,
        timeIncrement: 0.0075,
        
        // Camera settings
        autoRotationSpeed: 0.0,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 3,
        
        // Line settings
        minLineLength: 2,
        maxLineLength: 40,
        lineWeight: 0.5,
        lineAlpha: 255,
        
        // Color settings
        baseColor: [255, 255, 255],
        accentColor: [255, 255, 255],
        highlightColor: [64, 224, 208], // Turquoise highlight for interactions
        
        // Interaction settings
        mouseInfluenceRadius: 100,
        mouseInfluenceStrength: 30,
        rippleSpeed: 0.05,
        rippleDecay: 0.98,
        maxRipples: 5
    };

    let img;
    let zValues = [];
    let ripples = [];
    let mousePos = { x: 0, y: 0, z: 0 };
    let camTheta = 0;
    let camPhi = Math.PI / 4;
    let camRadius = 800;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;

    class Ripple {
        constructor(x, z, strength = 100) {
            this.x = x;
            this.z = z;
            this.radius = 0;
            this.strength = strength;
            this.life = 1;
        }

        update() {
            this.radius += CONFIG.rippleSpeed * 50;
            this.life *= CONFIG.rippleDecay;
            this.strength *= CONFIG.rippleDecay;
        }

        influence(x, z) {
            const distance = p.dist(x, z, this.x, this.z);
            const rippleWidth = 50;
            if (distance > this.radius - rippleWidth && distance < this.radius + rippleWidth) {
                const influence = p.sin((distance - this.radius) * 0.1) * this.strength * this.life;
                return influence;
            }
            return 0;
        }
    }

    p.preload = function() {
        img = p.loadImage(IMAGE_PATH);
    };

    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
        terrainGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
        terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
        
        p.smooth();
        createHeightMap();

        // Add click handler for ripples
        container.mouseClicked(() => {
            const worldPos = screenToWorld(p.mouseX - p.width/2, p.mouseY - p.height/2);
            if (worldPos) {
                addRipple(worldPos.x, worldPos.z);
            }
        });
    };

    function screenToWorld(screenX, screenY) {
        // Simple screen to world conversion - can be improved for more accuracy
        const containerWidth = p.width;
        const containerHeight = p.height;
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        const x = p.map(screenX, -containerWidth/2, containerWidth/2, -totalWidth/2, totalWidth/2);
        const z = p.map(screenY, -containerHeight/2, containerHeight/2, -totalDepth/2, totalDepth/2);
        
        return { x, z };
    }

    function addRipple(x, z) {
        ripples.push(new Ripple(x, z));
        if (ripples.length > CONFIG.maxRipples) {
            ripples.shift();
        }
    }

    p.draw = function() {
        p.clear();
        
        // Draw static background
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();

        // Update mouse position in world space
        const worldPos = screenToWorld(p.mouseX - p.width/2, p.mouseY - p.height/2);
        if (worldPos) {
            mousePos = worldPos;
        }

        // Update and clean up ripples
        ripples = ripples.filter(ripple => ripple.life > 0.01);
        ripples.forEach(ripple => ripple.update());

        // Update and draw terrain
        terrainGraphics.clear();
        CONFIG.time += CONFIG.timeIncrement;
        updateHeightMap();
        handleCamera();
        
        const camX = camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = camRadius * p.cos(camPhi);
        const camZ = camRadius * p.sin(camTheta) * p.sin(camPhi);
        terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
        
        drawArtisticTerrain();
        
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.image(terrainGraphics, 0, 0);
        p.pop();
    };

    function createHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            zValues[x] = [];
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    

    function updateHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    function handleCamera() {
        if (!p.mouseIsPressed) {
            camTheta += CONFIG.autoRotationSpeed;
        }
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            const deltaX = p.mouseX - lastMouseX;
            const deltaY = p.mouseY - lastMouseY;
            camTheta -= deltaX * 0.01;
            camPhi += deltaY * 0.01;
            camPhi = p.constrain(camPhi, CONFIG.minPhi, CONFIG.maxPhi);
        }
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
    }

    function calculateHeight(x, y) {
        const noiseVal = p.noise(
            x * CONFIG.noiseScale,
            y * CONFIG.noiseScale,
            CONFIG.time
        );
        let height = p.map(noiseVal, 0, 1, -CONFIG.heightScale, CONFIG.heightScale);

        // Add ripple influences
        const worldX = (x - CONFIG.cols/2) * CONFIG.pointSpacing;
        const worldZ = (y - CONFIG.rows/2) * CONFIG.pointSpacing;
        
        // Add mouse influence
        const mouseDistance = p.dist(worldX, worldZ, mousePos.x, mousePos.z);
        if (mouseDistance < CONFIG.mouseInfluenceRadius) {
            const influence = p.map(mouseDistance, 0, CONFIG.mouseInfluenceRadius, CONFIG.mouseInfluenceStrength, 0);
            height += influence;
        }

        // Add ripple influences
        ripples.forEach(ripple => {
            height += ripple.influence(worldX, worldZ);
        });

        return height;
    }

    // [Previous functions remain the same: createHeightMap, updateHeightMap, handleCamera]

    function drawArtisticTerrain() {
        terrainGraphics.push();
        
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        terrainGraphics.translate(
            -totalWidth / 2,
            0,
            -totalDepth / 2
        );

        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const height = zValues[x][y];
                
                const lineLength = p.map(
                    height,
                    -CONFIG.heightScale,
                    CONFIG.heightScale,
                    CONFIG.minLineLength,
                    CONFIG.maxLineLength
                );
                
                // Calculate world position for interaction effects
                const worldX = xpos - totalWidth/2;
                const worldZ = zpos - totalDepth/2;
                
                // Calculate color based on height and interaction
                let r = CONFIG.baseColor[0];
                let g = CONFIG.baseColor[1];
                let b = CONFIG.baseColor[2];
                
                // Add mouse highlight
                const mouseDistance = p.dist(worldX, worldZ, mousePos.x, mousePos.z);
                if (mouseDistance < CONFIG.mouseInfluenceRadius) {
                    const influence = p.map(mouseDistance, 0, CONFIG.mouseInfluenceRadius, 1, 0);
                    r = p.lerp(r, CONFIG.highlightColor[0], influence);
                    g = p.lerp(g, CONFIG.highlightColor[1], influence);
                    b = p.lerp(b, CONFIG.highlightColor[2], influence);
                }
                
                terrainGraphics.push();
                terrainGraphics.translate(xpos, height, zpos);
                terrainGraphics.stroke(r, g, b, CONFIG.lineAlpha);
                terrainGraphics.strokeWeight(CONFIG.lineWeight);
                terrainGraphics.line(0, 0, 0, lineLength);
                terrainGraphics.pop();
            }
        }

        terrainGraphics.pop();
    }

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        p.resizeCanvas(containerWidth, containerHeight);
        terrainGraphics.resizeCanvas(containerWidth, containerHeight);
        terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
    };

    // [Previous windowResized function remains the same]
}