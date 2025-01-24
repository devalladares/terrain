export default function (p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------
    const NUM_LINES = 10;
    const POINTS_PER_LINE = 100;
    const MAX_AMPLITUDE = 60;
    const NOISE_SPEED = 0.01;
    
    // Palettes
    const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };
    const COLOR_PALETTE_DARK = {
      background: '#121212',
      elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
    };
  
    // -------------------------------
    // 2. Global Variables
    // -------------------------------
    let lines = [];
    let noiseOffsets = [];
    let lineColors = [];
    
    // We'll decide which palette to use based on body class
    let currentPalette;
    let backgroundColor;
  
    // -------------------------------
    // 3. p5.js Lifecycle
    // -------------------------------
    p.setup = function () {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
  
      // Create canvas in WEBGL mode
      p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
  
      // Decide if dark mode is on
      setInitialMode();
  
      // Prepare line data
      initializeLines();
  
      p.noFill();
      p.strokeWeight(1.5);
    };
  
    p.draw = function () {
      // Clear the background each frame
      p.background(backgroundColor);
  
      // Optionally allow orbiting with mouse:
      p.orbitControl();
  
      // You could also do a manual rotation using mouse or scroll:
      // p.rotateX(p.map(p.mouseY, 0, p.height, -p.HALF_PI, p.HALF_PI));
      // p.rotateY(p.map(p.mouseX, 0, p.width, -p.PI, p.PI));
  
      // Center our “scene” so lines revolve around the center
      p.translate(-p.width / 2, 0, 0);
  
      // Draw each line in 3D
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
    function initializeLines() {
      lines = [];
      noiseOffsets = [];
      lineColors = [];
  
      for (let i = 0; i < NUM_LINES; i++) {
        const linePoints = [];
        for (let j = 0; j < POINTS_PER_LINE; j++) {
          const x = p.map(j, 0, POINTS_PER_LINE - 1, 0, p.width);
          // Baseline y = 0 if we want wave to revolve around y=0
          const y = 0;
          // We'll place each line at a different z
          const z = p.map(i, 0, NUM_LINES - 1, -200, 200);
          
          linePoints.push({ x, y, z });
        }
        lines.push(linePoints);
  
        // Each line gets its own noise offset
        noiseOffsets.push(p.random(10000));
  
        // Assign a random color
        lineColors.push(p.color(randomColorFromPalette()));
      }
    }
  
    function drawFluidLines() {
      for (let i = 0; i < NUM_LINES; i++) {
        p.stroke(lineColors[i]);
        p.beginShape();
        // We’ll interpret each line as a connected strip in 3D
        for (let j = 0; j < POINTS_PER_LINE; j++) {
          const pt = lines[i][j];
          // Use Perlin noise to vary the y coordinate
          const noiseVal = p.noise(noiseOffsets[i] + j * 0.1 + p.frameCount * NOISE_SPEED);
          const yOffset = p.map(noiseVal, 0, 1, -MAX_AMPLITUDE, MAX_AMPLITUDE);
  
          // We can just adjust the y dimension for the wave effect
          const newY = pt.y + yOffset;
  
          // Send vertex in 3D
          p.vertex(pt.x, newY, pt.z);
        }
        p.endShape();
  
        // Increment noise offset so the wave “drifts”
        noiseOffsets[i] += 0.005;
      }
    }
  
    function updateLineColors() {
      for (let i = 0; i < NUM_LINES; i++) {
        lineColors[i] = p.color(randomColorFromPalette());
      }
    }
  
    function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
    }
  }
  