// sketches/sketch4.js

export default function(p) {
    // 1) Tweakable config:
    const IMAGE_PATH        = 'images/1.jpg';      // Your terrain image for the flow field
    const RESIZE_WIDTH      = 200;                // Resize image to this width; height auto
    const NUM_PARTICLES     = 10;                 // Number of particles
    const DRAW_STEPS_PER_FRAME = 30;              // Lines drawn per frame
    
    const SHOW_BG_IMAGE     = false;              // Toggle background image on/off
    const BG_OPACITY        = 255;                // Background image opacity (0..255)
    
    // Example brand color palette
    const BRAND_PALETTE = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
     
    // Line color can be randomized from BRAND_PALETTE
    const LINE_WEIGHT       = 1;                  // Stroke weight
    
    // 2) Global Variables
    let img;            // Resized image
    let field = [];     // Flow field vectors
    let fieldW, fieldH; // Flow field dimensions
    let particles = []; // Array to hold particle objects
    
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
        
        // Create canvas to match the container's size
        p.createCanvas(containerWidth, containerHeight).parent(container);
        
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
                field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
            }
        }
      
        // Create particles, each with a random color from the brand palette
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                col: p.color(BRAND_PALETTE[p.floor(p.random(BRAND_PALETTE.length))])  // Store color as p5.Color object
            });
        }
      
        // Set a pink background for testing
        p.background('pink');
      
        p.noStroke();
    };
    
    p.draw = function() {
        // Optional: Draw background image each frame
        if (SHOW_BG_IMAGE) {
            p.push();
            p.tint(255, BG_OPACITY);  // Set the alpha for the background image
            p.image(img, 0, 0, p.width, p.height); // Stretch to canvas
            p.pop();
        } 
        // If you prefer to fade lines instead:
        // else {
        //     p.background(255, 10); 
        // }
      
        // Perform multiple draw steps per frame
        for (let i = 0; i < DRAW_STEPS_PER_FRAME; i++) {
            let pIndex = p.floor(p.random(particles.length));
            let particle = particles[pIndex];
      
            // Map particle position to flow field coordinates
            let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
            let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
      
            // Store old position for drawing a line
            let oldx = particle.x;
            let oldy = particle.y;
      
            // Get flow vector from the field
            let vx = 0, vy = 0;
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
            }
      
            // Update particle position
            particle.x += vx;
            particle.y += vy;
      
            // If out of bounds, reset particle position
            if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
                particle.x = p.random(p.width);
                particle.y = p.random(p.height);
                continue; // Skip drawing if particle is reset
            }
      
            // Draw line from old position to new position
            p.stroke(particle.col);
            p.strokeWeight(LINE_WEIGHT);
            p.line(oldx, oldy, particle.x, particle.y);
        }
      
        // Optionally, stop after some frames:
        // if (p.frameCount > 1000) p.noLoop();
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
        
        // Optionally, you can rebuild the flow field or reset particles here
        p.background('pink'); // Reset background after resizing
    };
}
