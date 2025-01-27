export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        cols: 50,
        rows: 50,
        pointSpacing: 10,
        noiseScale: 0.08,
        heightScale: 150,
        time: 0,
        timeIncrement: 0.0075,
        autoRotationSpeed: 0.002,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,
        // Warm, natural color palette inspired by the brief
        colors: {
            background: [255, 252, 247],
            terrain: {
                low: [255, 255, 255],   // Warm light cream
                high: [255, 255, 255],   // Warm peach
                lines: [255, 255, 255, 255] // Semi-transparent warm brown
            },
            accent: [246, 141, 108]      // Coral accent
        }
    };

    let zValues = [];
    let camTheta = 0;
    let camPhi = Math.PI / 3;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;
    let img;
    
    // Add smoothing for more organic movement
    let targetCamTheta = 0;
    let targetCamPhi = Math.PI / 3;

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
        
        // Draw background image
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();
        
        updateHeightMap();
        handleCamera();
        
        // Smooth camera movement
        camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
        camPhi = p.lerp(camPhi, targetCamPhi, 0.1);
        
        const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = CONFIG.camRadius * p.cos(camPhi);
        const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);
        
        terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
        
        drawTerrain();
        
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
        // Add multiple layers of noise for more organic terrain
        const mainNoise = p.noise(
            x * CONFIG.noiseScale,
            y * CONFIG.noiseScale,
            CONFIG.time
        );
        
        const detailNoise = p.noise(
            x * CONFIG.noiseScale * 2,
            y * CONFIG.noiseScale * 2,
            CONFIG.time * 1.5
        ) * 0.5;
        
        return p.map(mainNoise + detailNoise * 0.3, 0, 1.3, -CONFIG.heightScale, CONFIG.heightScale);
    }

    function updateHeightMap() {
        CONFIG.time += CONFIG.timeIncrement;
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    function handleCamera() {
        if (!p.mouseIsPressed) {
            targetCamTheta += CONFIG.autoRotationSpeed;
        }
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            const deltaX = p.mouseX - lastMouseX;
            const deltaY = p.mouseY - lastMouseY;
            targetCamTheta -= deltaX * 0.01;
            targetCamPhi += deltaY * 0.01;
            targetCamPhi = p.constrain(targetCamPhi, CONFIG.minPhi, CONFIG.maxPhi);
        }
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
    }

    function drawTerrain() {
        terrainGraphics.clear();
        terrainGraphics.push();
    
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
    
        terrainGraphics.translate(
            -totalWidth / 2,
            0,
            -totalDepth / 2
        );
    
        // Remove fill and enable stroke for lines
        terrainGraphics.noFill();
        terrainGraphics.stroke(CONFIG.colors.terrain.lines[0], CONFIG.colors.terrain.lines[1], CONFIG.colors.terrain.lines[2], CONFIG.colors.terrain.lines[3]);
        terrainGraphics.strokeWeight(1);
    
        // Iterate through rows and create QUAD_STRIP for each row pair
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            terrainGraphics.beginShape(p.QUAD_STRIP);
            for (let x = 0; x < CONFIG.cols; x++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                terrainGraphics.vertex(xpos, ypos, zpos);
    
                const zposNext = (y + 1) * CONFIG.pointSpacing;
                const yposNext = zValues[x][y + 1];
                terrainGraphics.vertex(xpos, yposNext, zposNext);
            }
            terrainGraphics.endShape();
        }
    
        // Optionally, add semi-transparent lines for grid edges
        // Since fill is removed, this ensures that only lines are visible
        terrainGraphics.stroke(CONFIG.colors.terrain.lines[0], CONFIG.colors.terrain.lines[1], CONFIG.colors.terrain.lines[2], CONFIG.colors.terrain.lines[3]);
        terrainGraphics.strokeWeight(1);
        terrainGraphics.noFill();
    
        for (let y = 0; y < CONFIG.rows; y++) {
            terrainGraphics.beginShape();
            for (let x = 0; x < CONFIG.cols; x++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                terrainGraphics.vertex(xpos, ypos, zpos);
            }
            terrainGraphics.endShape();
        }
    
        for (let x = 0; x < CONFIG.cols; x++) {
            terrainGraphics.beginShape();
            for (let y = 0; y < CONFIG.rows; y++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                terrainGraphics.vertex(xpos, ypos, zpos);
            }
            terrainGraphics.endShape();
        }
    
        terrainGraphics.pop();
    }
    
    

    function lerpColor(c1, c2, amt) {
        return [
            p.lerp(c1[0], c2[0], amt),
            p.lerp(c1[1], c2[1], amt),
            p.lerp(c1[2], c2[2], amt)
        ];
    }

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        p.resizeCanvas(container.width, container.height);
        terrainGraphics.resizeCanvas(container.width, container.height);
        terrainGraphics.ortho(-container.width / 2, container.width / 2, 
                             -container.height / 2, container.height / 2, 
                             -10000, 10000);
    };
}