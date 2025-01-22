// sketches/sketchN.js

export default function(p) {
  /**********************************************
   * p5.js Flow Field with Plus Signs (+) over an Image
   **********************************************/

  // -- FLOW FIELD SETTINGS --
  let scl = 100;          // Distance (scale) between each cell in the flow field
  let increment = 0.1;  // Step size in Perlin noise for x/y
  let symbolSize = 0.2;  // Overall size of the '+' symbol relative to scl

  // -- ANIMATION SETTINGS --
  let zOffset = 0;         // Perlin noise "z-dimension" offset (for animation)
  let animateSpeed = 0.01; // How fast the flow field "evolves" each frame

  // -- VISUAL OPTIONS --
  let strokeWeightVal = 1;  // Thickness of the stroke for the '+'
  let crossColor = 255;      // White color for the plus signs

  // -- GRID DIMENSIONS (automatically computed in setup) --
  let cols, rows;

  // -- IMAGE VARIABLE --
  let bgImage; // We'll load "images/1.jpg" into this

  // Preload function to load assets before setup
  p.preload = function() {
    // Load the background image from "images/1.jpg"
    bgImage = p.loadImage('images/1.jpg');
  };

  // Setup function to initialize the sketch
  p.setup = function() {
    // Create a canvas the size of the window
    p.createCanvas(p.windowWidth, p.windowHeight);

    // Calculate how many columns and rows based on the chosen 'scl'
    cols = p.floor(p.width / scl);
    rows = p.floor(p.height / scl);

    // Set stroke properties
    p.strokeWeight(strokeWeightVal);
    p.stroke(crossColor);
    p.noFill();
  };

  // Draw function to render each frame
  p.draw = function() {
    // Draw the background image
    p.background(0);

    let yOffset = 0;
    for (let y = 0; y < rows; y++) {
      let xOffset = 0;
      for (let x = 0; x < cols; x++) {
        // Sample Perlin noise value between 0 and 1
        let n = p.noise(xOffset, yOffset, zOffset);

        // Convert that noise value to an angle, 0 to TWO_PI * 2
        let angle = n * p.TWO_PI * 2;

        // Pixel coordinates for this grid cell
        let px = x * scl;
        let py = y * scl;

        // Center coordinates of the cell
        let centerX = px + scl / 2;
        let centerY = py + scl / 2;

        // Distance from mouse to the center of this cell
        let d = p.dist(centerX, centerY, p.mouseX, p.mouseY);

        // If within a certain radius of the mouse, add extra rotation
        let effectRadius = 100; // You can tweak this value
        if (d < effectRadius) {
          // Map the distance (0 to effectRadius) to some extra rotation
          // Closer to the mouse => bigger rotation
          let extraRotation = p.map(d, 0, effectRadius, 1.0, 0, true);
          angle += extraRotation;
        }

        // Create a vector from the final angle
        let v = p5.Vector.fromAngle(angle);

        // Draw the plus sign
        p.push();
        // Translate to the center of the cell
        p.translate(centerX, centerY);
        // Rotate using noise-based angle (plus any extra from mouse)
        p.rotate(v.heading());

        // The size of half of one "arm" of the plus
        let halfArm = (scl * symbolSize) / 2;
        // Horizontal line of the plus
        p.line(-halfArm, 0, halfArm, 0);
        // Vertical line of the plus
        p.line(0, -halfArm, 0, halfArm);

        p.pop();

        // Move Perlin sampling horizontally
        xOffset += increment;
      }
      // Move Perlin sampling vertically
      yOffset += increment;
    }

    // Advance zOffset to animate the noise field over time
    zOffset += animateSpeed;
  };

  // Handle window resizing to keep the canvas responsive
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);

    // Recalculate columns and rows based on new window size
    cols = p.floor(p.width / scl);
    rows = p.floor(p.height / scl);
  };

  // Optional: Handle mouse press events
  p.mousePressed = function() {
    // Re-seed the zOffset randomly, so the flow field "jumps"
    zOffset = p.random(1000);
  };

  // Optional: Handle key press events
  p.keyPressed = function() {
    // Example: Toggle animation on/off with the 'A' key
    if (p.key === 'A' || p.key === 'a') {
      animateSpeed = animateSpeed === 0 ? 0.01 : 0;
    }
  };
}
