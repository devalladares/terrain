/*
  ---------------------------------------------
  P5.JS SKETCH:
   - Full window canvas
   - Background image "1.jpg"
   - Grid of white crosses, each the same size
   - Crosses rotate if mouse is nearby
  ---------------------------------------------

  VARIABLE LIST:
  1) img                : background image
  2) spacing            : distance between crosses
  3) crossSize          : size of each cross
  4) crossColor         : color used for stroke (white in this example)
  5) crossWeight        : stroke thickness for the crosses
  6) influenceRadius    : radius around the mouse within which crosses rotate
  7) maxRotationAngle   : maximum rotation (in radians) at zero distance
*/

let img;                   // background image
let spacing = 120;         // distance between crosses
let crossSize = 20;        // size of each cross
let crossColor = 255;      // white
let crossWeight = 2;       // stroke thickness
let influenceRadius = 300; // how close the mouse must be to rotate the cross
let maxRotationAngle; // max rotation (90 degrees) when mouse is on the cross

function preload() {
  // Load the background image from "1.jpg"
  img = loadImage('1.jpg');
}

function setup() {
  // Create a canvas the size of the window
  createCanvas(windowWidth, windowHeight);

}

function draw() {
  // Draw the image as our background
  background(img);
  let maxRotationAngle = HALF_PI
  // Loop through a grid of points using spacing
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      
      // Check the distance of this cross from the mouse
      let d = dist(mouseX, mouseY, x, y);
      
      // If the cross is within 'influenceRadius', it should rotate
      // We map distance 0..influenceRadius to maxRotationAngle..0
      // so the closer the mouse is, the bigger the rotation
      let angle = 0; // no rotation by default
      if (d < influenceRadius) {
        angle = map(d, 0, influenceRadius, maxRotationAngle, 0, true);
      }
      
      // Draw the cross in its own coordinate space
      push();
      translate(x, y);
      rotate(angle);

      stroke(crossColor);
      strokeWeight(crossWeight);
      noFill();
      
      // Draw the “+” sign
      line(-crossSize / 2, 0, crossSize / 2, 0);
      line(0, -crossSize / 2, 0, crossSize / 2);
      
      pop();
    }
  }
}

// Keep canvas responsive if window size changes
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
