/*
  ---------------------------------------------
  P5.JS SKETCH:
   - White background
   - Dense grid of "pixels" (rectangles)
   - Each cell is colored by sampling from "1.jpg"
   - A white "+" sign is drawn inside each cell
  ---------------------------------------------

  VARIABLE LIST:
  1) img            : source image
  2) spacing        : size of each grid cell (width & height)
  3) crossSize      : length of each plus sign's arms
  4) crossWeight    : thickness of the plus sign stroke
  5) crossColor     : color of the plus signs (white here)
  6) sampleScaling  : whether we map the entire canvas to the image
                      or just use x,y directly
*/

let img;                 // the source image
let spacing = 20;        // width/height of each cell
let crossSize = 20;       // length of each plus sign arm
let crossWeight = 0.5;     // stroke thickness
let crossColor = 255;    // white

function preload() {
  // Load "1.jpg" (ensure it's in your project or correct path)
  img = loadImage('1.jpg');
}

function setup() {
  // Create a canvas the size of the window
  createCanvas(windowWidth, windowHeight);
  noLoop(); // We'll draw the mosaic once
}

function draw() {
  // White background (though it will be covered by the rectangles anyway)
  background(255);

  // Loop through a grid of points
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      
      // Map canvas coords to image coords 
      // so the entire canvas area maps onto the entire image
      let sampleX = map(x, 0, width, 0, img.width);
      let sampleY = map(y, 0, height, 0, img.height);
      
      // Constrain so we don't go out of image bounds
      sampleX = floor(constrain(sampleX, 0, img.width - 1));
      sampleY = floor(constrain(sampleY, 0, img.height - 1));
      
      // Get the pixel color from the image
      let c = img.get(sampleX, sampleY);
      
      // 1) Draw the colored rectangle (the "pixel" itself)
      noStroke();
      fill(c);
      rect(x, y, spacing, spacing);

      // 2) Overlay the white "+" sign in the center of the cell
      //    We'll position the plus sign in the middle of this cell
      let centerX = x + spacing / 2;
      let centerY = y + spacing / 2;

      stroke(crossColor);
      strokeWeight(crossWeight);
      noFill();

      // Horizontal arm
      line(centerX - crossSize / 2, centerY, 
           centerX + crossSize / 2, centerY);
      // Vertical arm
      line(centerX, centerY - crossSize / 2, 
           centerX, centerY + crossSize / 2);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw(); // Re-generate the mosaic after resizing
}
