// sketch1.6.js

export default function(p) {
  // Configuration Object with Numerical Reset Positions
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 10,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 20,
    LINE_COLOR: '#ffffff', // Green color for lines
    LINE_WEIGHT: 0.75,
    PARTICLE_LIFETIME_SEC: 1000, // Displayed in seconds
    FADE_IN_DURATION_SEC: 2,   // Fade In Duration in seconds
    FADE_OUT_DURATION_SEC: 2,  // Fade Out Duration in seconds
    PARTICLE_RESET_POSITION_MIN_X: 0,
    PARTICLE_RESET_POSITION_MAX_X: 800, // Default; will update in setup
    PARTICLE_RESET_POSITION_MIN_Y: 0,
    PARTICLE_RESET_POSITION_MAX_Y: 600, // Default; will update in setup
    FLOW_VECTOR_SCALE: 2,
    BASE_SPEED: 1,
    SPAWN_INTERVAL: 10000,
    MAX_PATH_LENGTH: 1000,
    STROKE_ALPHA: 255 // New configuration option for stroke transparency
  };

  // Deep copy of CONFIG for resetting purposes
  const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));

  let img, field = [], fieldW, fieldH, container;
  let particles = [];
  let gui; // GUI instance
  let guiVisible = false; // Flag to track GUI visibility

  // Constants
  const FRAME_RATE = 60; // Assuming a frame rate of 60 FPS

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
      this.active = true;
      this.path = [];
    }

    getAlpha() {
      const fadeInFrames = CONFIG.FADE_IN_DURATION_SEC * FRAME_RATE;
      const fadeOutFrames = CONFIG.FADE_OUT_DURATION_SEC * FRAME_RATE;
      const lifetimeFrames = CONFIG.PARTICLE_LIFETIME_SEC * FRAME_RATE;

      if (this.age < fadeInFrames) {
        // Fade In Phase
        return p.map(this.age, 0, fadeInFrames, 0, 255);
      } else if (this.age > lifetimeFrames - fadeOutFrames) {
        // Fade Out Phase
        return p.map(this.age, lifetimeFrames - fadeOutFrames, lifetimeFrames, 255, 0);
      }
      // Fully Opaque Phase
      return 255;
    }

    update() {
      if (!this.active) return;

      this.age++;
      const lifetimeFrames = CONFIG.PARTICLE_LIFETIME_SEC * FRAME_RATE;
      if (this.age >= lifetimeFrames) {
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
      
      // Convert HEX color to RGBA with stroke_alpha
      const c = p.color(CONFIG.LINE_COLOR);
      // Calculate final alpha by combining getAlpha() and STROKE_ALPHA
      const finalAlpha = p.map(CONFIG.STROKE_ALPHA, 0, 255, 0, 1) * (this.getAlpha());
      p.stroke(p.red(c), p.green(c), p.blue(c), finalAlpha);

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
    p.frameRate(FRAME_RATE); // Set frame rate

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
    resetParticles();

    // Initialize GUI
    initGUI();

    // Inject custom CSS for dat.GUI
    injectCustomCSS();
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
        particle.age = index * ((CONFIG.PARTICLE_LIFETIME_SEC * FRAME_RATE) / CONFIG.NUM_PARTICLES / 2);
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

  // Handle Key Pressed for Toggling GUI Visibility
  p.keyPressed = function() {
    if (p.key === 'g' || p.key === 'G') {
      toggleGUI();
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

    // Initially hide the GUI
    gui.domElement.style.display = 'none';
    gui.domElement.style.display = 'block';

    // Add GUI Controls with Descriptions

    // Line Color (Combined Gray and Alpha)

    // Number of Particles
    gui.add(CONFIG, 'NUM_PARTICLES', 1, 100).step(1).name('Trail Number').onChange(value => {
      // Adjust number of particles dynamically
      while (particles.length < value) {
        particles.push(new Particle());
      }
      while (particles.length > value) {
        particles.pop();
      }
    }).title = "Total number of particles in the system.";


    gui.addColor(CONFIG, 'LINE_COLOR').name('Line Color').onChange(value => {
      // No additional action needed; color is handled in draw()
    }).title = "Color of the particle lines.";

    // Line Weight
    gui.add(CONFIG, 'LINE_WEIGHT', 0.1, 5, 0.1).name('Lineweight').onChange(value => {
      // Adjust line thickness
    }).title = "Thickness of the particle lines.";

    // Stroke Alpha (New GUI Control)
    gui.add(CONFIG, 'STROKE_ALPHA', 0, 255, 1).name('Transparency').onChange(value => {
      // Adjust stroke transparency in Particle.draw()
    }).title = "Transparency of the particle lines (0-255).";

    // Particle Lifetime in Seconds
    gui.add(CONFIG, 'PARTICLE_LIFETIME_SEC', 1, 5000, 10).name('Trail Lifetime').onChange(value => {
      // Reset particles after changing lifetime
      resetParticles();
    }).title = "How long each particle lives in seconds.";

    // Max Path Length
    gui.add(CONFIG, 'MAX_PATH_LENGTH', 10, 5000, 10).name('Max Trail Length').onChange(value => {
      // Adjust maximum path length for particles
    }).title = "Maximum number of points in a particle's trail.";

    // Fade In Duration in Seconds
    gui.add(CONFIG, 'FADE_IN_DURATION_SEC', 0.1, 10, 0.1).name('Fade In Duration (sec)').onChange(value => {
      // Reset particles after changing fade durations
      resetParticles();
    }).title = "Duration over which particles fade in.";

    // Fade Out Duration in Seconds
    gui.add(CONFIG, 'FADE_OUT_DURATION_SEC', 0.1, 10, 0.1).name('Fade Out Duration (sec)').onChange(value => {
      // Reset particles after changing fade durations
      resetParticles();
    }).title = "Duration over which particles fade out.";

    // Flow Vector Scale
    gui.add(CONFIG, 'FLOW_VECTOR_SCALE', 0.1, 10, 0.1).name('Flow Vector Scale').onChange(value => {
      // Adjust flow vector scale
    }).title = "Scale multiplier for the flow vectors affecting particle movement.";

    // Base Speed
    // gui.add(CONFIG, 'BASE_SPEED', 0.1, 10, 0.1).name('Base Speed').onChange(value => {
    //   // Adjust base speed of particles
    //   // Recalculate flow field vectors with new base speed
    //   for (let i = 0; i < field.length; i++) {
    //     let v = field[i].copy().setMag(CONFIG.BASE_SPEED);
    //     field[i] = v;
    //   }
    //   // Reset particles to apply new flow vectors
    //   resetParticles();
    // }).title = "Base speed of particles before applying flow field influence.";

    // Add Reset Button
    gui.add({ reset: resetAll }, 'reset').name('Reset to Default').onChange(() => {
      // No additional action needed as resetAll handles everything
    }).title = "Reset all settings to their default values.";

    // GUI is initially hidden; no need to call gui.show()
  }

  // Function to Toggle GUI Visibility
  function toggleGUI() {
    guiVisible = !guiVisible;
    if (guiVisible) {
      gui.domElement.style.display = 'block';
    } else {
      gui.domElement.style.display = 'none';
    }
  }

  // Function to Reset All Particles
  function resetParticles() {
    particles = [];
    for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
      let particle = new Particle();
      // Stagger initial ages to prevent simultaneous spawning
      particle.age = i * ((CONFIG.PARTICLE_LIFETIME_SEC * FRAME_RATE) / CONFIG.NUM_PARTICLES / 2);
      particles.push(particle);
    }
  }

  // Function to Reset All Configurations to Default
  function resetAll() {
    // Restore CONFIG to DEFAULT_CONFIG
    Object.assign(CONFIG, JSON.parse(JSON.stringify(DEFAULT_CONFIG)));

    // Update the GUI controls to reflect the reset values
    for (let controller of gui.__controllers) {
      controller.updateDisplay();
    }
    for (let folderName in gui.__folders) {
      let folder = gui.__folders[folderName];
      for (let controller of folder.__controllers) {
        controller.updateDisplay();
      }
    }

    // Reset particles
    resetParticles();
  }

  // Function to Inject Custom CSS for dat.GUI
  function injectCustomCSS() {
    const css = `
      /* dat.GUI Container */
 
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }
} // Closing brace for `export default function(p) {`
