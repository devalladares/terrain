export default function(p) {
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 100,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 150,
    COLORS: [
      '#F098F4',   // Pink
      // '#57D7F2',   // Blue
      // '#ffffff',   // White
      '#96D39B'    // Lightgreen
    ],
    USE_COLORS: true,  // Set to true to use colors array, false for white only
    LINE_WEIGHT:1,
    TRAIL_LENGTH: 400,  // Default trail length (can be overridden per particle)
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
      MAX_COUNT: 500,       // Maximum number of particles allowed
      MIN_COUNT: 10        // Minimum number of particles allowed
    },
    SPEED_FACTOR_RANGE: [0.8, 1.2],  // Range for speed variation
    TRAIL_LENGTH_RANGE: [200, 600],  // Range for trail length variation
    MOUSE_SPAWN_RADIUS: 40,          // Radius around cursor for spawning particles
    TRAIL_STYLE: 'circle',            // 'circle' or 'dotted'
    CIRCLE_SIZE: 1,                   // Diameter of trail circles
    DOT_DISTANCE: 10                  // Distance between dots for dotted lines
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
      particles.push(createParticle());
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
        vx = v.x * CONFIG.FLOW_VECTOR_SCALE * particle.speedFactor;
        vy = v.y * CONFIG.FLOW_VECTOR_SCALE * particle.speedFactor;
      }

      // Update position
      particle.x += vx;
      particle.y += vy;

      // Update trail
      particle.trail.push({ x: particle.x, y: particle.y });
      if (particle.trail.length > particle.maxTrailLength) {
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
        p.noFill();
        if (CONFIG.USE_COLORS) {
          p.stroke(particle.color);
          p.strokeWeight(CONFIG.LINE_WEIGHT);
        } else {
          p.stroke(255, CONFIG.LINE_OPACITY);
          p.strokeWeight(CONFIG.LINE_WEIGHT);
        }

        if (CONFIG.TRAIL_STYLE === 'circle') {
          // Draw circles at each trail point
          particle.trail.forEach(pos => {
            p.circle(pos.x, pos.y, CONFIG.CIRCLE_SIZE);
          });
        } else if (CONFIG.TRAIL_STYLE === 'dotted') {
          // Draw dotted lines
          for (let i = 0; i < particle.trail.length - 1; i++) {
            const current = particle.trail[i];
            const next = particle.trail[i + 1];
            const distance = p.dist(current.x, current.y, next.x, next.y);
            const steps = Math.floor(distance / CONFIG.DOT_DISTANCE);

            for (let step = 0; step < steps; step++) {
              const interpX = p.lerp(current.x, next.x, step / steps);
              const interpY = p.lerp(current.y, next.y, step / steps);
              p.point(interpX, interpY);
            }
          }
        }
        p.pop();
      }
    });
  };

  /**
   * Generates a random position within a circle of given radius around (x, y).
   * @param {number} x - The x-coordinate of the center.
   * @param {number} y - The y-coordinate of the center.
   * @param {number} radius - The radius of the circle.
   * @returns {object} - An object with x and y properties.
   */
  function getRandomPositionAround(x, y, radius) {
    const angle = p.random(0, p.TWO_PI);
    const r = p.random(0, radius);
    const newX = x + r * p.cos(angle);
    const newY = y + r * p.sin(angle);
    return { x: newX, y: newY };
  }

  function createParticle(x, y) {
    const color = CONFIG.USE_COLORS ? 
      CONFIG.COLORS[Math.floor(p.random(CONFIG.COLORS.length))] : 
      '#FFFFFF';
    
    const speedFactor = p.random(CONFIG.SPEED_FACTOR_RANGE[0], CONFIG.SPEED_FACTOR_RANGE[1]);
    const maxTrailLength = p.floor(p.random(CONFIG.TRAIL_LENGTH_RANGE[0], CONFIG.TRAIL_LENGTH_RANGE[1]));

    return {
      x: x !== undefined ? x : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
      y: y !== undefined ? y : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
      trail: [],
      color: color,
      speedFactor: speedFactor,
      maxTrailLength: maxTrailLength
    };
  }

  function resetParticle(particle) {
    particle.x = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X());
    particle.y = p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y());
    particle.trail = [];  // Clear trail on reset
    // Optionally, you can re-randomize speed and trail length on reset
    // particle.speedFactor = p.random(CONFIG.SPEED_FACTOR_RANGE[0], CONFIG.SPEED_FACTOR_RANGE[1]);
    // particle.maxTrailLength = p.floor(p.random(CONFIG.TRAIL_LENGTH_RANGE[0], CONFIG.TRAIL_LENGTH_RANGE[1]));
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

    // Toggle trail style with 'T' key
    if (p.key === 'T' || p.key === 't') {
      if (CONFIG.TRAIL_STYLE === 'circle') {
        CONFIG.TRAIL_STYLE = 'dotted';
        console.log('Trail style changed to Dotted Lines');
      } else {
        CONFIG.TRAIL_STYLE = 'circle';
        console.log('Trail style changed to Circles');
      }
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

  // Add new particle on mouse drag with spawn radius
  p.mouseDragged = function() {
    if (particles.length < CONFIG.PARTICLE_SETTINGS.MAX_COUNT) {
      const spawnPos = getRandomPositionAround(p.mouseX, p.mouseY, CONFIG.MOUSE_SPAWN_RADIUS);
      particles.push(createParticle(spawnPos.x, spawnPos.y));
    }
  };
}
