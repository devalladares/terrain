// sketches/sketch4_3D.js

export default function(p) {
    // 1) Tweakable config:
    const IMAGE_PATH        = 'images/1.jpg';      // Your terrain image for the flow field
    const RESIZE_WIDTH      = 200;                // Resize image to this width; height auto
    const NUM_PARTICLES     = 100;                // Increased number of particles for 3D effect
    const DRAW_STEPS_PER_FRAME = 5;               // Adjusted for performance in 3D
    
    const SHOW_BG_IMAGE     = false;              // Toggle background image on/off
    const BG_OPACITY        = 255;                // Background image opacity (0..255)
    
    // Example brand color palette
    const BRAND_PALETTE_LIGHT = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
    const BRAND_PALETTE_DARK = ["#4CB944"];
     
    // Line color can be randomized from BRAND_PALETTE
    const LINE_WEIGHT       = 1;                  // Stroke weight
    
    // 2) Global Variables
    let img;            // Resized image
    let field = [];     // Flow field vectors
    let fieldW, fieldH; // Flow field dimensions
    let particles = []; // Array to hold particle objects
    let currentPalette = BRAND_PALETTE_LIGHT; // Current color palette
    let backgroundColor = '#ffffff'; // Default background color
    
    let angle = 0;      // Rotation angle
    
    /**
     * Preload function to load and resize the image before setup.
     */
    p.preload = function() {
        img = p.loadImage(IMAGE_PATH, loaded => {
            loaded.resize(RESIZE_WIDTH, 0); // Resize width to RESIZE_WIDTH; height auto
        });
    };
    
    p.setup = function() {
        // Select the sketch container
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        
        // Create a WEBGL canvas to enable 3D rendering
        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
        
        // Initialize the flow field from the resized image
        fieldW = img.width;
        fieldH = img.height;
        field = new Array(fieldW * fieldH);
      
        img.loadPixels();
        for (let y = 0; y < fieldH; y++) {
            for (let x = 0; x < fieldW; x++) {
                let idx = (x + y * fieldW) * 4;
                let r = img.pixels[idx + 0];
                let g = img.pixels[idx + 1];
                let b = img.pixels[idx + 2];
                let bright = (r + g + b) / 3.0;
                // Map brightness to angle
                let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
                field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle), p.random(-1, 1));
            }
        }
      
        // Create particles, each with a random color from the brand palette
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                position: p.createVector(
                    p.random(-p.width / 2, p.width / 2),
                    p.random(-p.height / 2, p.height / 2),
                    p.random(-200, 200) // Z-axis range
                ),
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
                history: [] // To store previous positions for drawing trails
            });
        }
      
        // Set a background color based on the current mode
        p.background(backgroundColor);
      
        p.noFill();
    };
    
    p.draw = function() {
        p.background(backgroundColor, 20); // Semi-transparent background for trail effect
        
        // Apply gentle rotation
        angle += 0.001;
        p.push();
        p.rotateY(angle);
        p.rotateX(angle * 0.3);
        
        // Perform draw steps per frame
        for (let i = 0; i < DRAW_STEPS_PER_FRAME; i++) {
            let pIndex = p.floor(p.random(particles.length));
            let particle = particles[pIndex];
      
            // Map particle position to flow field coordinates
            let ix = p.floor(p.map(particle.position.x, -p.width / 2, p.width / 2, 0, fieldW));
            let iy = p.floor(p.map(particle.position.y, -p.height / 2, p.height / 2, 0, fieldH));
      
            // Get flow vector from the field
            let vx = 0, vy = 0, vz = 0;
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
                vz = v.z;
            }
      
            // Update particle position
            particle.position.x += vx;
            particle.position.y += vy;
            particle.position.z += vz;
      
            // Add current position to history
            particle.history.push(p.createVector(particle.position.x, particle.position.y, particle.position.z));
            if (particle.history.length > 10) particle.history.shift(); // Limit trail length
      
            // If out of bounds, reset particle position
            if (
                particle.position.x < -p.width / 2 || particle.position.x > p.width / 2 ||
                particle.position.y < -p.height / 2 || particle.position.y > p.height / 2 ||
                particle.position.z < -200 || particle.position.z > 200
            ) {
                particle.position.set(
                    p.random(-p.width / 2, p.width / 2),
                    p.random(-p.height / 2, p.height / 2),
                    p.random(-200, 200)
                );
                particle.history = [];
                continue; // Skip drawing if particle is reset
            }
      
            // Draw trail
            p.beginShape();
            p.stroke(particle.col);
            p.strokeWeight(LINE_WEIGHT);
            for (let j = 0; j < particle.history.length - 1; j++) {
                let pos1 = particle.history[j];
                let pos2 = particle.history[j + 1];
                p.vertex(pos1.x, pos1.y, pos1.z);
                p.vertex(pos2.x, pos2.y, pos2.z);
            }
            p.endShape();
        }
      
        p.pop();
    };
    
    // Optional: Additional p5.js lifecycle methods
    p.mousePressed = function() {
        // Placeholder for mouse interaction (if needed)
    };
    
    p.keyPressed = function() {
        // Placeholder for key interaction (if needed)
    };
    
    // Handle window resizing to maintain responsiveness
    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);
        
        // Update background based on the current mode
        p.background(backgroundColor);
    };

    /**
     * Method to set the current mode (light or dark).
     * @param {boolean} darkMode - True for dark mode, false for light mode.
     */
    p.setMode = function(darkMode) {
        if (darkMode) {
            currentPalette = BRAND_PALETTE_DARK;
            backgroundColor = '#003323'; // Dark background
        } else {
            currentPalette = BRAND_PALETTE_LIGHT;
            backgroundColor = '#ffffff'; // Light background
        }

        // Update all particles with the new color palette
        for (let i = 0; i < particles.length; i++) {
            particles[i].col = p.color(currentPalette[p.floor(p.random(currentPalette.length))]);
        }

        // Update the background
        p.background(backgroundColor);
    };
}
