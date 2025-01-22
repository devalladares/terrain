// sketches/terrainMap.js

export default function(p) {
  /**********************************************
   * p5.js Sketch:
   * - Animated terrain map transitioning into waves
   * - Fluid and complex lines representing exploration
   **********************************************/

  // ---------------------------------------------
  // VARIABLE LIST:
  // 1) field           : flow field vectors
  // 2) spacing         : size of each grid cell
  // 3) flowScale       : scale for the noise function
  // 4) zOffset         : offset for animating the flow field
  // 5) zIncrement      : how much to change z each frame
  // 6) palette         : color palette (brand colors)
  // ---------------------------------------------

  // -- VISUAL SETTINGS --
  const spacing = 15;          // Width/height of each cell
  const flowScale = 0.001;      // Scale for the noise function
  let zOffset = 0;             // Z-offset for animating the flow field
  const zIncrement = 0.005;    // Increment for z-offset each frame

  // -- BRAND COLOR PALETTE --
  const palette = [ 
    "darkgreen",      // Dark Green
    // '#96D39B',        // Light Green
    // '#57D7F2',        // Light Blue
    '#000'         // Light Pink
  ];

  let field = []; // Flow field vectors

  p.setup = function() {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.frameRate(60); // Smooth animation
    p.background(0); // Dark background
    p.strokeWeight(2);
    p.noFill();

    // Initialize the flow field
    initializeFlowField();
  };

  p.draw = function() {
    // Update the flow field for animation
    zOffset += zIncrement;
    updateFlowField();

    // Draw the terrain map
    p.strokeWeight(2);
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        let v = field[x][y];
        let angle = v.heading(); // Angle in radians
        let c = p.color(palette[p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length))]);
        p.stroke(c);

        // Draw lines emanating from each grid point
        p.line(x, y, x + v.x * spacing, y + v.y * spacing);
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

  // Handle window resizing
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
    field = [];
    initializeFlowField();
  };

  // Optional: Save frame as image
  p.keyPressed = function() {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('terrain_map', 'png');
    }
  };
}
