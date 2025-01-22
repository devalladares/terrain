// sketches/sketch15.js

export default function sketch15(p) {
  /*******************************************************
    Roni-Style Variable Squares with Collision Detection
    and Animated Noise-based Coloring

    -- Key Customizable Variables at the Top --
  *******************************************************/

  // ----------------------
  // Variables at the top
  // ----------------------
  const CANVAS_SIZE = 600;        // Final canvas dimension (width=height)
  const N = 32;                   // Total number of grid cells along each axis
  const margin = 2;               // How many grid cells to leave empty at edges

  // Animation + Noise
  const N_FRAMES = 500;           // How many frames in our "loop"
  const FRAME_RATE = 60;          // Frames per second
  const noiseScale = 1 / 100;    // Noise scale factor (sc in original)
  const offset = 10;              // Offset used in noise calls
  const rad = 1;                  // Amplitude in noise calls

  // Visual
  const palette = ["#003323", "white", "#96D39B", "#57D7F2", "#F098F4"];
  const bgColor = "white";        // Background color (removed '#' as it's invalid for color names)
  const strokeColor = "black";    // Outline color for squares (removed '#' as it's invalid)
  const strokeW = 1;              // Outline thickness

  // Internal
  let u;                            // Pixel size of each grid cell
  let squares = [];                 // Holds all squares (i, j, s) in grid coords

  p.setup = function() {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(FRAME_RATE);

    // Each grid cell is "u" pixels wide
    u = p.width / N;

    p.stroke(strokeColor);
    p.strokeWeight(strokeW);

    // Build our composition of squares
    createComposition();
  };

  p.draw = function() {
    p.background(bgColor);

    // Calculate theta for animation: cycles from 0..TWO_PI as frameCount goes from 0..N_FRAMES
    let theta = p.TWO_PI * (p.frameCount % N_FRAMES) / N_FRAMES;

    // Draw each square with an animated noise-based fill
    for (let squ of squares) {
      drawSquare(squ.i * u, squ.j * u, squ.s * u, theta);
    }
  };

  // -------------------------------------------
  // 1) Build the composition of squares
  // -------------------------------------------
  function createComposition() {
    squares = [];

    // 1A) Try placing many 2×2 squares randomly without overlap
    // (Up to 1000 attempts; you can increase or decrease)
    for (let attempt = 0; attempt < 1000; attempt++) {
      let newSqu = generateSquare(4);
      if (canPlaceSquare(newSqu)) {
        squares.push(newSqu);
      }
    }

    // 1B) Fill all remaining gaps with 1×1 squares
    for (let j = margin; j < N - margin; j++) {
      for (let i = margin; i < N - margin; i++) {
        let newSqu = { i: i, j: j, s: 1 };
        if (canPlaceSquare(newSqu)) {
          squares.push(newSqu);
        }
      }
    }
  }

  // -------------------------------------------
  // 2) Attempt to create a new square of size s
  //    in random grid coords, ensuring it fits
  //    within margins
  // -------------------------------------------
  function generateSquare(s) {
    let i = p.floor(p.random(margin, N - margin - s + 1));
    let j = p.floor(p.random(margin, N - margin - s + 1));
    return { i, j, s };
  }

  // -------------------------------------------
  // 3) Collision check
  //    Return true if the new square doesn't overlap
  //    any existing squares
  // -------------------------------------------
  function canPlaceSquare(newSqu) {
    for (let squ of squares) {
      if (squaresIntersect(newSqu, squ)) {
        return false;
      }
    }
    return true;
  }

  // Overlap test in grid coords
  function squaresIntersect(a, b) {
    // a: {i, j, s}, b: {i, j, s}
    // They intersect if their projections on X and Y both overlap
    let aLeft   = a.i,      aRight   = a.i + a.s;
    let aTop    = a.j,      aBottom  = a.j + a.s;
    let bLeft   = b.i,      bRight   = b.i + b.s;
    let bTop    = b.j,      bBottom  = b.j + b.s;
    
    let overlapX = (aLeft < bRight) && (aRight > bLeft);
    let overlapY = (aTop < bBottom) && (aBottom > bTop);
    return overlapX && overlapY;
  }

  // -------------------------------------------
  // 4) drawSquare(...) : Renders a single square
  //    at pixel coords (x, y) with side s (pixels)
  //    color determined by noise(...) 
  // -------------------------------------------
  function drawSquare(x, y, s, theta) {
    // Compute a noise value to pick a color from the palette
    let nVal = p.noise(
      offset + rad * p.cos((x * noiseScale) + theta),
      offset + rad * p.sin((x * noiseScale) + theta),
      y * noiseScale
    );

    // Pick a color index based on nVal
    let idx = p.floor(nVal * palette.length) % palette.length;

    p.fill(palette[idx]);
    p.square(x, y, s);
  }

  // Optional: Handle window resizing
  p.windowResized = function() {
    p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE);
    u = p.width / N;
  };

  // Optional: Handle mouse press events
  p.mousePressed = function() {
    // Example: Recreate composition on mouse press
    createComposition();
  };

  // Optional: Handle key press events
  p.keyPressed = function() {
    // Example: Toggle some feature on key press
    // You can customize this as needed
  };
}
