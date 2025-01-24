// sketches/sketch4.js

export default function(p) {
    // 1) Tweakable Config:

    // Path to the terrain image used to generate the flow field
    const IMAGE_PATH = 'images/2.jpg'; 
    
    // The width to which the terrain image will be resized.
    // The height is automatically adjusted to maintain aspect ratio.
    const RESIZE_WIDTH = 1000; 

    const FLOW_ROTATION_ANGLE = -p.PI / 2; // Rotate by -90 degrees to make particles move upwards

    
    // Total number of particles that will move through the flow field
    const NUM_PARTICLES = 500; 
    
    // Number of line segments drawn per animation frame
    // Not needed when updating all particles each frame
    // const DRAW_STEPS_PER_FRAME = 600; 
    
    // Boolean flag to toggle the visibility of the background image
    const SHOW_BG_IMAGE = false; 
    
    // Opacity level for the background image (0 = fully transparent, 255 = fully opaque)
    const BG_OPACITY = 255; 
    
    // Array of color codes representing the light theme palette for the brand
    const BRAND_PALETTE_LIGHT = ["#4CB944"];
    
    // Array of color codes representing the dark theme palette for the brand
    // Uncomment the desired palette as needed
    // const BRAND_PALETTE_DARK = ["#A1C181", "#4CB944", "#2E86AB", "#E94E77"];
    const BRAND_PALETTE_DARK = ["#4CB944"];
     
    // Stroke weight for the lines drawn by particles
    const LINE_WEIGHT = 0.5;                  
    
    // Trail length for each particle (number of previous positions to store)
    const TRAIL_LENGTH = 100; // You can adjust this value as needed
    
    // Directional bias vector to guide particles from bottom left to top right
    const BIAS_VECTOR_X = 0.05; // Reduced horizontal bias component (rightward movement)
    const BIAS_VECTOR_Y = -0.05; // Reduced vertical bias component (upward movement)
    
    // 2) Global Variables
    
    // Variable to store the resized terrain image
    let img;            
    
    // Array to hold vectors representing the flow field derived from the image
    let field = [];     
    
    // Width of the flow field based on the resized image
    let fieldW; 
    
    // Height of the flow field based on the resized image
    let fieldH; 
    
    // Array to store all particle objects that move through the flow field
    let particles = []; 
    
    // Current color palette in use (initialized to light palette)
    let currentPalette = BRAND_PALETTE_LIGHT; 
    
    // Background color of the canvas (default is white)
    let backgroundColor = '#ffffff'; 
    
    /**
     * Preload function to load and resize the image before setup.
     */
    p.preload = function() {
        img = p.loadImage(IMAGE_PATH, loaded => {
            loaded.resize(RESIZE_WIDTH, 0); // Resize width to RESIZE_WIDTH; height auto
        });
    };
    
    p.setup = function() {
        // Select the sketch container element from the DOM
        const container = p.select('#sketch-container');
        
        // Get the width of the container
        const containerWidth = container.width;
        
        // Get the height of the container
        const containerHeight = container.height;
        
        // Create a canvas that matches the container's dimensions and attach it to the container
        p.createCanvas(containerWidth, containerHeight).parent(container);
        
        // Initialize the flow field based on the resized image dimensions
        fieldW = img.width;
        fieldH = img.height;
        field = new Array(fieldW * fieldH);
      
        // Load the pixel data of the image for flow field calculation
        img.loadPixels();
        for (let y = 0; y < fieldH; y++) {
            for (let x = 0; x < fieldW; x++) {
                // Flip the y-coordinate to align the flow field correctly
                let flippedY = fieldH - 1 - y;
                
                // Calculate the index with the flipped y-coordinate
                let idx = (x + flippedY * fieldW) * 4;
                
                // Retrieve pixel data and compute brightness
                let r = img.pixels[idx + 0];
                let g = img.pixels[idx + 1];
                let b = img.pixels[idx + 2];
                let bright = (r + g + b) / 3.0;
                
                // Map brightness to angle and apply rotation
                let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
                angle += FLOW_ROTATION_ANGLE;
                
                // Create and store the flow vector
                field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
            }
        }
        
      
        // Initialize particles with positions spread out across the canvas
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                // Initialize x-coordinate randomly across the entire width
                x: p.random(0, p.width),
                
                // Initialize y-coordinate randomly across the entire height
                y: p.random(0, p.height),
                
                // Assign a random color from the current palette to the particle
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
                
                // Initialize the trail as an empty array
                trail: [] 
            });
        }
      
        /*
        // Optional: Grid-Based Initialization for Even Distribution
        const gridCols = p.ceil(p.sqrt(NUM_PARTICLES));
        const gridRows = p.ceil(NUM_PARTICLES / gridCols);
        const spacingX = p.width / gridCols;
        const spacingY = p.height / gridRows;
        
        particles = []; // Reset particles array
        
        for (let i = 0; i < NUM_PARTICLES; i++) {
            let col = i % gridCols;
            let row = p.floor(i / gridCols);
            
            particles.push({
                // Position based on grid with random jitter
                x: col * spacingX + p.random(-spacingX * 0.2, spacingX * 0.2),
                y: row * spacingY + p.random(-spacingY * 0.2, spacingY * 0.2),
                
                // Assign a random color from the current palette to the particle
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
                
                // Initialize the trail as an empty array
                trail: [] 
            });
        }
        */
      
        // Set the initial background color of the canvas
        p.background(backgroundColor);
      
        // Enable smooth drawing
        p.smooth();
    };
    
    p.draw = function() {
        // Optionally draw the background image each frame
        if (SHOW_BG_IMAGE) {
            p.push(); // Save the current drawing state
            p.tint(255, BG_OPACITY);  // Apply transparency to the image
            p.image(img, 0, 0, p.width, p.height); // Draw the image stretched to canvas size
            p.pop(); // Restore the original drawing state
        } else {
            // Fade the background slightly to create a trailing effect
            p.fill(backgroundColor + 'CC'); // Adding 'CC' for 80% opacity
            p.noStroke();
            p.rect(0, 0, p.width, p.height); // Semi-transparent rectangle to fade trails
        }
      
        // Iterate through all particles to update and draw them
        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
      
            // Map the particle's current position to flow field coordinates
            let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
            let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
      
            // Initialize flow vector components
            let vx = 0, vy = 0;
            
            // Retrieve the flow vector from the field if within bounds
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
            }
      
            // Apply a directional bias towards the top right with slight randomness
            let bias = p.createVector(
                BIAS_VECTOR_X + p.random(-0.02, 0.02), // Slightly vary horizontal bias
                BIAS_VECTOR_Y + p.random(-0.02, 0.02)  // Slightly vary vertical bias
            );
            vx += bias.x;
            vy += bias.y;
      
            // Store previous position before updating
            let oldX = particle.x;
            let oldY = particle.y;
      
            // Update the particle's position based on the flow vector and bias
            particle.x += vx;
            particle.y += vy;
      
            // Flags to check if the particle has wrapped around
            let wrapped = false;
      
            // Wrap around the canvas edges to create continuous movement
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
      
            // If the particle has wrapped, reset its trail to avoid drawing lines across the canvas
            if (wrapped) {
                particle.trail = [];
                continue; // Skip drawing this frame for the wrapped particle
            }
      
            // Update the particle's trail
            particle.trail.push({x: particle.x, y: particle.y});
            if (particle.trail.length > TRAIL_LENGTH) {
                particle.trail.shift(); // Remove the oldest position to maintain trail length
            }
      
            // Draw the particle's trail
            p.stroke(particle.col);
            p.strokeWeight(LINE_WEIGHT);
            p.noFill();
            
            p.beginShape();
            for (let j = 0; j < particle.trail.length; j++) {
                p.vertex(particle.trail[j].x, particle.trail[j].y);
            }
            p.endShape();
        }
      
        // Optional: Stop the animation after a certain number of frames
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
        // Select the sketch container element
        const container = p.select('#sketch-container');
        
        // Get the updated width of the container
        const containerWidth = container.width;
        
        // Get the updated height of the container
        const containerHeight = container.height;
        
        // Resize the canvas to match the new container dimensions
        p.resizeCanvas(containerWidth, containerHeight);
        
        // Update the background color based on the current mode
        p.background(backgroundColor);
    };

    /**
     * Method to set the current mode (light or dark).
     * @param {boolean} darkMode - True for dark mode, false for light mode.
     */
    p.setMode = function(darkMode) {
        if (darkMode) {
            // Switch to dark color palette
            currentPalette = BRAND_PALETTE_DARK;
            
            // Set dark background color
            backgroundColor = '#003323'; 
        } else {
            // Switch to light color palette
            currentPalette = BRAND_PALETTE_LIGHT;
            
            // Set light background color
            backgroundColor = '#ffffff'; 
        }

        // Update each particle's color based on the new palette
        for (let i = 0; i < particles.length; i++) {
            particles[i].col = p.color(currentPalette[p.floor(p.random(currentPalette.length))]);
        }

        // Apply the new background color to the canvas
        p.background(backgroundColor);
    };
}
