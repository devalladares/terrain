// sketches/sketchTemplate.js

export default function(p) {
  // -------------------------------
  // 1. Configuration Parameters
  // -------------------------------

  // Example image path (adjust as needed)
  const IMAGE_PATH = 'images/example.jpg'; 

  // Example color palettes for light and dark modes
  const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
  };

  const COLOR_PALETTE_DARK = {
      background: '#121212',
      elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
  };

  // Number of particles or other dynamic elements
  const NUM_PARTICLES = 10;

  // Stroke weight for drawing
  const LINE_WEIGHT = 1;

  // -------------------------------
  // 2. Global Variables
  // -------------------------------

  let img;                 // Image object
  let particles = [];      // Array to hold particle objects
  let currentPalette;      // Current color palette based on mode
  let backgroundColor;     // Current background color

  // -------------------------------
  // 3. p5.js Lifecycle Methods
  // -------------------------------

  /**
   * Preload assets before the sketch starts.
   */
  p.preload = function() {
      img = p.loadImage(IMAGE_PATH, () => {
          // Image loaded successfully
          img.resize(200, 0); // Resize width to 200px; height auto
      }, () => {
          console.error(`Failed to load image at path: ${IMAGE_PATH}`);
      });
  };

  /**
   * Setup the sketch environment.
   */
  p.setup = function() {
      // Select the sketch container from the HTML
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;

      // Create a canvas that matches the container's size
      p.createCanvas(containerWidth, containerHeight).parent(container);

      // Initialize color palette and background color
      setInitialMode();

      // Initialize particles or other dynamic elements
      initializeParticles();

      // Set initial background
      p.background(backgroundColor);

      // Disable drawing outlines
      p.noStroke();
  };

  /**
   * The main draw loop.
   */
  p.draw = function() {
      // Example: Update and display particles
      updateAndDisplayParticles();
  };

  /**
   * Handle window resizing to maintain responsiveness.
   */
  p.windowResized = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
      p.resizeCanvas(containerWidth, containerHeight);
      
      // Optionally, reinitialize or adjust elements based on new size
      p.background(backgroundColor);
  };

  // -------------------------------
  // 4. Mode Handling Methods
  // -------------------------------

  /**
   * Initialize the mode based on the current state of the HTML body.
   */
  function setInitialMode() {
      const body = document.body;
      if (body.classList.contains('dark-mode')) {
          currentPalette = COLOR_PALETTE_DARK;
          backgroundColor = COLOR_PALETTE_DARK.background;
      } else {
          currentPalette = COLOR_PALETTE_LIGHT;
          backgroundColor = COLOR_PALETTE_LIGHT.background;
      }
  }

  /**
   * Method to set the current mode (light or dark).
   * This method will be called externally from main.js when toggling modes.
   * @param {boolean} darkMode - True for dark mode, false for light mode.
   */
  p.setMode = function(darkMode) {
      if (darkMode) {
          currentPalette = COLOR_PALETTE_DARK;
          backgroundColor = COLOR_PALETTE_DARK.background;
      } else {
          currentPalette = COLOR_PALETTE_LIGHT;
          backgroundColor = COLOR_PALETTE_LIGHT.background;
      }

      // Update visual elements based on the new palette
      updateVisualElements();

      // Update the background
      p.background(backgroundColor);
  };

  // -------------------------------
  // 5. Particle System (Example)
  // -------------------------------

  /**
   * Initialize particles with random positions and colors.
   */
  function initializeParticles() {
      for (let i = 0; i < NUM_PARTICLES; i++) {
          particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              col: p.color(randomColorFromPalette())
          });
      }
  }

  /**
   * Update particle positions and display them.
   */
  function updateAndDisplayParticles() {
      // Example logic: Move particles randomly and draw them
      p.background(backgroundColor, 10); // Slightly translucent background for trails

      particles.forEach(particle => {
          // Update position
          particle.x += p.random(-1, 1);
          particle.y += p.random(-1, 1);

          // Wrap around the canvas edges
          if (particle.x > p.width) particle.x = 0;
          if (particle.x < 0) particle.x = p.width;
          if (particle.y > p.height) particle.y = 0;
          if (particle.y < 0) particle.y = p.height;

          // Draw the particle
          p.fill(particle.col);
          p.circle(particle.x, particle.y, 5);
      });
  }

  /**
   * Update visual elements when the mode changes.
   * Customize this function based on your sketch's requirements.
   */
  function updateVisualElements() {
      // Example: Update colors of existing elements
      particles.forEach(particle => {
          particle.col = p.color(randomColorFromPalette());
      });
  }

  /**
   * Select a random color from the current palette.
   * @returns {string} - A color string from the palette.
   */
  function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
  }

  // -------------------------------
  // 6. Additional Helper Methods
  // -------------------------------

  // Add any additional helper methods below as needed.
}
