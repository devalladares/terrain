// sketches/sketchN.js

export default function(p) {
    /**********************************************
     * p5.js Sketch:
     * - Dark background
     * - Dense grid of "pixels" (rectangles)
     * - Each cell is colored based on an animated flow field
     * - A white "+" sign is drawn inside each cell
     **********************************************/
  
    // ---------------------------------------------
    // VARIABLE LIST:
    // 1) field           : flow field vectors
    // 2) spacing         : size of each grid cell (width & height)
    // 3) crossSize       : length of each plus sign's arms
    // 4) crossWeight     : thickness of the plus sign stroke
    // 5) crossColor      : color of the plus signs (white here)
    // 6) flowScale       : scale for the noise function
    // 7) zOffset         : offset for animating the flow field
    // 8) zIncrement      : how much to change z each frame
    // 9) palette         : color palette (brand colors)
    // ---------------------------------------------
  
    // -- VISUAL SETTINGS --
    const spacing = 20;          // Width/height of each cell
    const crossSize = 15;         // Length of each plus sign arm
    const crossWeight = 0.5;     // Stroke thickness
    const crossColor = 'darkgreen';  // White color for the "+" signs
  
    // -- FLOW FIELD SETTINGS --
    const flowScale = 0.01;      // Scale for the noise function
    let zOffset = 0;             // Z-offset for animating the flow field
    const zIncrement = 0.0025;    // Increment for z-offset each frame
  
    // -- BRAND COLOR PALETTE --
    const palette = [ 
      "darkgreen",      // Dark Green
      "white",          // White
       '#96D39B',        // Light Green
    //   '#57D7F2',        // Light Blue
    //   '#F098F4'         // Light Pink
    ];
  
    let field = []; // Flow field vectors
  
    p.setup = function() {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.frameRate(60); // Increase frame rate for smoother animation
      p.background(0); // Dark background
      p.noStroke();
  
      // Initialize the flow field
      initializeFlowField();
    };
  
    p.draw = function() {
      // Update the flow field for animation
      zOffset += zIncrement;
      updateFlowField();
  
      // Loop through a grid of points
      for (let x = 0; x < p.width; x += spacing) {
        for (let y = 0; y < p.height; y += spacing) {
  
          // Get the flow vector at this cell
          let v = field[x][y];
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
          p.rect(x, y, spacing, spacing);
  
          // 2) Overlay the white "+" sign in the center of the cell
          let centerX = x + spacing / 2;
          let centerY = y + spacing / 2;
  
          p.stroke(crossColor);
          p.strokeWeight(crossWeight);
          p.noFill();
  
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
      for (let x = 0; x < p.width; x += spacing) {
        field[x] = [];
        for (let y = 0; y < p.height; y += spacing) {
          let angle = p.noise(x * flowScale, y * flowScale, zOffset) * p.TWO_PI * 2;
          let v = p5.Vector.fromAngle(angle);
          field[x][y] = v;
        }
      }
    }
  
    // Function to update the flow field for animation
    function updateFlowField() {
      for (let x = 0; x < p.width; x += spacing) {
        for (let y = 0; y < p.height; y += spacing) {
          let angle = p.noise(x * flowScale, y * flowScale, zOffset) * p.TWO_PI * 2;
          let v = p5.Vector.fromAngle(angle);
          field[x][y] = v;
        }
      }
    }
  
    // Handle window resizing to keep the canvas responsive
    p.windowResized = function() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      p.background(0); // Reset background
      field = []; // Reset flow field
      initializeFlowField(); // Reinitialize after resizing
    };
  
    // Optional: Handle mouse press events
    p.mousePressed = function() {
      // Optionally, reset the flow field on mouse press
      zOffset = 0;
      initializeFlowField();
    };
  
    // Optional: Handle key press events
    p.keyPressed = function() {
      // Save the canvas as an image when 'S' is pressed
      if (p.key === 'S' || p.key === 's') {
        p.saveCanvas('flowfield_mosaic', 'png');
      }
    };
  }
  