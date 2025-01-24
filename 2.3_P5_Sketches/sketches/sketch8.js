// Ensure you have included the dat.GUI library in your HTML file:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/dat-gui/0.7.9/dat.gui.min.js"></script>

export default function(p) {
    // -----------------------------------------
    // 1. Configuration Variables
    // -----------------------------------------
    
    // Grid Configuration
    const GRID_SPACING = 20;          // Distance between grid points (x, y)
    const GRID_COLS = 50;             // Number of cells horizontally
    const GRID_ROWS = 50;             // Number of cells vertically

    // Noise Configuration
    const NOISE_SCALE_INITIAL = 0.1;  // Initial noise scale (controls horizontal stretch)
    const TIME_INCREMENT = 0.001;      // Time increment for animation

    // Height Configuration
    const HEIGHT_SCALE_INITIAL = 1000; // Initial maximum hill height (z)

    // Contour Configuration
    const NUM_LEVELS_INITIAL = 20;    // Initial number of contour levels

    // Color Palettes
    const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
      elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };
    const COLOR_PALETTE_DARK = {
      background: '#003323',
      elements: ['#96D39B']
    };

    // GUI Parameters Object
    let params = {
      noiseScale: NOISE_SCALE_INITIAL,
      heightScale: HEIGHT_SCALE_INITIAL,
      numLevels: NUM_LEVELS_INITIAL,
      animate: true,
      darkMode: false
    };

    // -----------------------------------------
    // 2. Global Variables
    // -----------------------------------------
    let currentPalette;
    let backgroundColor;

    let corners = [];                // 2D array storing grid corners' 3D positions
    let levelColors = [];            // Colors for each contour level

    let time = 0;                    // Animation time variable

    let gui;                         // dat.GUI instance

    // -----------------------------------------
    // 3. p5.js Setup Function
    // -----------------------------------------
    p.setup = function() {
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noFill();
      p.strokeWeight(1);

      setInitialMode();
      initializeGrid();
      assignLevelColors();
      setupGUI();
    };

    // -----------------------------------------
    // 4. p5.js Draw Function
    // -----------------------------------------
    p.draw = function() {
      p.background(backgroundColor);
      p.orbitControl();

      // Center the grid in the view
      p.translate(- (GRID_COLS * GRID_SPACING) / 2, 
                  - (GRID_ROWS * GRID_SPACING) / 2, 
                  -params.heightScale / 2);

      // Update Z-values for animation if enabled
      if (params.animate) {
        updateZValues();
        time += TIME_INCREMENT;
      }

      // Draw contour lines for each level
      for (let lvl = 0; lvl < params.numLevels; lvl++) {
        let threshold = p.map(lvl, 0, params.numLevels - 1, 0, params.heightScale);
        p.stroke(levelColors[lvl]);

        // Apply Marching Squares algorithm to each cell
        for (let j = 0; j < GRID_ROWS; j++) {
          for (let i = 0; i < GRID_COLS; i++) {
            let cTL = corners[j][i];      // Top-Left
            let cTR = corners[j][i + 1];  // Top-Right
            let cBL = corners[j + 1][i];  // Bottom-Left
            let cBR = corners[j + 1][i + 1]; // Bottom-Right

            // Determine if each corner is above the threshold
            let tl = cTL.z >= threshold;
            let tr = cTR.z >= threshold;
            let bl = cBL.z >= threshold;
            let br = cBR.z >= threshold;

            let pts = []; // Intersection points

            // Interpolation Function
            function interp3D(A, B, T) {
              let denom = (B.z - A.z) || 0.00001; 
              let frac = (T - A.z) / denom;
              frac = p.constrain(frac, 0, 1); // Ensure frac is between 0 and 1
              return {
                x: A.x + frac * (B.x - A.x),
                y: A.y + frac * (B.y - A.y),
                z: T
              };
            }

            // Check and interpolate edges
            if (tl !== tr) pts.push(interp3D(cTL, cTR, threshold));
            if (tr !== br) pts.push(interp3D(cTR, cBR, threshold));
            if (bl !== br) pts.push(interp3D(cBL, cBR, threshold));
            if (tl !== bl) pts.push(interp3D(cTL, cBL, threshold));

            // Draw line if exactly two intersection points are found
            if (pts.length === 2) {
              p.line(
                pts[0].x, pts[0].y, pts[0].z,
                pts[1].x, pts[1].y, pts[1].z
              );
            }
          }
        }
      }
    };

    // -----------------------------------------
    // 5. Handle Window Resizing for Fullscreen
    // -----------------------------------------
    p.windowResized = function() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    // -----------------------------------------
    // 6. Mode Handling (Dark/Light)
    // -----------------------------------------
    function setInitialMode() {
      const body = document.body;
      if (body.classList.contains('dark-mode')) {
        currentPalette = COLOR_PALETTE_DARK;
        backgroundColor = COLOR_PALETTE_DARK.background;
        params.darkMode = true;
      } else {
        currentPalette = COLOR_PALETTE_LIGHT;
        backgroundColor = COLOR_PALETTE_LIGHT.background;
        params.darkMode = false;
      }
    }

    p.setMode = function(darkMode) {
      if (darkMode) {
        currentPalette = COLOR_PALETTE_DARK;
        backgroundColor = COLOR_PALETTE_DARK.background;
        params.darkMode = true;
      } else {
        currentPalette = COLOR_PALETTE_LIGHT;
        backgroundColor = COLOR_PALETTE_LIGHT.background;
        params.darkMode = false;
      }
      assignLevelColors();
      p.background(backgroundColor);
    };

    // -----------------------------------------
    // 7. Initialize Grid Corners
    // -----------------------------------------
    function initializeGrid() {
      for (let j = 0; j <= GRID_ROWS; j++) {
        corners[j] = [];
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;
          corners[j][i] = { x, y, z: 0 };
        }
      }
      updateZValues(); // Initial Z-values
    }

    // -----------------------------------------
    // 8. Update Z-values Based on Noise and Time
    // -----------------------------------------
    function updateZValues() {
      for (let j = 0; j <= GRID_ROWS; j++) {
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;

          let nx = i * params.noiseScale;
          let ny = j * params.noiseScale;
          let n = p.noise(nx, ny, time);

          let z = n * params.heightScale;
          corners[j][i].z = z;
        }
      }
    }

    // -----------------------------------------
    // 9. Assign Colors to Contour Levels
    // -----------------------------------------
    function assignLevelColors() {
      levelColors = [];
      for (let lvl = 0; lvl < params.numLevels; lvl++) {
        levelColors[lvl] = p.color(randomColorFromPalette());
      }
    }

    // -----------------------------------------
    // 10. Utility: Pick Random Color from Palette
    // -----------------------------------------
    function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
    }

    // -----------------------------------------
    // 11. Setup GUI Controls using dat.GUI
    // -----------------------------------------
    function setupGUI() {
      gui = new dat.GUI();

      // Noise Scale Control
      gui.add(params, 'noiseScale', 0.01, 0.5).step(0.01).name('Noise Scale').onChange(() => {
        assignLevelColors();
      });

      // Height Scale Control
      gui.add(params, 'heightScale', 100, 1000).step(10).name('Height Scale').onChange(() => {
        assignLevelColors();
      });

      // Number of Contour Levels Control
      gui.add(params, 'numLevels', 5, 30).step(1).name('Contour Levels').onChange(() => {
        assignLevelColors();
      });

      // Animation Toggle
      gui.add(params, 'animate').name('Animate');

      // Dark Mode Toggle
      gui.add(params, 'darkMode').name('Dark Mode').onChange((value) => {
        p.setMode(value);
      });
    }
}
