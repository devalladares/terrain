// sketches/sketchN.js

export default function(p) {
    /**************************************************
     * Flow-field "contour-ish" lines based on image brightness
     * 
     *  - Generates long trails for particles moving through the flow field
     **************************************************/

    // ===========================
    // Configuration Constants
    // ===========================
    const CONFIG = {
      IMAGE_PATH: 'images/4.png',           // Path to the terrain image
      RESIZE_WIDTH: 600,                     // Width to resize the image; height auto-scaled
      NUM_PARTICLES: 100,                    // Number of particles for denser trails
      SHOW_BG_IMAGE: true,                   // Toggle to show/hide background image
      BG_OPACITY: 0,                         // Opacity of background overlay for fading trails (0..255)
      LINE_COLOR: {
        GRAY: 255,                            // Gray scale value for lines
        ALPHA: undefined                      // Alpha value for lines (optional)
      },
      LINE_WEIGHT: 0.2,                       // Stroke weight for lines
      PARTICLE_RESET_POSITION: {
        MIN_X: 0,                             // Minimum X position for resetting particles
        MAX_X: () => p.width,                 // Dynamic maximum X based on canvas width
        MIN_Y: 0,                             // Minimum Y position for resetting particles
        MAX_Y: () => p.height                 // Dynamic maximum Y based on canvas height
      },
      CANVAS_SIZE: {
        WIDTH: 800,                           // Initial Width of the canvas (will be overridden by container size)
        HEIGHT: 800                           // Initial Height of the canvas (will be overridden by container size)
      },
      FRAME_LIMIT: 0,                        // Set to 0 for infinite looping
      DEBUG: {
        SHOW_FLOW_FIELD: false,               // Toggle to visualize the flow field
        SHOW_PARTICLES: false                 // Toggle to visualize particle positions
      },
      FLOW_VECTOR_SCALE: 3,                   // Scale factor to increase movement per step
    };

    // ===========================
    // State Variables
    // ===========================
    let img;             // Resized image
    let field = [];      // Array of flow vectors
    let fieldW, fieldH;  // Width and height of the flow field
    let particles = [];  // Array to hold particle objects
    let container;       // Sketch container
    let bgImageDisplayed = false; // Flag to check if background image is drawn

    // ===========================
    // p5.js Preload Function
    // ===========================
    p.preload = function() {
      // Load the image with success and error callbacks
      img = p.loadImage(
        CONFIG.IMAGE_PATH, 
        () => {
          console.log(`Image "${CONFIG.IMAGE_PATH}" loaded successfully.`);
        },
        (err) => {
          console.error(`Failed to load image "${CONFIG.IMAGE_PATH}".`, err);
        }
      );
    };

    // ===========================
    // p5.js Setup Function
    // ===========================
    p.setup = function() {
      // Select the sketch container from the HTML
      container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;

      // Create a canvas that matches the container's size
      p.createCanvas(containerWidth, containerHeight).parent(container);

      // Resize the image while maintaining aspect ratio based on the canvas size
      p.image(img, 0, 0);

      // Initialize flow field dimensions
      fieldW = img.width;
      fieldH = img.height;
      field = new Array(fieldW * fieldH);

      // Load image pixels for flow field computation
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
          field[x + y * fieldW] = p5.Vector.fromAngle(angle);
        }
      }

      // Initialize particles with random positions
      for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
        particles.push(createParticle());
      }

      // If SHOW_BG_IMAGE=true, draw the background image once
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255); // White background
      }
    };

    // ===========================
    // p5.js Draw Function
    // ===========================
    p.draw = function() {
      // Draw a semi-transparent overlay for fading trails
      p.push();
      p.noStroke();
      p.fill(255, CONFIG.BG_OPACITY); // White with low opacity to fade trails
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

        // Initialize flow vector components
        let vx = 0, vy = 0;

        // Retrieve flow vector if within bounds
        if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
          let v = field[ix + iy * fieldW];
          vx = v.x * CONFIG.FLOW_VECTOR_SCALE; // Scale the vector for longer movement
          vy = v.y * CONFIG.FLOW_VECTOR_SCALE;
        }

        // Update particle position
        particle.x += vx;
        particle.y += vy;

        // Check if particle is out of bounds
        if (isOutOfBounds(particle)) {
          resetParticle(particle);
          return; // Skip drawing the line
        }

        // Draw line from old position to new position
        setLineColor();
        p.strokeWeight(CONFIG.LINE_WEIGHT);
        p.line(oldx, oldy, particle.x, particle.y);

        // Optional: Visualize particle positions
        if (CONFIG.DEBUG.SHOW_PARTICLES) {
          p.push();
          p.noStroke();
          p.fill(0, 150);
          p.ellipse(particle.x, particle.y, 2, 2);
          p.pop();
        }

        // Optional: Visualize flow field for debugging
        if (CONFIG.DEBUG.SHOW_FLOW_FIELD) {
          visualizeFlowField(ix, iy, vx, vy);
        }
      });

      // Optionally stop the sketch after a certain number of frames
      if (CONFIG.FRAME_LIMIT > 0 && p.frameCount > CONFIG.FRAME_LIMIT) {
        p.noLoop();
        console.log('Frame limit reached. Sketch stopped.');
      }
    };

    // ===========================
    // Particle Management Functions
    // ===========================

    /**
     * Creates a new particle with random position.
     * @returns {Object} Particle object with x and y properties.
     */
    function createParticle() {
      return {
        x: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
        y: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
      };
    }

    /**
     * Resets a particle to a random position within specified bounds.
     * @param {Object} particle - The particle to reset.
     */
    function resetParticle(particle) {
      particle.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X());
      particle.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
    }

    /**
     * Checks if a particle is out of the canvas bounds.
     * @param {Object} particle - The particle to check.
     * @returns {boolean} True if out of bounds, else false.
     */
    function isOutOfBounds(particle) {
      return (
        particle.x < CONFIG.PARTICLE_RESET_POSITION.MIN_X ||
        particle.x >= CONFIG.PARTICLE_RESET_POSITION.MAX_X() ||
        particle.y < CONFIG.PARTICLE_RESET_POSITION.MIN_Y ||
        particle.y >= CONFIG.PARTICLE_RESET_POSITION.MAX_Y()
      );
    }

    // ===========================
    // Drawing Helper Functions
    // ===========================

    /**
     * Sets the stroke color based on configuration.
     */
    function setLineColor() {
      if (CONFIG.LINE_COLOR.ALPHA !== undefined) {
        p.stroke(CONFIG.LINE_COLOR.GRAY, CONFIG.LINE_COLOR.ALPHA);
      } else {
        p.stroke(CONFIG.LINE_COLOR.GRAY);
      }
    }

    /**
     * Optionally visualizes the flow field vectors for debugging.
     * @param {number} ix - Flow field cell x-index.
     * @param {number} iy - Flow field cell y-index.
     * @param {number} vx - Flow vector x-component.
     * @param {number} vy - Flow vector y-component.
     */
    function visualizeFlowField(ix, iy, vx, vy) {
      p.push();
      p.stroke(0, 150); // Semi-transparent black for vectors
      p.strokeWeight(0.5);
      let cellWidth = p.width / fieldW;
      let cellHeight = p.height / fieldH;
      let centerX = ix * cellWidth + cellWidth / 2;
      let centerY = iy * cellHeight + cellHeight / 2;
      p.line(
        centerX,
        centerY,
        centerX + vx * 10, // Scale vector for visibility
        centerY + vy * 10
      );
      p.pop();
    }

    /**
     * Draws the background image scaled to the canvas size.
     */
    function drawBackgroundImage() {
      p.background(255); // Clear to white
      p.image(img, 0, 0, p.width, p.height); // Stretch image to fit canvas
      bgImageDisplayed = true;
    }

    // ===========================
    // Optional p5.js Event Functions
    // ===========================
    p.mousePressed = function() {
      // Example: Reset all particles on mouse press
      particles.forEach(particle => resetParticle(particle));
      console.log('All particles have been reset.');
    };

    p.keyPressed = function() {
      // Example: Toggle background image visibility on key press
      if (p.key === 'B' || p.key === 'b') {
        CONFIG.SHOW_BG_IMAGE = !CONFIG.SHOW_BG_IMAGE;
        console.log(`Background image visibility set to ${CONFIG.SHOW_BG_IMAGE}`);

        if (CONFIG.SHOW_BG_IMAGE) {
          drawBackgroundImage();
        } else {
          p.background(255); // Remove background image
        }
      }

      // Example: Toggle flow field visualization
      if (p.key === 'F' || p.key === 'f') {
        CONFIG.DEBUG.SHOW_FLOW_FIELD = !CONFIG.DEBUG.SHOW_FLOW_FIELD;
        console.log(`Flow field visualization set to ${CONFIG.DEBUG.SHOW_FLOW_FIELD}`);
      }

      // Example: Save the canvas as an image
      if (p.key === 'S' || p.key === 's') {
        p.saveCanvas('flow-field-trails', 'png');
        console.log('Canvas saved as flow-field-trails.png');
      }
    };

    /**
     * Handles window resizing to maintain responsiveness.
     */
    p.windowResized = function() {
      if (container) {
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);

        // Resize the image while maintaining aspect ratio based on the new canvas size
        img.resize(CONFIG.RESIZE_WIDTH, 0); 

        // Recalculate flow field dimensions
        fieldW = img.width;
        fieldH = img.height;
        field = new Array(fieldW * fieldH);

        // Reload image pixels for flow field computation
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
            field[x + y * fieldW] = p5.Vector.fromAngle(angle);
          }
        }

        // Redraw background image if it's enabled
        if (CONFIG.SHOW_BG_IMAGE) {
          drawBackgroundImage();
        } else {
          p.background(255);
        }

        console.log('Canvas resized and background image updated.');
      }
    };
}
