// sketches/sketchN.js

export default function(p) {
  /**********************************************
   * p5.js Sketch:
   * - White background
   * - Dense grid of "pixels" (rectangles)
   * - Each cell is colored by sampling from "1.jpg"
   * - A white "+" sign is drawn inside each cell
   **********************************************/

  // ---------------------------------------------
  // VARIABLE LIST:
  // 1) img            : source image
  // 2) spacing        : size of each grid cell (width & height)
  // 3) crossSize      : length of each plus sign's arms
  // 4) crossWeight    : thickness of the plus sign stroke
  // 5) crossColor     : color of the plus signs (white here)
  // 6) sampleScaling  : whether we map the entire canvas to the image
  //                      or just use x,y directly
  // ---------------------------------------------

  // -- VISUAL SETTINGS --
  let img;                     // the source image
  const spacing = 10;          // width/height of each cell
  const crossSize = 5;        // length of each plus sign arm
  const crossWeight = 0.5;     // stroke thickness
  const crossColor = 255;      // white

  // -- SAMPLING SETTINGS --
  const sampleScaling = true;  // whether to map the entire canvas to the image

  p.preload = function() {
    // Load "images/1.jpg" (ensure it's in your project folder or use correct path)
    img = p.loadImage('images/1.jpg');
  };

  p.setup = function() {
    // Create a canvas the size of the window
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.noLoop(); // We'll draw the mosaic once

    // Set drawing properties
    p.noStroke();
    p.fill(255); // Default fill (covered by rectangles)
  };

  p.draw = function() {
    // White background (covers the entire canvas)
    p.background(255);

    // Ensure the image is loaded
    if (img) {
      // Loop through a grid of points
      for (let x = 0; x < p.width; x += spacing) {
        for (let y = 0; y < p.height; y += spacing) {

          // Map canvas coords to image coords 
          // so the entire canvas area maps onto the entire image
          let sampleX = sampleScaling
            ? p.map(x, 0, p.width, 0, img.width)
            : x;
          let sampleY = sampleScaling
            ? p.map(y, 0, p.height, 0, img.height)
            : y;

          // Constrain so we don't go out of image bounds
          sampleX = p.floor(p.constrain(sampleX, 0, img.width - 1));
          sampleY = p.floor(p.constrain(sampleY, 0, img.height - 1));

          // Get the pixel color from the image at (sampleX, sampleY)
          let c = img.get(sampleX, sampleY);

          // 1) Draw the colored rectangle (the "pixel" itself)
          p.noStroke();
          p.fill(c);
          p.rect(x, y, spacing, spacing);

          // 2) Overlay the white "+" sign in the center of the cell
          //    We'll position the plus sign in the middle of this cell
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
    }
  };

  // Handle window resizing to keep the canvas responsive
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.redraw(); // Re-generate the mosaic after resizing
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
      p.saveCanvas('mosaic', 'png');
    }
  };
}
