export default function (p) {
  // -------------------------------
  // 1. Configuration Parameters
  // -------------------------------
  
  // Number of fluid lines to display
  const NUM_LINES = 20;
  
  // Number of points per each fluid line
  const POINTS_PER_LINE = 100;
  
  // Maximum amplitude for the wave effect on the y-axis
  const MAX_AMPLITUDE = 160;
  
  // Speed at which the noise evolves over time
  const NOISE_SPEED = 0.005;

  const LINESPACE = 300;
  
  // Color palette for light mode
  const COLOR_PALETTE_LIGHT = {
    background: '#ffffff', // Background color for light mode
    elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4'] // Element colors for light mode
  };
  
  // Color palette for dark mode
  const COLOR_PALETTE_DARK = {
    background: '#121212', // Background color for dark mode
    elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77'] // Element colors for dark mode
  };

  // -------------------------------
  // 2. Global Variables
  // -------------------------------
  
  // Array to hold all the lines, each containing its points
  let lines = [];
  
  // Array to hold noise offsets for each line to create variation
  let noiseOffsets = [];
  
  // Array to hold the color of each line
  let lineColors = [];
  
  // Current color palette based on the mode (light or dark)
  let currentPalette;
  
  // Background color based on the current palette
  let backgroundColor;

  // -------------------------------
  // 3. p5.js Lifecycle
  // -------------------------------
  p.setup = function () {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    // Create canvas in WEBGL mode and attach it to the container
    p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

    // Initialize mode based on the current body class
    setInitialMode();

    // Initialize all lines with their points and properties
    initializeLines();

    // Set drawing properties
    p.noFill();
    p.strokeWeight(2);
  };

  p.draw = function () {
    // Clear the background each frame with the selected background color
    p.background(backgroundColor);

    // Enable orbit control for interactive rotation with the mouse
    p.orbitControl();

    // Center the scene by translating the origin
    p.translate(-p.width / 2, 0, 0);

    // Draw all the fluid lines in 3D space
    drawFluidLines();
  };

  p.windowResized = function () {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;
    p.resizeCanvas(containerWidth, containerHeight);
  };

  // -------------------------------
  // 4. Mode Handling
  // -------------------------------
  
  /**
   * Sets the initial mode (light or dark) based on the body's class.
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
   * Updates the palette and background color based on the mode.
   * @param {boolean} darkMode - Indicates whether dark mode is active.
   */
  p.setMode = function (darkMode) {
    if (darkMode) {
      currentPalette = COLOR_PALETTE_DARK;
      backgroundColor = COLOR_PALETTE_DARK.background;
    } else {
      currentPalette = COLOR_PALETTE_LIGHT;
      backgroundColor = COLOR_PALETTE_LIGHT.background;
    }
    updateLineColors();
  };

  // -------------------------------
  // 5. Fluid Lines in 3D
  // -------------------------------
  
  /**
   * Initializes all lines with their points, noise offsets, and colors.
   */
  function initializeLines() {
    lines = [];
    noiseOffsets = [];
    lineColors = [];

    for (let i = 0; i < NUM_LINES; i++) {
      const linePoints = [];
      for (let j = 0; j < POINTS_PER_LINE; j++) {
        // Map the x position across the width of the canvas
        const x = p.map(j, 0, POINTS_PER_LINE - 1, 0, p.width);
        const y = 0; // Baseline y-coordinate
        // Distribute lines along the z-axis
        const z = p.map(i, 0, NUM_LINES - 1, -LINESPACE, LINESPACE);
        
        linePoints.push({ x, y, z });
      }
      lines.push(linePoints);

      // Assign a random noise offset for each line to vary the wave patterns
      noiseOffsets.push(p.random(10000));

      // Assign a random color from the current palette to each line
      lineColors.push(p.color(randomColorFromPalette()));
    }
  }

  /**
   * Draws all fluid lines with dynamic wave effects.
   */
  function drawFluidLines() {
    for (let i = 0; i < NUM_LINES; i++) {
      p.stroke(lineColors[i]);
      p.beginShape();
      // Iterate through each point in the line to create the wave effect
      for (let j = 0; j < POINTS_PER_LINE; j++) {
        const pt = lines[i][j];
        // Use Perlin noise to calculate the y-offset for smooth wave motion
        const noiseVal = p.noise(noiseOffsets[i] + j * 0.1 + p.frameCount * NOISE_SPEED);
        const yOffset = p.map(noiseVal, 0, 1, -MAX_AMPLITUDE, MAX_AMPLITUDE);

        // Apply the y-offset to create the wave
        const newY = pt.y + yOffset;

        // Define the vertex in 3D space
        p.vertex(pt.x, newY, pt.z);
      }
      p.endShape();

      // Increment the noise offset to animate the waves over time
      noiseOffsets[i] += 0.001;
    }
  }

  /**
   * Updates the colors of all lines based on the current palette.
   */
  function updateLineColors() {
    for (let i = 0; i < NUM_LINES; i++) {
      lineColors[i] = p.color(randomColorFromPalette());
    }
  }

  /**
   * Selects a random color from the current palette's elements.
   * @returns {p5.Color} A randomly selected color.
   */
  function randomColorFromPalette() {
    const palette = currentPalette.elements;
    return palette[p.floor(p.random(palette.length))];
  }
}
