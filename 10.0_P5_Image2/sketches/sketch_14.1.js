// sketches/adaptedSketchN.js

export default function adaptedSketchN(p) {
    /**********************************************
     * p5.js Sketch:
     * - Dark background
     * - Non-square grid of "pixels" (rectangles)
     * - Each cell is colored based on an animated flow field
     * - A white "+" sign is drawn inside each cell
     **********************************************/
  
    // ----------------------
    // Configuration Constants
    // ----------------------
    const N = 24;                  // Base number of cells (height)
    const FRAME_RATE = 60;         // Frames per second
  
    const margin = 1;              // Margin in cell units
    const gapFactor = 0.015;       // Gap between cells as a fraction of cell size
  
    const palette = [ 
      "darkgreen",      // Dark Green
      "white",          // White
      '#96D39B',        // Light Green
      '#57D7F2',        // Light Blue
      '#F098F4'         // Light Pink
    ];
  
    // Flow field settings
    const flowScale = 0.05;      // Adjusted scale for the noise function
    let zOffset = 0;             // Z-offset for animating the flow field
    const zIncrement = 0.004;    // Increment for z-offset each frame
  
    // -- Flow Field Variables --
    let field = []; // Flow field vectors
  
    // -----------------------
    // Internal Variables
    // -----------------------
    let uX, uY;          // Size of each cell in pixels (width and height)
    let gapX, gapY;      // Gap between squares in pixels (width and height)
    let N_COLS, N_ROWS;  // Number of columns and rows based on aspect ratio
  
    // -----------------------
    // Setup Function
    // -----------------------
    p.setup = () => {
      // Select the container
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
  
      // Create canvas matching the container's dimensions
      p.createCanvas(containerWidth, containerHeight).parent(container);
      p.frameRate(FRAME_RATE);
      p.background(255); // Dark background
  
      // Calculate number of columns based on aspect ratio to maintain square cells
      N_ROWS = N;
      N_COLS = Math.floor((containerWidth / containerHeight) * N);
  
      // Calculate cell size and gaps
      uX = containerWidth / N_COLS;
      uY = containerHeight / N_ROWS;
      gapX = uX * gapFactor;
      gapY = uY * gapFactor;
  
      // Initialize the flow field
      initializeFlowField();
  
      // Set rectangle and stroke properties
      p.noStroke();
    };
  
    // -----------------------
    // Window Resized Function
    // -----------------------
    p.windowResized = () => {
      // Select the container again in case it has resized
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
  
      // Resize the canvas to match the new container size
      p.resizeCanvas(containerWidth, containerHeight);
      p.background(0); // Reset background
  
      // Recalculate number of columns based on new aspect ratio
      N_ROWS = N;
      N_COLS = Math.floor((containerWidth / containerHeight) * N);
  
      // Recalculate cell sizes and gaps
      uX = containerWidth / N_COLS;
      uY = containerHeight / N_ROWS;
      gapX = uX * gapFactor;
      gapY = uY * gapFactor;
  
      // Reset and reinitialize the flow field
      field = [];
      initializeFlowField();
    };
  
    // -----------------------
    // Draw Function
    // -----------------------
    p.draw = () => {
      // Update the flow field for animation
      zOffset += zIncrement;
      updateFlowField();
  
      // Loop through the grid based on columns and rows
      for (let i = margin; i < N_COLS - margin; i++) {
        for (let j = margin; j < N_ROWS - margin; j++) {
          // Calculate pixel position with gaps
          let x = i * uX + gapX / 2;
          let y = j * uY + gapY / 2;
          let cellWidth = uX - gapX;
          let cellHeight = uY - gapY;
  
          // Get the flow vector at this cell
          let v = field[i][j];
          if (!v) continue; // Safety check
  
          // Use the angle to determine color from the palette
          let angle = v.heading(); // Get angle in radians (-PI to PI)
          // Map angle to palette index (0 to palette.length - 1)
          let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
          // Ensure index is within bounds
          index = p.constrain(index, 0, palette.length - 1);
          let c = palette[index];
  
          // 1) Draw the colored rectangle (the "pixel" itself)
          p.noStroke();
          p.fill(c);
          p.rect(x, y, cellWidth, cellHeight);
  
          // 2) Overlay the white "+" sign in the center of the cell
          let centerX = x + cellWidth / 2;
          let centerY = y + cellHeight / 2;
  
          p.stroke('white'); // Use white color for the "+" sign
          p.strokeWeight(1); // Increased stroke weight for visibility
          p.noFill();
  
          const crossSize = Math.min(cellWidth, cellHeight) * 0.3; // Dynamic cross size
          // Horizontal arm
          p.line(
            centerX - crossSize / 2,
            centerY,
            centerX + crossSize / 2,
            centerY
          );
          // Vertical arm
          p.line(
            centerX,
            centerY - crossSize / 2,
            centerX,
            centerY + crossSize / 2
          );
        }
      }
    };
  
    // Function to initialize the flow field
    function initializeFlowField() {
      for (let i = 0; i < N_COLS; i++) {
        field[i] = [];
        for (let j = 0; j < N_ROWS; j++) {
          let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
          let v = p5.Vector.fromAngle(angle);
          field[i][j] = v;
        }
      }
    }
  
    // Function to update the flow field for animation
    function updateFlowField() {
      for (let i = 0; i < N_COLS; i++) {
        for (let j = 0; j < N_ROWS; j++) {
          let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
          let v = p5.Vector.fromAngle(angle);
          field[i][j] = v;
        }
      }
    }
  
    // Optional: Handle mouse press events
    p.mousePressed = () => {
      // Optionally, reset the flow field on mouse press
      zOffset = 0;
      initializeFlowField();
    };
  
    // Optional: Handle key press events
    p.keyPressed = () => {
      // Save the canvas as an image when 'S' is pressed
      if (p.key === 'S' || p.key === 's') {
        p.saveCanvas('flowfield_mosaic', 'png');
      }
    };
  }
  