// sketches/sketch3.js

export default function(p) {
  // Number of particles or other constants
  const NUM_PARTICLES = 1000; // Reduced for performance with interactions
  const SCALE = 0.002;
  let particles = [];
  let palette = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557'];
  let field = [];
  let container;

  // Array to store circles drawn on mouse click
  let circles = [];

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
      // Optional: Semi-transparent background for trail effect
      // p.background(255, 10); // Uncomment for trails

      // Draw a certain number of segments per frame
      for (let i = 0; i < 100; i++) {
          // Pick a random particle
          let particle = p.random(particles);

          // Look up the flow vector at that position
          let vx = 0;
          let vy = 0;
          let ix = p.floor(particle.x);
          let iy = p.floor(particle.y);
          if (ix >= 0 && ix < p.width && iy >= 0 && iy < p.height) {
              let v = field[ix + iy * p.width];
              vx = v.x;
              vy = v.y;
          }

          // Update particle
          let oldx = particle.x;
          let oldy = particle.y;
          particle.x += vx;
          particle.y += vy;

          // If out of bounds, re-spawn
          if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
              particle.x = p.random(p.width);
              particle.y = p.random(p.height);
          }

          // Draw a small rectangle for the segment
          p.push();
          p.translate(oldx, oldy);
          let angleRot = p.atan2(vy, vx);
          p.rotate(angleRot);
          p.fill(particle.color);
          p.rect(0, 0, p.random(5, 10), 2);
          p.pop();
      }

      // Draw circles from mouse interactions
      circles.forEach((circle, index) => {
          p.fill(circle.color);
          p.noStroke();
          p.ellipse(circle.x, circle.y, circle.size);
          // Fade out effect
          circle.alpha -= 2;
          if (circle.alpha <= 0) {
              circles.splice(index, 1); // Remove circle when fully transparent
          } else {
              circle.color = p.color(p.red(circle.color), p.green(circle.color), p.blue(circle.color), circle.alpha);
          }
      });
  };

  // Handle mouse pressed event
  p.mouseDragged = function() {
      // Add a new circle at the mouse position
      circles.push({
          x: p.mouseX,
          y: p.mouseY,
          size: p.random(20, 50),
          color: p.random(palette).levels ? p.random(palette) : p.color(p.random(palette)),
          alpha: 255
      });
  };

  // Resize the canvas when the window is resized
  p.windowResized = function() {
      const containerWidth = container.width;
      const containerHeight = container.height;
      p.resizeCanvas(containerWidth, containerHeight);
      p.background('pink');
  };
}
