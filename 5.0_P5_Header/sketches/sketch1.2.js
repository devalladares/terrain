export default function(p) {
    const CONFIG = {
      IMAGE_PATH: 'images/4.png',
      RESIZE_WIDTH: 0,
      NUM_PARTICLES: 10,                    // Reduced to 3-5 particles
      SHOW_BG_IMAGE: true,
      BG_OPACITY: 20,                      // Increased opacity for faster fade
      LINE_COLOR: {
        GRAY: 255,
        ALPHA: 180                         // Added alpha for line transparency
      },
      LINE_WEIGHT: 1,                      // Increased line weight
      PARTICLE_LIFETIME: 420,              // Lifetime in frames (2 seconds at 60fps)
      FADE_DURATION: 20,                   // Frames over which to fade in/out
      PARTICLE_RESET_POSITION: {
        MIN_X: 0,
        MAX_X: () => p.width,
        MIN_Y: 0,
        MAX_Y: () => p.height
      },
      FLOW_VECTOR_SCALE: 2,               // Reduced for more controlled movement
      SPAWN_INTERVAL: 45                  // Frames between spawning new particles
    };
  
    let img, field = [], fieldW, fieldH, container;
    let particles = [];
    let framesSinceLastSpawn = 0;
  
    // Enhanced particle object
    class Particle {
      constructor() {
        this.reset();
      }
  
      reset() {
        // Start from left side for more consistent "trail" effect
        this.x = CONFIG.PARTICLE_RESET_POSITION.MIN_X;
        this.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
        this.age = 0;
        this.alpha = 0; // Start transparent
        this.active = true;
        this.path = []; // Store path for smoother rendering
      }
  
      // Calculate current opacity based on particle age
      getAlpha() {
        if (this.age < CONFIG.FADE_DURATION) {
          // Fade in
          return p.map(this.age, 0, CONFIG.FADE_DURATION, 0, CONFIG.LINE_COLOR.ALPHA);
        } else if (this.age > CONFIG.PARTICLE_LIFETIME - CONFIG.FADE_DURATION) {
          // Fade out
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
  
        // Trim path length to prevent memory issues
        if (this.path.length > 50) {
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
      
      // Initialize flow field
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
          field[x + y * fieldW] = p5.Vector.fromAngle(angle);
        }
      }
  
      if (CONFIG.SHOW_BG_IMAGE) {
        p.image(img, 0, 0, p.width, p.height);
      } else {
        p.background(255);
      }
  
      // Initialize first particle
      particles.push(new Particle());
    };
  
    p.draw = function() {
      // Redraw background image with low opacity for fade effect
      p.push();
      p.tint(255, CONFIG.BG_OPACITY);
      p.image(img, 0, 0, p.width, p.height);
      p.pop();
  
      // Update and draw particles
      particles = particles.filter(particle => particle.active);
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
  
      // Spawn new particles periodically
      framesSinceLastSpawn++;
      if (framesSinceLastSpawn >= CONFIG.SPAWN_INTERVAL && particles.length < CONFIG.NUM_PARTICLES) {
        particles.push(new Particle());
        framesSinceLastSpawn = 0;
      }
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