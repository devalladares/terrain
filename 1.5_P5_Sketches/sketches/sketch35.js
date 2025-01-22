/*
  ---------------------------------------------
  P5.JS SKETCH:
   - White background
   - Dense grid of crosses
   - Each cross is colored by the pixel color 
     from an underlying image ("1.jpg")
  ---------------------------------------------

  VARIABLE LIST:
  1) img            : the source image
  2) spacing        : distance (in px) between cross centers
  3) crossSize      : size (diameter) of each cross “arm”
  4) crossWeight    : line thickness for each cross
  5) sampleOffsetX  : shift used to sample from the image 
  6) sampleOffsetY  : shift used to sample from the image 
                     (in case your image & window differ in size)
*/

let img;           // the source image
let spacing = 5;  // distance between cross centers
let crossSize = 6; // length of each cross arm
let crossWeight = 3; // stroke thickness

// If the image size differs from the window, you can offset sampling:
let sampleOffsetX = 0;
let sampleOffsetY = 0;

function preload() {
  // Load "1.jpg" (ensure it's in your project folder or use correct path)
  img = loadImage('1.jpg');
}

function setup() {
  // Create a canvas the size of the window
  createCanvas(windowWidth, windowHeight);

  // We only need to draw one time, so let's stop the loop
  noLoop();
}

function draw() {
  // Fill the background with white
  background(255);

  // Loop in a grid across the canvas
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {

      // Figure out which pixel of the image to sample
      // If the image is the same size as the canvas, 
      // this can just be x and y (plus any needed offset).
      let sampleX = x + sampleOffsetX;
      let sampleY = y + sampleOffsetY;

      // Bound-check in case x or y exceed the image size
      // (or do more sophisticated scaling if needed)
      sampleX = constrain(sampleX, 0, img.width - 1);
      sampleY = constrain(sampleY, 0, img.height - 1);

      // Get the pixel color from the image at (sampleX, sampleY)
      let c = img.get(sampleX, sampleY);

      // Draw a “+” sign using that color
      push();
      translate(x, y);
      stroke(c);
      strokeWeight(crossWeight);
      noFill();
      // Horizontal line
      line(-crossSize / 2, 0, crossSize / 2, 0);
      // Vertical line
      line(0, -crossSize / 2, 0, crossSize / 2);
      pop();
    }
  }
}

// If you want the sketch to resize with the window:
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // noLoop() means we should redraw once after resizing
  redraw();
}
