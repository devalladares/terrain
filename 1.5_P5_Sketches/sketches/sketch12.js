// sketches/sketch12.js

export default function(p) {
  // Canvas size
  const w = 800;
  const h = 800;
  // Resolution of our sampling grid (the smaller, the smoother the contour lines)
  const gridSize = 3;
  // Noise scale (adjust to taste)
  const noiseScale = 0.0025;
  // How many contour levels to draw
  const levels = 10;
  // Animation speed in noise's third parameter
  const timeSpeed = 2;

  p.setup = function() {
    p.createCanvas(w, h);
    p.pixelDensity(1); // Ensures our pixel array matches the canvas size 1:1
    p.noSmooth(); // (Optional) so that pixels stay crisp
    p.noLoop(); // We can remove this to animate
  };

  p.draw = function() {
    // Clear background to black
    p.background(0);
    // Grab the current canvas pixels so we can modify them
    p.loadPixels();

    // Precompute a 2D array of noise values for this frame
    let cols = p.floor(w / gridSize);
    let rows = p.floor(h / gridSize);
    let values = [];

    for (let j = 0; j <= rows; j++) {
      values[j] = [];
      for (let i = 0; i <= cols; i++) {
        let x = i * gridSize;
        let y = j * gridSize;
        // Add a "time" dimension so noise evolves each frame
        let z = p.frameCount * timeSpeed;
        values[j][i] = p.noise(x * noiseScale, y * noiseScale, z);
      }
    }

    // For each threshold, do a marching‐squares pass
    for (let l = 0; l < levels; l++) {
      let threshold = l / levels; // e.g., 0.0, 0.1, 0.2, etc.

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          // corners of our grid cell
          let tl = values[j][i];
          let tr = values[j][i + 1];
          let bl = values[j + 1][i];
          let br = values[j + 1][i + 1];

          // Collect any edges that cross this threshold
          let edges = [];

          // Helper: linear interpolation to find crossing
          function interp(val1, val2, pos1, pos2) {
            let t = (threshold - val1) / (val2 - val1 + 1e-9);
            return pos1 + (pos2 - pos1) * t;
          }

          // top edge
          if (
            (tl < threshold && tr >= threshold) ||
            (tl >= threshold && tr < threshold)
          ) {
            let xcoord = interp(tl, tr, i * gridSize, (i + 1) * gridSize);
            edges.push(p.createVector(xcoord, j * gridSize));
          }
          // right edge
          if (
            (tr < threshold && br >= threshold) ||
            (tr >= threshold && br < threshold)
          ) {
            let ycoord = interp(tr, br, j * gridSize, (j + 1) * gridSize);
            edges.push(p.createVector((i + 1) * gridSize, ycoord));
          }
          // bottom edge
          if (
            (bl < threshold && br >= threshold) ||
            (bl >= threshold && br < threshold)
          ) {
            let xcoord = interp(bl, br, i * gridSize, (i + 1) * gridSize);
            edges.push(p.createVector(xcoord, (j + 1) * gridSize));
          }
          // left edge
          if (
            (tl < threshold && bl >= threshold) ||
            (tl >= threshold && bl < threshold)
          ) {
            let ycoord = interp(tl, bl, j * gridSize, (j + 1) * gridSize);
            edges.push(p.createVector(i * gridSize, ycoord));
          }

          // If we got two edge points, "draw" a line of white pixels between them
          if (edges.length === 2) {
            drawLineAsPixels(edges[0].x, edges[0].y, edges[1].x, edges[1].y);
          }
        }
      }
    }

    // Push our changed pixel data to the screen
    p.updatePixels();
  };

  // “Bresenham‐ish” or simple linear interpolation to set each pixel in the line
  function drawLineAsPixels(x1, y1, x2, y2) {
    let steps = p.max(p.abs(x2 - x1), p.abs(y2 - y1));
    for (let s = 0; s <= steps; s++) {
      let t = s / steps;
      let x = p.floor(p.lerp(x1, x2, t));
      let y = p.floor(p.lerp(y1, y2, t));
      setPixel(x, y, 255); // set this pixel to white
    }
  }

  // Helper to poke a single pixel in the pixels[] array
  function setPixel(x, y, brightness) {
    if (x < 0 || x >= p.width || y < 0 || y >= p.height) return; // out of bounds
    let idx = 4 * (y * p.width + x);
    p.pixels[idx + 0] = brightness; // R
    p.pixels[idx + 1] = brightness; // G
    p.pixels[idx + 2] = brightness; // B
    p.pixels[idx + 3] = 255; // A
  }
}
