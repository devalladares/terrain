// sketches/sketch11.js

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
  const timeSpeed = 0.002;

  p.setup = function() {
    p.createCanvas(w, h);
    // Remove noLoop(), so draw() is called every frame (for animation)
    p.stroke(255);
    p.noFill();
  };

  p.draw = function() {
    p.background(0);

    // Precompute a 2D array of noise values for this frame
    let values = [];
    let cols = p.floor(w / gridSize);
    let rows = p.floor(h / gridSize);
    for (let j = 0; j <= rows; j++) {
      values[j] = [];
      for (let i = 0; i <= cols; i++) {
        let x = i * gridSize;
        let y = j * gridSize;
        // Add a "time" dimension so noise evolves each frame
        values[j][i] = p.noise(
          x * noiseScale,
          y * noiseScale,
          p.frameCount * timeSpeed
        );
      }
    }

    // For each threshold, we do a “marching squares” pass
    for (let l = 0; l < levels; l++) {
      let threshold = l / levels; // e.g., 0.0, 0.04, 0.08, ...

      p.strokeWeight(1);
      p.stroke(255);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          // corners of our grid cell
          let tl = values[j][i];
          let tr = values[j][i + 1];
          let bl = values[j + 1][i];
          let br = values[j + 1][i + 1];

          // Where does threshold cross each cell edge?
          let edges = [];

          // Helper: linearly interpolate the crossing point on an edge
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

          // If we found two crossing points, connect them with a line
          if (edges.length === 2) {
            p.line(edges[0].x, edges[0].y, edges[1].x, edges[1].y);
          }
        }
      }
    }
  };
}
