export default function(p) {
    // Path to optional background image
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
        heightScale: 150,
        time: 0,
        timeIncrement: 0.005,

        // Camera parameters
        autoRotationSpeed: 0.002,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,

        // Colors
        colors: {
            // If no image, you can do a flat background color with p.background()
            background: [255, 252, 247],

            terrain: {
                low:  [190, 230, 200],   // Lower elevation color
                high: [ 255, 255, 255],   // Higher elevation color
                lines:[ 80,  80,  80, 90]// Grid lines (R,G,B, alpha)
            },

            boid: [0, 200, 200, 255],     // Green boids
        },

        // Flocking
        numBoids: 20,
        maxSpeed: 0.5,        // how fast boids can move
        maxForce: 0.03,       // steering force limit
        neighborDist: 10,     // how far to look for neighbors
        desiredSeparation: 5, // how close is too close
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

    // Optional background image
    let img;

    // Array of boid objects
    let boids = [];

    // ----------------------------------------------------
    // p5: PRELOAD (load background image if you want one)
    // ----------------------------------------------------
    p.preload = function() {
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Background image loaded.'),
            () => console.error('Failed to load image at:', IMAGE_PATH)
        );
    };

    // ----------------------------------------------------
    // p5: SETUP
    // ----------------------------------------------------
    p.setup = function() {
        const container = p.select('#sketch-container');
        const cw = container.width;
        const ch = container.height;

        p.createCanvas(cw, ch, p.WEBGL).parent(container);

        // Offscreen 3D buffer for terrain
        terrainGraphics = p.createGraphics(cw, ch, p.WEBGL);
        terrainGraphics.ortho(-cw/2, cw/2, -ch/2, ch/2, -10000, 10000);

        p.smooth();

        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        // Create the initial height map
        createHeightMap();

        // Create boids
        createBoids();
    };

    // ----------------------------------------------------
    // BOID (Flocking) IMPLEMENTATION
    // ----------------------------------------------------
    class Boid {
        constructor(x, y) {
            // Position in "grid" space from 0..cols, 0..rows
            this.pos = p.createVector(x, y);
            // Random velocity
            this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
            // Zero acceleration to begin with
            this.acc = p.createVector(0, 0);
        }

        // This is where the boid calculates steering forces based on neighbors
        flock(boids) {
            // 1) Separation
            let sep = this.separation(boids);
            // 2) Alignment
            let ali = this.alignment(boids);
            // 3) Cohesion
            let coh = this.cohesion(boids);

            // Let’s weight them all equally, or you can tweak if you want
            sep.mult(1.5);
            ali.mult(1.0);
            coh.mult(1.0);

            // Sum the forces
            this.acc.add(sep);
            this.acc.add(ali);
            this.acc.add(coh);
        }

        separation(boids) {
            let steer = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p.dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                // If too close...
                if (d > 0 && d < CONFIG.desiredSeparation) {
                    let diff = p5.Vector.sub(this.pos, other.pos);
                    diff.normalize();
                    diff.div(d); // weight by distance
                    steer.add(diff);
                    count++;
                }
            }
            if (count > 0) {
                steer.div(count);
            }
            if (steer.mag() > 0) {
                steer.setMag(CONFIG.maxSpeed);
                steer.sub(this.vel);
                steer.limit(CONFIG.maxForce);
            }
            return steer;
        }

        alignment(boids) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p.dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d > 0 && d < CONFIG.neighborDist) {
                    sum.add(other.vel);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                sum.setMag(CONFIG.maxSpeed);
                let steer = p5.Vector.sub(sum, this.vel);
                steer.limit(CONFIG.maxForce);
                return steer;
            } else {
                return p.createVector(0, 0);
            }
        }

        cohesion(boids) {
            let sum = p.createVector(0, 0);
            let count = 0;
            for (let other of boids) {
                let d = p.dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d > 0 && d < CONFIG.neighborDist) {
                    sum.add(other.pos);
                    count++;
                }
            }
            if (count > 0) {
                sum.div(count);
                return this.seek(sum);
            } else {
                return p.createVector(0, 0);
            }
        }

        // Steering force towards a target
        seek(target) {
            let desired = p5.Vector.sub(target, this.pos);
            desired.setMag(CONFIG.maxSpeed);

            let steer = p5.Vector.sub(desired, this.vel);
            steer.limit(CONFIG.maxForce);
            return steer;
        }

        // Update velocity, position
        update() {
            this.vel.add(this.acc);
            this.vel.limit(CONFIG.maxSpeed);
            this.pos.add(this.vel);
            this.acc.mult(0); // reset acceleration
        }

        // Wrap around if outside bounds
        edges() {
            if (this.pos.x < 0)  this.pos.x = CONFIG.cols - 1;
            if (this.pos.x > CONFIG.cols - 1) this.pos.x = 0;

            if (this.pos.y < 0)  this.pos.y = CONFIG.rows - 1;
            if (this.pos.y > CONFIG.rows - 1) this.pos.y = 0;
        }
    }

    function createBoids() {
        boids = [];
        for (let i = 0; i < CONFIG.numBoids; i++) {
            // Start them randomly in the grid
            let x = p.random(CONFIG.cols - 1);
            let y = p.random(CONFIG.rows - 1);
            boids.push(new Boid(x, y));
        }
    }

    function updateBoids() {
        // For each boid, apply flocking (look at neighbors) then update
        for (let boid of boids) {
            boid.flock(boids);
        }
        for (let boid of boids) {
            boid.update();
            boid.edges(); // wrap around edges
        }
    }

    // ----------------------------------------------------
    // CREATE / UPDATE TERRAIN
    // ----------------------------------------------------
    function createHeightMap() {
        for (let x = 0; x < CONFIG.cols; x++) {
            zValues[x] = [];
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    function updateHeightMap() {
        CONFIG.time += CONFIG.timeIncrement;
        for (let x = 0; x < CONFIG.cols; x++) {
            for (let y = 0; y < CONFIG.rows; y++) {
                zValues[x][y] = calculateHeight(x, y);
            }
        }
    }

    // A noisy terrain function
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

        const combined = mainNoise + detailNoise * 0.3;
        return p.map(combined, 0, 1.3, -CONFIG.heightScale, CONFIG.heightScale);
    }

    function lerpColor(c1, c2, amt) {
        return [
            p.lerp(c1[0], c2[0], amt),
            p.lerp(c1[1], c2[1], amt),
            p.lerp(c1[2], c2[2], amt)
        ];
    }

    function getTerrainColor(height) {
        const t = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1, true);
        return lerpColor(CONFIG.colors.terrain.low, CONFIG.colors.terrain.high, t);
    }

    // ----------------------------------------------------
    // DRAW TERRAIN & BOIDS
    // ----------------------------------------------------
    function drawTerrainAndBoids() {
        terrainGraphics.clear();
        terrainGraphics.push();

        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        terrainGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);

        // 1) Draw the terrain squares
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            for (let x = 0; x < CONFIG.cols - 1; x++) {
                const xPos = x * CONFIG.pointSpacing;
                const zPos = y * CONFIG.pointSpacing;

                const h1 = zValues[x][y];
                const h2 = zValues[x + 1][y];
                const h3 = zValues[x][y + 1];
                const h4 = zValues[x + 1][y + 1];

                // Average height → color
                const avgHeight = (h1 + h2 + h3 + h4) / 4;
                const terrainColor = getTerrainColor(avgHeight);

                terrainGraphics.fill(terrainColor[0], terrainColor[1], terrainColor[2], 200);
                terrainGraphics.noStroke();

                terrainGraphics.beginShape(p.QUADS);
                terrainGraphics.vertex(xPos,             h1, zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, h2, zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, h4, zPos + CONFIG.pointSpacing);
                terrainGraphics.vertex(xPos,             h3, zPos + CONFIG.pointSpacing);
                terrainGraphics.endShape(p.CLOSE);
            }
        }

        // 2) Grid lines (optional)
        terrainGraphics.stroke(
            CONFIG.colors.terrain.lines[0],
            CONFIG.colors.terrain.lines[1],
            CONFIG.colors.terrain.lines[2],
            CONFIG.colors.terrain.lines[3]
        );
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

        // 3) Draw boids (green squares) in 3D
        for (let boid of boids) {
            // Convert boid.x, boid.y to 3D position on terrain
            const bx = boid.pos.x;
            const by = boid.pos.y;

            // For safety, floor or clamp indices
            const ix = p.floor(p.constrain(bx, 0, CONFIG.cols - 1));
            const iy = p.floor(p.constrain(by, 0, CONFIG.rows - 1));
            const terrainHeight = zValues[ix][iy];

            // Map boid's 2D (bx,by) to 3D coordinate
            let worldX = bx * CONFIG.pointSpacing;
            let worldZ = by * CONFIG.pointSpacing;
            let worldY = terrainHeight; // "height"

            // Draw a small box at that location
            terrainGraphics.push();
            terrainGraphics.translate(worldX, worldY, worldZ);
            terrainGraphics.fill(CONFIG.colors.boid[0],
                                 CONFIG.colors.boid[1],
                                 CONFIG.colors.boid[2],
                                 CONFIG.colors.boid[3]);
            terrainGraphics.noStroke();
            // A small 3D box (width, height, depth)
            terrainGraphics.box(10, 20, 10);
            terrainGraphics.pop();
        }

        terrainGraphics.pop();
    }

    // ----------------------------------------------------
    // CAMERA CONTROLS
    // ----------------------------------------------------
    function handleCamera() {
        // If mouse not pressed, auto-rotate
        if (!p.mouseIsPressed) {
            targetCamTheta += CONFIG.autoRotationSpeed;
        }

        // If dragging with left mouse, rotate camera manually
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            const deltaX = p.mouseX - lastMouseX;
            const deltaY = p.mouseY - lastMouseY;
            targetCamTheta -= deltaX * 0.01;
            targetCamPhi   += deltaY * 0.01;
            targetCamPhi    = p.constrain(targetCamPhi, CONFIG.minPhi, CONFIG.maxPhi);
        }

        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        // Smooth interpolation
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
        p.clear();

        // If you'd prefer a flat color:
        // p.background(CONFIG.colors.background);
        // Otherwise, draw background image
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();

        // Update noise-based terrain
        updateHeightMap();

        // Update flocking boids
        updateBoids();

        // Camera motion
        handleCamera();

        // Draw terrain + boids into the offscreen buffer
        drawTerrainAndBoids();

        // Draw that buffer on the main canvas
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
            -container.width / 2,
            container.width / 2,
            -container.height / 2,
            container.height / 2,
            -10000,
            10000
        );
    };
}
