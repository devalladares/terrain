// sketches/sketch1.js

export default function(p) {
    // Number of particles
    const NUM_PARTICLES = 2000;
    // Flow field grid resolution
    const SCALE = 0.001; 
    // Store an array of particles
    let particles = [];
    // Color palette
    const palette = [
      '#ff6f61', '#ffc154', '#4bb3fd', '#af69ee', '#0fdc9f',
      '#2b193d', '#fdda24', '#f45d01', '#ebe7e0', '#2f2f2f'
    ];
    
    // Flow field vectors (optional to store in a table for faster lookup)
    let field = [];
    
    p.setup = function() {
      p.createCanvas(800, 800);
      // Precompute the flow field directions for each pixel or for a grid
      field = new Array(p.width * p.height);
    
      // Fill the flow field
      for (let y = 0; y < p.height; y++) {
        for (let x = 0; x < p.width; x++) {
          // Use noise to get angle
          let angle = p.noise(x * SCALE, y * SCALE) * p.TWO_PI * 2;
          // Store the direction as a p5.Vector
          let v = p5.Vector.fromAngle(angle);
          field[x + y * p.width] = v;
        }
      }
    
      // Create initial particles
      for (let i = 0; i < NUM_PARTICLES; i++) {
        let px = p.random(p.width);
        let py = p.random(p.height);
        particles.push({
          x: px,
          y: py,
          color: p.random(palette),
        });
      }
    
      p.background(255);
      p.noStroke();
    };
    
    p.draw = function() {
      // Draw a certain number of segments per frame
      // Doing multiple steps per frame helps fill the canvas faster
      for (let i = 0; i < 1000; i++) {
        // Pick a random particle
        let pParticle = p.random(particles);
    
        // Look up the flow vector at that position
        let vx = 0;
        let vy = 0;
        // Clamp particle coords to valid range
        let ix = p.floor(pParticle.x);
        let iy = p.floor(pParticle.y);
        if (ix >= 0 && ix < p.width && iy >= 0 && iy < p.height) {
          let v = field[ix + iy * p.width];
          vx = v.x;
          vy = v.y;
        }
    
        // Update particle
        let oldx = pParticle.x;
        let oldy = pParticle.y;
        pParticle.x += vx;
        pParticle.y += vy;
    
        // If out of bounds, re-spawn
        if (pParticle.x < 0 || pParticle.x >= p.width || pParticle.y < 0 || pParticle.y >= p.height) {
          pParticle.x = p.random(p.width);
          pParticle.y = p.random(p.height);
        }
    
        // Draw a small rectangle for the segment
        p.push();
        p.translate(oldx, oldy);
        let angleRot = p.atan2(vy, vx);
        p.rotate(angleRot);
        p.fill(pParticle.color);
        // Draw rectangle: width=some small random size, height=2
        p.rect(0, 0, p.random(5,10), 2);
        p.pop();
      }
    
      // Optionally stop after some frames or let it run
      // if (p.frameCount > 1000) p.noLoop();
    };
}
