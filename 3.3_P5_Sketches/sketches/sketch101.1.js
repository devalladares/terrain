export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        cols: 50,
        rows: 50,
        pointSpacing: 10,
        noiseScale: 0.1,
        heightScale: 100,
        time: 0,
        timeIncrement: 0.009,
        autoRotationSpeed: 0.0025,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 3,
        xOffset: 0,
        yOffset: -1000,
        scaleFactor: 1,
        lowColor: [255, 255, 255],
        highColor: [224, 247, 250]
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
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Image loaded as background.'),
            () => console.error(`Failed to load image at path: ${IMAGE_PATH}`)
        );
    };

    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
        
        terrainGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
        terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
        
        p.smooth();
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
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

        // Update terrain
        terrainGraphics.clear();
        CONFIG.time += CONFIG.timeIncrement;
        updateHeightMap();
        handleCamera();
        
        // Set camera for terrain
        const camX = camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = camRadius * p.cos(camPhi);
        const camZ = camRadius * p.sin(camTheta) * p.sin(camPhi);
        terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
        
        // Draw terrain
        drawTerrainLines();
        
        // Overlay terrain on background
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.image(terrainGraphics, 0, 0);
        p.pop();
    };

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        p.resizeCanvas(containerWidth, containerHeight);
        terrainGraphics.resizeCanvas(containerWidth, containerHeight);
        terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
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

    function drawTerrainLines() {
        terrainGraphics.push();
        
        // Calculate the total width and height of the terrain
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        // Center the terrain by translating half the total size
        terrainGraphics.translate(
            -totalWidth / 2,  // Center horizontally
            0,               // Keep vertical position
            -totalDepth / 2  // Center depth
        );

        terrainGraphics.scale(CONFIG.scaleFactor);
        
        terrainGraphics.stroke(255);
        terrainGraphics.strokeWeight(1);
        terrainGraphics.noFill();

        for (let y = 0; y < CONFIG.rows; y++) {
            terrainGraphics.beginShape();
            for (let x = 0; x < CONFIG.cols; x++) {
                const xpos = x * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                const zpos = y * CONFIG.pointSpacing;
                terrainGraphics.vertex(xpos, ypos, zpos);
            }
            terrainGraphics.endShape();
        }

        terrainGraphics.pop();
    }
}