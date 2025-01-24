export default function(p) {
    // -----------------------------------------
    // 1. Configuration
    // -----------------------------------------
    const GRID_SPACING = 10;      // Distance between grid points (x,y)
    const GRID_COLS    = 50;      // Number of cells horizontally
    const GRID_ROWS    = 50;      // Number of cells vertically
    const NOISE_SCALE  = 0.1;    // Controls horizontal “stretch” of noise
    const HEIGHT_SCALE = 500;     // Maximum hill height (z)
    
    const NUM_LEVELS   = 15;       // How many contour slices
    // => this yields thresholds like 0, 20, 40, 60..., up to HEIGHT_SCALE
    
    // Palettes
    const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };
    const COLOR_PALETTE_DARK = {
      background: '#121212',
      elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
    };
  
    // -----------------------------------------
    // 2. Global variables
    // -----------------------------------------
    let currentPalette;
    let backgroundColor;
  
    // 2D array storing each grid corner’s 3D position
    // corners[j][i] = { x, y, z } for row j, col i
    let corners = [];
  
    // If you want each contour level to have a color, store them here:
    let levelColors = [];
  
    // -----------------------------------------
    // 3. p5 Setup
    // -----------------------------------------
    p.setup = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
  
      p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
  
      setInitialMode();
      
      // Precompute grid corner positions (x, y, z)
      // We'll have (GRID_COLS+1) points horizontally, (GRID_ROWS+1) vertically
      for (let j = 0; j <= GRID_ROWS; j++) {
        corners[j] = [];
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;
          
          // Noise for z
          let nx = i * NOISE_SCALE;
          let ny = j * NOISE_SCALE;
          let n = p.noise(nx, ny);
          
          // Scale noise to 0..HEIGHT_SCALE
          let z = n * HEIGHT_SCALE;
          
          corners[j][i] = { x, y, z };
        }
      }
  
      // Assign random colors to each contour level if desired
      for (let lvl = 0; lvl < NUM_LEVELS; lvl++) {
        levelColors[lvl] = p.color(randomColorFromPalette());
      }
      
      p.noFill();
      p.strokeWeight(2);
    };
  
    // -----------------------------------------
    // 4. p5 Draw
    // -----------------------------------------
    p.draw = function() {
      p.background(backgroundColor);
  
      // Let user rotate/pan/zoom in 3D
      p.orbitControl();
      
      // Move the hill so it's more central in view
      // (shifting it left/down can help center if you want)
      p.translate(- (GRID_COLS * GRID_SPACING)/2, 
                  - (GRID_ROWS * GRID_SPACING)/2, 
                  -HEIGHT_SCALE/2);
  
      // Optionally tilt the entire scene a bit so we see more of the shape
      // p.rotateX(-p.PI / 6);
  
      // Draw the contour lines for multiple levels
      // e.g. from 0 up to HEIGHT_SCALE in equal increments
      for (let lvl = 0; lvl < NUM_LEVELS; lvl++) {
        let threshold = p.map(lvl, 0, NUM_LEVELS - 1, 0, HEIGHT_SCALE);
        p.stroke(levelColors[lvl]);
  
        // Marching squares across each cell
        for (let j = 0; j < GRID_ROWS; j++) {
          for (let i = 0; i < GRID_COLS; i++) {
            // corners of the cell in 3D
            let cTL = corners[j][i];      // top-left
            let cTR = corners[j][i+1];    // top-right
            let cBL = corners[j+1][i];    // bottom-left
            let cBR = corners[j+1][i+1];  // bottom-right
  
            // Check which corners are above/below threshold
            let tl = cTL.z >= threshold;
            let tr = cTR.z >= threshold;
            let bl = cBL.z >= threshold;
            let br = cBR.z >= threshold;
            
            // We'll gather intersection points in 3D
            let pts = [];
  
            // Helper to interpolate intersection along an edge
            // cornerA, cornerB are objects { x, y, z }, T is the threshold
            function interp3D(A, B, T) {
              // fraction along the edge
              let denom = (B.z - A.z) || 0.00001; 
              let frac = (T - A.z) / denom;
              return {
                x: A.x + frac * (B.x - A.x),
                y: A.y + frac * (B.y - A.y),
                z: T  // the line is at z = T
              };
            }
  
            // top edge (between cTL, cTR)
            if (tl !== tr) {
              let ip = interp3D(cTL, cTR, threshold);
              pts.push(ip);
            }
            // right edge (between cTR, cBR)
            if (tr !== br) {
              let ip = interp3D(cTR, cBR, threshold);
              pts.push(ip);
            }
            // bottom edge (between cBL, cBR)
            if (bl !== br) {
              let ip = interp3D(cBL, cBR, threshold);
              pts.push(ip);
            }
            // left edge (between cTL, cBL)
            if (tl !== bl) {
              let ip = interp3D(cTL, cBL, threshold);
              pts.push(ip);
            }
  
            // If we have exactly 2 intersection points, draw a line
            if (pts.length === 2) {
              p.line(
                pts[0].x, pts[0].y, pts[0].z,
                pts[1].x, pts[1].y, pts[1].z
              );
            }
            // If pts.length == 4, you could connect them in pairs 
            // depending on the shape. Typically we’d use the 
            // official marching squares lookup table. But for 
            // a quick approach, you can do 2 lines, etc.
          }
        }
      }
    };
  
    p.windowResized = function() {
      const container = p.select('#sketch-container');
      p.resizeCanvas(container.width, container.height);
    };
  
    // -----------------------------------------
    // 5. Mode Handling (Dark/Light)
    // -----------------------------------------
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
      // Reassign the contour level colors:
      for (let lvl = 0; lvl < NUM_LEVELS; lvl++) {
        levelColors[lvl] = p.color(randomColorFromPalette());
      }
      p.background(backgroundColor);
    };
  
    // -----------------------------------------
    // 6. Utility: pick random color from palette
    // -----------------------------------------
    function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
    }
  }
  