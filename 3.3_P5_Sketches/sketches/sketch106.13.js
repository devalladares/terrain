export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        // Grid parameters
        cols: 50,
        rows: 50,
        pointSpacing: 10,

        // Height/energy parameters
        noiseScale: 0.08,
        heightScale: 150,   
        time: 0,
        timeIncrement: 0.005, // From first code
        rippleSpeed: 0.1,     // From first code

        // Camera parameters
        autoRotationSpeed: 0.0, // From first code
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,

        // Ripple parameters
        peakThreshold: 300, // From first code

        // Colors
        colors: {
            background: [255, 252, 247],
            terrain: {
                low: [255, 243, 230],    // Warm light cream
                high: [255, 206, 166],    // Warm peach
                peak: [246, 141, 108],    // Coral for peaks
                ripple: [255, 180, 140],  // Light coral for ripples
                lines: [102, 71, 53, 80]  // Semi-transparent warm brown
            },
            accent: [246, 141, 108],
            motifs: { // From second code
                startCodon: [150, 211, 155, 200],    // 96D39B - Soft green
                stopCodon: [240, 152, 244, 200],     // F098F4 - Pink/purple
                bindingSite: [87, 215, 242, 200],    // 57D7F2 - Light blue
            }
        },

        // Sequence features parameters
        numBindingSites: 40,
        moveEveryNFrames: 10,
    };

    let zValues = [];
    let peakRipples = []; // From first code
    let sequenceFeatures = []; // From second code
    let camTheta = 0;
    let camPhi = Math.PI / 3;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;
    let img;
    
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
        initializeSequenceFeatures(); // Initialize sequence features
    };

    // Ripple Functions (from first code)
    function createRipple(x, y) {
        peakRipples.push({
            x,
            y,
            radius: 0,
            life: 1.0
        });
    }

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

    // Height Map Functions (from first code)
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
        
        // Create ripples at peaks
        if (height > CONFIG.peakThreshold && p.random() < 0.01) {
            createRipple(x, y);
        }
        
        return height;
    }

    function getTerrainColor(height, x, y) {
        const rippleIntensity = getRippleIntensity(x, y);
        let baseColor;
        
        if (height > CONFIG.peakThreshold) {
            // Peak color
            baseColor = CONFIG.colors.terrain.peak;
        } else {
            // Interpolate between low and high colors based on height
            const t = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1);
            baseColor = lerpColor(CONFIG.colors.terrain.low, CONFIG.colors.terrain.high, t);
        }
        
        // Blend with ripple color if there's an active ripple
        if (rippleIntensity > 0) {
            return lerpColor(baseColor, CONFIG.colors.terrain.ripple, rippleIntensity);
        }
        
        return baseColor;
    }

    // Sequence Features Functions (from second code)
    function initializeSequenceFeatures() {
        sequenceFeatures = [];
        addFeature('startCodon', 20);
        addFeature('stopCodon', 20);
        addFeature('bindingSite', CONFIG.numBindingSites);
    }

    function addFeature(type, count) {
        for (let i = 0; i < count; i++) {
            const x = p.floor(p.random(CONFIG.cols));
            const y = p.floor(p.random(CONFIG.rows));
            sequenceFeatures.push({ type, x, y });
        }
    }

    function updateFeatures() {
        if (p.frameCount % CONFIG.moveEveryNFrames !== 0) return;

        sequenceFeatures.forEach(feature => {
            if (feature.type === 'bindingSite') {
                const dx = p.floor(p.random(-1, 2));
                const dy = p.floor(p.random(-1, 2));
                feature.x = p.constrain(feature.x + dx, 0, CONFIG.cols - 1);
                feature.y = p.constrain(feature.y + dy, 0, CONFIG.rows - 1);
            }
            // You can add movement logic for startCodon and stopCodon if needed
        });
    }

    function drawTerrain() {
        terrainGraphics.clear();
        terrainGraphics.push();
    
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
    
        terrainGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);
    
        // Draw terrain with dynamic colors
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            terrainGraphics.beginShape(p.QUAD_STRIP);
            for (let x = 0; x < CONFIG.cols; x++) {
                const xpos = x * CONFIG.pointSpacing;
                const zpos = y * CONFIG.pointSpacing;
                const ypos = zValues[x][y];
                
                const color = getTerrainColor(ypos, x, y);
                terrainGraphics.fill(color[0], color[1], color[2], 150);
                terrainGraphics.vertex(xpos, ypos, zpos);
    
                const yposNext = zValues[x][y + 1];
                const colorNext = getTerrainColor(yposNext, x, y + 1);
                terrainGraphics.fill(colorNext[0], colorNext[1], colorNext[2], 150);
                terrainGraphics.vertex(xpos, yposNext, (y + 1) * CONFIG.pointSpacing);
            }
            terrainGraphics.endShape();
        }
    
        // Draw grid lines
        terrainGraphics.stroke(CONFIG.colors.terrain.lines[0], CONFIG.colors.terrain.lines[1], 
                             CONFIG.colors.terrain.lines[2], CONFIG.colors.terrain.lines[3]);
        terrainGraphics.strokeWeight(1);
        terrainGraphics.noFill();

        // Draw grid lines along Y axis
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

        // Draw grid lines along X axis
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

        // Draw Sequence Features
        sequenceFeatures.forEach(feature => {
            const xpos = feature.x * CONFIG.pointSpacing;
            const zpos = feature.y * CONFIG.pointSpacing;
            const ypos = zValues[feature.x][feature.y];

            terrainGraphics.push();
            terrainGraphics.translate(xpos, ypos, zpos);
            terrainGraphics.noStroke();
            terrainGraphics.fill(
                CONFIG.colors.motifs[feature.type][0],
                CONFIG.colors.motifs[feature.type][1],
                CONFIG.colors.motifs[feature.type][2],
                CONFIG.colors.motifs[feature.type][3]
            );
            // You can change the shape and size as needed
            terrainGraphics.sphere(5);
            terrainGraphics.pop();
        });
    
        terrainGraphics.pop();
    }

    p.draw = function() {
        p.clear();
        
        // Draw background image
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();
        
        // Update height map and ripples
        updateHeightMap();
        updateRipples();

        // Update sequence features
        updateFeatures();
        
        // Handle camera movement
        handleCamera();
        
        // Calculate camera position with smoothing
        camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
        camPhi = p.lerp(camPhi, targetCamPhi, 0.1);
        
        const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = CONFIG.camRadius * p.cos(camPhi);
        const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);
        
        terrainGraphics.camera(camX, camY, camZ, 0, 0, 0, 0, 1, 0);
        
        // Draw terrain with sequence features
        drawTerrain();
        
        // Render terrain graphics onto main canvas
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.image(terrainGraphics, 0, 0);
        p.pop();
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

    function createHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            zValues[x] = [];
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
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
