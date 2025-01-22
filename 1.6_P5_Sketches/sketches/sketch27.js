// sketches/sketch27.js

export default function(p) {
  // -- Control Variables --

  // Canvas dimensions
  const CANVAS_SIZE = 800; 

  // Your brand palette
  const BRAND_PALETTE = ['black'];

  // Flow field resolution: each cell is `SCL` pixels wide
  const SCL = 30;      

  // Noise increment (lower => smoother, more “stretched out” flow)
  const INC = 0.05;    

  // How quickly the flow field shifts over time
  const ZOFF_SPEED = 0.003;  

  // Number of particles (circles) moving around
  const NUM_PARTICLES = 100;    

  // Particle max speed
  const MAX_SPEED = 1.5;    

  // Particle stroke weight
  const STROKE_WEIGHT = 2;      

  // Background color (white = 255, black = 0, etc.)
  const BACKGROUND_COLOR = 255;    

  // Separation parameters
  // How close is “too close” for repulsion?
  const SEPARATION_DIST = 200;     
  // The upper limit on separation steering force 
  const SEPARATION_FORCE = 1;    

  // --------------------------------------------------
  // Below: variables that p5 manipulates internally
  // --------------------------------------------------

  // Number of columns & rows in the flow field
  let cols, rows;            
  // The array storing a p5.Vector flow direction for each cell
  let flowField = [];        
  // Perlin noise “time” offset
  let zoff = 0;              

  // The array of Particle objects
  let particles = [];


  // =======================
  // PARTICLE CLASS
  // =======================
  class Particle {
    constructor() {
      // Random start position
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      // Velocity & acceleration start at 0
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      // Max speed
      this.maxspeed = MAX_SPEED;

      // Random brand color (solid, no alpha)
      this.col = p.color(p.random(BRAND_PALETTE));
      this.col.setAlpha(255);
    }

    // Slight repulsion from neighbors to maintain space
    separate(others) {
      let steering = p.createVector(0, 0);
      let total = 0;

      // Check each other particle
      for (let o of others) {
        if (o === this) continue; // skip ourselves
        let d = p.dist(this.pos.x, this.pos.y, o.pos.x, o.pos.y);

        // If too close, push away
        if (d > 0 && d < SEPARATION_DIST) {
          let diff = p5.Vector.sub(this.pos, o.pos);
          diff.normalize();
          // Weighted by 1/d so the closer they are, the stronger the push
          diff.div(d);
          steering.add(diff);
          total++;
        }
      }

      // Average the steering vector
      if (total > 0) {
        steering.div(total);
      }

      // If we have any steering, turn it into a force
      if (steering.mag() > 0) {
        // Aim for this maxspeed
        steering.setMag(this.maxspeed);
        // Steering = desired - velocity
        steering.sub(this.vel);
        // Limit its power
        steering.limit(SEPARATION_FORCE);
        this.applyForce(steering);
      }
    }

    // Follow the local flowField vector
    follow(flow) {
      // Which cell of the field are we in?
      let x = p.floor(this.pos.x / SCL);
      let y = p.floor(this.pos.y / SCL);
      let index = x + y * cols;

      // Handle edge cases
      index = p.constrain(index, 0, flow.length - 1);
      let force = flow[index].copy();
      this.applyForce(force);
    }

    // Add a force (acceleration)
    applyForce(force) {
      this.acc.add(force);
    }

    // Standard position/velocity update
    update() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxspeed);
      this.pos.add(this.vel);
      // Clear out acceleration
      this.acc.set(0, 0);
    }

    // Wrap around the edges
    edges() {
      if (this.pos.x > p.width)  this.pos.x = 0;
      if (this.pos.x < 0)         this.pos.x = p.width;
      if (this.pos.y > p.height) this.pos.y = 0;
      if (this.pos.y < 0)         this.pos.y = p.height;
    }

    // Draw this particle as a circle
    show() {
      p.strokeWeight(STROKE_WEIGHT);
      p.stroke(this.col);
      p.point(this.pos.x, this.pos.y);
    }
  }

  // =======================
  // p5.js INSTANCE METHODS
  // =======================
  p.setup = function() {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);

    // Figure out how many columns and rows we need
    cols = p.floor(p.width / SCL);
    rows = p.floor(p.height / SCL);

    // Prepare the flowField array
    flowField = new Array(cols * rows);

    // Create a bunch of particles
    for (let i = 0; i < NUM_PARTICLES; i++) {
      particles.push(new Particle());
    }
  };

  p.draw = function() {
    // Draw a solid background each frame
    p.background(BACKGROUND_COLOR);

    // --- Compute the flow field vectors ---
    let yoff = 0;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        // Convert (x,y) to index in our 1D array
        let index = x + y * cols;

        // 3D Perlin noise => angle in [0..4π]
        let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 2;

        // Convert angle to a 2D vector
        let v = p5.Vector.fromAngle(angle);
        v.setMag(1);              // magnitude ~1
        flowField[index] = v;

        // Step xoff horizontally
        xoff += INC;
      }
      // Step yoff down for the next row
      yoff += INC;
    }
    // Advance zoff so flow field “animates” over time
    zoff += ZOFF_SPEED;


    // --- Update & draw each particle ---
    // We first calculate separation for each particle, then update their flow
    // so that the repulsion is taken into account each frame.
    for (let pObj of particles) {
      pObj.separate(particles);
      pObj.follow(flowField);
      pObj.update();
      pObj.edges();
      pObj.show();
    }
  };

  // Optional: Additional p5.js lifecycle methods
  p.mousePressed = function() {
    // Example: Add a new particle on mouse press
    particles.push(new Particle());
  };

  p.keyPressed = function() {
    // Example: Clear all particles on pressing 'c' or 'C'
    if (p.key === 'c' || p.key === 'C') {
      particles = [];
      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle());
      }
    }
  };
}
