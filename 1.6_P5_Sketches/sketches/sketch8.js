/**********************************************
 * sketches/sketchN.js
 * Converted p5.js Particle Flow Field with Animation & Interaction
 **********************************************/

export default function(p) {
    // -- SETTINGS --
    const CELL_SIZE = 4;           // Each "pixel" is a 4×4 block
    const NOISE_SCALE = 0.001;     // Flow field resolution
    const NUM_PARTICLES = 200;     // Number of particles
    const palette = [              // Color palette for particles
      "darkgreen", "white", "white", '#96D39B', '#57D7F2', '#F098F4'
    ];
  
    // -- VARIABLES --
    let field = [];                // Flow field vectors
    let particles = [];            // Array of particle objects
  
    p.setup = function() {
      p.createCanvas(800, 800);
      p.noStroke();
      p.background(255);
  
      // Precompute the flow direction for each pixel of 800×800
      field = new Array(p.width * p.height);
      for (let y = 0; y < p.height; y++) {
        for (let x = 0; x < p.width; x++) {
          let angle = p.noise(x * NOISE_SCALE, y * NOISE_SCALE) * p.TWO_PI * 2;
          // Convert angle to a vector
          field[x + y * p.width] = p5.Vector.fromAngle(angle);
        }
      }
  
      // Create initial particles
      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push({
          x: p.random(p.width),
          y: p.random(p.height),
          color: p.random(palette),
        });
      }
    };
  
    p.draw = function() {
      // Move and draw several particle steps per frame
      for (let i = 0; i < 100; i++) {
        let particle = p.random(particles);
  
        // Current pixel position (rounded down)
        let ix = p.floor(particle.x);
        let iy = p.floor(particle.y);
  
        let vx = 0, vy = 0;
        if (ix >= 0 && ix < p.width && iy >= 0 && iy < p.height) {
          let v = field[ix + iy * p.width];
          vx = v.x;
          vy = v.y;
        }
  
        // Move the particle
        particle.x += vx;
        particle.y += vy;
  
        // Wrap or respawn if it leaves the canvas
        if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
          particle.x = p.random(p.width);
          particle.y = p.random(p.height);
        }
  
        // Convert continuous (x, y) to the coarse grid cell
        let cellX = p.floor(particle.x / CELL_SIZE);
        let cellY = p.floor(particle.y / CELL_SIZE);
  
        // Draw a “big pixel” block if in range
        if (cellX >= 0 && cellX < p.width / CELL_SIZE &&
            cellY >= 0 && cellY < p.height / CELL_SIZE) {
          p.fill(particle.color);
          p.rect(cellX * CELL_SIZE, cellY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
  
      // Optionally stop after some frames:
      // if (p.frameCount > 1000) p.noLoop();
    };
  
    // Optional: Handle mouse press or other interactions
    p.mousePressed = function() {
      // Example: Reset background on mouse press
      // p.background(255);
    };
  
    // Optional: Handle key presses
    p.keyPressed = function() {
      // Example: Toggle particle count with a key press
      // if (p.key === 'Up') {
      //   particles.push({
      //     x: p.random(p.width),
      //     y: p.random(p.height),
      //     color: p.random(p.palette),
      //   });
      // } else if (p.key === 'Down' && particles.length > 0) {
      //   particles.pop();
      // }
    };
  }
  