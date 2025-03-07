export default function(p) {
    // 1) Tweakable Config:

    // ---- Flow Field Settings ----
    const NOISE_SCALE = 0.005;          // The smaller this value, the smoother/larger-scale the waves.
    const NOISE_MULTIPLIER = 4;         // Multiplies the noise value to get a wider range of angles (e.g., 2π * NOISE_MULTIPLIER).
    const FLOW_ROTATION_OFFSET = 0;     // Extra offset in angle if you want to rotate the flow globally.
    
    // ---- Particle Settings ----
    const NUM_PARTICLES = 800;          // Total number of particles
    const TRAIL_LENGTH = 80;            // How long each particle's trail is
    const LINE_WEIGHT = 0.7;            // Thickness of each line
    const PARTICLE_ALPHA = 60;          // Alpha for the stroke color (0-255)

    // ---- Bias Settings (optional) ----
    // If you’d like a slight directional drift (e.g., all lines slowly moving upward),
    // set these to small non-zero values. Otherwise, set to 0 for pure “wave” flow.
    const BIAS_VECTOR_X = 0.0;
    const BIAS_VECTOR_Y = 0.0;

    // ---- Visual/Theme Settings ----
    // Updated palettes to use #4CB944
    const BRAND_PALETTE_LIGHT = ["#4CB944", "#66D16F"]; 
    const BRAND_PALETTE_DARK  = ["#4CB944", "#66D16F"]; 

    // For simplicity, we’ll default to dark mode here. You can switch it in p.setMode().
    let currentPalette = BRAND_PALETTE_DARK; 
    let backgroundColor = '#003323'; 
    
    // 2) Global Variables
    let fieldW, fieldH;    // Dimensions for the flow field
    let field = [];        // The array of p5.Vectors describing the flow
    let particles = [];    // All particle objects
    
    // --------------------------------------------------------------
    // p5.js Life Cycle
    // --------------------------------------------------------------

    p.preload = function() {
        // We’re no longer loading an image, so nothing here.
    };

    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        
        p.createCanvas(containerWidth, containerHeight).parent(container);
        
        // Initialize flow field dimensions to match the canvas
        fieldW = p.width;
        fieldH = p.height;
        field = new Array(fieldW * fieldH);

        // Build the flow field from Perlin noise
        for (let y = 0; y < fieldH; y++) {
            for (let x = 0; x < fieldW; x++) {
                // Get a noise value in [0,1], scale it to [0, TWO_PI * NOISE_MULTIPLIER]
                let n = p.noise(x * NOISE_SCALE, y * NOISE_SCALE);
                let angle = n * p.TWO_PI * NOISE_MULTIPLIER + FLOW_ROTATION_OFFSET;
                
                // Create the corresponding vector
                let v = p.createVector(p.cos(angle), p.sin(angle));
                field[x + y * fieldW] = v;
            }
        }

        // Initialize particles
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                col: getRandomColorFromPalette(currentPalette, PARTICLE_ALPHA),
                trail: []
            });
        }

        // Set the starting background
        p.background('#003323');
        p.smooth();
    };

    p.draw = function() {
        // Optionally fade out old frames slightly to create trailing lines
        // Use a semi-transparent rect over the whole canvas
        p.fill(p.color(backgroundColor + '10'));  // e.g., ~6% opacity
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // Update and draw each particle
        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];

            // Map particle's position to field indices
            let ix = p.floor(particle.x);
            let iy = p.floor(particle.y);

            let vx = 0, vy = 0;
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
            }

            // Apply bias if desired
            vx += BIAS_VECTOR_X;
            vy += BIAS_VECTOR_Y;

            // Update particle position
            let oldX = particle.x;
            let oldY = particle.y;
            particle.x += vx;
            particle.y += vy;

            // Wrap around edges
            let wrapped = false;
            if (particle.x < 0) {
                particle.x = p.width;
                wrapped = true;
            }
            if (particle.x > p.width) {
                particle.x = 0;
                wrapped = true;
            }
            if (particle.y < 0) {
                particle.y = p.height;
                wrapped = true;
            }
            if (particle.y > p.height) {
                particle.y = 0;
                wrapped = true;
            }

            // If the particle has wrapped, reset its trail 
            if (wrapped) {
                particle.trail = [];
                continue;
            }

            // Update trail
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > TRAIL_LENGTH) {
                particle.trail.shift();
            }

            // Draw the trail
            p.stroke(particle.col);
            p.strokeWeight(LINE_WEIGHT);
            p.noFill();
            p.beginShape();
            for (let j = 0; j < particle.trail.length; j++) {
                p.vertex(particle.trail[j].x, particle.trail[j].y);
            }
            p.endShape();
        }
    };

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        
        p.resizeCanvas(containerWidth, containerHeight);
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

        // Reassign colors to existing particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].col = getRandomColorFromPalette(currentPalette, PARTICLE_ALPHA);
        }

        p.background(backgroundColor);
    };

    // 3) Utility Functions
    function getRandomColorFromPalette(palette, alphaVal) {
        let c = p.color(palette[p.floor(p.random(palette.length))]);
        c.setAlpha(alphaVal);
        return c;
    }
}
