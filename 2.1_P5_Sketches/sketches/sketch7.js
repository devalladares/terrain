// sketches/sketch.js

export default function(p) {
    /**************************************************
     * Flow-field "contour-ish" lines based on image brightness
     * 
     *  - Generates moving segments for particles following the flow field
     **************************************************/
  
    // ===========================
    // 1. Configuration Constants
    // ===========================
    const CONFIG = {
      // ---------------------------
      // Image Configuration
      // ---------------------------
      IMAGE_PATH: 'images/1.jpg',               // Path to the display image (background)
      CONTRAST_IMAGE_PATH: 'images/1contrast.jpg', // Path to the high-contrast image for flow field
      // ---------------------------
      // Flow Field Configuration
      // ---------------------------
      FLOW_VECTOR_SCALE: 2,                      // Scale factor to control movement per step (smaller for smoother flow)
      // ---------------------------
      // Particle Configuration
      // ---------------------------
      NUM_PARTICLES: 200,                        // Number of particles for denser trails
      PARTICLE_SPEED_LIMIT: 2,                   // Maximum speed for particles
      // ---------------------------
      // Appearance Configuration
      // ---------------------------
      SHOW_BG_IMAGE: true,                       // Toggle to show/hide background image
      BG_OPACITY: 20,                             // Background overlay opacity for fading trails (0..255)
      LINE_COLOR: '#FFFFFF',                     // Color of the contour lines (white)
      LINE_WEIGHT: 1,                             // Stroke weight for lines
      SEGMENT_LENGTH: 10,                         // Length of each moving line segment
      // ---------------------------
      // Canvas Configuration
      // ---------------------------
      CANVAS_SIZE: {
        WIDTH: 0,                                 // Width of the canvas. Set to 0 to match window width
        HEIGHT: 0                                 // Height of the canvas. Set to 0 to match window height
      },
      // ---------------------------
      // Particle Reset Configuration
      // ---------------------------
      PARTICLE_RESET_POSITION: {
        MIN_X: 0,                                 // Minimum X position for resetting particles
        MAX_X: 0,                                 // Maximum X position for resetting particles (updated dynamically)
        MIN_Y: 0,                                 // Minimum Y position for resetting particles
        MAX_Y: 0                                  // Maximum Y position for resetting particles (updated dynamically)
      },
      // ---------------------------
      // Debug Configuration
      // ---------------------------
      DEBUG: {
        SHOW_FLOW_FIELD: false,                   // Toggle to visualize the flow field
        SHOW_PARTICLES: false                     // Toggle to visualize particle positions
      },
      // ---------------------------
      // Frame Configuration
      // ---------------------------
      FRAME_LIMIT: 0                              // Set to 0 for infinite looping
    };
  
    // ===========================
    // 2. State Variables
    // ===========================
    let displayImg;           // Image object for display (background)
    let contrastImg;          // High-contrast image for generating flow field
    let field = [];           // Array of flow vectors based on contrast image
    let fieldW, fieldH;       // Width and height of the flow field
    let particles = [];       // Array to hold particle objects
  
    // ===========================
    // 3. p5.js Preload Function
    // ===========================
    p.preload = function() {
      // Load the display image (background)
      displayImg = p.loadImage(
        CONFIG.IMAGE_PATH,
        () => {
          console.log(`Display image "${CONFIG.IMAGE_PATH}" loaded successfully.`);
          // Resize if RESIZE_WIDTH is set (optional)
          if (CONFIG.RESIZE_WIDTH > 0) {
            displayImg.resize(CONFIG.RESIZE_WIDTH, 0);
          }
        },
        (err) => {
          console.error(`Failed to load display image at path: ${CONFIG.IMAGE_PATH}`, err);
        }
      );
  
      // Load the high-contrast image for flow field
      contrastImg = p.loadImage(
        CONFIG.CONTRAST_IMAGE_PATH,
        () => {
          console.log(`Contrast image "${CONFIG.CONTRAST_IMAGE_PATH}" loaded successfully.`);
          // Resize if RESIZE_WIDTH is set (optional)
          if (CONFIG.RESIZE_WIDTH > 0) {
            contrastImg.resize(CONFIG.RESIZE_WIDTH, 0);
          }
        },
        (err) => {
          console.error(`Failed to load contrast image at path: ${CONFIG.CONTRAST_IMAGE_PATH}`, err);
        }
      );
    };
  
    // ===========================
    // 4. p5.js Setup Function
    // ===========================
    p.setup = function() {
      // Determine canvas size based on window size or image dimensions
      let canvasWidth = CONFIG.CANVAS_SIZE.WIDTH;
      let canvasHeight = CONFIG.CANVAS_SIZE.HEIGHT;
  
      if (canvasWidth === 0) {
        canvasWidth = p.windowWidth; // Full window width
      }
      if (canvasHeight === 0) {
        canvasHeight = p.windowHeight; // Full window height
      }
  
      // Create the canvas with specified or calculated dimensions
      p.createCanvas(canvasWidth, canvasHeight).parent('sketch-container');
  
      // Display the background image stretched to fit the entire canvas
      if (CONFIG.SHOW_BG_IMAGE && displayImg) {
        p.image(displayImg, 0, 0, p.width, p.height); // Stretch image to fit canvas
      } else {
        p.background(0); // Black background if no image
      }
  
      // Initialize the flow field using the contrast image
      initializeFlowField();
  
      // Update particle reset boundaries based on canvas size
      CONFIG.PARTICLE_RESET_POSITION.MAX_X = p.width;
      CONFIG.PARTICLE_RESET_POSITION.MAX_Y = p.height;
  
      // Initialize particles with random positions
      for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
        particles.push(createParticle());
      }
  
      // Set stroke properties for contour lines
      p.stroke(CONFIG.LINE_COLOR);
      p.strokeWeight(CONFIG.LINE_WEIGHT);
      p.noFill();
    };
  
    // ===========================
    // 5. p5.js Draw Function
    // ===========================
    p.draw = function() {
      // Draw a semi-transparent overlay for fading trails
      p.push();
      p.noStroke();
      p.fill(0, 0, 0, CONFIG.BG_OPACITY); // Black with low opacity for dark trails
      p.rect(0, 0, p.width, p.height);
      p.pop();
  
      // Iterate through each particle once per frame
      particles.forEach(particle => {
        // Store old position for drawing
        let oldx = particle.x;
        let oldy = particle.y;
  
        // Determine the current flow field cell
        let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
        let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
  
        // Retrieve flow vector if within bounds
        let flowVector = p.createVector(0, 0);
        if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
          flowVector = field[ix + iy * fieldW].copy().mult(CONFIG.FLOW_VECTOR_SCALE);
        }
  
        // Update particle position based on flow vector
        particle.x += flowVector.x;
        particle.y += flowVector.y;
  
        // Check if particle is out of bounds
        if (isOutOfBounds(particle)) {
          resetParticle(particle);
          return; // Skip drawing the line to prevent unwanted lines across the canvas
        }
  
        // Calculate the end point for the moving segment
        let endX = particle.x + flowVector.x * CONFIG.SEGMENT_LENGTH;
        let endY = particle.y + flowVector.y * CONFIG.SEGMENT_LENGTH;
  
        // Draw a moving line segment from current position to end point
        p.stroke(CONFIG.LINE_COLOR);
        p.strokeWeight(CONFIG.LINE_WEIGHT);
        p.line(particle.x, particle.y, endX, endY);
      });
  
      // Optionally stop the sketch after a certain number of frames
      if (CONFIG.FRAME_LIMIT > 0 && p.frameCount > CONFIG.FRAME_LIMIT) {
        p.noLoop();
        console.log('Frame limit reached. Sketch stopped.');
      }
    };
  
    // ===========================
    // 6. Particle Management Functions
    // ===========================
  
    /**
     * Creates a new particle with random position.
     * @returns {Object} Particle object with x and y properties.
     */
    function createParticle() {
      return {
        x: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X),
        y: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y),
      };
    }
  
    /**
     * Resets a particle to a random position within specified bounds.
     * @param {Object} particle - The particle to reset.
     */
    function resetParticle(particle) {
      particle.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X);
      particle.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y);
    }
  
    /**
     * Checks if a particle is out of the canvas bounds.
     * @param {Object} particle - The particle to check.
     * @returns {boolean} True if out of bounds, else false.
     */
    function isOutOfBounds(particle) {
      return (
        particle.x < CONFIG.PARTICLE_RESET_POSITION.MIN_X ||
        particle.x >= CONFIG.PARTICLE_RESET_POSITION.MAX_X ||
        particle.y < CONFIG.PARTICLE_RESET_POSITION.MIN_Y ||
        particle.y >= CONFIG.PARTICLE_RESET_POSITION.MAX_Y
      );
    }
  
    // ===========================
    // 7. Flow Field Initialization
    // ===========================
  
    /**
     * Initializes the flow field based on the high-contrast image.
     * Uses brightness to determine the direction of flow vectors.
     */
    function initializeFlowField() {
      if (!contrastImg) return;
  
      // Set flow field dimensions based on the contrast image
      fieldW = contrastImg.width;
      fieldH = contrastImg.height;
      field = new Array(fieldW * fieldH);
  
      // Load pixels from the contrast image for flow field computation
      contrastImg.loadPixels();
      for (let y = 0; y < fieldH; y++) {
        for (let x = 0; x < fieldW; x++) {
          let idx = (x + y * fieldW) * 4;
          let r = contrastImg.pixels[idx];
          let g = contrastImg.pixels[idx + 1];
          let b = contrastImg.pixels[idx + 2];
          let bright = (r + g + b) / 3.0;
  
          // Map brightness to angle (0 to TWO_PI)
          // Higher brightness means steeper slope, guiding particles along contours
          let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
          field[x + y * fieldW] = p5.Vector.fromAngle(angle);
        }
      }
  
      console.log('Flow field initialized using contrast image.');
    }
  
    // ===========================
    // 8. Debugging Helper Functions
    // ===========================
  
    /**
     * Optionally visualizes the flow field vectors for debugging purposes.
     * Draws arrows representing flow vectors at each grid point.
     */
    function visualizeFlowField() {
      p.push();
      p.stroke(255, 0, 0); // Red color for flow vectors
      p.strokeWeight(0.5);
  
      // Determine grid spacing based on flow field dimensions
      let gridSpacingX = p.width / fieldW;
      let gridSpacingY = p.height / fieldH;
  
      for (let y = 0; y < fieldH; y++) {
        for (let x = 0; x < fieldW; x++) {
          let posX = x * gridSpacingX;
          let posY = y * gridSpacingY;
          let v = field[x + y * fieldW];
          p.line(
            posX,
            posY,
            posX + v.x * CONFIG.FLOW_VECTOR_SCALE,
            posY + v.y * CONFIG.FLOW_VECTOR_SCALE
          );
        }
      }
  
      p.pop();
    }
  
    // ===========================
    // 9. p5.js Event Functions
    // ===========================
    p.mousePressed = function() {
      // Reset all particles on mouse press
      particles.forEach(particle => resetParticle(particle));
      console.log('All particles have been reset.');
    };
  
    p.keyPressed = function() {
      // Toggle background image visibility on 'B' key press
      if (p.key === 'B' || p.key === 'b') {
        CONFIG.SHOW_BG_IMAGE = !CONFIG.SHOW_BG_IMAGE;
        console.log(`Background image visibility set to ${CONFIG.SHOW_BG_IMAGE}`);
  
        if (CONFIG.SHOW_BG_IMAGE && displayImg) {
          p.image(displayImg, 0, 0, p.width, p.height);
        } else {
          p.background(0); // Black background when image is hidden
        }
      }
  
      // Toggle flow field visualization on 'F' key press
      if (p.key === 'F' || p.key === 'f') {
        CONFIG.DEBUG.SHOW_FLOW_FIELD = !CONFIG.DEBUG.SHOW_FLOW_FIELD;
        console.log(`Flow field visualization set to ${CONFIG.DEBUG.SHOW_FLOW_FIELD}`);
      }
  
      // Toggle particle visualization on 'P' key press
      if (p.key === 'P' || p.key === 'p') {
        CONFIG.DEBUG.SHOW_PARTICLES = !CONFIG.DEBUG.SHOW_PARTICLES;
        console.log(`Particle visualization set to ${CONFIG.DEBUG.SHOW_PARTICLES}`);
      }
  
      // Save the canvas as an image on 'S' key press
      if (p.key === 'S' || p.key === 's') {
        p.saveCanvas('flow-field-trails', 'png');
        console.log('Canvas saved as flow-field-trails.png');
      }
    };
  
    // ===========================
    // 10. Window Resize Handling
    // ===========================
    p.windowResized = function() {
      // Adjust canvas size to window width and height
      let newWidth = p.windowWidth;
      let newHeight = p.windowHeight;
  
      p.resizeCanvas(newWidth, newHeight);
  
      // Redraw the background image stretched to new canvas size
      if (CONFIG.SHOW_BG_IMAGE && displayImg) {
        p.image(displayImg, 0, 0, p.width, p.height);
      } else {
        p.background(0); // Black background if no image
      }
  
      // Update particle reset boundaries based on new canvas size
      CONFIG.PARTICLE_RESET_POSITION.MAX_X = p.width;
      CONFIG.PARTICLE_RESET_POSITION.MAX_Y = p.height;
  
      // Optionally, reinitialize the flow field to match new canvas size
      // initializeFlowField();
  
      // Optionally, reset all particles to prevent glitches
      particles.forEach(particle => resetParticle(particle));
    };
  }
  