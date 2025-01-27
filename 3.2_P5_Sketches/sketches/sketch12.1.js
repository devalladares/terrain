// Ensure you have included the p5.js library in your HTML file:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js"></script>

/**
 * Contour Visualization Sketch
 * 
 * This sketch generates dynamic, smooth 3D contour lines using p5.js.
 * It features automatic gentle rotation, consistent stroke weight regardless of zoom,
 * and an initial zoomed-in view. All configurable variables are organized at the top
 * for easy customization.
 */
export default function(p) {
    // -----------------------------------------
    // 1. Configuration Variables
    // -----------------------------------------
    
    /**
     * GRID_SPACING
     * Distance between each grid point along the x and y axes.
     * Smaller values result in higher grid resolution and smoother contours.
     */
    const GRID_SPACING = 5;          // Distance between grid points (x, y)
    
    /**
     * GRID_COLS & GRID_ROWS
     * Number of cells horizontally and vertically.
     * Higher values increase grid resolution.
     */
    const GRID_COLS = 200;            // Number of cells horizontally
    const GRID_ROWS = 200;            // Number of cells vertically

    /**
     * NOISE_SCALE_INITIAL
     * Controls the frequency of the Perlin noise.
     * Smaller values produce more gradual changes, resulting in smoother contours.
     */
    const NOISE_SCALE_INITIAL = 0.005; // Initial noise scale (controls horizontal stretch)

    /**
     * TIME_INCREMENT
     * Determines the speed of animation over time.
     * Smaller values slow down the animation.
     */
    const TIME_INCREMENT = 0.001;     // Time increment for animation

    /**
     * HEIGHT_SCALE_INITIAL
     * Sets the maximum elevation (z-axis) of the terrain.
     * Higher values increase the height variation.
     */
    const HEIGHT_SCALE_INITIAL = 2000; // Initial maximum hill height (z)

    /**
     * NUM_LEVELS_INITIAL
     * Defines the number of contour levels.
     * More levels result in finer contour details.
     */
    const NUM_LEVELS_INITIAL = 30;     // Initial number of contour levels

    /**
     * STROKE_WEIGHT_INITIAL, STROKE_WEIGHT_MIN, STROKE_WEIGHT_MAX
     * Controls the thickness of contour lines.
     * Users can adjust the stroke weight within the defined range.
     */
    const STROKE_WEIGHT_INITIAL = 2;   // Initial stroke weight
    const STROKE_WEIGHT_MIN = 0.5;     // Minimum stroke weight
    const STROKE_WEIGHT_MAX = 10;      // Maximum stroke weight

    /**
     * AUTO_ROTATE_SPEED_X & AUTO_ROTATE_SPEED_Y
     * Determines the speed of automatic rotation around the X and Y axes.
     * Smaller values result in slower, more gentle rotations.
     */
    const AUTO_ROTATE_SPEED_X = 0.001; // Rotation speed around X-axis
    const AUTO_ROTATE_SPEED_Y = 0.001; // Rotation speed around Y-axis

    /**
     * INITIAL_ZOOM, ZOOM_FACTOR, ZOOM_MIN, ZOOM_MAX
     * Controls the zoom functionality.
     * INITIAL_ZOOM sets the starting zoom level.
     * ZOOM_FACTOR determines how sensitive the zoom is to mouse wheel input.
     * ZOOM_MIN and ZOOM_MAX define the allowable range for zoom levels.
     */
    const INITIAL_ZOOM = 2;            // Initial zoom level (zoomed in)
    const ZOOM_FACTOR = 0.001;         // Zoom sensitivity
    const ZOOM_MIN = 0.1;               // Minimum zoom level
    const ZOOM_MAX = 5;                 // Maximum zoom level

    /**
     * COLOR_PALETTE_LIGHT & COLOR_PALETTE_DARK
     * Define color schemes for light and dark modes.
     * 'background' sets the canvas background color.
     * 'elements' contains an array of colors used for contour lines.
     */
    const COLOR_PALETTE_LIGHT = {
      background: '#ffffff',
    //   elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
      elements: ['#96D39B']
    };
    const COLOR_PALETTE_DARK = {
      background: '#003323',
      elements: ['#96D39B']
    };

    /**
     * AUTO_ROTATE_INITIAL
     * Flag to control whether the sketch starts with automatic rotation enabled.
     */
    const AUTO_ROTATE_INITIAL = true;   // Flag to control auto-rotation

    // -----------------------------------------
    // 2. Global Variables
    // -----------------------------------------
    
    /**
     * params
     * Object containing all adjustable parameters.
     * Users can tweak these values directly in the code.
     */
    let params = {
      noiseScale: NOISE_SCALE_INITIAL,
      heightScale: HEIGHT_SCALE_INITIAL,
      numLevels: NUM_LEVELS_INITIAL,
      strokeWeight: STROKE_WEIGHT_INITIAL,
      animate: true,
      darkMode: false
    };

    let currentPalette;       // Currently active color palette
    let backgroundColor;      // Current background color based on mode

    let corners = [];         // 2D array storing grid corners' 3D positions
    let levelColors = [];     // Array storing colors for each contour level

    let time = 0;             // Animation time variable

    let zoom = INITIAL_ZOOM;  // Current zoom level

    // Rotation Variables
    let autoRotate = AUTO_ROTATE_INITIAL; // Flag to control auto-rotation
    let rotationX = 0;                    // Current rotation around X-axis
    let rotationY = 0;                    // Current rotation around Y-axis

    // -----------------------------------------
    // 3. p5.js Setup Function
    // -----------------------------------------
    p.setup = function() {
      // Create a fullscreen canvas using WEBGL renderer for 3D capabilities
      p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
      p.noFill();                          // Disable filling shapes
      p.strokeWeight(params.strokeWeight); // Set initial stroke weight

      setInitialMode();    // Set initial color mode based on HTML body class
      initializeGrid();    // Initialize grid corner positions
      assignLevelColors(); // Assign colors to contour levels
    };

    // -----------------------------------------
    // 4. p5.js Draw Function
    // -----------------------------------------
    p.draw = function() {
      p.background(backgroundColor); // Set background color

      // Apply Orbit Control for manual rotation (disable default zoom)
      p.orbitControl(1, 1, 0); // Parameters: sensitivityX, sensitivityY, sensitivityZ (0 disables zoom)

      // Apply custom zoom
      p.scale(zoom);

      // Adjust stroke weight inversely to zoom to keep it consistent
      p.strokeWeight(params.strokeWeight / zoom);

      // Apply automatic gentle rotation
      if (autoRotate) {
        rotationX += AUTO_ROTATE_SPEED_X;
        rotationY += AUTO_ROTATE_SPEED_Y;
      }

      p.rotateX(rotationX); // Rotate around X-axis
      p.rotateY(rotationY); // Rotate around Y-axis

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
        // Determine the elevation threshold for the current contour level
        let threshold = p.map(lvl, 0, params.numLevels - 1, 0, params.heightScale);
        p.stroke(levelColors[lvl]); // Set stroke color for the contour level

        // Apply Marching Squares algorithm to each cell in the grid
        for (let j = 0; j < GRID_ROWS; j++) {
          for (let i = 0; i < GRID_COLS; i++) {
            let cTL = corners[j][i];         // Top-Left corner
            let cTR = corners[j][i + 1];     // Top-Right corner
            let cBL = corners[j + 1][i];     // Bottom-Left corner
            let cBR = corners[j + 1][i + 1]; // Bottom-Right corner

            // Determine if each corner is above the threshold
            let tl = cTL.z >= threshold;
            let tr = cTR.z >= threshold;
            let bl = cBL.z >= threshold;
            let br = cBR.z >= threshold;

            let pts = []; // Array to store intersection points

            /**
             * interp3D
             * Interpolates between two points A and B to find the intersection point at elevation T.
             * Ensures that the fraction is constrained between 0 and 1 to avoid extrapolation.
             * 
             * @param {Object} A - First point with properties x, y, z
             * @param {Object} B - Second point with properties x, y, z
             * @param {number} T - Elevation threshold
             * @returns {Object} - Interpolated point with properties x, y, z
             */
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

            // Check and interpolate edges based on contour crossing
            if (tl !== tr) pts.push(interp3D(cTL, cTR, threshold));
            if (tr !== br) pts.push(interp3D(cTR, cBR, threshold));
            if (bl !== br) pts.push(interp3D(cBL, cBR, threshold));
            if (tl !== bl) pts.push(interp3D(cTL, cBL, threshold));

            // Draw a line between the two intersection points if exactly two are found
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
    
    /**
     * setInitialMode
     * Sets the initial color palette based on the HTML body's class.
     * If 'dark-mode' class is present, dark palette is used; otherwise, light palette is applied.
     */
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

    /**
     * setMode
     * Updates the color palette and background color based on the darkMode flag.
     * 
     * @param {boolean} darkMode - Flag indicating whether to switch to dark mode
     */
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
    
    /**
     * initializeGrid
     * Initializes the 2D array of grid corners with x, y positions.
     * Initially sets all z-values to 0; they will be updated in updateZValues().
     */
    function initializeGrid() {
      for (let j = 0; j <= GRID_ROWS; j++) {
        corners[j] = [];
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;
          corners[j][i] = { x, y, z: 0 };
        }
      }
      updateZValues(); // Set initial Z-values based on noise
    }

    // -----------------------------------------
    // 8. Update Z-values Based on Noise and Time
    // -----------------------------------------
    
    /**
     * updateZValues
     * Updates the z-values of each grid corner based on Perlin noise and the current time.
     * Creates dynamic elevation changes for animated contours.
     */
    function updateZValues() {
      for (let j = 0; j <= GRID_ROWS; j++) {
        for (let i = 0; i <= GRID_COLS; i++) {
          let x = i * GRID_SPACING;
          let y = j * GRID_SPACING;

          // Generate Perlin noise value with spatial and temporal components
          let nx = i * params.noiseScale;
          let ny = j * params.noiseScale;
          let n = p.noise(nx, ny, time);

          // Scale noise to desired height
          let z = n * params.heightScale;
          corners[j][i].z = z;
        }
      }
    }

    // -----------------------------------------
    // 9. Assign Colors to Contour Levels
    // -----------------------------------------
    
    /**
     * assignLevelColors
     * Assigns colors to each contour level based on the current color palette.
     * Ensures that each contour level has a distinct color.
     */
    function assignLevelColors() {
      levelColors = [];
      for (let lvl = 0; lvl < params.numLevels; lvl++) {
        levelColors[lvl] = p.color(randomColorFromPalette());
      }
    }

    // -----------------------------------------
    // 10. Utility: Pick Random Color from Palette
    // -----------------------------------------
    
    /**
     * randomColorFromPalette
     * Selects a random color from the current palette's elements array.
     * 
     * @returns {p5.Color} - Selected color
     */
    function randomColorFromPalette() {
      const palette = currentPalette.elements;
      return palette[p.floor(p.random(palette.length))];
    }

    // -----------------------------------------
    // 11. Setup GUI Controls using dat.GUI
    // -----------------------------------------
    
    /**
     * setupGUI
     * Initializes dat.GUI controls for adjusting sketch parameters.
     * Note: As per user request, this function will be removed. Hence, the GUI code is omitted.
     * 
     * If you wish to reintroduce GUI controls in the future, implement this function accordingly.
     */
    function setupGUI() {
      // GUI integration removed as per user request.
      // All parameters can now be adjusted directly in the configuration section above.
    }

    // -----------------------------------------
    // 12. Custom Mouse Wheel for Zoom
    // -----------------------------------------
    
    /**
     * mouseWheel
     * Custom handler for mouse wheel events to control zoom level.
     * Adjusts the zoom variable based on wheel input while constraining it within set limits.
     * 
     * @param {Object} event - Mouse wheel event object
     * @returns {boolean} - Prevents default scrolling behavior
     */
    p.mouseWheel = function(event) {
      // Adjust zoom based on wheel delta
      zoom += event.delta * ZOOM_FACTOR;
      zoom = p.constrain(zoom, ZOOM_MIN, ZOOM_MAX);
      // Prevent default scrolling behavior
      return false;
    };
}
