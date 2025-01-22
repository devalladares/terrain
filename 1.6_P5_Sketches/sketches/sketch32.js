// sketches/sketchN.js

export default function(p) {
  // ---------------------------------------------
  // VARIABLE LIST:
  // 1) img                : background image
  // 2) spacing            : distance between crosses
  // 3) crossSize          : size of each cross
  // 4) crossColor         : color used for stroke (white in this example)
  // 5) crossWeight        : stroke thickness for the crosses
  // 6) influenceRadius    : radius around the mouse within which crosses rotate
  // 7) maxRotationAngle   : maximum rotation (in radians) at zero distance
  // ---------------------------------------------

  // Variable declarations at the top
  let img;                   // background image
  const spacing = 100;       // distance between crosses
  const crossSize = 10;      // size of each cross
  const crossColor = 255;    // white
  const crossWeight = 1;     // stroke thickness
  const influenceRadius = 300; // how close the mouse must be to rotate the cross
  let maxRotationAngle;      // max rotation (90 degrees) when mouse is on the cross

  p.preload = function() {
    // Load the background image from "images/1.jpg"
    img = p.loadImage('images/1.jpg');
  };

  p.setup = function() {
    // Create a canvas the size of the window
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.strokeWeight(crossWeight);
    // Initialize maxRotationAngle to 90 degrees (HALF_PI radians)
    maxRotationAngle = p.HALF_PI;
  };

  p.draw = function() {
    // Draw the image as our background
    p.background(img);

    // Loop through a grid of points using spacing
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        // Check the distance of this cross from the mouse
        const d = p.dist(p.mouseX, p.mouseY, x, y);

        // If the cross is within 'influenceRadius', it should rotate
        // Map distance 0..influenceRadius to maxRotationAngle..0
        // so the closer the mouse is, the bigger the rotation
        let angle = 0; // no rotation by default
        if (d < influenceRadius) {
          angle = p.map(d, 0, influenceRadius, maxRotationAngle, 0, true);
        }

        // Draw the cross with rotation if applicable
        p.push();
        p.translate(x, y);
        p.rotate(angle);

        p.stroke(crossColor);
        p.noFill();

        // Draw the “+” sign
        p.line(-crossSize / 2, 0, crossSize / 2, 0); // Horizontal segment
        p.line(0, -crossSize / 2, 0, crossSize / 2); // Vertical segment

        p.pop();
      }
    }
  };

  // Keep canvas responsive if window size changes
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press if needed
    // Example: Reset the rotation or perform another action
    // maxRotationAngle = p.HALF_PI; // Reset rotation angle
  };

  p.keyPressed = function() {
    // Handle key press if needed
    // Example: Toggle visibility of crosses or change parameters
  };
}
