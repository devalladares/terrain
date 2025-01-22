// sketches/sketchN.js

export default function(p) {
  // Declare variables within the instance scope
  let minSquareSize;
  let squareSpacing = 30;
  let squareSize = 0;
  let distFromRipple;
  
  let ripplex;
  let rippley;
  let rippleRadius = 0;
  let rippleStrength = 0;
  
  let speed = 0.02;
  
  const alph1 = ["A", "U", "G", "C"];
  const alph2 = [
    "+",
    "-",
    "++",
    "---",
    "++++"
  ];
  let xoff = 0;
  let yoff = 0;
  let zoff = 0;

  p.setup = function() {
    p.createCanvas(500, 500);
  
    ripplex = p.width / 2;
    rippley = p.height / 2;
  
    p.rectMode(p.CENTER);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16); // Adjust text size as needed
    p.colorMode(p.RGB, 255);
  };
  
  p.draw = function() {
    p.background(255); // Inverted from black (0) to white (255)
    xoff = 0;
    for (let x = 0; x <= p.width; x += 16) {
      yoff = 0;
      for (let y = 0; y <= p.height; y += 16) {
        const noiseVal = p.noise(xoff, yoff, zoff);
        const flow = p.noise(xoff, yoff, zoff);
        // Ensure indices are within array bounds
        const index1 = p.floor(p.map(flow, 0, 1, 0, alph1.length));
        const index2 = p.floor(p.map(flow, 0, 1, 0, alph2.length));
  
        // Calculate distance from ripple center
        const currentDist = p.dist(x, y, ripplex, rippley);
        distFromRipple = p.abs(currentDist - rippleRadius);
        const inc = 2;
  
        if (distFromRipple <= rippleStrength) {
          squareSize += inc;
          p.fill(0); // Inverted from white (255) to black (0)
          p.text(alph1[index1], x, y);
        } else {
          p.fill(0); // Inverted from white (255) to black (0)
          p.text(alph2[index2], x, y);
        }
        yoff += speed;
        // It's unclear why squareSize is incremented here; ensure it's intended
        squareSize += inc;
      }
      xoff += speed;
    }
  
    if (p.mouseIsPressed) {
      rippleRadius = rippleStrength;
      ripplex = p.mouseX;
      rippley = p.mouseY;
    }
  
    zoff += speed / 3;
    rippleRadius += 10;
  };
  
  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press if needed
  };
  
  p.keyPressed = function() {
    // Handle key press if needed
  };
}
