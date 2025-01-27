export default function(p) {
    // Adjust this path to your own image if desired
    const IMAGE_PATH = 'images/4.png';

    // ----------------------------------------------------
    // CONFIGURATION
    // ----------------------------------------------------
    const CONFIG = {
        // Terrain size and shape
        cols: 50,
        rows: 50,
        pointSpacing: 10,

        // Height / noise parameters
        noiseScale: 0.08,
        heightScale: 150,   // Maximum possible height above/below the baseline
        time: 0,
        timeIncrement: 0.005,

        // Camera parameters
        // autoRotationSpeed: 0.002,
        autoRotationSpeed: 0.0,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,

        // Colors
        colors: {
            // If you want a flat background color instead of an image, use p.background() 
            // in draw(), or just keep the image usage as is.
            background: [255, 255, 255],

            terrain: {
                low:  [255, 255, 255],   // Lower elevation color (soft green)
                high: [255,  255, 255],   // Higher elevation color (deeper green)
                lines: [255, 255, 255] // Grid lines (R,G,B, alpha)
            },

            greenSquare: [0, 200, 0, 200],  // Green squares (rgba)
        },

        // Green squares
        numGreenSquares: 20,   // How many squares we want
        moveEveryNFrames: 10,  // Move every 10 frames, for example
    };

    // Height map storage
    let zValues = [];

    // Camera angles
    let camTheta = 0;
    let camPhi   = Math.PI / 3;
    let targetCamTheta = 0;
    let targetCamPhi   = Math.PI / 3;

    // Mouse tracking
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Offscreen graphics buffer for the terrain
    let terrainGraphics;

    // For the background image
    let img;

    // Store "green squares" positions
    let greenSquares = [];

    // ----------------------------------------------------
    // p5: PRELOAD
    // ----------------------------------------------------
    p.preload = function() {
        // Load background image (optional)
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Image loaded successfully.'),
            () => console.error('Failed to load image at path:', IMAGE_PATH)
        );
    };

    // ----------------------------------------------------
    // p5: SETUP
    // ----------------------------------------------------
    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth  = container.width;
        const containerHeight = container.height;

        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

        // Offscreen buffer for 3D terrain
        terrainGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
        terrainGraphics.ortho(
            -containerWidth / 2, containerWidth / 2,
            -containerHeight / 2, containerHeight / 2,
            -10000, 10000
        );
        p.smooth();

        // Initialize mouse positions
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        // Build our height map
        createHeightMap();

        // Generate the initial green squares
        createGreenSquares();
    };

    // ----------------------------------------------------
    // CREATE / UPDATE FUNCTIONS
    // ----------------------------------------------------
    // Fill zValues array with perlin noise-based heights
    function createHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            zValues[x] = [];
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    // Recalculate the height map (called each frame)
    function updateHeightMap() {
        CONFIG.time += CONFIG.timeIncrement;
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    // Use Perlin noise to get a height for (x, y)
    function calculateHeight(x, y) {
        const mainNoise = p.noise(
            x * CONFIG.noiseScale,
            y * CONFIG.noiseScale,
            CONFIG.time
        );
        // A second noise for additional detail
        const detailNoise = p.noise(
            x * CONFIG.noiseScale * 2,
            y * CONFIG.noiseScale * 2,
            CONFIG.time * 1.5
        ) * 0.5;

        // Combine them and map to -heightScale ... +heightScale
        // 1.3 is the maximum possible sum (1.0 + 0.3)
        const combined = mainNoise + detailNoise * 0.3;
        return p.map(combined, 0, 1.3, -CONFIG.heightScale, CONFIG.heightScale);
    }

    // Simple linear interpolation between two colors [r, g, b]
    // c1, c2 are [r, g, b], amt is between 0..1
    function lerpColor(c1, c2, amt) {
        return [
            p.lerp(c1[0], c2[0], amt),
            p.lerp(c1[1], c2[1], amt),
            p.lerp(c1[2], c2[2], amt),
        ];
    }

    // Given a height value, return a color between terrain.low and terrain.high
    function getTerrainColor(height) {
        // Map height from [-heightScale, +heightScale] to [0..1]
        const t = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1, true);
        return lerpColor(CONFIG.colors.terrain.low, CONFIG.colors.terrain.high, t);
    }

    // Generate random positions for the initial green squares
    function createGreenSquares() {
        greenSquares = [];
        for (let i = 0; i < CONFIG.numGreenSquares; i++) {
            const x = p.floor(p.random(CONFIG.cols));
            const y = p.floor(p.random(CONFIG.rows));
            greenSquares.push({x, y});
        }
    }

    // Move the green squares around in a simple pattern
    function updateGreenSquares() {
        // Move every "moveEveryNFrames" frames
        if (p.frameCount % CONFIG.moveEveryNFrames !== 0) {
            return;
        }

        greenSquares.forEach(sq => {
            // Randomly shift in x or y or both
            const dx = p.floor(p.random(-1, 2)); // -1, 0, or 1
            const dy = p.floor(p.random(-1, 2)); // -1, 0, or 1

            sq.x = p.constrain(sq.x + dx, 0, CONFIG.cols - 1);
            sq.y = p.constrain(sq.y + dy, 0, CONFIG.rows - 1);
        });
    }

    // ----------------------------------------------------
    // DRAW TERRAIN
    // ----------------------------------------------------
    function drawTerrain() {
        terrainGraphics.clear();
        terrainGraphics.push();
    
        const totalWidth  = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth  = (CONFIG.rows - 1) * CONFIG.pointSpacing;
    
        // Center the terrain
        terrainGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);
    
        // Draw squares (fill)
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            for (let x = 0; x < CONFIG.cols - 1; x++) {
                const xPos = x * CONFIG.pointSpacing;
                const zPos = y * CONFIG.pointSpacing;
    
                const h1 = zValues[x][y];
                const h2 = zValues[x + 1][y];
                const h3 = zValues[x][y + 1];
                const h4 = zValues[x + 1][y + 1];
    
                // Check if this square's top-left corner is "green"
                const isGreen = greenSquares.some(sq => sq.x === x && sq.y === y);
    
                if (isGreen) {
                    // Green fill
                    terrainGraphics.fill(
                        CONFIG.colors.greenSquare[0],
                        CONFIG.colors.greenSquare[1],
                        CONFIG.colors.greenSquare[2],
                        CONFIG.colors.greenSquare[3]
                    );
                } else {
                    // Make regular squares transparent
                    terrainGraphics.noFill();
                }
    
                terrainGraphics.noStroke();
                terrainGraphics.beginShape(p.QUADS);
                terrainGraphics.vertex(xPos,             h1, zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, h2, zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, h4, zPos + CONFIG.pointSpacing);
                terrainGraphics.vertex(xPos,             h3, zPos + CONFIG.pointSpacing);
                terrainGraphics.endShape(p.CLOSE);
            }
        }
    
        // Draw grid lines on top (optional)
        terrainGraphics.stroke(
            CONFIG.colors.terrain.lines[0],
            CONFIG.colors.terrain.lines[1],
            CONFIG.colors.terrain.lines[2],
            CONFIG.colors.terrain.lines[3]
        );
        terrainGraphics.strokeWeight(0.5);
        terrainGraphics.noFill();
    
        // Horizontal lines
        for (let y = 0; y < CONFIG.rows; y++) {
            terrainGraphics.beginShape();
            for (let x = 0; x < CONFIG.cols; x++) {
                terrainGraphics.vertex(
                    x * CONFIG.pointSpacing,
                    zValues[x][y],
                    y * CONFIG.pointSpacing
                );
            }
            terrainGraphics.endShape();
        }
    
        // Vertical lines
        for (let x = 0; x < CONFIG.cols; x++) {
            terrainGraphics.beginShape();
            for (let y = 0; y < CONFIG.rows; y++) {
                terrainGraphics.vertex(
                    x * CONFIG.pointSpacing,
                    zValues[x][y],
                    y * CONFIG.pointSpacing
                );
            }
            terrainGraphics.endShape();
        }
    
        terrainGraphics.pop();
    }
    

    // ----------------------------------------------------
    // HANDLE CAMERA
    // ----------------------------------------------------
    function handleCamera() {
        // If mouse not pressed, auto-rotate
        if (!p.mouseIsPressed) {
            targetCamTheta += CONFIG.autoRotationSpeed;
        }

        // If dragging with left mouse, update camera angles
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            const deltaX = p.mouseX - lastMouseX;
            const deltaY = p.mouseY - lastMouseY;
            targetCamTheta -= deltaX * 0.01;
            targetCamPhi   += deltaY * 0.01;
            targetCamPhi    = p.constrain(targetCamPhi, CONFIG.minPhi, CONFIG.maxPhi);
        }

        // Save the mouse for next frame
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        // Smoothly interpolate actual camera angles to target
        camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
        camPhi   = p.lerp(camPhi,   targetCamPhi,   0.1);

        // Convert spherical to Cartesian
        const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = CONFIG.camRadius * p.cos(camPhi);
        const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);

        terrainGraphics.camera(camX, camY, camZ,  0, 0, 0,  0, 1, 0);
    }

    // ----------------------------------------------------
    // p5: DRAW
    // ----------------------------------------------------
    p.draw = function() {
        // Clear the main canvas
        p.clear();

        // If you prefer a solid background color instead of the image:
        // p.background(CONFIG.colors.background);

        // Draw background image (optional)
        p.push();
        p.resetMatrix();          // Make sure we draw 2D image behind everything
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);    // Move it slightly behind the 3D scene
        p.image(img, 0, 0, p.width, p.height);
        p.pop();

        // Update terrain heights over time
        updateHeightMap();

        // Handle camera movement
        handleCamera();

        // Update and draw terrain on the offscreen buffer
        drawTerrain();

        // Update green squares' positions (the "animation")
        updateGreenSquares();

        // Finally, draw the 3D terrain buffer onto the main canvas
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.image(terrainGraphics, 0, 0);
        p.pop();
    };

    // ----------------------------------------------------
    // WINDOW RESIZE
    // ----------------------------------------------------
    p.windowResized = function() {
        const container = p.select('#sketch-container');
        p.resizeCanvas(container.width, container.height);
        terrainGraphics.resizeCanvas(container.width, container.height);
        terrainGraphics.ortho(
            -container.width / 2, container.width / 2,
            -container.height / 2, container.height / 2,
            -10000, 10000
        );
    };
}
