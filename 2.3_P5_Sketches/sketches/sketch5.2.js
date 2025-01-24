// sketches/sketch4.js

export default function(p) {
    // 1) Tweakable Config:
    
    // Path to the terrain image used to generate the flow field
    const IMAGE_PATH = 'images/1.jpg'; 
    
    // The width to which the terrain image will be resized.
    // The height is automatically adjusted to maintain aspect ratio.
    const RESIZE_WIDTH = 200; 
    
    // Total number of particles that will move through the flow field
    const NUM_PARTICLES = 80; 
    
    // Number of line segments drawn per animation frame
    const DRAW_STEPS_PER_FRAME = 160; 
    
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
                // Calculate the index for the current pixel
                let idx = (x + y * fieldW) * 4;
                
                // Retrieve the red, green, and blue components of the pixel
                let r = img.pixels[idx + 0];
                let g = img.pixels[idx + 1];
                let b = img.pixels[idx + 2];
                
                // Compute the brightness of the pixel
                let bright = (r + g + b) / 3.0;
                
                // Map the brightness to an angle between 0 and TWO_PI radians
                let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
                
                // Create a vector based on the angle and store it in the flow field
                field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
            }
        }
      
        // Initialize particles with random positions and assign them colors from the current palette
        for (let i = 0; i < NUM_PARTICLES; i++) {
            particles.push({
                // Random x-coordinate within the canvas width
                x: p.random(p.width),
                
                // Random y-coordinate within the canvas height
                y: p.random(p.height),
                
                // Assign a random color from the current palette to the particle
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))])  
            });
        }
      
        // Set the initial background color of the canvas
        p.background(backgroundColor);
      
        // Disable drawing outlines for shapes (lines will only have stroke)
        p.noStroke();
    };
    
    p.draw = function() {
        // Optionally draw the background image each frame
        if (SHOW_BG_IMAGE) {
            p.push(); // Save the current drawing state
            p.tint(255, BG_OPACITY);  // Apply transparency to the image
            p.image(img, 0, 0, p.width, p.height); // Draw the image stretched to canvas size
            p.pop(); // Restore the original drawing state
        } 
        // Alternatively, you can fade lines by uncommenting the following:
        // else {
        //     p.background(255, 10); 
        // }
      
        // Perform multiple drawing steps within each frame for smoother animation
        for (let i = 0; i < DRAW_STEPS_PER_FRAME; i++) {
            // Select a random particle index
            let pIndex = p.floor(p.random(particles.length));
            
            // Retrieve the selected particle object
            let particle = particles[pIndex];
      
            // Map the particle's current position to flow field coordinates
            let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
            let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
      
            // Store the particle's old position before updating
            let oldx = particle.x;
            let oldy = particle.y;
      
            // Initialize flow vector components
            let vx = 0, vy = 0;
            
            // Retrieve the flow vector from the field if within bounds
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
            }
      
            // Update the particle's position based on the flow vector
            particle.x += vx;
            particle.y += vy;
      
            // Reset particle position if it moves out of canvas bounds
            if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
                particle.x = p.random(p.width);
                particle.y = p.random(p.height);
                continue; // Skip drawing if the particle was reset
            }
      
            // Set the stroke color for the line based on the particle's color
            p.stroke(particle.col);
            
            // Set the stroke weight for the line
            p.strokeWeight(LINE_WEIGHT);
            
            // Draw a line from the old position to the new position of the particle
            p.line(oldx, oldy, particle.x, particle.y);
        }
      
        // Optionally stop the animation after a certain number of frames
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
