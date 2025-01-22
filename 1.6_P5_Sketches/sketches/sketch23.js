// sketches/sketchN.js

export default function(p) {
  const BRAND_PALETTE = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
  
  let inc = 0.1;      // Noise increment
  let scl = 20;       // Size of each flow-field cell
  let cols, rows;     // Number of columns and rows in the flow field
  let zoff = 0;       // Time offset for noise (creates animation)
  let flowField;      // Will hold a p5.Vector for each cell
  
  let particles = [];
  let numParticles = 800; // Number of moving particles
  
  // Particle class adapted for instance mode
  class Particle {
    constructor(pInstance) {
      this.p = pInstance;
      // Start at random screen position
      this.pos = this.p.createVector(this.p.random(this.p.width), this.p.random(this.p.height));
      // No initial velocity
      this.vel = this.p.createVector(0, 0);
      // No initial acceleration
      this.acc = this.p.createVector(0, 0);
      // Limit how fast the particle can go
      this.maxspeed = 1.0;
      // Pick a random color from your brand palette
      this.col = this.p.color(this.p.random(BRAND_PALETTE));
      // Make it slightly transparent so trails blend
      this.col.setAlpha(70);
    }
  
    follow(flow) {
      // Figure out which cell of the flow field we're in
      let x = this.p.floor(this.pos.x / scl);
      let y = this.p.floor(this.pos.y / scl);
      // Convert x,y to index in the flowField array
      let index = x + y * cols;
      // Ensure index is within bounds
      if (index >= 0 && index < flow.length) {
        // Get the vector from our flow field
        let force = flow[index];
        // Apply that force to our particle
        this.applyForce(force);
      }
    }
  
    applyForce(force) {
      this.acc.add(force);
    }
  
    update() {
      // Update velocity and position
      this.vel.add(this.acc);
      this.vel.limit(this.maxspeed);
      this.pos.add(this.vel);
      // Reset acceleration for next frame
      this.acc.mult(0);
    }
  
    edges() {
      // Wrap around if we go off the edges
      if (this.pos.x > p.width)  this.pos.x = 0;
      if (this.pos.x < 0)        this.pos.x = p.width;
      if (this.pos.y > p.height) this.pos.y = 0;
      if (this.pos.y < 0)        this.pos.y = p.height;
    }
  
    show() {
      this.p.stroke(this.col);
      this.p.strokeWeight(2);
      this.p.point(this.pos.x, this.pos.y);
    }
  }
  
  p.setup = function() {
    p.createCanvas(800, 800);
    
    // Figure out how many columns & rows we need for the flow field
    cols = p.floor(p.width / scl);
    rows = p.floor(p.height / scl);
  
    // Initialize the array that will store a vector for each cell
    flowField = new Array(cols * rows);
  
    // Create a bunch of particles
    for (let i = 0; i < numParticles; i++) {
      particles[i] = new Particle(p);
    }
  
    // Start with a black background
    p.background(0);
  };
  
  p.draw = function() {
    // Calculate a new flow field for this frame
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        let index = x + y * cols;
        // Use 3D Perlin noise (xoff, yoff, zoff) => angle
        let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 2; 
        // Create a 2D vector from that angle
        let v = p5.Vector.fromAngle(angle);
        // Control how strong that vector is
        v.setMag(1);
        // Store in flowField
        flowField[index] = v;
        xoff += inc;
      }
      yoff += inc;
    }
    // Slightly move through "time" each frame
    zoff += 0.01;
  
    // (Optional) very gently fade the previous frame, so particles leave trails
    p.fill(0, 15);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);
  
    // Update each particle according to the flow field & draw it
    for (let pObj of particles) {
      pObj.follow(flowField);
      pObj.update();
      pObj.edges();
      pObj.show();
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
