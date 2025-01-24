export default function(p) {
    // -----------------------------------------
    // 1. Configuration: Tweak these!
    // -----------------------------------------
    const GRID_SPACING = 10;    // Distance between grid points (x,y)
    const GRID_COLS    = 50;    // Number of cells horizontally
    const GRID_ROWS    = 50;    // Number of cells vertically
    
    const NOISE_SCALE  = 0.1;   // Controls horizontal “stretch” of noise
    const HEIGHT_SCALE = 300;   // Max hill height (z)
  
    const NUM_LEVELS   = 12;    // How many contour slices
    // => e.g. thresholds from 0 up to HEIGHT_SCALE in equal increments
  
    // Animation
    const ANIMATE = true;       // Set to false to freeze
    const ANIMATION_SPEED = 0.02; // Speed at which noise changes
  
    // Camera constraints
    const CAM_INITIAL_RADIUS = 800;
    const CAM_MIN_RADIUS     = 100;  // how close you can zoom in
    const CAM_MAX_RADIUS     = 2000; // how far you can zoom out
    const CAM_INITIAL_THETA  = 0;    // initial rotation around Y
    const CAM_INITIAL_PHI    = -0.3; // initial rotation around X
    const PHI_MIN            = -0.9; // look up limit
    const PHI_MAX            = 0.2;  // look down limit
    
    // Color Palettes
    const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };
    const COLOR_PALETTE_DARK = {
      background: '#121212',
      elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
    };
  
    // -----------------------------------------
    // 2. Global Variables
    // -----------------------------------------
    let currentPalette;
    let backgroundColor;
  
    // 3D corner data:
    // corners[j][i] = { x, y, z }
    let corners = [];
  
    // Colors for each contour level
    let levelColors = [];
  
    // Camera variables:
    let theta = CAM_INITIAL_THETA;  // rotation around Y
    let phi   = CAM_INITIAL_PHI;    // rotation around X
    let radius = CAM_INITIAL_RADIUS; // distance from center
  
    // We'll store previous mouse positions to calculate drags
    let pmouseX, pmouseY;
  
    // -----------------------------------------
    // 3. p5 Setup
    // -----------------------------------------
    p.setup = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
  
      p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);
  
      setInitialMode();
  
      // Prepare random colors for each contour level
      for (let lvl = 0; lvl < NUM_LEVELS; lvl++) {
        levelColors[lvl] = p.color(randomColorFromPalette());
      }
  
      // No fill for lines
      p.noFill();
      p.strokeWeight(2);
  
      // Initialize pmouse so first drag is smooth
      pmouseX = p.mouseX;
      pmouseY = p.mouseY;
    };
  
    // -----------------------------------------
    // 4. p5 Draw
    // -----------------------------------------
    p.draw = function() {
      p.background(backgroundColor);
  
      // 4A. Recompute corners each frame if we're ANIMATEing
      computeCorners();
  
      // 4B. Setup our custom camera transform
      setupCamera();
  
      // 4C. Draw the contour lines
      drawContours();
    };
  
    // -----------------------------------------
    // 5. Compute the 3D Terrain (corners)
    // -----------------------------------------
    function computeCorners() {
      // Re‐generate the 2D grid of points (x, y, z)
      // If ANIMATE = true, we use frameCount in noise calls so it “shifts”
      corners = [];
      for (let j = 0; j <= GRID_ROWS; j++) {
        corners[j] = [];
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;
  
          let nx = i * NOISE_SCALE;
          let ny = j * NOISE_SCALE;
          // Add a time component if ANIMATE
          let nz = ANIMATE ? p.frameCount * ANIMATION_SPEED : 0;
  
          let n = p.noise(nx, ny, nz);
          let z = n * HEIGHT_SCALE;
  
          corners[j][i] = { x, y, z };
        }
      }
    }
  
    // -----------------------------------------
    // 6. Draw the 3D Contour Lines
    // -----------------------------------------
    function drawContours() {
      // We use marching squares for each threshold
      for (let lvl = 0; lvl < NUM_LEVELS; lvl++) {
        let threshold = p.map(lvl, 0, NUM_LEVELS - 1, 0, HEIGHT_SCALE);
        p.stroke(levelColors[lvl]);
  
        // Loop over each cell
        for (let j = 0; j < GRID_ROWS; j++) {
          for (let i = 0; i < GRID_COLS; i++) {
            let cTL = corners[j][i];     // top-left
            let cTR = corners[j][i+1];   // top-right
            let cBL = corners[j+1][i];   // bottom-left
            let cBR = corners[j+1][i+1]; // bottom-right
  
            let tl = cTL.z >= threshold;
            let tr = cTR.z >= threshold;
            let bl = cBL.z >= threshold;
            let br = cBR.z >= threshold;
  
            let pts = [];
  
            // Interpolate intersection along an edge
            function interp3D(A, B, T) {
              let denom = (B.z - A.z) || 0.00001;
              let frac = (T - A.z) / denom;
              return {
                x: A.x + frac * (B.x - A.x),
                y: A.y + frac * (B.y - A.y),
                z: T
              };
            }
  
            // top edge
            if (tl !== tr) pts.push(interp3D(cTL, cTR, threshold));
            // right edge
            if (tr !== br) pts.push(interp3D(cTR, cBR, threshold));
            // bottom edge
            if (bl !== br) pts.push(interp3D(cBL, cBR, threshold));
            // left edge
            if (tl !== bl) pts.push(interp3D(cTL, cBL, threshold));
  
            // Draw line if exactly 2 intersections
            if (pts.length === 2) {
              p.line(
                pts[0].x, pts[0].y, pts[0].z,
                pts[1].x, pts[1].y, pts[1].z
              );
            }
            // If pts.length == 4, you might draw 2 lines, etc.
          }
        }
      }
    }
  
    // -----------------------------------------
    // 7. Camera Controls (no orbitControl)
    // -----------------------------------------
    function setupCamera() {
      // 7A. We position the camera manually:
      // Start at the center of the scene, looking at (0,0,0).
      // We'll rotate by phi (X) and theta (Y), then translate by radius.
      // Approach:
      // 1) Move camera to origin
      // 2) rotate X by phi, rotate Y by theta
      // 3) translate back by radius along Z
      p.translate(0, 0, 0);
      p.rotateX(phi);
      p.rotateY(theta);
      p.translate(0, 0, -radius);
  
      // Also let's shift the entire "hill" so it's roughly in front of us:
      p.translate(
        - (GRID_COLS * GRID_SPACING)/2,
        - (GRID_ROWS * GRID_SPACING)/2,
        - HEIGHT_SCALE/4
      );
    }
  
    // We track drag events for rotation
    p.mouseDragged = function() {
      // Only rotate if you are pressing left mouse button
      if (p.mouseButton === p.LEFT) {
        let dx = p.mouseX - pmouseX;
        let dy = p.mouseY - pmouseY;
        // Horizontal drag changes theta
        theta += dx * 0.01;
        // Vertical drag changes phi, clamp within [PHI_MIN, PHI_MAX]
        phi -= dy * 0.01;
        phi = p.constrain(phi, PHI_MIN, PHI_MAX);
  
        pmouseX = p.mouseX;
        pmouseY = p.mouseY;
      }
    };
  
    // Also track if user is panning with right mouse or SHIFT? 
    // We could do that, but let's keep it simple for now.
  
    // We track scroll for zoom
    p.mouseWheel = function(event) {
      // event.delta is + (scroll down) or - (scroll up)
      radius += event.delta * 1.0;
      radius = p.constrain(radius, CAM_MIN_RADIUS, CAM_MAX_RADIUS);
    };
  
    // Reset pmouse each frame so dragging is smooth
    p.mouseMoved = function() {
      pmouseX = p.mouseX;
      pmouseY = p.mouseY;
    };
  
    p.windowResized = function() {
      const container = p.select('#sketch-container');
      p.resizeCanvas(container.width, container.height);
    };
  
    // -----------------------------------------
    // 8. Mode Handling (Dark/Light)
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
    // 9. Utility: pick random color from palette
    // -----------------------------------------
    function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
    }
  }
  