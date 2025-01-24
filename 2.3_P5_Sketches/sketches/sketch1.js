// sketch1.js

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
  
  // Flow field vectors
  let field = [];

  // Reference to the container
  let container;

  p.setup = function() {
    // Select the sketch container
    container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    // Create canvas to match the container's size
    p.createCanvas(containerWidth, containerHeight).parent(container);

    // Initialize the flow field
    field = new Array(p.width * p.height);

    // Fill the flow field with vectors based on Perlin noise
    for (let y = 0; y < p.height; y++) {
      for (let x = 0; x < p.width; x++) {
        let angle = p.noise(x * SCALE, y * SCALE) * p.TWO_PI * 2;
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

    // Set a pink background for testing
    p.background('pink');

    p.noStroke();
  };
  
  p.draw = function() {
    // Optional: Set semi-transparent background for trail effect
    // p.background(255, 5); // Uncomment for trails

    // Draw a certain number of segments per frame
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
  };

  // Resize the canvas when the window is resized
  p.windowResized = function() {
    const containerWidth = container.width;
    const containerHeight = container.height;
    p.resizeCanvas(containerWidth, containerHeight);

    // Optionally, reinitialize the flow field and particles
    // For simplicity, we'll keep them as is

    // Reset the background after resizing
    p.background('pink');
  };
}
