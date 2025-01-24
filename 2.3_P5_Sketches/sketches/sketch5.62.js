// sketches/sketch4.js

export default function(p) {
    // 1) Tweakable Config:

    const IMAGE_PATH = 'images/2.jpg'; 
    const RESIZE_WIDTH = 1000; 
    const FLOW_ROTATION_ANGLE = -p.PI / 2; 
    const NUM_PARTICLES = 200; 
    const SHOW_BG_IMAGE = false; 
    const BG_OPACITY = 255; 
    const BRAND_PALETTE_LIGHT = ["#4CB944"];
    const BRAND_PALETTE_DARK = ["#4CB944"];
    const LINE_WEIGHT = 0.5;                  
    const TRAIL_LENGTH = 100; 
    const BIAS_VECTOR_X = 0.05; 
    const BIAS_VECTOR_Y = -0.05; 
    const NUM_LAYERS = 1; // For z-space effect

    // 2) Global Variables

    let img;            
    let layers = [];     
    let fieldW; 
    let fieldH; 
    let particles = []; 
    let currentPalette = BRAND_PALETTE_LIGHT; 
    let backgroundColor = '#ffffff'; 

    p.preload = function() {
        img = p.loadImage(IMAGE_PATH, loaded => {
            loaded.resize(RESIZE_WIDTH, 0); // Resize width to RESIZE_WIDTH; height auto
        });
    };

    p.setup = function() {
        // Initialize multiple flow fields for z-space
        img.loadPixels();
        fieldW = img.width;
        fieldH = img.height;

        for (let l = 0; l < NUM_LAYERS; l++) {
            let layerField = [];
            for (let y = 0; y < fieldH; y++) {
                for (let x = 0; x < fieldW; x++) {
                    let flippedY = fieldH - 1 - y;
                    let idx = (x + flippedY * fieldW) * 4;
                    let r = img.pixels[idx + 0];
                    let g = img.pixels[idx + 1];
                    let b = img.pixels[idx + 2];
                    let bright = (r + g + b) / 3.0;
                    let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
                    angle += FLOW_ROTATION_ANGLE + p.map(l, 0, NUM_LAYERS, -0.1, 0.1); // Layer variation
                    layerField[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
                }
            }
            layers.push(layerField);
        }

        // Create a WEBGL canvas
        const container = p.select('#sketch-container');
        p.createCanvas(container.width, container.height, p.WEBGL).parent(container);

        // Initialize particles for each layer
        for (let l = 0; l < NUM_LAYERS; l++) {
            for (let i = 0; i < NUM_PARTICLES / NUM_LAYERS; i++) {
                // Initialize trail as a formed line
                let angle = p.random(0, p.TWO_PI);
                let initialLength = TRAIL_LENGTH;
                let trail = [];

                for (let j = initialLength; j > 0; j--) {
                    trail.push({
                        x: p.random(0, p.width) - p.cos(angle) * j * 2,
                        y: p.random(0, p.height) - p.sin(angle) * j * 2
                    });
                }

                particles.push({
                    x: trail[trail.length - 1].x,
                    y: trail[trail.length - 1].y,
                    col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
                    trail: trail,
                    layer: l,
                    rotation: p.random(-0.005, 0.005),
                    offsetX: p.random(0, fieldW),
                    offsetY: p.random(0, fieldH)
                });
            }
        }

        p.background(backgroundColor);
        p.smooth();
    };

    p.draw = function() {
        p.background(backgroundColor);

        // Apply gentle rotation for z-space effect
        p.rotateX(p.frameCount * 0.0005);
        p.rotateY(p.frameCount * 0.0005);

        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
            let layerField = layers[particle.layer];

            // Map particle's position to flow field coordinates
            let sampledX = (particle.x / p.width) * fieldW + particle.offsetX;
            let sampledY = (particle.y / p.height) * fieldH + particle.offsetY;

            let ix = p.floor(p.constrain(sampledX, 0, fieldW - 1));
            let iy = p.floor(p.constrain(sampledY, 0, fieldH - 1));

            let vx = 0, vy = 0;

            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = layerField[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
            }

            // Apply bias and slight randomness
            let bias = p.createVector(
                BIAS_VECTOR_X + p.random(-0.02, 0.02),
                BIAS_VECTOR_Y + p.random(-0.02, 0.02)
            );
            vx += bias.x;
            vy += bias.y;

            // Update position
            particle.x += vx;
            particle.y += vy;

            // Wrap around logic is handled via trail reset
            // Check if the entire trail is outside the frame
            let isOutside = particle.trail.every(pos => 
                pos.x < 0 || pos.x > p.width || pos.y < 0 || pos.y > p.height
            );

            if (isOutside) {
                particle.trail = [];
                // Reinitialize trail as a formed line
                let angle = p.random(0, p.TWO_PI);
                for (let j = TRAIL_LENGTH; j > 0; j--) {
                    particle.trail.push({
                        x: particle.x - p.cos(angle) * j * 2,
                        y: particle.y - p.sin(angle) * j * 2
                    });
                }
                continue; // Skip drawing this frame for the reset particle
            }

            // Update the particle's trail
            particle.trail.push({x: particle.x, y: particle.y});
            if (particle.trail.length > TRAIL_LENGTH) {
                particle.trail.shift();
            }

            // Draw the particle's trail in 3D space
            p.stroke(particle.col);
            p.strokeWeight(LINE_WEIGHT);
            p.noFill();

            p.beginShape();
            for (let j = 0; j < particle.trail.length; j++) {
                let pos = particle.trail[j];
                let x = p.map(pos.x, 0, p.width, -p.width / 2, p.width / 2);
                let y = p.map(pos.y, 0, p.height, -p.height / 2, p.height / 2);
                let z = p.map(particle.layer, 0, NUM_LAYERS, -100, 100);
                p.vertex(x, y, z);
            }
            p.endShape();
        }
    };

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        p.resizeCanvas(container.width, container.height);
        p.background(backgroundColor);
    };

    p.setMode = function(darkMode) {
        if (darkMode) {
            currentPalette = BRAND_PALETTE_DARK;
            backgroundColor = '#003323'; 
        } else {
            currentPalette = BRAND_PALETTE_LIGHT;
            backgroundColor = '#ffffff'; 
        }

        for (let i = 0; i < particles.length; i++) {
            particles[i].col = p.color(currentPalette[p.floor(p.random(currentPalette.length))]);
        }

        p.background(backgroundColor);
    };
}
