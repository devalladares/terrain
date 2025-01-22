// sketches/sketchN.js

export default function(p) {
  /**********************************************
   * p5.js Sketch:
   * - Black background
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
  // 9) palette         : color palette (green and black)
  // ---------------------------------------------

  // -- VISUAL SETTINGS --
  const spacing = 10;          // Width/height of each cell
  const crossSize = 5;         // Length of each plus sign arm
  const crossWeight = 0.5;     // Stroke thickness
  const crossColor = 255;      // White color for the "+" signs

  // -- FLOW FIELD SETTINGS --
  const flowScale = 0.01;      // Scale for the noise function
  let zOffset = 0;             // Z-offset for animating the flow field
  const zIncrement = 0.005;    // Increment for z-offset each frame

  // -- COLOR PALETTE --
  const palette = [ 
    "darkgreen", '#96D39B', '#57D7F2', '#F098F4'
  ];

  let field = []; // Flow field vectors

  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noLoop(); // We'll control when to draw

    // Initialize the flow field
    for (let x = 0; x < p.width; x += spacing) {
      field[x] = [];
      for (let y = 0; y < p.height; y += spacing) {
        let angle = p.noise(x * flowScale, y * flowScale, zOffset) * p.TWO_PI * 2;
        let v = p5.Vector.fromAngle(angle);
        field[x][y] = v;
      }
    }

    // Set drawing properties
    p.noStroke();
    p.background(0); // Black background
  };

  p.draw = function() {
    p.background(0); // Clear the background each frame

    // Update the flow field for animation
    zOffset += zIncrement;
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        let angle = p.noise(x * flowScale, y * flowScale, zOffset) * p.TWO_PI * 2;
        let v = p5.Vector.fromAngle(angle);
        field[x][y] = v;
      }
    }

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

    p.redraw(); // Trigger redraw since noLoop was called
  };

  // Handle window resizing to keep the canvas responsive
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // Reinitialize the flow field after resizing
    field = [];
    for (let x = 0; x < p.width; x += spacing) {
      field[x] = [];
      for (let y = 0; y < p.height; y += spacing) {
        let angle = p.noise(x * flowScale, y * flowScale, zOffset) * p.TWO_PI * 2;
        let v = p5.Vector.fromAngle(angle);
        field[x][y] = v;
      }
    }
    p.redraw(); // Re-draw the mosaic after resizing
  };

  // Optional: Handle mouse press events
  p.mousePressed = function() {
    // Example: Redraw the mosaic on mouse press
    p.redraw();
  };

  // Optional: Handle key press events
  p.keyPressed = function() {
    // Example: Save the canvas as an image when 'S' is pressed
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('flowfield_mosaic', 'png');
    }
  };
}
 