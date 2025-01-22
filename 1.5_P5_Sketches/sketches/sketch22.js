// sketches/sketchN.js

export default function(p) {
  // 1) Tweakable config:
  const IMAGE_PATH          = 'images/1.jpg';  // your terrain image
  const RESIZE_WIDTH        = 200;      // resize image to this width; height auto
  const NUM_PARTICLES       = 200;       // how many particles
  const DRAW_STEPS_PER_FRAME = 100;    // lines drawn per frame
  
  const SHOW_BG_IMAGE       = false;     // toggle background image on/off
  const BG_OPACITY          = 255;      // background image opacity (0..255)
  
  // Example brand color palette
  // (Replace with your actual brand hex codes)
  const BRAND_PALETTE = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
   
  // If you just want white lines, you can do:
  // const LINE_COLOR = [255]; // white
  // Instead, we'll randomize from BRAND_PALETTE for each particle.
  
  const LINE_WEIGHT         = 1;        // stroke weight
  
  // 2) Global Variables
  let img;       // resized image
  let field = []; 
  let fieldW, fieldH;
  let particles = [];
  
  /**
   * Preload function to load and resize the image before setup.
   */
  p.preload = function() {
    img = p.loadImage(IMAGE_PATH, loaded => {
      loaded.resize(RESIZE_WIDTH, 0); 
    });
  };
  
  p.setup = function() {
    p.createCanvas(800, 800);
    
    // Build the flow field from the resized image
    fieldW = img.width;
    fieldH = img.height;
    field = new Array(fieldW * fieldH);
  
    img.loadPixels();
    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        let idx = (x + y * fieldW) * 4;
        let r = img.pixels[idx + 0];
        let g = img.pixels[idx + 1];
        let b = img.pixels[idx + 2];
        let bright = (r + g + b) / 3.0;
        // Map brightness to angle
        let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
        field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
      }
    }
  
    // Create particles, each with a random color from our brand palette
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: p.random(p.width),
        y: p.random(p.height),
        col: BRAND_PALETTE[p.floor(p.random(BRAND_PALETTE.length))]  // store color string
      });
    }
  
    // Draw white background initially
    p.background(255);
  };
  
  p.draw = function() {
    // Draw optional background image each frame
    if (SHOW_BG_IMAGE) {
      p.push();
      p.tint(255, BG_OPACITY);  // set the alpha for the background image
      p.image(img, 0, 0, p.width, p.height); // stretch to canvas
      p.pop();
    } 
    // If you prefer to fade lines instead:
    // else {
    //   p.background(255, 10); 
    // }
  
    // We do multiple small "steps" per frame
    for (let i = 0; i < DRAW_STEPS_PER_FRAME; i++) {
      let particle = p.random(particles);
  
      // Find which pixel of the flow field we’re in
      let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
      let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
  
      // Old position for drawing a line
      let oldx = particle.x;
      let oldy = particle.y;
  
      // If valid pixel in field, get flow vector
      let vx = 0, vy = 0;
      if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
        let v = field[ix + iy * fieldW];
        vx = v.x;
        vy = v.y;
      }
  
      // Move particle
      particle.x += vx;
      particle.y += vy;
  
      // If out of bounds, reset & skip drawing
      if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
        particle.x = p.random(p.width);
        particle.y = p.random(p.height);
        continue;
      }
  
      // Draw line from old pos to new pos
      p.stroke(p.color(particle.col));
      p.strokeWeight(LINE_WEIGHT);
      p.line(oldx, oldy, particle.x, particle.y);
    }
  
    // Optionally, stop after some frames:
    // if (p.frameCount > 1000) p.noLoop();
  };
  
  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press if needed
  };
  
  p.keyPressed = function() {
    // Handle key press if needed
  };
}
