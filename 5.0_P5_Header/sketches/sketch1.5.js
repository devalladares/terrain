export default function(p) {
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 10,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 20,
    LINE_COLOR: {
      GRAY: 255,
      ALPHA: 255
    },
    LINE_WEIGHT: .75,                      // Reduced line weight as requested
    PARTICLE_LIFETIME: 100000,              // Much longer lifetime for longer trails
    FADE_DURATION: 100000,                   // Longer fade for smoother transition
    PARTICLE_RESET_POSITION: {
      MIN_X: 0,
      MAX_X: () => p.width,
      MIN_Y: 0,
      MAX_Y: () => p.height
    },
    FLOW_VECTOR_SCALE: 2,               // Overall speed multiplier
    BASE_SPEED: 1,                    // Base speed before flow field influence
    SPAWN_INTERVAL: 10000,                  // Increased interval between spawns
    MAX_PATH_LENGTH: 100000                 // Much longer maximum path length
  };

  let img, field = [], fieldW, fieldH, container;
  let particles = [];
  let framesSinceLastSpawn = 0;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      // Randomize starting position across the entire screen
      this.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X());
      this.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
      this.age = 0;
      this.alpha = 0;
      this.active = true;
      this.path = [];
    }

    getAlpha() {
      if (this.age < CONFIG.FADE_DURATION) {
        return p.map(this.age, 0, CONFIG.FADE_DURATION, 0, CONFIG.LINE_COLOR.ALPHA);
      } else if (this.age > CONFIG.PARTICLE_LIFETIME - CONFIG.FADE_DURATION) {
        return p.map(this.age, CONFIG.PARTICLE_LIFETIME - CONFIG.FADE_DURATION, CONFIG.PARTICLE_LIFETIME, CONFIG.LINE_COLOR.ALPHA, 0);
      }
      return CONFIG.LINE_COLOR.ALPHA;
    }

    update() {
      if (!this.active) return;

      this.age++;
      if (this.age >= CONFIG.PARTICLE_LIFETIME) {
        this.active = false;
        return;
      }

      // Store current position
      this.path.push({x: this.x, y: this.y});

      // Keep more points for longer trails
      if (this.path.length > CONFIG.MAX_PATH_LENGTH) {
        this.path.shift();
      }

      // Get flow field vector
      let ix = p.floor(p.map(this.x, 0, p.width, 0, fieldW));
      let iy = p.floor(p.map(this.y, 0, p.height, 0, fieldH));

      if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
        let v = field[ix + iy * fieldW];
        this.x += v.x * CONFIG.FLOW_VECTOR_SCALE;
        this.y += v.y * CONFIG.FLOW_VECTOR_SCALE;
      } else {
        // Deactivate particle when it goes off screen instead of wrapping
        this.active = false;
      }
    }

    draw() {
      if (!this.active || this.path.length < 2) return;

      p.push();
      p.noFill();
      p.strokeWeight(CONFIG.LINE_WEIGHT);
      p.stroke(CONFIG.LINE_COLOR.GRAY, this.getAlpha());

      // Draw smooth curve through path points
      p.beginShape();
      for (let pt of this.path) {
        p.curveVertex(pt.x, pt.y);
      }
      p.endShape();
      p.pop();
    }
  }

  p.preload = function() {
    img = p.loadImage(CONFIG.IMAGE_PATH);
  };

  p.setup = function() {
    container = p.select('#sketch-container');
    p.createCanvas(container.width, container.height).parent(container);
    
    img.resize(CONFIG.RESIZE_WIDTH, 0);
    fieldW = img.width;
    fieldH = img.height;
    field = new Array(fieldW * fieldH);

    img.loadPixels();
    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        let idx = (x + y * fieldW) * 4;
        let bright = (img.pixels[idx] + img.pixels[idx + 1] + img.pixels[idx + 2]) / 3.0;
        let angle = p.map(bright, 0, 255, p.TWO_PI, 0);
        let vector = p5.Vector.fromAngle(angle);
        vector.mult(CONFIG.BASE_SPEED);  // Apply base speed to the vector
        field[x + y * fieldW] = vector;
      }
    }

    if (CONFIG.SHOW_BG_IMAGE) {
      p.image(img, 0, 0, p.width, p.height);
    }

    // Initialize with staggered particles
    for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
      let particle = new Particle();
      // Stagger initial ages to prevent simultaneous spawning
      particle.age = i * (CONFIG.PARTICLE_LIFETIME / CONFIG.NUM_PARTICLES);
      particles.push(particle);
    }
  };

  p.draw = function() {
    // Redraw background image with low opacity for fade effect
    p.push();
    p.tint(255, CONFIG.BG_OPACITY);
    p.image(img, 0, 0, p.width, p.height);
    p.pop();

    // Update and draw particles
    particles.forEach((particle, index) => {
      particle.update();
      particle.draw();
      
      // Reset particle if it's inactive
      if (!particle.active) {
        particle.reset();
        // Stagger resets to prevent clustering
        particle.age = index * (CONFIG.PARTICLE_LIFETIME / CONFIG.NUM_PARTICLES / 2);
      }
    });
  };

  p.windowResized = function() {
    if (container) {
      p.resizeCanvas(container.width, container.height);
      if (CONFIG.SHOW_BG_IMAGE) {
        p.image(img, 0, 0, p.width, p.height);
      }
    }
  };
}