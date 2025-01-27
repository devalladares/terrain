export default function(p) {
    // Optional background image path
    const IMAGE_PATH = 'images/4.png';

    // ----------------------------------------------------
    // CONFIGURATION
    // ----------------------------------------------------
    const CONFIG = {
        // Terrain grid
        cols: 50,
        rows: 50,
        pointSpacing: 10,

        // Height / noise
        noiseScale: 0.08,
        heightScale: 150,
        time: 0,
        timeIncrement: 0.005,

        // Camera
        autoRotationSpeed: 0.002,
        minPhi: Math.PI / 12,
        maxPhi: Math.PI / 2.5,
        camRadius: 900,

        // Colors
        colors: {
            // If you don't use an image, you can do `p.background(...)` instead.
            background: [255, 252, 247],

            terrain: {
                low:   [255, 255, 255],  // Lower elevation color
                high:  [ 90, 180, 140],  // Higher elevation color
                lines: [ 0,  0,  80, 90] // Grid lines (R,G,B, alpha)
            },
            boid: [0, 200, 0],    // Green-ish color for boid influence
        },

        // Flocking
        numBoids: 20,
        maxSpeed: 0.5,
        maxForce: 0.03,
        neighborDist: 10,
        desiredSeparation: 5,

        // How far each boid's color "influences" surrounding squares
        boidInfluenceRadius: 5
    };

    // ----------------------------------------------------
    // GLOBALS
    // ----------------------------------------------------
    let zValues = [];           // Terrain heights
    let terrainGraphics;        // Offscreen 3D buffer
    let img;                    // Optional background image

    let camTheta = 0;          // Camera angles
    let camPhi   = Math.PI / 3;
    let targetCamTheta = 0;
    let targetCamPhi   = Math.PI / 3;

    let lastMouseX = 0;        // For camera dragging
    let lastMouseY = 0;

    let boids = [];            // Array of boid objects

    // ----------------------------------------------------
    // PRELOAD
    // ----------------------------------------------------
    p.preload = function() {
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Background image loaded.'),
            () => console.error('Failed to load image at:', IMAGE_PATH)
        );
    };

    // ----------------------------------------------------
    // SETUP
    // ----------------------------------------------------
    p.setup = function() {
        const container = p.select('#sketch-container');
        const cw = container.width;
        const ch = container.height;

        p.createCanvas(cw, ch, p.WEBGL).parent(container);

        terrainGraphics = p.createGraphics(cw, ch, p.WEBGL);
        terrainGraphics.ortho(-cw/2, cw/2, -ch/2, ch/2, -10000, 10000);

        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        // Initialize the height map
        createHeightMap();

        // Initialize boids
        createBoids();
    };

    // ----------------------------------------------------
    // BOIDS (FLOCKING)
    // ----------------------------------------------------
    class Boid {
        constructor(x, y) {
            this.pos = p.createVector(x, y);
            this.vel = p.createVector(p.random(-1,1), p.random(-1,1));
            this.acc = p.createVector(0, 0);
        }

        // The "flock" method applies separation, alignment, cohesion
        flock(boids) {
            let sep = this.separation(boids);
            let ali = this.alignment(boids);
            let coh = this.cohesion(boids);

            // Weight each force
            sep.mult(1.5);
            ali.mult(1.0);
            coh.mult(1.0);

            this.acc.add(sep);
            this.acc.add(ali);
            this.acc.add(coh);
        }

        separation(boids) {
            let steer = p.createVector(0,0);
            let count = 0;
            for (let other of boids) {
                let d = p.dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
                if (d > 0 && d < CONFIG.desiredSeparation) {
                    let diff = p5.Vector.sub(this.pos, other.pos);
                    diff.normalize();
                    diff.div(d);
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
            let sum = p.createVector(0,0);
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
            }
            return p.createVector(0,0);
        }

        cohesion(boids) {
            let sum = p.createVector(0,0);
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
            }
            return p.createVector(0,0);
        }

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
            this.acc.mult(0);
        }

        // Wrap edges
        edges() {
            if (this.pos.x < 0)              this.pos.x = CONFIG.cols - 1;
            if (this.pos.x > CONFIG.cols - 1) this.pos.x = 0;
            if (this.pos.y < 0)              this.pos.y = CONFIG.rows - 1;
            if (this.pos.y > CONFIG.rows - 1) this.pos.y = 0;
        }
    }

    function createBoids() {
        boids = [];
        for (let i = 0; i < CONFIG.numBoids; i++) {
            const x = p.random(CONFIG.cols - 1);
            const y = p.random(CONFIG.rows - 1);
            boids.push(new Boid(x, y));
        }
    }

    function updateBoids() {
        // first apply flocking, then update
        for (let b of boids) {
            b.flock(boids);
        }
        for (let b of boids) {
            b.update();
            b.edges();
        }
    }

    // ----------------------------------------------------
    // TERRAIN (HEIGHT MAP)
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

    function calculateHeight(x, y) {
        let mainNoise = p.noise(
            x * CONFIG.noiseScale,
            y * CONFIG.noiseScale,
            CONFIG.time
        );
        let detailNoise = p.noise(
            x * CONFIG.noiseScale * 2,
            y * CONFIG.noiseScale * 2,
            CONFIG.time * 1.5
        ) * 0.5;

        let combo = mainNoise + detailNoise * 0.3;
        return p.map(combo, 0, 1.3, -CONFIG.heightScale, CONFIG.heightScale);
    }

    function lerpColor(c1, c2, amt) {
        return [
            p.lerp(c1[0], c2[0], amt),
            p.lerp(c1[1], c2[1], amt),
            p.lerp(c1[2], c2[2], amt),
        ];
    }

    function getTerrainColor(height) {
        const t = p.map(height, -CONFIG.heightScale, CONFIG.heightScale, 0, 1, true);
        return lerpColor(CONFIG.colors.terrain.low, CONFIG.colors.terrain.high, t);
    }

    // ----------------------------------------------------
    // BLEND BOID COLOR INTO TERRAIN
    // ----------------------------------------------------
    // This returns how strongly a cell (x,y) is "influenced" by the nearest boid
    // Range: 0..1, where 1 = exactly on a boid, 0 = outside radius
    function getBoidInfluence(x, y) {
        let minDistSq = Infinity;
        for (let b of boids) {
            let dx = b.pos.x - x;
            let dy = b.pos.y - y;
            let distSq = dx*dx + dy*dy;
            if (distSq < minDistSq) {
                minDistSq = distSq;
            }
        }
        let dist = p.sqrt(minDistSq);

        // If the nearest boid is further than boidInfluenceRadius, no effect
        if (dist > CONFIG.boidInfluenceRadius) {
            return 0.0;
        }
        // Else map [0..boidInfluenceRadius] -> [1..0]
        // (closer = stronger effect)
        return 1 - dist / CONFIG.boidInfluenceRadius;
    }

    // ----------------------------------------------------
    // DRAW TERRAIN (WITH BOID-INFLUENCED COLORS)
    // ----------------------------------------------------
    function drawTerrainWithBoids() {
        terrainGraphics.clear();
        terrainGraphics.push();

        const totalWidth = (CONFIG.cols - 1) * CONFIG.pointSpacing;
        const totalDepth = (CONFIG.rows - 1) * CONFIG.pointSpacing;
        terrainGraphics.translate(-totalWidth / 2, 0, -totalDepth / 2);

        // 1. Set all strokes to white
        terrainGraphics.stroke(255, 255, 255);
        terrainGraphics.strokeWeight(0.25);

        // 2. No fill by default (transparent)
        terrainGraphics.noFill();

        // 3. Draw the squares with boid influence
        for (let y = 0; y < CONFIG.rows - 1; y++) {
            for (let x = 0; x < CONFIG.cols - 1; x++) {
                const xPos = x * CONFIG.pointSpacing;
                const zPos = y * CONFIG.pointSpacing;

                // Calculate influence from boids
                const influence = getBoidInfluence(x, y);

                if (influence > 0) {
                    // 3.1. If influenced by a boid, fill with green and appropriate alpha
                    terrainGraphics.fill(
                        CONFIG.colors.boid[0],
                        CONFIG.colors.boid[1],
                        CONFIG.colors.boid[2],
                        influence * 255 // Alpha based on influence strength
                    );
                } else {
                    // 2.1. If no influence, ensure no fill (transparent)
                    terrainGraphics.noFill();
                }

                // Draw the quad (terrain square)
                terrainGraphics.beginShape(p.QUADS);
                terrainGraphics.vertex(xPos,                       zValues[x][y], zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, zValues[x + 1][y], zPos);
                terrainGraphics.vertex(xPos + CONFIG.pointSpacing, zValues[x + 1][y + 1], zPos + CONFIG.pointSpacing);
                terrainGraphics.vertex(xPos,                       zValues[x][y + 1], zPos + CONFIG.pointSpacing);
                terrainGraphics.endShape(p.CLOSE);
            }
        }

        // 4. Draw grid lines with white strokes
        // (Optional: If you want to keep grid lines visible)
        terrainGraphics.stroke(255, 255, 255); // Ensure grid lines are white
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
    // CAMERA CONTROLS
    // ----------------------------------------------------
    function handleCamera() {
        if (!p.mouseIsPressed) {
            targetCamTheta += CONFIG.autoRotationSpeed;
        }
        if (p.mouseIsPressed && p.mouseButton === p.LEFT) {
            const dx = p.mouseX - lastMouseX;
            const dy = p.mouseY - lastMouseY;
            targetCamTheta -= dx * 0.01;
            targetCamPhi   += dy * 0.01;
            targetCamPhi    = p.constrain(targetCamPhi, CONFIG.minPhi, CONFIG.maxPhi);
        }
        lastMouseX = p.mouseX;
        lastMouseY = p.mouseY;

        camTheta = p.lerp(camTheta, targetCamTheta, 0.1);
        camPhi   = p.lerp(camPhi,   targetCamPhi,   0.1);

        const camX = CONFIG.camRadius * p.cos(camTheta) * p.sin(camPhi);
        const camY = CONFIG.camRadius * p.cos(camPhi);
        const camZ = CONFIG.camRadius * p.sin(camTheta) * p.sin(camPhi);

        terrainGraphics.camera(camX, camY, camZ,  0, 0, 0,  0, 1, 0);
    }

    // ----------------------------------------------------
    // DRAW LOOP
    // ----------------------------------------------------
    p.draw = function() {
        p.clear();

        // If you prefer a simple color background:
        // p.background(CONFIG.colors.background);
        // Otherwise, use the loaded image:
        p.push();
        p.resetMatrix();
        p.imageMode(p.CENTER);
        p.translate(0, 0, -1);
        p.image(img, 0, 0, p.width, p.height);
        p.pop();

        // Update terrain noise
        updateHeightMap();

        // Update boids (flocking)
        updateBoids();

        // Camera
        handleCamera();

        // Draw terrain with boid-influenced fill
        drawTerrainWithBoids();

        // Render the offscreen buffer onto main canvas
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
            -container.width/2, container.width/2,
            -container.height/2, container.height/2,
            -10000, 10000
        );
    };
}
