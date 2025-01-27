export default function(p) {
    // Path to the background image
    const IMAGE_PATH = 'images/4.png';

    // Configuration object for easy parameter management
    const CONFIG = {
        cols: 50,
        rows: 50,
        pointSpacing: 10,
        noiseScale: 0.08,
        heightScale: 150,
        time: 0,
        timeIncrement: 0.005,
        autoRotationSpeed: 0.002,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,
        peakThreshold: 100,
        peakInfluenceRadius: 2, // How many cells around a peak are affected
        rippleSpeed: 0.1,
        rippleRadius: 5,
        colors: {
            background: [255, 252, 247],
            terrain: {
                low: [255, 243, 230],        // Warm light cream
                high: [255, 206, 166],       // Warm peach
                peak: [246, 141, 108],       // Coral for peaks
                peakArea: [255, 255, 140],   // Color for area around peaks
                ripple: [255, 180, 140],     // Light coral for ripples
                lines: [102, 71, 53, 80]      // Semi-transparent warm brown
            },
            accent: [246, 141, 108],
            square: {
                base: [0, 255, 0, 200],       // Green with some transparency
                highlight: [0, 200, 0, 255]   // Darker green for highlighting
            }
        }
    };

    let zValues = [];
    let peakLocations = []; // Store peak locations
    let peakRipples = [];
    let camTheta = 0;
    let camPhi = Math.PI / 3;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;
    let img;

    let targetCamTheta = 0;
    let targetCamPhi = Math.PI / 3;

    // Variables for animated green squares
    let greenSquares = [];
    const NUM_GREEN_SQUARES = 50;

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

        // Create the main canvas
        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
        
        // Create a separate graphics layer for the terrain
        terrainGraphics = p.createGraphics(containerWidth, containerHeight, p.WEBGL);
        terrainGraphics.ortho(-containerWidth / 2, containerWidth / 2, -containerHeight / 2, containerHeight / 2, -10000, 10000);
        
        p.smooth();
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;
        createHeightMap();

        // Initialize green squares with random positions and movement directions
        for (let i = 0; i < NUM_GREEN_SQUARES; i++) {
            const x = p.floor(p.random(CONFIG.cols - 1));
            const y = p.floor(p.random(CONFIG.rows - 1));
            greenSquares.push({
                x,
                y,
                // Random movement direction
                dx: p.random([-1, 0, 1]),
                dy: p.random([-1, 0, 1])
            });
        }
    };

    // Function to check if a position is near any peak
    function isNearPeak(x, y) {
        for (const peak of peakLocations) {
            const distance = Math.sqrt(Math.pow(x - peak.x, 2) + Math.pow(y - peak.y, 2));
            if (distance <= CONFIG.peakInfluenceRadius) {
                return true;
            }
        }
        return false;
    }

    // Function to create a ripple effect at a given position
    function createRipple(x, y) {
        peakRipples.push({
            x,
            y,
            radius: 0,
            life: 1.0
        });
    }

    // Update existing ripples
    function updateRipples() {
        for (let i = peakRipples.length - 1; i >= 0; i--) {
            const ripple = peakRipples[i];
            ripple.radius += CONFIG.rippleSpeed;
            ripple.life -= 0.02;
            
            if (ripple.life <= 0) {
                peakRipples.splice(i, 1);
            }
        }
    }

    // Calculate the intensity of ripples at a given position
    function getRippleIntensity(x, y) {
        let totalIntensity = 0;
        
        for (const ripple of peakRipples) {
            const distance = p.dist(x, y, ripple.x, ripple.y);
            if (distance <= ripple.radius + CONFIG.rippleRadius) {
                const intensity = ripple.life * (1 - distance / (ripple.radius + CONFIG.rippleRadius));
                totalIntensity += Math.max(0, intensity);
            }
        }
        
        return Math.min(1, totalIntensity);
    }

    // Calculate the height at a given grid position
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
        
        const height = p.map(mainNoise + detailNoise * 0.3, 0, 1.3, -CONFIG.heightScale, CONFIG.heightScale);
        
        // Track peaks
        if (height > CONFIG.peakThreshold) {
            // Check if this peak is already recorded
            const isPeakRecorded = peakLocations.some(peak => 
                peak.x === x && peak.y === y
            );
            
            if (!isPeakRecorded) {
                peakLocations.push({ x, y });
                if (p.random() < 0.01) {
                    createRipple(x, y);
                }
            }
        }
        
        return height;
    }

    // Determine the color of the terrain based on height and ripple intensity
    function getTerrainColor(height, x, y) {
        const rippleIntensity = getRippleIntensity(x, y);
        let baseColor;
        
        // Check surrounding points for peaks
        let hasNearbyPeak = false;
        const checkRadius = 2;
        
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                const checkX = x + dx;
                const checkY = y + dy;
                
                // Skip if out of bounds
                if (checkX < 0 || checkX >= CONFIG.cols || checkY < 0 || checkY >= CONFIG.rows) {
                    continue;
                }
                
                // Get height at check position
                const checkHeight = zValues[checkX][checkY];
                if (checkHeight > CONFIG.peakThreshold) {
                    hasNearbyPeak = true;
                    break;
                }
            }
            if (hasNearbyPeak) break;
        }
        
        if (height > CONFIG.peakThreshold) {
            baseColor = CONFIG.colors.terrain.peak;
        } else if (hasNearbyPeak) {
            baseColor = CONFIG.colors.terrain.peakArea;
        } else {
            const t = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1);
            baseColor = lerpColor(CONFIG.colors.terrain.low, CONFIG.colors.terrain.high, t);
        }
        
        if (rippleIntensity > 0) {
            return lerpColor(baseColor, CONFIG.colors.terrain.ripple, rippleIntensity);
        }
        
        return baseColor;
    }

    // Draw the terrain on the separate graphics layer
    function drawTerrain() {
        terrainGraphics.clear();
        terrainGraphics.push();
    
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
    
        terrainGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);
    
        // Draw individual squares
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            for (let x = 0; x < CONFIG.cols - 1; x++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
    
                // Get heights for the four corners
                const h1 = zValues[x][y];
                const h2 = zValues[x + 1][y];
                const h3 = zValues[x][y + 1];
                const h4 = zValues[x + 1][y + 1];
    
                // Determine if this square should be green
                const isGreen = greenSquares.some(square => square.x === x && square.y === y);
    
                if (isGreen) {
                    terrainGraphics.fill(CONFIG.colors.square.base); // Green with transparency
                } else {
                    // Normal terrain color
                    const avgHeight = (h1 + h2 + h3 + h4) / 4;
                    const color = getTerrainColor(avgHeight, x, y);
                    terrainGraphics.fill(color[0], color[1], color[2], 150);
                }
    
                terrainGraphics.noStroke();
                terrainGraphics.beginShape(p.QUADS);
                terrainGraphics.vertex(xpos, h1, zpos);
                terrainGraphics.vertex(xpos + CONFIG.pointSpacing, h2, zpos);
                terrainGraphics.vertex(xpos + CONFIG.pointSpacing, h4, zpos + CONFIG.pointSpacing);
                terrainGraphics.vertex(xpos, h3, zpos + CONFIG.pointSpacing);
                terrainGraphics.endShape(p.CLOSE);
            }
        }
    
        // Draw grid lines on top
        terrainGraphics.stroke(CONFIG.colors.terrain.lines[0], CONFIG.colors.terrain.lines[1], 
                             CONFIG.colors.terrain.lines[2], CONFIG.colors.terrain.lines[3]);
        terrainGraphics.strokeWeight(1);
        terrainGraphics.noFill();
    
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

    p.draw = function() {
        p.clear();
        
        // Draw the background image
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1); // Slightly behind
        p.image(img, 0, 0, p.width, p.height);
        p.pop();
        
        // Reset peakLocations before updating
        peakLocations = []; 
        updateHeightMap();
        updateRipples();
        handleCamera();
        
        camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
        camPhi = p.lerp(camPhi, targetCamPhi, 0.1);
        
        const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = CONFIG.camRadius * p.cos(camPhi);
        const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);
        
        terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
        
        drawTerrain();
        
        // Draw the terrain graphics onto the main canvas
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.image(terrainGraphics, 0, 0);
        p.pop();

        // Update and animate green squares
        updateGreenSquares();
    };

    // Update the height map based on Perlin noise
    function updateHeightMap() {
        CONFIG.time += CONFIG.timeIncrement;
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    // Handle camera movement based on user interaction and auto-rotation
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

    // Initialize the height map
    function createHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            zValues[x] = [];
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    // Linear interpolation between two colors
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

    // **Define updateGreenSquares within the p5 instance**
    function updateGreenSquares() {
        // Update positions of green squares to create an animated pattern
        greenSquares.forEach(square => {
            // Move square based on its direction
            square.x += square.dx * 0.05; // Slow movement
            square.y += square.dy * 0.05;

            // Wrap around if out of bounds
            if (square.x < 0) square.x = CONFIG.cols - 1;
            if (square.x >= CONFIG.cols - 1) square.x = 0;
            if (square.y < 0) square.y = CONFIG.rows - 1;
            if (square.y >= CONFIG.rows - 1) square.y = 0;
        });

        // Optionally, you can add some pulsating effect or color changes
        // For simplicity, we're just moving the squares
    }

    // Optional: Handle mouse interactions or other user inputs here
}
