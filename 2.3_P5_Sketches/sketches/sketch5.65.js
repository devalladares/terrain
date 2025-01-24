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
    const NUM_PARTICLES = 200; 
    
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
    const BIAS_VECTOR_Z = 0.0; // Optional: Add bias for Z-axis
    
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
    
    // Rotation angles for auto-rotation
    let rotationX = 0;
    let rotationY = 0;
    
    // Rotation speed
    let autoRotateSpeedX = 0.001;
    let autoRotateSpeedY = 0.001;
    
    // Mouse-controlled rotation factors
    let mouseRotationFactor = 0.1;
    
    // Rotation modes
    let autoRotate = true;
    let mouseControl = true;
    
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
        
        // Create a WEBGL canvas that matches the container's dimensions and attach it to the container
        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
        
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
                
                // Map brightness to angles for X-Y plane
                let angleXY = p.map(bright, 0, 255, 0, p.TWO_PI);
                angleXY += FLOW_ROTATION_ANGLE;
                
                // Additional mapping for Z-axis based on brightness
                let angleZ = p.map(bright, 0, 255, -p.PI / 6, p.PI / 6); // Adjust range for subtle Z movement
                
                // Create flow vectors with Z component
                let vx = p.cos(angleXY) * p.cos(angleZ);
                let vy = p.sin(angleXY) * p.cos(angleZ);
                let vz = p.sin(angleZ);
                
                // Normalize the vector to maintain consistent speed
                let v = p.createVector(vx, vy, vz).normalize();
                field[x + y * fieldW] = v;
            }
        }
      
        // Initialize particles with positions and trail arrays
        for (let i = 0; i < NUM_PARTICLES; i++) {
            let initialX = p.random(-p.width / 2, p.width / 2); // Centered in WEBGL
            let initialY = p.random(-p.height / 2, p.height / 2);
            let initialZ = p.random(-500, 500); // Depth range; adjust as needed
            particles.push({
                x: initialX,
                y: initialY,
                z: initialZ,            // Initialize z-coordinate
                trail: [{x: initialX, y: initialY, z: initialZ}], // Initialize trail with starting position
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
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
                x: col * spacingX + p.random(-spacingX * 0.2, spacingX * 0.2) - p.width / 2,
                y: row * spacingY + p.random(-spacingY * 0.2, spacingY * 0.2) - p.height / 2,
                z: p.random(-500, 500), // Depth position
                
                // Assign a random color from the current palette to the particle
                col: p.color(currentPalette[p.floor(p.random(currentPalette.length))]),
                
                // Initialize the trail as an empty array
                trail: [{x: initialX, y: initialY, z: initialZ}], // Initialize trail
            });
        }
        */
      
        // Set the initial background color of the canvas
        p.background(backgroundColor);
      
        // Enable smooth drawing
        p.smooth();
        
        // Optional: Disable stroke for background image drawing
        p.noStroke();
    };
    
    p.draw = function() {
        // Clear the background
        p.background(backgroundColor);
    
        // Apply rotations based on modes
        if (autoRotate) {
            p.rotateX(rotationX);
            p.rotateY(rotationY);
            
            // Increment rotation angles for auto-rotation
            rotationX += autoRotateSpeedX;
            rotationY += autoRotateSpeedY;
        }
        
        if (mouseControl) {
            let rotX = p.map(p.mouseY, 0, p.height, -mouseRotationFactor, mouseRotationFactor);
            let rotY = p.map(p.mouseX, 0, p.width, -mouseRotationFactor, mouseRotationFactor);
            p.rotateX(rotX);
            p.rotateY(rotY);
        }
    
        // Iterate through all particles to update and draw them
        for (let i = 0; i < particles.length; i++) {
            let particle = particles[i];
      
            // Map the particle's current position to flow field coordinates
            let ix = p.floor(p.map(particle.x, -p.width / 2, p.width / 2, 0, fieldW));
            let iy = p.floor(p.map(particle.y, -p.height / 2, p.height / 2, 0, fieldH));
      
            // Initialize flow vector components
            let vx = 0, vy = 0, vz = 0;
            
            // Retrieve the flow vector from the field if within bounds
            if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
                let v = field[ix + iy * fieldW];
                vx = v.x;
                vy = v.y;
                vz = v.z;
            }
      
            // Apply a directional bias towards the top right with slight randomness
            let bias = p.createVector(
                BIAS_VECTOR_X + p.random(-0.02, 0.02), // Slightly vary horizontal bias
                BIAS_VECTOR_Y + p.random(-0.02, 0.02), // Slightly vary vertical bias
                BIAS_VECTOR_Z + p.random(-0.02, 0.02)  // Slightly vary Z bias
            );
            vx += bias.x;
            vy += bias.y;
            vz += bias.z;
      
            // Update the particle's position based on the flow vector and bias
            particle.x += vx;
            particle.y += vy;
            particle.z += vz;
      
            // Flags to check if the particle has wrapped around
            let wrapped = false;
      
            // Wrap around the canvas edges to create continuous movement
            if (particle.x < -p.width / 2) {
                particle.x = p.width / 2;
                wrapped = true;
            }
            if (particle.x > p.width / 2) {
                particle.x = -p.width / 2;
                wrapped = true;
            }
            if (particle.y < -p.height / 2) {
                particle.y = p.height / 2;
                wrapped = true;
            }
            if (particle.y > p.height / 2) {
                particle.y = -p.height / 2;
                wrapped = true;
            }
            if (particle.z < -500) { // Adjust based on z range
                particle.z = 500;
                wrapped = true;
            }
            if (particle.z > 500) {
                particle.z = -500;
                wrapped = true;
            }
      
            // If the particle has wrapped, reset its trail to avoid drawing lines across the canvas
            if (wrapped) {
                particle.trail = [{x: particle.x, y: particle.y, z: particle.z}];
                continue; // Skip drawing this frame for the wrapped particle
            }
      
            // Update the particle's trail
            particle.trail.push({x: particle.x, y: particle.y, z: particle.z});
            if (particle.trail.length > TRAIL_LENGTH) {
                particle.trail.shift(); // Remove the oldest position to maintain trail length
            }
      
            // Draw the particle's trail as a continuous 3D line
            p.beginShape();
            p.noFill();
            p.strokeWeight(LINE_WEIGHT);
            for (let j = 0; j < particle.trail.length; j++) {
                let pos = particle.trail[j];
                
                // Depth-Based Color Tinting
                let alpha = p.map(pos.z, -500, 500, 50, 255); // Adjust range as needed
                let col = p.color(
                    p.red(particle.col),
                    p.green(particle.col),
                    p.blue(particle.col),
                    alpha
                );
                p.stroke(col);
                
                // Optionally, Depth-Based Stroke Weight
                /*
                let sw = p.map(Math.abs(pos.z), 0, 500, LINE_WEIGHT * 2, LINE_WEIGHT);
                p.strokeWeight(sw);
                */
                
                p.vertex(pos.x, pos.y, pos.z);
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
        // Toggle auto-rotation with 'A' and mouse-controlled rotation with 'M'
        if (p.key === 'A' || p.key === 'a') {
            autoRotate = !autoRotate;
        }
        if (p.key === 'M' || p.key === 'm') {
            mouseControl = !mouseControl;
        }
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

        // Apply the new background color to the canvas
        p.background(backgroundColor);

        // Update each particle's color based on the new palette
        for (let i = 0; i < particles.length; i++) {
            particles[i].col = p.color(currentPalette[p.floor(p.random(currentPalette.length))]);
        }
    };
}
