export default function(p) {
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 100,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 150,
    COLORS: [
      '#F098F4',   // White
      '#57D7F2',   // Red
      '#ffffff',   // Green
      '#96D39B'    // Blue
    ],
    USE_COLORS: false,  // Set to true to use colors array, false for white only
    LINE_WEIGHT:1,
    TRAIL_LENGTH: 500,
    FLOW_VECTOR_SCALE: 3,
    LINE_OPACITY: 255,  // Moved from LINE_COLOR for easier access
    PARTICLE_RESET_POSITION: {
      MIN_X: 0,
      MAX_X: () => p.width,
      MIN_Y: 0,
      MAX_Y: () => p.height
    },
    PARTICLE_SETTINGS: {
      BASE_COUNT: 100,      // Starting number of particles
      INCREMENT: 10,        // How many particles to add/remove with +/- keys
      MAX_COUNT: 1000,       // Maximum number of particles allowed
      MIN_COUNT: 10        // Minimum number of particles allowed
    }
  };

  let img;
  let field = [];
  let fieldW, fieldH;
  let particles = [];
  let container;

  p.preload = function() {
    img = p.loadImage(
      CONFIG.IMAGE_PATH,
      () => console.log(`Image "${CONFIG.IMAGE_PATH}" loaded successfully.`),
      (err) => console.error(`Failed to load image "${CONFIG.IMAGE_PATH}".`, err)
    );
  };

  p.setup = function() {
    container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;
    
    p.createCanvas(containerWidth, containerHeight).parent(container);
    
    img.resize(CONFIG.RESIZE_WIDTH, 0);
    fieldW = img.width;
    fieldH = img.height;
    field = new Array(fieldW * fieldH);

    // Initialize flow field
    img.loadPixels();
    for (let y = 0; y < fieldH; y++) {
      for (let x = 0; x < fieldW; x++) {
        let idx = (x + y * fieldW) * 4;
        let bright = (img.pixels[idx] + img.pixels[idx + 1] + img.pixels[idx + 2]) / 3.0;
        let angle = p.map(bright, 0, 255, p.TWO_PI, 0);
        field[x + y * fieldW] = p5.Vector.fromAngle(angle);
      }
    }

    // Initialize particles with trails
    for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
      particles.push({
        x: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
        y: p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
        trail: []  // Added trail array for each particle
      });
    }

    // Draw initial background
    if (CONFIG.SHOW_BG_IMAGE) {
      drawBackgroundImage();
    } else {
      p.background(255);
    }
  };

  p.draw = function() {
    // Semi-transparent overlay for trail fade effect
    p.push();
    p.noStroke();
    if (CONFIG.SHOW_BG_IMAGE) {
      drawBackgroundImage();
      p.fill(255, 10);  // Very slight fade for visible background
    } else {
      p.fill(255, 20);  // Stronger fade for non-background version
    }
    p.rect(0, 0, p.width, p.height);
    p.pop();

    particles.forEach(particle => {
      // Get flow field vector
      let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
      let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
      
      let vx = 0, vy = 0;
      if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
        let v = field[ix + iy * fieldW];
        vx = v.x * CONFIG.FLOW_VECTOR_SCALE;
        vy = v.y * CONFIG.FLOW_VECTOR_SCALE;
      }

      // Update position
      particle.x += vx;
      particle.y += vy;

      // Update trail
      particle.trail.push({ x: particle.x, y: particle.y });
      if (particle.trail.length > CONFIG.TRAIL_LENGTH) {
        particle.trail.shift();
      }

      // Check bounds and reset if needed
      if (isOutOfBounds(particle)) {
        resetParticle(particle);
        particle.trail = [];  // Clear trail on reset
        return;
      }

      // Draw trail
      if (particle.trail.length > 1) {
        p.push();
        if (CONFIG.USE_COLORS) {
          p.stroke(particle.color);
          p.strokeWeight(CONFIG.LINE_WEIGHT);
        } else {
          p.stroke(255, CONFIG.LINE_OPACITY);
          p.strokeWeight(CONFIG.LINE_WEIGHT);
        }
        p.noFill();
        p.beginShape();
        particle.trail.forEach(pos => {
          p.vertex(pos.x, pos.y);
        });
        p.endShape();
        p.pop();
      }
    });
  };

  function createParticle(x, y) {
    const color = CONFIG.USE_COLORS ? 
      CONFIG.COLORS[Math.floor(p.random(CONFIG.COLORS.length))] : 
      '#FFFFFF';
    
    return {
      x: x || p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
      y: y || p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
      trail: [],
      color: color
    };
  }

  function resetParticle(particle) {
    particle.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X());
    particle.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
    particle.trail = [];  // Clear trail on reset
  }

  function isOutOfBounds(particle) {
    // Only reset if ALL trail points are out of bounds
    if (!particle.trail || particle.trail.length === 0) {
      return (
        particle.x < CONFIG.PARTICLE_RESET_POSITION.MIN_X ||
        particle.x >= CONFIG.PARTICLE_RESET_POSITION.MAX_X() ||
        particle.y < CONFIG.PARTICLE_RESET_POSITION.MIN_Y ||
        particle.y >= CONFIG.PARTICLE_RESET_POSITION.MAX_Y()
      );
    }

    // Check if all trail points are out of bounds
    return particle.trail.every(point => (
      point.x < CONFIG.PARTICLE_RESET_POSITION.MIN_X ||
      point.x >= CONFIG.PARTICLE_RESET_POSITION.MAX_X() ||
      point.y < CONFIG.PARTICLE_RESET_POSITION.MIN_Y ||
      point.y >= CONFIG.PARTICLE_RESET_POSITION.MAX_Y()
    ));
  }

  function drawBackgroundImage() {
    p.background(255);
    p.image(img, 0, 0, p.width, p.height);
  }

  // Window resize handling
  p.windowResized = function() {
    if (container) {
      const containerWidth = container.width;
      const containerHeight = container.height;
      p.resizeCanvas(containerWidth, containerHeight);
      
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
    }
  };

  // Interactive controls
  p.keyPressed = function() {
    if (p.key === 'B' || p.key === 'b') {
      CONFIG.SHOW_BG_IMAGE = !CONFIG.SHOW_BG_IMAGE;
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
    }
    
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('flow-field-trails', 'png');
    }

    // Toggle color mode
    if (p.key === 'C' || p.key === 'c') {
      CONFIG.USE_COLORS = !CONFIG.USE_COLORS;
      // Update existing particles with new colors
      particles.forEach(particle => {
        particle.color = CONFIG.USE_COLORS ? 
          CONFIG.COLORS[Math.floor(p.random(CONFIG.COLORS.length))] : 
          '#FFFFFF';
      });
    }

    // Add particles with + key
    if (p.key === '=') {
      const toAdd = Math.min(
        CONFIG.PARTICLE_SETTINGS.INCREMENT,
        CONFIG.PARTICLE_SETTINGS.MAX_COUNT - particles.length
      );
      for (let i = 0; i < toAdd; i++) {
        particles.push(createParticle());
      }
    }

    // Remove particles with - key
    if (p.key === '-') {
      const toRemove = Math.min(
        CONFIG.PARTICLE_SETTINGS.INCREMENT,
        particles.length - CONFIG.PARTICLE_SETTINGS.MIN_COUNT
      );
      particles.splice(particles.length - toRemove, toRemove);
    }
  };

  // Add new particle on mouse click
  p.mouseDragged = function() {
    if (particles.length < CONFIG.PARTICLE_SETTINGS.MAX_COUNT) {
      particles.push(createParticle(p.mouseX, p.mouseY));
    }
  };
}