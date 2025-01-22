// sketches/sketchN.js

export default function(p) {
  // Define all global variables within the instance
  const BRAND_PALETTE = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
  
  let inc = 0.05;   // Noise increment (smaller => smoother, more stretched flow)
  let scl = 30;     // Size of each flow-field cell (bigger => chunkier flow cells)
  let cols, rows;   // Number of columns and rows in the flow field
  let zoff = 0;     // Time offset for noise (creates animation)
  let flowField;    // Will hold a p5.Vector for each cell
  
  let particles = [];
  let numParticles = 400; // Fewer particles for more negative space / separation
  
  // Particle class definition
  class Particle {
    constructor() {
      // Random start position
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      // Velocity and acceleration vectors
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      // Maximum speed
      this.maxspeed = 1.5;
      
      // Pick a random brand color at full opacity
      this.col = p.color(p.random(BRAND_PALETTE));
      this.col.setAlpha(255);
    }

    // Method to follow the flow field
    follow(flow) {
      // Determine the grid cell the particle is in
      let x = p.floor(this.pos.x / scl);
      let y = p.floor(this.pos.y / scl);
      let index = x + y * cols;
      
      // Safety check to prevent out-of-bounds errors
      if (index >= 0 && index < flow.length) {
        let force = flow[index];
        this.applyForce(force);
      }
    }

    // Apply a force to the particle's acceleration
    applyForce(force) {
      this.acc.add(force);
    }

    // Update the particle's position based on velocity and acceleration
    update() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxspeed);
      this.pos.add(this.vel);
      this.acc.mult(0);
    }

    // Wrap around the edges of the canvas
    edges() {
      if (this.pos.x > p.width)  this.pos.x = 0;
      if (this.pos.x < 0)        this.pos.x = p.width;
      if (this.pos.y > p.height) this.pos.y = 0;
      if (this.pos.y < 0)        this.pos.y = p.height;
    }

    // Display the particle on the canvas
    show() {
      p.stroke(this.col);
      p.strokeWeight(4);  // Thicker stroke for a bolder, more graphic look
      p.point(this.pos.x, this.pos.y);
    }
  }

  p.setup = function() {
    // Initialization code
    p.createCanvas(800, 800); // Set canvas size
    
    // Calculate the number of columns and rows based on the scale
    cols = p.floor(p.width / scl);
    rows = p.floor(p.height / scl);
    
    // Initialize the flowField array
    flowField = new Array(cols * rows);
    
    // Create the particles
    for (let i = 0; i < numParticles; i++) {
      particles[i] = new Particle();
    }
    
    // Optional: Set initial background color
    p.background(255);
  };

  p.draw = function() {
    // Each frame, redraw a solid white background (no fading)
    p.background(255);
    
    // Calculate or update the flow field
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        let index = x + y * cols;
        // 3D Perlin noise => angle
        let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 2;
        // Make a vector from that angle
        // In instance mode, use p5.Vector.fromAngle directly
        let v = p5.Vector.fromAngle(angle);
        v.setMag(1);
        flowField[index] = v;
        xoff += inc;
      }
      yoff += inc;
    }
    
    // Move through "time" slowly for gentle changes in flow
    zoff += 0.003;
    
    // Update and draw particles
    for (let particle of particles) {
      particle.follow(flowField);
      particle.update();
      particle.edges();
      particle.show();
    }
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Handle mouse press if needed
  };

  p.keyPressed = function() {
    // Handle key press if needed
  };
}
