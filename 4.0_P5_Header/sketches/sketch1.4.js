// sketches/sketchN.js

export default function(p) {
  /**************************************************
   * Enhanced Flow-field "contour-ish" lines with Depth and Layering
   * 
   * - Implements multiple flow fields with unique properties
   * - Adds parallax effects for depth perception
   * - Fixes particle wrapping to prevent unwanted straight lines
   **************************************************/

  // ===========================
  // Configuration Constants
  // ===========================
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',           // Path to the terrain image
    RESIZE_WIDTH: 600,                     // Width to resize the image; height auto-scaled
    NUM_PARTICLES_PER_LAYER: 50,           // Number of particles per layer
    SHOW_BG_IMAGE: true,                   // Toggle to show/hide background image
    BG_OPACITY: 0,                        // Opacity of background overlay for fading trails (0..255)
    LINE_COLOR: {
      GRAY: 255,                            // Default Gray scale value for lines (fallback)
      ALPHA: 100,                            // Alpha value for lines (optional)
    },
    LINE_WEIGHT: 1,                        // Base stroke weight for lines
    PARTICLE_RESET_POSITION: {
      MIN_X: 0,                             // Minimum X position for resetting particles
      MAX_X: () => p.width,                 // Dynamic maximum X based on canvas width
      MIN_Y: 0,                             // Minimum Y position for resetting particles
      MAX_Y: () => p.height,                // Dynamic maximum Y based on canvas height
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
    FLOW_VECTOR_SCALE: 5,                  // Base scale factor to increase movement per step
    LAYERS: [                              // Define multiple layers with unique properties
      {
        color: '#F098F4',                  // Light Purple
        vectorScale: 4,
        parallaxOffset: { x: 0, y: 0 },
      },
      {
        color: '#57D7F2',                  // Light Blue
        vectorScale: 6,
        parallaxOffset: { x: 1, y: 1 },
      },
      {
        color: '#96D39B',                  // Light Green
        vectorScale: 8,
        parallaxOffset: { x: 2, y: 2 },
      },
      {
        color: '#003323',                  // Dark Green
        vectorScale: 10,
        parallaxOffset: { x: 3, y: 3 },
      }
    ],
    FLOW_FIELD_RESOLUTION: 20,              // Determines the density of the flow field
  };

  // ===========================
  // State Variables
  // ===========================
  let img;             // Resized image
  let layers = [];     // Array to hold Layer objects
  let container;       // Sketch container

  // ===========================
  // Layer Class Definition
  // ===========================
  class Layer {
    constructor(config, flowField) {
      this.color = p.color(config.color);
      this.vectorScale = config.vectorScale;
      this.parallaxOffset = config.parallaxOffset;
      this.flowField = flowField; // Object containing vectors, cols, rows, resolution
      this.particles = [];

      // Initialize particles for this layer
      for (let i = 0; i < CONFIG.NUM_PARTICLES_PER_LAYER; i++) {
        this.particles.push(this.createParticle());
      }
    }

    /**
     * Creates a new particle with random position.
     * @returns {Object} Particle object with x and y properties.
     */
    createParticle() {
      return {
        x: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
        y: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
      };
    }

    /**
     * Resets a particle to a random position within specified bounds.
     * @param {Object} particle - The particle to reset.
     */
    resetParticle(particle) {
      particle.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X());
      particle.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
    }

    /**
     * Checks if a particle is completely off the canvas.
     * @param {Object} particle - The particle to check.
     * @returns {boolean} True if the particle is off-screen, else false.
     */
    isOffScreen(particle) {
      return (
        particle.x < -50 || // Adding margin
        particle.x > p.width + 50 ||
        particle.y < -50 ||
        particle.y > p.height + 50
      );
    }

    /**
     * Updates and renders all particles in this layer.
     */
    updateAndRender() {
      this.particles.forEach(particle => {
        // Store old position for drawing
        let oldx = particle.x;
        let oldy = particle.y;

        // Determine the current flow field cell
        let ix = p.floor(p.map(particle.x, 0, p.width, 0, this.flowField.cols));
        let iy = p.floor(p.map(particle.y, 0, p.height, 0, this.flowField.rows));

        // Initialize flow vector components
        let vx = 0, vy = 0;

        // Retrieve flow vector if within bounds
        if (ix >= 0 && ix < this.flowField.cols && iy >= 0 && iy < this.flowField.rows) {
          let index = ix + iy * this.flowField.cols;
          let v = this.flowField.vectors[index];
          vx = v.x * this.vectorScale;
          vy = v.y * this.vectorScale;
        }

        // Update particle position
        particle.x += vx;
        particle.y += vy;

        // Apply parallax offset based on layer depth
        particle.x += this.parallaxOffset.x;
        particle.y += this.parallaxOffset.y;

        // Check if particle is off-screen
        if (this.isOffScreen(particle)) {
          this.resetParticle(particle);
          return; // Skip drawing the line to prevent unwanted lines
        }

        // Draw line from old position to new position
        p.stroke(this.color);
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
          this.visualizeFlowField(ix, iy, vx, vy);
        }
      });
    }

    /**
     * Optionally visualizes the flow field vectors for debugging.
     * @param {number} ix - Flow field cell x-index.
     * @param {number} iy - Flow field cell y-index.
     * @param {number} vx - Flow vector x-component.
     * @param {number} vy - Flow vector y-component.
     */
    visualizeFlowField(ix, iy, vx, vy) {
      p.push();
      p.stroke(0, 150); // Semi-transparent black for vectors
      p.strokeWeight(0.5);
      let cellWidth = p.width / this.flowField.cols;
      let cellHeight = p.height / this.flowField.rows;
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
  }

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
    img.resize(CONFIG.RESIZE_WIDTH, 0); // Height auto-scaled

    // Initialize flow fields for each layer
    CONFIG.LAYERS.forEach(layerConfig => {
      const flowField = generateFlowField(layerConfig.vectorScale);
      layerConfig.flowField = flowField;
      layers.push(new Layer(layerConfig, flowField));
    });

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

    // Iterate through each layer and update/render particles
    layers.forEach(layer => {
      layer.updateAndRender();
    });

    // Optionally stop the sketch after a certain number of frames
    if (CONFIG.FRAME_LIMIT > 0 && p.frameCount > CONFIG.FRAME_LIMIT) {
      p.noLoop();
      console.log('Frame limit reached. Sketch stopped.');
    }
  };

  // ===========================
  // Flow Field Generation
  // ===========================

  /**
   * Generates a flow field based on the image brightness.
   * @param {number} vectorScale - Scale factor for the flow vectors.
   * @returns {Object} Flow field object containing vectors, cols, rows, resolution.
   */
  function generateFlowField(vectorScale) {
    const resolution = CONFIG.FLOW_FIELD_RESOLUTION;
    const cols = Math.floor(img.width / resolution);
    const rows = Math.floor(img.height / resolution);
    const vectors = new Array(cols * rows);

    img.loadPixels();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Calculate the pixel index for the top-left corner of the cell
        let pixelX = x * resolution;
        let pixelY = y * resolution;
        let pixelIndex = (pixelX + pixelY * img.width) * 4;

        let r = img.pixels[pixelIndex + 0];
        let g = img.pixels[pixelIndex + 1];
        let b = img.pixels[pixelIndex + 2];
        let bright = (r + g + b) / 3.0;

        // Map brightness to angle
        let angle = p.map(bright, 0, 255, p.TWO_PI, 0);
        vectors[x + y * cols] = p5.Vector.fromAngle(angle);
      }
    }

    return { vectors, cols, rows, resolution };
  }

  // ===========================
  // Drawing Helper Functions
  // ===========================

  /**
   * Draws the background image scaled to the canvas size.
   */
  function drawBackgroundImage() {
    p.background(255); // Clear to white
    p.image(img, 0, 0, p.width, p.height); // Stretch image to fit canvas
  }

  // ===========================
  // Optional p5.js Event Functions
  // ===========================
  p.mousePressed = function() {
    // Example: Reset all particles on mouse press
    layers.forEach(layer => {
      layer.particles.forEach(particle => layer.resetParticle(particle));
    });
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

      // Regenerate flow fields for each layer based on new image size
      layers = []; // Clear existing layers
      CONFIG.LAYERS.forEach(layerConfig => {
        const flowField = generateFlowField(layerConfig.vectorScale);
        layerConfig.flowField = flowField;
        layers.push(new Layer(layerConfig, flowField));
      });

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
