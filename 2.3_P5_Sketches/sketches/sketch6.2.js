// sketches/sketchFluidLines3D.js

export default function(p) {
  // -------------------------------
  // 1. Configuration Parameters
  // -------------------------------

  const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
  };

  const COLOR_PALETTE_DARK = {
      background: '#121212',
      elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
  };

  const NUM_LINES = 10;
  const POINTS_PER_LINE = 150;
  const MAX_AMPLITUDE = 60;
  const NOISE_SPEED = 0.01;

  // -------------------------------
  // 2. Global Variables
  // -------------------------------
  let lines = [];
  let noiseOffsets = [];
  let lineColors = [];
  let currentPalette;
  let backgroundColor;
  let zoom = 1;

  // -------------------------------
  // 3. p5.js Lifecycle Methods
  // -------------------------------

  p.preload = function() {
      // Image is not needed for 3D contour lines
  };

  p.setup = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;

      // Create and attach WEBGL canvas
      p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

      // Set perspective
      let fov = 60 * (Math.PI / 180);
      let cameraZ = (containerHeight / 2.0) / p.tan(fov / 2.0);
      p.perspective(fov, containerWidth / containerHeight, cameraZ / 10.0, cameraZ * 10.0);

      // Set mode based on body class
      setInitialMode();

      // Initialize our lines
      initializeLines();

      // Initialize background
      p.background(backgroundColor);

      p.noFill();  // We’ll be drawing stroked lines
      p.strokeWeight(1.5); 

      // Listen to scroll events for zoom
      window.addEventListener('wheel', function(event) {
          zoom += event.deltaY * -0.001;
          zoom = p.constrain(zoom, 0.5, 3);
      });
  };

  p.draw = function() {
      // Clear with background color
      p.background(backgroundColor);
      
      // Set up lighting
      p.ambientLight(100);
      p.pointLight(255, 255, 255, 0, 0, 500);
      
      p.push();
      p.scale(zoom);
      
      // Camera rotation based on mouse
      let rotX = p.map(p.mouseY, 0, p.height, -0.5, 0.5);
      let rotY = p.map(p.mouseX, 0, p.width, -0.5, 0.5);
      
      p.rotateX(rotX);
      p.rotateY(rotY);
      
      // Draw the lines
      drawFluidLines();
      
      p.pop();
  };

  p.windowResized = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
      p.resizeCanvas(containerWidth, containerHeight);
      
      // Update perspective after resize
      let fov = 60 * (Math.PI / 180);
      let cameraZ = (containerHeight / 2.0) / p.tan(fov / 2.0);
      p.perspective(fov, containerWidth / containerHeight, cameraZ / 10.0, cameraZ * 10.0);
      
      p.background(backgroundColor);
  };

  // -------------------------------
  // 4. Mode Handling Methods
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

  p.setMode = function(darkMode) {
      if (darkMode) {
          currentPalette = COLOR_PALETTE_DARK;
          backgroundColor = COLOR_PALETTE_DARK.background;
      } else {
          currentPalette = COLOR_PALETTE_LIGHT;
          backgroundColor = COLOR_PALETTE_LIGHT.background;
      }
      updateLineColors();
      p.background(backgroundColor);
  };

  // -------------------------------
  // 5. Fluid Lines System
  // -------------------------------

  function initializeLines() {
      lines = [];
      noiseOffsets = [];
      lineColors = [];

      for (let i = 0; i < NUM_LINES; i++) {
          const linePoints = [];
          for (let j = 0; j < POINTS_PER_LINE; j++) {
              const x = p.map(j, 0, POINTS_PER_LINE - 1, -p.width / 2, p.width / 2);
              const y = p.map(i, 0, NUM_LINES - 1, -p.height / 2, p.height / 2);
              const z = 0;
              linePoints.push({ x, y, z });
          }
          lines.push(linePoints);
          noiseOffsets.push(p.random(10000));
          lineColors.push(p.color(randomColorFromPalette()));
      }
  }

  function updateLineColors() {
      for (let i = 0; i < NUM_LINES; i++) {
          lineColors[i] = p.color(randomColorFromPalette());
      }
  }

  function drawFluidLines() {
      for (let i = 0; i < NUM_LINES; i++) {
          p.stroke(lineColors[i]);
          p.beginShape();

          for (let j = 0; j < POINTS_PER_LINE; j++) {
              const pt = lines[i][j];
              const noiseVal = p.noise(noiseOffsets[i] + j * 0.1 + p.frameCount * NOISE_SPEED);
              const yOffset = p.map(noiseVal, 0, 1, -MAX_AMPLITUDE, MAX_AMPLITUDE);
              const newY = pt.y + yOffset + (i - NUM_LINES / 2) * 30;

              const zOffset = p.map(noiseVal, 0, 1, -MAX_AMPLITUDE, MAX_AMPLITUDE);

              p.vertex(pt.x, newY, zOffset);
          }
          p.endShape();

          noiseOffsets[i] += 0.005;
      }
  }

  // -------------------------------
  // 6. Additional Helper Methods
  // -------------------------------

  function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
  }
}
