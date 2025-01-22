// sketches/sketchN.js

export default function(p) {
  // Define your variables within the instance scope
  let cols = 40;
  let rows = 40;
  let freq = 0.01;  // Noise frequency
  let amp = 100;    // Maximum displacement

  p.setup = function() {
    // Initialization code
    p.createCanvas(600, 600); // Set canvas size
    p.stroke(255);
    p.noFill();
  };

  p.draw = function() {
    // Drawing code
    p.background(0);

    // Draw horizontal lines
    for (let j = 0; j < rows; j++) {
      p.beginShape();
      for (let i = 0; i < cols; i++) {
        let x = p.map(i, 0, cols - 1, 0, p.width);
        let y = p.map(j, 0, rows - 1, 0, p.height);

        // Use Perlin noise to offset each point
        let nx = p.noise(i * freq, j * freq, p.frameCount * 0.01);
        let ny = p.noise(i * freq + 100, j * freq + 100, p.frameCount * 0.01);

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
        let x = p.map(i, 0, cols - 1, 0, p.width);
        let y = p.map(j, 0, rows - 1, 0, p.height);

        let nx = p.noise(i * freq, j * freq, p.frameCount * 0.01);
        let ny = p.noise(i * freq + 100, j * freq + 10, p.frameCount * 0.0001);

        x += (nx - 0.5) * amp;
        y += (ny - 0.5) * amp;
        p.vertex(x, y);
      }
      p.endShape();
    }
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press
    // Example: Toggle background color
    // p.background(p.random(255), p.random(255), p.random(255));
  };

  p.keyPressed = function() {
    // Handle key press
    // Example: Save the canvas as an image
    // if (p.key === 's' || p.key === 'S') {
    //   p.saveCanvas('myCanvas', 'png');
    // }
  };
}
