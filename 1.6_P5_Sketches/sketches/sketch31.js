// sketches/sketchN.js

export default function(p) {
  // Variable declarations at the top
  let spacing = 10;                   // Distance between grid points
  let noiseScale = 0.005;              // Scale for noise
  let hueMin = 810;                    // Minimum hue value
  let hueMax = 160;                   // Maximum hue value
  let bgHue = 120;                    // Background hue
  let bgSaturation = 30;              // Background saturation
  let bgBrightness = 100;             // Background brightness
  let crossMinSize = .01;               // Minimum size of the cross
  let crossMaxSizeMultiplier = 1.5;   // Multiplier for maximum cross size
  let zOffset = 0;                    // Offset for noise to create animation
  let zIncrement = 0.02;             // How much to increment zOffset each frame

  p.setup = function() {
    p.createCanvas(800, 800);                 // Updated canvas size to 800x800
    p.colorMode(p.HSB, 360, 100, 100);        // Easier for color gradients
    p.strokeWeight(1);
    // Optional: Frame rate can be set if needed
    // p.frameRate(60);
  };

  p.draw = function() {
    p.background(bgHue, bgSaturation, bgBrightness); // Greenish background

    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {
        // Sample noise at (x, y, z)
        let n = p.noise(x * noiseScale, y * noiseScale, zOffset);

        // Map noise [0..1] to hue range [80..160]
        let hueVal = p.map(n, 0, 1, hueMin, hueMax);
        p.stroke('black'); // Fixed stroke color as per your latest code

        // Vary cross size by noise
        let crossSize = p.map(n, 0, 1, crossMinSize, spacing * crossMaxSizeMultiplier);

        // Draw a “+” sign at (x, y)
        // Horizontal segment
        p.line(
          x - crossSize / 2, y,
          x + crossSize / 2, y
        );
        // Vertical segment
        p.line(
          x, y - crossSize / 2,
          x, y + crossSize / 2
        );
      }
    }

    // Increment zOffset to animate noise over time
    zOffset += zIncrement;
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press if needed
    // For example, reset the animation
    // zOffset = 0;
  };

  p.keyPressed = function() {
    // Handle key press if needed
    // For example, toggle animation or change parameters
  };
}
