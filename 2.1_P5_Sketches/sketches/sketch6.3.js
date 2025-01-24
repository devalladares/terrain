export default function(p) {
  // ----------------------------------------
  // 1. Configuration
  // ----------------------------------------
  const CANVAS_SIZE = 600;

  // We’ll do marching squares on an internal grid
  // (the finer the grid, the smoother the contours)
  const GRID_SPACING = 10;  // pixel distance between grid points
  const NOISE_SCALE  = 0.01;
  const NUM_LEVELS   = 10;  // how many contour thresholds
  const ANIMATE      = true; // whether to animate the noise

  // Palettes
  const COLOR_PALETTE_LIGHT = {
    background: '#ffffff',
    elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
  };
  const COLOR_PALETTE_DARK = {
    background: '#121212',
    elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
  };

  // ----------------------------------------
  // 2. Globals
  // ----------------------------------------
  let currentPalette;
  let backgroundColor;
  let noiseValues = []; // 2D array for noise data
  let cols, rows;       // number of grid cells horizontally & vertically

  // If you want multi‐color contour lines, you can store the color for each level
  let levelColors = [];

  // ----------------------------------------
  // 3. p5 Setup
  // ----------------------------------------
  p.setup = function() {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    // Create a WEBGL canvas so we can orbit around
    p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

    setInitialMode();

    // Calculate how many columns/rows in our grid
    cols = Math.floor(CANVAS_SIZE / GRID_SPACING);
    rows = Math.floor(CANVAS_SIZE / GRID_SPACING);

    // Initialize color for each contour “level”
    // If you want them all the same color, you can skip this loop
    for (let i = 0; i < NUM_LEVELS; i++) {
      levelColors[i] = p.color(randomColorFromPalette());
    }

    // We’ll *not* call noLoop(), so we can animate if desired
  };

  // ----------------------------------------
  // 4. p5 Draw
  // ----------------------------------------
  p.draw = function() {
    // Clear the 3D scene
    p.background(backgroundColor);

    // Let the user orbit around by clicking & dragging
    p.orbitControl();

    // Optionally rotate the plane a bit so we see it “angled”
    p.rotateX(-p.PI / 6);

    // Center the plane so (0,0) is in the middle of the screen
    p.translate(-CANVAS_SIZE/2, -CANVAS_SIZE/2, 0);

    // 4A. Recompute noise array (if animating)
    computeNoiseField();

    // 4B. Draw multiple contour lines via marching squares
    drawContours();
  };

  p.windowResized = function() {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;
    p.resizeCanvas(containerWidth, containerHeight);
  };

  // ----------------------------------------
  // 5. Noise Field
  // ----------------------------------------
  function computeNoiseField() {
    // Recompute a 2D array of noise values
    // If ANIMATE = false, you can do this once in setup() instead
    noiseValues = [];
    for (let j = 0; j <= rows; j++) {
      noiseValues[j] = [];
      for (let i = 0; i <= cols; i++) {
        let x = i * GRID_SPACING;
        let y = j * GRID_SPACING;

        // If animating, we use frameCount to “move” through noise
        let t = ANIMATE ? p.frameCount * 0.01 : 0;

        // Sample 2D (or 3D) noise
        let n = p.noise(x * NOISE_SCALE, y * NOISE_SCALE, t);
        noiseValues[j][i] = n;
      }
    }
  }

  // ----------------------------------------
  // 6. Marching Squares
  // ----------------------------------------
  function drawContours() {
    // For each “level” 0..1 in small increments
    for (let l = 0; l < NUM_LEVELS; l++) {
      let threshold = l / NUM_LEVELS;

      p.stroke(levelColors[l]);
      p.strokeWeight(1.5);
      p.noFill();

      // March across the grid
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          // Values at the 4 corners
          let topleft  = noiseValues[j][i];
          let topright = noiseValues[j][i+1];
          let botleft  = noiseValues[j+1][i];
          let botright = noiseValues[j+1][i+1];

          // We'll check each edge. If it crosses threshold,
          // we interpolate an intersection point
          let edges = [];

          function interp(valA, valB, start, end) {
            // We assume threshold is T
            let denom = (valB - valA) || 0.00001;
            let t = (threshold - valA) / denom;
            return start + t * (end - start);
          }

          // Check top edge
          if ((topleft < threshold && topright >= threshold) ||
              (topleft >= threshold && topright < threshold)) {
            let xcoord = interp(topleft, topright, i*GRID_SPACING, (i+1)*GRID_SPACING);
            edges.push(p.createVector(xcoord, j*GRID_SPACING));
          }
          // Right edge
          if ((topright < threshold && botright >= threshold) ||
              (topright >= threshold && botright < threshold)) {
            let ycoord = interp(topright, botright, j*GRID_SPACING, (j+1)*GRID_SPACING);
            edges.push(p.createVector((i+1)*GRID_SPACING, ycoord));
          }
          // Bottom edge
          if ((botleft < threshold && botright >= threshold) ||
              (botleft >= threshold && botright < threshold)) {
            let xcoord = interp(botleft, botright, i*GRID_SPACING, (i+1)*GRID_SPACING);
            edges.push(p.createVector(xcoord, (j+1)*GRID_SPACING));
          }
          // Left edge
          if ((topleft < threshold && botleft >= threshold) ||
              (topleft >= threshold && botleft < threshold)) {
            let ycoord = interp(topleft, botleft, j*GRID_SPACING, (j+1)*GRID_SPACING);
            edges.push(p.createVector(i*GRID_SPACING, ycoord));
          }

          // If we have 2 intersection points, draw a line
          if (edges.length === 2) {
            p.line(edges[0].x, edges[0].y, edges[1].x, edges[1].y);
          }
          // If edges.length == 4, you might need special logic to draw 2 segments
          // For simplicity, we'll skip that or handle only simple 2-edge crossing
        }
      }
    }
  }

  // ----------------------------------------
  // 7. Mode Handling
  // ----------------------------------------
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
    // Reassign the level colors from new palette
    for (let i = 0; i < NUM_LEVELS; i++) {
      levelColors[i] = p.color(randomColorFromPalette());
    }
    // Force redraw
    p.background(backgroundColor);
  };

  // ----------------------------------------
  // 8. Utility
  // ----------------------------------------
  function randomColorFromPalette() {
    const palette = currentPalette.elements;
    return palette[p.floor(p.random(palette.length))];
  }
}
