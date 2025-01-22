function setup() {
  createCanvas(600, 600);
  noLoop();          // We only need to draw once
  colorMode(HSB, 360, 100, 100);  // Easier for color gradients
}

function draw() {
  background(120, 30, 100); // Some greenish background if you like
  
  let spacing = 10;     // Distance between grid points
  let noiseScale = 0.01; // Scale for noise
  strokeWeight(1);
  
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      // Sample noise at (x, y)
      let n = noise(x * noiseScale, y * noiseScale);
      
      // Map noise [0..1] to hue range [80..160], plus saturation/value
      let hueVal = map(n, 0, 1, 80, 160);
      stroke("black");

      // Optionally vary cross size by noise
      let crossSize = map(n, 0, 1, 2, spacing * 1.2);
      
      // Draw a “+” sign at (x, y)
      // Horizontal segment
      line(
        x - crossSize / 2, y,
        x + crossSize / 2, y
      );
      // Vertical segment
      line(
        x, y - crossSize / 2,
        x, y + crossSize / 2
      );
    }
  }
}
