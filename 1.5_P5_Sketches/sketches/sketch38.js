/**********************************************
 * p5.js Flow Field with Plus Signs (+) over an image
 * Each plus sign:
 *   - Rotates according to Perlin noise
 *   - Changes size based on that same noise
 *   - Spins a bit extra when the mouse is close
 **********************************************/

// -- FLOW FIELD SETTINGS --
let scl = 60;          // Distance (scale) between each cell in the flow field
let increment = 0.01;  // Step size in Perlin noise for x/y

// -- ANIMATION SETTINGS --
let zOffset = 0;         // Perlin noise "z-dimension" offset (for continuous animation)
let animateSpeed = 0.01; // How fast the noise field "evolves" each frame

// -- VISUAL OPTIONS --
let strokeWeightVal = 1; // Thickness of the stroke for the '+'
let effectRadius = 80;   // Radius around mouse for extra rotation

// -- GRID DIMENSIONS (computed in setup) --
let cols, rows;

// -- IMAGE VARIABLE --
let bgImage; // We'll load "1.jpg" into this

function preload() {
  // Load the image before setup() runs
  bgImage = loadImage('1.jpg');
}

function setup() {
  createCanvas(600, 600);
  
  // Compute how many columns and rows, given the chosen 'scl'
  cols = floor(width / scl);
  rows = floor(height / scl);
  
  // p5 will call draw() continuously
}

function draw() {
  // Draw the background image
  background(bgImage);

  let yOffset = 0;
  for (let y = 0; y < rows; y++) {
    let xOffset = 0;
    for (let x = 0; x < cols; x++) {
      // Sample Perlin noise value [0..1]
      let n = noise(xOffset, yOffset, zOffset);

      // Convert that noise to an angle, range [0..TWO_PI*2]
      let angle = n * TWO_PI * 2;

      // Also use noise to vary the cross size
      // Map noise [0..1] to a range [2..scl*1.2]
      let crossSize = map(n, 0, 1, 2, scl * 1.2);

      // Find pixel coordinates for this grid cell
      let px = x * scl;
      let py = y * scl;

      // Center of the cell
      let centerX = px + scl / 2;
      let centerY = py + scl / 2;

      // Check distance from the mouse
      let d = dist(mouseX, mouseY, centerX, centerY);
      if (d < effectRadius) {
        // Add a little extra rotation if the mouse is near
        angle += 0.05; 
      }

      // Create a vector from the final angle
      let v = p5.Vector.fromAngle(angle);

      // Draw the plus sign
      push();
      translate(centerX, centerY);
      rotate(v.heading());
      stroke(255); // White
      strokeWeight(strokeWeightVal);
      noFill();

      // Half of the cross's arm length
      let halfArm = crossSize / 2;

      // Horizontal arm
      line(-halfArm, 0, halfArm, 0);
      // Vertical arm
      line(0, -halfArm, 0, halfArm);

      pop();

      // Move Perlin sampling horizontally
      xOffset += increment;
    }
    // Move Perlin sampling vertically
    yOffset += increment;
  }

  // Advance the "z" dimension of noise to animate over time
  zOffset += animateSpeed;
}

// Optionally re-seed the noise on a mouse press
function mousePressed() {
  zOffset = random(1000);
}
