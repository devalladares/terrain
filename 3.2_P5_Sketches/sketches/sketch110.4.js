export default function(p) {
    const IMAGE_PATH = 'images/4.png';

    const CONFIG = {
        // Existing configurations
        cols: 60,
        rows: 60,
        pointSpacing: 8,
        noiseScale: 0.1,
        heightScale: 200,
        time: 0,
        timeIncrement: 0.0075,
        autoRotationSpeed: 0.002,
        minPhi: p.PI / 12,
        maxPhi: p.PI / 3,
        minLineLength: 2,
        maxLineLength: 40,
        lineWeight: 1,
        lineAlpha: 255,
        baseColor: [0, 0, 0],    // HSB for golden
        accentColor:  [0, 0, 0],   // HSB for another shade
        swayAmount: 0.0,
        swaySpeed: 100,
        colorShiftSpeed: 0.5, // New configuration
        colorVariation: 50    // New configuration
    };

    let img;
    let zValues = [];
    let camTheta = 0;
    let camPhi = p.PI / 4;
    let camRadius = 800;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let terrainGraphics;
    let particles = []; // Particle array

    class Particle {
        constructor() {
            this.position = p.createVector(
                p.random(-CONFIG.cols * CONFIG.pointSpacing / 2, CONFIG.cols * CONFIG.pointSpacing / 2),
                p.random(-CONFIG.heightScale, CONFIG.heightScale),
                p.random(-CONFIG.rows * CONFIG.pointSpacing / 2, CONFIG.rows * CONFIG.pointSpacing / 2)
            );
            this.velocity = p.createVector(
                p.random(-1, 1),
                p.random(-0.5, 0.5),
                p.random(-1, 1)
            );
            this.size = p.random(2, 5);
            this.color = p.color(255, 0, 0); // HSB color
        }

        update() {
            // Update position based on velocity
            this.position.add(this.velocity);

            // Wrap around the edges
            if (this.position.x > CONFIG.cols * CONFIG.pointSpacing / 2) this.position.x = -CONFIG.cols * CONFIG.pointSpacing / 2;
            if (this.position.x < -CONFIG.cols * CONFIG.pointSpacing / 2) this.position.x = CONFIG.cols * CONFIG.pointSpacing / 2;
            if (this.position.z > CONFIG.rows * CONFIG.pointSpacing / 2) this.position.z = -CONFIG.rows * CONFIG.pointSpacing / 2;
            if (this.position.z < -CONFIG.rows * CONFIG.pointSpacing / 2) this.position.z = CONFIG.rows * CONFIG.pointSpacing / 2;

            // Interact with terrain height
            let gridX = p.floor((this.position.x + (CONFIG.cols * CONFIG.pointSpacing / 2)) / CONFIG.pointSpacing);
            let gridY = p.floor((this.position.z + (CONFIG.rows * CONFIG.pointSpacing / 2)) / CONFIG.pointSpacing);

            // Ensure indices are within bounds
            gridX = p.constrain(gridX, 0, CONFIG.cols - 1);
            gridY = p.constrain(gridY, 0, CONFIG.rows - 1);

            const terrainHeight = zValues[gridX][gridY];
            
            // Simple interaction: particles avoid high terrain
            if (terrainHeight > 0) {
                this.velocity.y -= 0.01; // Move downward
            } else {
                this.velocity.y += 0.01; // Move upward
            }

            // Mouse interaction: repel particles when mouse is pressed
            if (p.mouseIsPressed) {
                const mouseX3D = p.map(p.mouseX, 0, p.width, -CONFIG.cols * CONFIG.pointSpacing / 2, CONFIG.cols * CONFIG.pointSpacing / 2);
                const mouseZ3D = p.map(p.mouseY, 0, p.height, -CONFIG.rows * CONFIG.pointSpacing / 2, CONFIG.rows * CONFIG.pointSpacing / 2);
                const mousePos = p.createVector(mouseX3D, 0, mouseZ3D);
                const dir = p5.Vector.sub(this.position, mousePos);
                const distance = dir.mag();
                if (distance < 100) { // Adjust influence radius
                    dir.normalize();
                    this.velocity.add(dir.mult(0.05)); // Adjust repulsion strength
                }
            }

            // Limit velocity
            this.velocity.limit(2);
        }

        display() {
            terrainGraphics.push();
            terrainGraphics.translate(this.position.x, this.position.y, this.position.z);
            terrainGraphics.noStroke();
            terrainGraphics.fill('white');
            terrainGraphics.sphere(this.size);
            terrainGraphics.pop();
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
        terrainGraphics.colorMode('white');
        
        p.smooth();
        createHeightMap();

        // Initialize particles
        for (let i = 0; i < 100; i++) { // Adjust the number as needed
            particles.push(new Particle());
        }
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

        // Update and display particles
        particles.forEach(particle => {
            particle.update();
            particle.display();
        });
        
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
        
        // Set up lighting
        terrainGraphics.directionalLight(200, 200, 200, -1, -1, -1);
        terrainGraphics.ambientLight(50, 50, 50);
        
        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        
        terrainGraphics.translate(
            -totalWidth / 2,
            0,
            -totalDepth / 2
        );

        // Draw vertical lines with animated colors
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
                
                // Calculate color blend based on height and time
                const blendFactor = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1);
                
                // Smooth color transitions over time
                const dynamicHue = (CONFIG.time * CONFIG.colorShiftSpeed + x + y) % 360;
                const baseHue = p.lerp(CONFIG.baseColor[0], CONFIG.accentColor[0], blendFactor);
                const dynamicColor = p.color(
                    (baseHue + dynamicHue) % 360,
                    100,
                    100,
                    CONFIG.lineAlpha
                );
                
                // Add slight sway based on time
                const sway = p.sin(CONFIG.time * CONFIG.swaySpeed + x * 0.1 + y * 0.1) * CONFIG.swayAmount;
                
                // Draw the vertical line
                terrainGraphics.push();
                terrainGraphics.translate(xpos + sway, height, zpos);
                terrainGraphics.stroke(dynamicColor);
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
