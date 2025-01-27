export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        cols: 50,
        rows: 50,
        pointSpacing: 10,
        noiseScale: 0.08,
        heightScale: 150,
        time: 0,
        timeIncrement: 0.010,
        autoRotationSpeed: 0.0,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,
        // Peak pattern settings
        peakThreshold: 0.7,
        patternSpacing: 5,
        patternScale: 0.01,
        patternColors: [
            [255, 255, 255],  // White
            [150, 211, 155],  // Light green
            [87, 215, 242],   // Light blue
            [240, 152, 244]   // Light pink
        ]
    };

    let zValues = [];
    let patternField = [];
    let camTheta = 0;
    let camPhi = Math.PI / 3;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;
    let patternGraphics;
    let img;
    let targetCamTheta = 0;
    let targetCamPhi = Math.PI / 3;
    let patternZOffset = 0;

    p.preload = function() {
        try {
            img = p.loadImage(IMAGE_PATH, 
                () => console.log('Image loaded successfully'),
                () => console.error('Failed to load image')
            );
        } catch (e) {
            console.error('Error in preload:', e);
        }
    };

    p.setup = function() {
        try {
            const container = p.select('#sketch-container');
            if (!container) {
                console.error('Container not found');
                return;
            }
            const containerWidth = container.width;
            const containerHeight = container.height;

            console.log('Setting up canvas:', containerWidth, containerHeight);

            p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
            
            terrainGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
            patternGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
            
            terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
            patternGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
            
            p.smooth();
            
            // Initialize arrays
            createHeightMap();
            initializePatternField();
            
            console.log('Setup complete');
        } catch (e) {
            console.error('Error in setup:', e);
        }
    };

    function createHeightMap() {
        zValues = Array(CONFIG.cols).fill().map(() => Array(CONFIG.rows));
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    function calculateHeight(x, y) {
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

    function initializePatternField() {
        patternField = Array(CONFIG.cols).fill().map(() => Array(CONFIG.rows));
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                let angle = p.noise(x * CONFIG.patternScale, y * CONFIG.patternScale, patternZOffset) * p.TWO_PI * 2;
                patternField[x][y] = p.createVector(p.cos(angle), p.sin(angle));
            }
        }
    }

    function updatePatternField() {
        patternZOffset += CONFIG.timeIncrement * 0.5;
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                let angle = p.noise(x * CONFIG.patternScale, y * CONFIG.patternScale, patternZOffset) * p.TWO_PI * 2;
                patternField[x][y].set(p.cos(angle), p.sin(angle));
            }
        }
    }

    function drawPatternAtPeak(x, y, z, normalizedHeight) {
        if (normalizedHeight < CONFIG.peakThreshold) return;

        const gridX = Math.floor(x / CONFIG.pointSpacing);
        const gridY = Math.floor(y / CONFIG.pointSpacing);
        
        if (gridX >= CONFIG.cols || gridY >= CONFIG.rows) return;
        
        const patternVector = patternField[gridX][gridY];
        const angle = p.atan2(patternVector.y, patternVector.x);
        
        const colorIndex = Math.floor(p.map(angle, -p.PI, p.PI, 0, CONFIG.patternColors.length));
        const color = CONFIG.patternColors[colorIndex % CONFIG.patternColors.length];
        
        const opacity = p.map(normalizedHeight, CONFIG.peakThreshold, 1, 0, 255);
        
        patternGraphics.push();
        patternGraphics.translate(x, z, y);
        patternGraphics.rotateX(p.PI/2);
        
        // Draw colored square
        patternGraphics.fill(...color, opacity);
        patternGraphics.noStroke();
        const size = CONFIG.pointSpacing * 0.4;
        patternGraphics.rect(-size/2, -size/2, size, size);
        
        // Add cross pattern at high points
        if (normalizedHeight > 0.85) {
            patternGraphics.stroke(255, opacity);
            patternGraphics.strokeWeight(0.5);
            patternGraphics.line(-size/2, 0, size/2, 0);
            patternGraphics.line(0, -size/2, 0, size/2);
        }
        
        patternGraphics.pop();
    }

    p.draw = function() {
        try {
            p.clear();
            
            if (img) {
                p.push();
                p.resetMatrix();
                p.imageMode(p.CENTER);
                p.translate(0, 0, -1);
                p.image(img, 0, 0, p.width, p.height);
                p.pop();
            }
            
            updateHeightMap();
            updatePatternField();
            handleCamera();
            
            camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
            camPhi = p.lerp(camPhi, targetCamPhi, 0.1);
            
            const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
            const camY = CONFIG.camRadius * p.cos(camPhi);
            const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);
            
            terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
            patternGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
            
            drawTerrain();
            drawPatterns();
            
            p.push();
            p.resetMatrix();
            p.imageMode(p.CENTER);
            p.image(terrainGraphics, 0, 0);
            p.blendMode(p.ADD);
            p.image(patternGraphics, 0, 0);
            p.pop();
            
        } catch (e) {
            console.error('Error in draw:', e);
        }
    };

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

    function drawPatterns() {
        patternGraphics.clear();
        patternGraphics.push();
        
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        patternGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);
        
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                const xpos = x * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                const zpos = y * CONFIG.pointSpacing;
                
                const normalizedHeight = p.map(ypos, -CONFIG.heightScale, CONFIG.heightScale, 0, 1);
                drawPatternAtPeak(xpos, zpos, ypos, normalizedHeight);
            }
        }
        
        patternGraphics.pop();
    }

    function drawTerrain() {
        terrainGraphics.clear();
        terrainGraphics.push();
      
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
      
        // Center terrain
        terrainGraphics.translate(
          -totalWidth / 2,
          0,
          -totalDepth / 2
        );
      
        // 1) Draw wireframe lines
        terrainGraphics.stroke(255);
        terrainGraphics.strokeWeight(0.5);
        terrainGraphics.noFill();
      
        // Horizontal lines
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
      
        // Vertical lines
        for (let x = 0; x < CONFIG.cols; x++) {
          terrainGraphics.beginShape();
          for (let y = 0; y < CONFIG.rows; y++) {
            const xpos = x * CONFIG.pointSpacing;
            const ypos = zValues[x][y];
            const zpos = y * CONFIG.pointSpacing;
            terrainGraphics.vertex(xpos, ypos, zpos);
          }
          terrainGraphics.endShape();
        }
      
        // Diagonal lines (top-left to bottom-right)
        for (let k = 0; k < CONFIG.cols + CONFIG.rows - 1; k++) {
          terrainGraphics.beginShape();
          for (let i = 0; i <= k; i++) {
            const x = i;
            const y = k - i;
            if (x < CONFIG.cols && y < CONFIG.rows) {
              const xpos = x * CONFIG.pointSpacing;
              const ypos = zValues[x][y];
              const zpos = y * CONFIG.pointSpacing;
              terrainGraphics.vertex(xpos, ypos, zpos);
            }
          }
          terrainGraphics.endShape();
        }
      
        // Diagonal lines (top-right to bottom-left)
        for (let k = 0; k < CONFIG.cols + CONFIG.rows - 1; k++) {
          terrainGraphics.beginShape();
          for (let i = 0; i <= k; i++) {
            const x = CONFIG.cols - 1 - i;
            const y = k - i;
            if (x >= 0 && x < CONFIG.cols && y < CONFIG.rows) {
              const xpos = x * CONFIG.pointSpacing;
              const ypos = zValues[x][y];
              const zpos = y * CONFIG.pointSpacing;
              terrainGraphics.vertex(xpos, ypos, zpos);
            }
          }
          terrainGraphics.endShape();
        }
      
        // 2) DEBUG: Draw a BIG RED square at EVERY cell (no threshold).
        //    Also shift it up by +10 so it's clearly above the wireframe lines.
        for (let x = 0; x < CONFIG.cols; x++) {
          for (let y = 0; y < CONFIG.rows; y++) {
            const xpos = x * CONFIG.pointSpacing;
            const ypos = zValues[x][y] + 10;  // shift upward by 10
            const zpos = y * CONFIG.pointSpacing;
      
            terrainGraphics.push();
            terrainGraphics.translate(xpos, ypos, zpos);
      
            // (Skip rotateX, just draw it upright.)
            terrainGraphics.fill(255, 0, 0, 180);  // red w/ some transparency
            terrainGraphics.noStroke();
      
            // Make it extra large to be sure you see it
            const squareSize = 15;
            terrainGraphics.rectMode(p.CENTER);
      
            // By default, rect() in WEBGL draws in XY plane facing the camera.
            // That can be fine for debugging—just to see if it appears at all.
            terrainGraphics.rect(0, 0, squareSize, squareSize);
      
            terrainGraphics.pop();
          }
        }
      
        terrainGraphics.pop();
      }
      

    p.windowResized = function() {
        try {
            const container = p.select('#sketch-container');
            p.resizeCanvas(container.width, container.height);
            terrainGraphics.resizeCanvas(container.width, container.height);
            patternGraphics.resizeCanvas(container.width, container.height);
            terrainGraphics.ortho(-container.width / 2, container.width / 2, 
                                -container.height / 2, container.height / 2, 
                                -10000, 10000);
            patternGraphics.ortho(-container.width / 2, container.width / 2, 
                                -container.height / 2, container.height / 2, 
                                -10000, 10000);
        } catch (e) {
            console.error('Error in windowResized:', e);
        }
    };
}