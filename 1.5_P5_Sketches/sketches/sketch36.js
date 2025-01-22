/**********************************************
 * p5.js Flow Field with Plus Signs (+) over an image
 **********************************************/

// -- FLOW FIELD SETTINGS --
let scl = 60;          // Distance (scale) between each cell in the flow field
let increment = 0.01;  // Step size in Perlin noise for x/y
let symbolSize = 0.2;  // Overall size of the '+' symbol relative to scl

// -- ANIMATION SETTINGS --
let zOffset = 0;         // Perlin noise "z-dimension" offset (for animation)
let animateSpeed = 0.01; // How fast the flow field "evolves" each frame

// -- VISUAL OPTIONS --
let strokeWeightVal = 1;  // Thickness of the stroke for the '+'
let colorModeOn = false;  // Not using color mode now, just white plus signs

// -- GRID DIMENSIONS (automatically computed in setup) --
let cols, rows;

// -- IMAGE VARIABLE --
let bgImage; // We'll load "1.jpg" into this

function preload() {
  // Load the image before setup() runs
  bgImage = loadImage('1.jpg');
}

function setup() {
  createCanvas(600, 600);
  
  // Calculate how many columns and rows based on the chosen 'scl'
  cols = floor(width / scl);
  rows = floor(height / scl);
  
  // By default, p5 loops (calls draw continuously)
}

function draw() {
  // Draw the background image
  background(bgImage);

  let yOffset = 0;
  for (let y = 0; y < rows; y++) {
    let xOffset = 0;
    for (let x = 0; x < cols; x++) {
      // Sample Perlin noise value between 0 and 1
      let n = noise(xOffset, yOffset, zOffset);
      // Convert that noise value to an angle, 0 to TWO_PI * 2
      let angle = n * TWO_PI * 2;

      // Pixel coordinates for this grid cell
      let px = x * scl;
      let py = y * scl;

      // Distance from mouse to the center of this cell
      let centerX = px + scl / 2;
      let centerY = py + scl / 2;
      let d = dist(centerX, centerY, mouseX, mouseY);

      // If within a certain radius of the mouse, add extra rotation
      let effectRadius = 100; // you can tweak this
      if (d < effectRadius) {
        // Map the distance (0 to effectRadius) to some extra rotation
        // Closer to the mouse => bigger rotation
        let extraRotation = map(d, 0, effectRadius, 1.0, 0, true);
        angle += extraRotation;
      }

      // Create a vector from the final angle
      let v = p5.Vector.fromAngle(angle);

      // Draw the plus sign
      push();
      // Translate to the center of the cell
      translate(centerX, centerY);
      // Rotate using noise‐based angle (plus any extra from mouse)
      rotate(v.heading());

      // White stroke for the plus
      stroke(255);
      strokeWeight(strokeWeightVal);

      // The size of half of one "arm" of the plus
      let halfArm = (scl * symbolSize) / 2;
      // Horizontal line of the plus
      line(-halfArm, 0, halfArm, 0);
      // Vertical line of the plus
      line(0, -halfArm, 0, halfArm);

      pop();

      // Move Perlin sampling horizontally
      xOffset += increment;
    }
    // Move Perlin sampling vertically
    yOffset += increment;
  }

  // Advance zOffset to animate the noise field over time
  zOffset += animateSpeed;
}

// (Optional) If you like an immediate "jump" effect on click:
function mousePressed() {
  // Re-seed the zOffset randomly, so the flow field "jumps"
  zOffset = random(1000);
}
