/**********************************************
 * p5.js Flow Field with Animation & Mouse Interaction
 **********************************************/

// -- FLOW FIELD SETTINGS --
let scl = 20;           // Distance (scale) between each line in the flow field
let increment = 0.01;    // Step size in Perlin noise for x/y
let lineLength = 0.8;   // Length of each line (fraction of scl)

// -- ANIMATION SETTINGS --
let zOffset = 100;        // Perlin noise "z-dimension" offset (for animation)
let animateSpeed = 0.005; // How fast the flow field "evolves" each frame

// -- VISUAL OPTIONS --
let strokeWeightVal = 1; // Thickness of the flow field lines
let colorModeOn = false; // Whether to draw lines in color (toggled on click)

// -- GRID DIMENSIONS (automatically computed in setup) --
let cols, rows;

function setup() {
  createCanvas(600, 600);
  // Calculate how many columns and rows based on the chosen 'scl'
  cols = floor(width / scl);
  rows = floor(height / scl);
  
  // Smooth edges for drawing
  smooth();

  // By default, we redraw every frame (looping)
}

function draw() {
  background(255);

  // We’ll use yOffset and xOffset to walk through the noise space
  let yOffset = 0;
  for (let y = 0; y < rows; y++) {
    let xOffset = 0;
    for (let x = 0; x < cols; x++) {

      // Get a Perlin noise value between 0 and 1
      let n = noise(xOffset, yOffset, zOffset);
      // Convert that noise value into an angle (0 to TWO_PI * 2)
      let angle = n * TWO_PI * 2;

      // Optionally: shift angle a bit by mouseX for mild interaction
      // angle += (mouseX * 0.0005);

      // Create a vector pointing in that angle
      let v = p5.Vector.fromAngle(angle);

      // Calculate the grid cell’s pixel coordinates
      let px = x * scl;
      let py = y * scl;

      // Draw the line
      push();
      translate(px, py);
      rotate(v.heading());
      
      if (colorModeOn) {
        // Make color respond to angle (just for fun)
        stroke(
          map(sin(angle), -1, 1, 50, 255),
          map(cos(angle), -1, 1, 50, 255),
          200
        );
      } else {
        stroke(0); // plain black lines
      }
      strokeWeight(strokeWeightVal);

      // Draw a short line in the direction of the vector
      line(0, 0, scl * lineLength, 0);
      pop();

      xOffset += increment; // move Perlin sampling horizontally
    }
    yOffset += increment;   // move Perlin sampling vertically
  }

  // Advance zOffset slightly each frame to animate
  zOffset += animateSpeed;
}

// Called automatically when the mouse is pressed
function mousePressed() {
  // Toggle color mode on/off
  colorModeOn = !colorModeOn;
}
