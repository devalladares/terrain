/**********************************************
 * sketches/sketchN.js
 * Converted p5.js Perlin Noise Grid with Animated Lines
 **********************************************/

export default function(p) {
  // -- SETTINGS --
  const cols = 40;      // Number of columns
  const rows = 40;      // Number of rows
  const freq = 0.1;     // Noise frequency
  const amp = 950;      // Maximum displacement

  p.setup = function() {
    p.createCanvas(600, 600); // Set canvas size
    p.stroke(255);             // Set stroke color to white
    p.noFill();                // Disable fill for shapes
  };

  p.draw = function() {
    p.background(0); // Set background to black

    // Draw horizontal lines
    for (let j = 0; j < rows; j++) {
      p.beginShape();
      for (let i = 0; i < cols; i++) {
        // Map grid indices to canvas coordinates
        let x = p.map(i, 0, cols - 1, 0, p.width);
        let y = p.map(j, 0, rows - 1, 0, p.height);

        // Use Perlin noise to offset each point
        let nx = p.noise(i * freq, j * freq, p.frameCount * 0.01);
        let ny = p.noise(i * freq + 100, j * freq + 100, p.frameCount * 0.01);

        // Apply displacement based on noise
        x += (nx - 0.5) * amp;
        y += (ny - 0.5) * amp;

        p.vertex(x, y);
      }
      p.endShape();
    }

    // Draw vertical lines
    for (let i = 0; i < cols; i++) {
      p.beginShape();
      for (let j = 0; j < rows; j++) {
        // Map grid indices to canvas coordinates
        let x = p.map(i, 0, cols - 1, 0, p.width);
        let y = p.map(j, 0, rows - 1, 0, p.height);

        // Use Perlin noise to offset each point
        let nx = p.noise(i * freq, j * freq, p.frameCount * 0.01);
        let ny = p.noise(i * freq + 100, j * freq + 10, p.frameCount * 0.0001);

        // Apply displacement based on noise
        x += (nx - 0.5) * amp;
        y += (ny - 0.5) * amp;

        p.vertex(x, y);
      }
      p.endShape();
    }
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Example: Reset the canvas on mouse press
    // p.background(0);
  };

  p.keyPressed = function() {
    // Example: Change noise frequency with key presses
    // if (p.key === 'Up') {
    //   freq += 0.01;
    // } else if (p.key === 'Down') {
    //   freq = max(0, freq - 0.01);
    // }
  };
}
