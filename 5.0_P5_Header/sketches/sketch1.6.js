// sketch1.6.js

export default function(p) {
  // Configuration Object with Numerical Reset Positions
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 10,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 20,
    LINE_COLOR_GRAY: 255,
    LINE_COLOR_ALPHA: 255,
    LINE_WEIGHT: 0.75,
    PARTICLE_LIFETIME: 100000,
    FADE_DURATION: 0,
    PARTICLE_RESET_POSITION_MIN_X: 0,
    PARTICLE_RESET_POSITION_MAX_X: 800, // Default; will update in setup
    PARTICLE_RESET_POSITION_MIN_Y: 0,
    PARTICLE_RESET_POSITION_MAX_Y: 600, // Default; will update in setup
    FLOW_VECTOR_SCALE: 2,
    BASE_SPEED: 1,
    SPAWN_INTERVAL: 10000,
    MAX_PATH_LENGTH: 10
  };

  let img, field = [], fieldW, fieldH, container;
  let particles = [];
  let gui, guiVisible = true; // GUI visibility flag

  // Particle Class
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      // Randomize starting position within the configured boundaries
      this.x = p.random(CONFIG.PARTICLE_RESET_POSITION_MIN_X, CONFIG.PARTICLE_RESET_POSITION_MAX_X);
      this.y = p.random(CONFIG.PARTICLE_RESET_POSITION_MIN_Y, CONFIG.PARTICLE_RESET_POSITION_MAX_Y);
      this.age = 0;
      this.alpha = 0;
      this.active = true;
      this.path = [];
    }

    getAlpha() {
      if (CONFIG.FADE_DURATION === 0) {
        return CONFIG.LINE_COLOR_ALPHA;
      }
      if (this.age < CONFIG.FADE_DURATION) {
        return p.map(this.age, 0, CONFIG.FADE_DURATION, 0, CONFIG.LINE_COLOR_ALPHA);
      } else if (this.age > CONFIG.PARTICLE_LIFETIME - CONFIG.FADE_DURATION) {
        return p.map(this.age, CONFIG.PARTICLE_LIFETIME - CONFIG.FADE_DURATION, CONFIG.PARTICLE_LIFETIME, CONFIG.LINE_COLOR_ALPHA, 0);
      }
      return CONFIG.LINE_COLOR_ALPHA;
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
      p.stroke(CONFIG.LINE_COLOR_GRAY, this.getAlpha());

      // Draw smooth curve through path points
      p.beginShape();
      for (let pt of this.path) {
        p.curveVertex(pt.x, pt.y);
      }
      p.endShape();
      p.pop();
    }
  }

  // Preload Function
  p.preload = function() {
    img = p.loadImage(CONFIG.IMAGE_PATH);
  };

  // Setup Function
  p.setup = function() {
    container = p.select('#sketch-container');
    p.createCanvas(container.width, container.height).parent(container);
    
    // Update CONFIG with actual canvas dimensions
    CONFIG.PARTICLE_RESET_POSITION_MAX_X = p.width;
    CONFIG.PARTICLE_RESET_POSITION_MAX_Y = p.height;
    
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

    // Initialize GUI
    initGUI();
  };

  // Draw Function
  p.draw = function() {
    // Redraw background image with low opacity for fade effect
    if (CONFIG.SHOW_BG_IMAGE) {
      p.push();
      p.tint(255, CONFIG.BG_OPACITY);
      p.image(img, 0, 0, p.width, p.height);
      p.pop();
    } else {
      p.background(0); // Fallback to black background if not showing image
    }

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

  // Handle Window Resize
  p.windowResized = function() {
    if (container) {
      p.resizeCanvas(container.width, container.height);
      // Update CONFIG with new canvas dimensions
      CONFIG.PARTICLE_RESET_POSITION_MAX_X = p.width;
      CONFIG.PARTICLE_RESET_POSITION_MAX_Y = p.height;
      if (CONFIG.SHOW_BG_IMAGE) {
        p.image(img, 0, 0, p.width, p.height);
      }
    }
  };

  // Initialize dat.GUI
  function initGUI() {
    gui = new dat.GUI({ autoPlace: false });
    
    // Create and style the GUI container
    const guiContainer = document.createElement('div');
    guiContainer.style.position = 'absolute';
    guiContainer.style.top = '10px';
    guiContainer.style.right = '10px';
    guiContainer.style.zIndex = '1000'; // Ensure it's on top
    guiContainer.appendChild(gui.domElement);
    document.body.appendChild(guiContainer);

    // Add GUI Controls with Descriptions
    // gui.add(CONFIG, 'IMAGE_PATH').name('Image Path').onFinishChange(value => {
    //   img = p.loadImage(value);
    // }).listen();



    gui.add(CONFIG, 'NUM_PARTICLES', 1, 100).step(1).name('Number of Particles').onChange(value => {
      // Adjust number of particles dynamically
      while (particles.length < value) {
        particles.push(new Particle());
      }
      while (particles.length > value) {
        particles.pop();
      }
    });
 
 

    gui.add(CONFIG, 'LINE_COLOR_GRAY', 0, 255).name('Line Gray').onChange(value => {
      // Adjust line color gray
    });
 

    gui.add(CONFIG, 'LINE_WEIGHT', 0.1, 5, 0.2).name('Line Weight').onChange(value => {
      // Adjust line thickness
    });

    gui.add(CONFIG, 'PARTICLE_LIFETIME', 100, 200000, 100).name('Particle Lifetime').onChange(value => {
      // Display this in seconds please chat
    });

    gui.add(CONFIG, 'FADE_DURATION', 0, 50000).name('Fade Duration').onChange(value => {
      // chat plz always reset the sketch after change
    });
 

    gui.add(CONFIG, 'FLOW_VECTOR_SCALE', 0.1, 10, 0.2).name('Flow Vector Scale').onChange(value => {
      // Adjust flow vector scale
    });

    gui.add(CONFIG, 'BASE_SPEED', 0.2, 10, 0.2).name('Base Speed').onChange(value => {
      // Adjust base speed of particles
      // Recalculate flow field vectors with new base speed
      for (let i = 0; i < field.length; i++) {
        let v = field[i].copy().setMag(CONFIG.BASE_SPEED);
        field[i] = v;
      }
    });
 

    gui.add(CONFIG, 'MAX_PATH_LENGTH', 10, 2000, 10).name('Max Path Length').onChange(value => {
      // Adjust maximum path length for particles
    });

    // Start with GUI visible
    gui.show();
  }

  // Handle Key Presses for Toggling GUI
  p.keyPressed = function() {
    if (p.key === 'G' || p.key === 'g') {
      guiVisible = !guiVisible;
      if (guiVisible) {
        gui.domElement.parentNode.style.display = 'block';
      } else {
        gui.domElement.parentNode.style.display = 'none';
      }
    }
  };
} // Closing brace for `export default function(p) {`
