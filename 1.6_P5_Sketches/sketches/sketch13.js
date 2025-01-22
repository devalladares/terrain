// sketches/sketch13.js

export default function sketch13(p) {
  // ----------------------
  // Variables at the top
  // ----------------------
  const CANVAS_SIZE = 600;       // Canvas width & height
  const N = 24;                  // How many cells across (and down) in our grid
  const N_FRAMES = 500;          // Animation loop length (frames)
  const FRAME_RATE = 30;         // Frames per second
  
  const margin = 1;              // Left/right/top/bot margin in "cell units"
  const gapFactor = 0.2;         // Gap between squares (as fraction of each cell's dimension)
  
  const palette = ["#003323", "white", "#96D39B", "#57D7F2", "#F098F4"];
  
  // Noise/animation parameters
  const offset = 10;             // Noise offset
  const rad = 1;                 // Used inside noise calls (radius amplitude)
  const sc = 1 / 50;             // Noise scale
  
  // -----------------------
  // Internal variables
  // -----------------------
  let u;        // Pixel dimension of each cell
  let gap;      // Pixel gap between squares
  
  p.setup = function() {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FRAME_RATE);
  
    u = p.width / N;          // Size of each cell in pixels
    gap = u * gapFactor;      // Pixel gap
    
    // Nice thick stroke if desired:
    p.stroke("#2c2060");
    p.strokeWeight(1);
  };
  
  p.draw = function() {
    // A gentle background color:
    p.background("white"); // Corrected to use a valid color string without '#'
  
    // Calculate theta for animation
    let theta = p.TWO_PI * (p.frameCount % N_FRAMES) / N_FRAMES;
  
    // Iterate over the grid cells, excluding margins
    for (let j = margin; j < N - margin; j++) {
      for (let i = margin; i < N - margin; i++) {
        drawCell(i, j, theta);
      }
    }
  };
  
  // ---------------------------------------
  // Draw a single grid cell (square) at (i, j)
  // ---------------------------------------
  function drawCell(i, j, theta) {
    // Convert grid coordinates to pixel coordinates
    let x = i * u + gap / 2;
    let y = j * u + gap / 2;
    let s = u - gap; // Actual square size
  
    // Use Perlin noise to pick a color index
    let nVal = p.noise(
      offset + rad * p.cos(x * sc + theta),
      offset + rad * p.sin(x * sc + theta),
      y * sc
    );
  
    // Pick a color from the palette
    let idx = p.floor(nVal * palette.length) % palette.length;
    p.fill(palette[idx]);
  
    // Draw the cell
    p.square(x, y, s);
  }
  
  // Optional: Handle window resizing
  p.windowResized = function() {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
    u = p.width / N;
    gap = u * gapFactor;
  };
  
  // Optional: Handle mouse press events
  p.mousePressed = function() {
    // Example: Change palette on mouse press
    // You can customize this as needed
    // palette.push(palette.shift());
  };
  
  // Optional: Handle key press events
  p.keyPressed = function() {
    // Example: Toggle some feature on key press
    // You can customize this as needed
  };
}
