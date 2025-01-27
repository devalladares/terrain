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
        autoRotationSpeed: 0.002,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 3,
        
        // Line settings
        minLineLength: 2,
        maxLineLength: 40,
        lineWeight: 1,
        lineAlpha: 180,  // 0-255
        
        // Color settings
        baseColor: [64, 224, 208],    // Turquoise
        accentColor: [218, 165, 32],  // Golden
        
        // Animation settings for lines
        swayAmount: 0.2,
        swaySpeed: 2
    };

    let img;
    let zValues = [];
    let camTheta = 0;
    let camPhi = Math.PI / 4;
    let camRadius = 800;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;

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
    };

    p.draw = function() {
        p.clear();
        
        // Draw static background
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();

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

    function calculateHeight(x, y) {
        const noiseVal = p.noise(
            x * CONFIG.noiseScale,
            y * CONFIG.noiseScale,
            CONFIG.time
        );
        return p.map(noiseVal, 0, 1, -CONFIG.heightScale, CONFIG.heightScale);
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

    function drawArtisticTerrain() {
        terrainGraphics.push();
        
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        terrainGraphics.translate(
            -totalWidth / 2,
            0,
            -totalDepth / 2
        );

        // Draw vertical lines at each grid point
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const height = zValues[x][y];
                
                // Calculate line length based on height
                const lineLength = p.map(
                    height,
                    -CONFIG.heightScale,
                    CONFIG.heightScale,
                    CONFIG.minLineLength,
                    CONFIG.maxLineLength
                );
                
                // Calculate color blend based on height
                const blendFactor = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1);
                const r = p.lerp(CONFIG.baseColor[0], CONFIG.accentColor[0], blendFactor);
                const g = p.lerp(CONFIG.baseColor[1], CONFIG.accentColor[1], blendFactor);
                const b = p.lerp(CONFIG.baseColor[2], CONFIG.accentColor[2], blendFactor);
                
                // Add slight sway based on time
                const sway = p.sin(CONFIG.time * CONFIG.swaySpeed + x * 0.1 + y * 0.1) * CONFIG.swayAmount;
                
                // Draw the vertical line
                terrainGraphics.push();
                terrainGraphics.translate(xpos + sway, height, zpos);
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
}