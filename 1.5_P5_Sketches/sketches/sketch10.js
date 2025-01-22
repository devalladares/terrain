// sketches/sketch10.js

export default function(p) {
  // Canvas size
  const w = 600;
  const h = 600;
  // Resolution of our sampling grid (the finer, the smoother the contours)
  const gridSize = 13;
  // Noise scale
  const noiseScale = 0.011;
  // How many contour levels to draw
  const levels = 25;

  p.setup = function() {
    p.createCanvas(w, h);
    p.noLoop(); // Compute once
    p.stroke(255);
    p.noFill();
  };

  p.draw = function() {
    p.background(0);

    // Precompute a 2D array of noise values
    let values = [];
    let cols = p.floor(w / gridSize);
    let rows = p.floor(h / gridSize);
    for (let j = 0; j <= rows; j++) {
      values[j] = [];
      for (let i = 0; i <= cols; i++) {
        let x = i * gridSize;
        let y = j * gridSize;
        values[j][i] = p.noise(x * noiseScale, y * noiseScale);
      }
    }

    // For each threshold, we do marching squares
    for (let l = 0; l < levels; l++) {
      let threshold = l / levels; // e.g., 0.0, 0.066..., up to ~1.0
      p.strokeWeight(1.2);
      p.stroke(255);

      // Marching squares: loop over each cell in the grid
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          // corners of our cell
          let topleft = values[j][i];
          let topright = values[j][i + 1];
          let bottomleft = values[j + 1][i];
          let bottomright = values[j + 1][i + 1];

          // We'll interpolate edges if crossing threshold
          let edges = [];

          // Quick function to linearly interpolate between 2 corners
          function interp(val1, val2, a, b) {
            // We assume threshold is T
            let t = (threshold - val1) / (val2 - val1 + 0.00001);
            return a + (b - a) * t;
          }

          // Check each edge for crossing
          // top edge
          if (
            (topleft < threshold && topright >= threshold) ||
            (topleft >= threshold && topright < threshold)
          ) {
            let xcoord = interp(
              topleft,
              topright,
              i * gridSize,
              (i + 1) * gridSize
            );
            edges.push(p.createVector(xcoord, j * gridSize));
          }
          // right edge
          if (
            (topright < threshold && bottomright >= threshold) ||
            (topright >= threshold && bottomright < threshold)
          ) {
            let ycoord = interp(
              topright,
              bottomright,
              j * gridSize,
              (j + 1) * gridSize
            );
            edges.push(p.createVector((i + 1) * gridSize, ycoord));
          }
          // bottom edge
          if (
            (bottomleft < threshold && bottomright >= threshold) ||
            (bottomleft >= threshold && bottomright < threshold)
          ) {
            let xcoord = interp(
              bottomleft,
              bottomright,
              i * gridSize,
              (i + 1) * gridSize
            );
            edges.push(p.createVector(xcoord, (j + 1) * gridSize));
          }
          // left edge
          if (
            (topleft < threshold && bottomleft >= threshold) ||
            (topleft >= threshold && bottomleft < threshold)
          ) {
            let ycoord = interp(
              topleft,
              bottomleft,
              j * gridSize,
              (j + 1) * gridSize
            );
            edges.push(p.createVector(i * gridSize, ycoord));
          }

          // If we got 2 intersection points, draw a line
          if (edges.length === 2) {
            p.line(edges[0].x, edges[0].y, edges[1].x, edges[1].y);
          }
        }
      }
    }
  };
}
