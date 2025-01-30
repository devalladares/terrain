export default function(p) {
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    RESIZE_WIDTH: 0,
    NUM_PARTICLES: 200,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 150,
    COLOR_SCHEMES: {
      WHITE: ['#ffffff'],
      GREEN: ['#96D39B'],
      MIXED: ['#ffffff', '#ffffff', '#ffffff', '#96D39B']  // 3:1 ratio favoring green
    },
    CURRENT_COLOR_SCHEME: 'GREEN',  // Starting color scheme
    TRAIL_STYLES: {
      CIRCLES: 'circles',
      STROKE: 'stroke',
      CIRCLES_AND_STROKE: 'circles_and_stroke',
      PLUS: 'plus',
      SQUARES: 'squares'
    },
    CURRENT_TRAIL_STYLE: 'circles_and_stroke',  // Starting trail style
    STROKE_WEIGHT: 0.2,           // General stroke weight for trails
    PLUS_STROKE_WEIGHT: 0.5,      // Specific stroke weight for plus symbols <              // Size of circles in trails
    PLUS_SIZE: 5,                  // Size of plus symbols
    SQUARE_SIZE: 3,                // Size of squares in trails
    TRAIL_LENGTH: 0,
    FLOW_VECTOR_SCALE: 3,
    LINE_OPACITY: 255,
    PARTICLE_RESET_POSITION: {
      MIN_X: 0,
      MAX_X: () => p.width,
      MIN_Y: 0,
      MAX_Y: () => p.height
    },
    PARTICLE_SETTINGS: {
      BASE_COUNT: 100,
      INCREMENT: 10,
      MAX_COUNT: 500,
      MIN_COUNT: 10
    },
    SPEED_FACTOR_RANGE: [0.8, 1.2],
    TRAIL_LENGTH_RANGE: [500, 1500], // Adjusted for variability
    MOUSE_SPAWN_RADIUS: 40,
    CIRCLE_SPACING: 4.25,   
    CIRCLE_SIZE: 2,           // Distance between trail elements
    DASH_LENGTH: 10,
    GAP_LENGTH: 20,
    USE_COLORS: true,                 // Toggle to use colors based on schemes
    COLORS: ['#ffffff', '#96D39B'],  // Fallback or additional colors
    HEART_EMOJI: '<3'                 // Added heart emoji for reference <3
  };

  let img;
  let field = [];
  let fieldW, fieldH;
  let particles = [];
  let container;
  let bgDrawn = false;

  p.preload = function() {
    img = p.loadImage(
      CONFIG.IMAGE_PATH,
      () => console.log(`Image "${CONFIG.IMAGE_PATH}" loaded successfully.`),
      (err) => console.error(`Failed to load image "${CONFIG.IMAGE_PATH}".`, err)
    );
  };

  p.setup = function() {
    container = p.select('#sketch-container');
    let containerWidth, containerHeight;

    if (container) {
      containerWidth = container.width;
      containerHeight = container.height;
    } else {
      // Fallback to window size if container doesn't exist
      console.warn('Container "#sketch-container" not found. Using window dimensions.');
      containerWidth = window.innerWidth;
      containerHeight = window.innerHeight;
    }

    p.createCanvas(containerWidth, containerHeight).parent(container || p.body);

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

    for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
      particles.push(createParticle());
    }

    if (CONFIG.SHOW_BG_IMAGE) {
      drawBackgroundImage();
    } else {
      p.background(255);
    }
  };

  p.draw = function() {
    // Draw background only once
    if (!bgDrawn) {
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
      bgDrawn = true;
    }

    let allComplete = true;

    particles.forEach(particle => {
      if (!particle.isComplete) {
        allComplete = false;
        let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
        let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
        
        let vx = 0, vy = 0;
        if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
          let v = field[ix + iy * fieldW];
          vx = v.x * CONFIG.FLOW_VECTOR_SCALE * particle.speedFactor;
          vy = v.y * CONFIG.FLOW_VECTOR_SCALE * particle.speedFactor;
        }

        particle.x += vx;
        particle.y += vy;

        particle.trail.push({ x: particle.x, y: particle.y });
        if (particle.trail.length > particle.maxTrailLength) {
          particle.trail.shift();
        }

        // Once the trail reaches its maximum length, mark as complete
        if (particle.trail.length >= particle.maxTrailLength) {
          particle.isComplete = true;
          return;
        }

        if (particle.trail.length > 1) {
          p.push();
          if (CONFIG.USE_COLORS) {
            p.stroke(particle.color);
          } else {
            p.stroke(255, CONFIG.LINE_OPACITY);
          }
          p.strokeWeight(CONFIG.STROKE_WEIGHT);
          p.noFill();

          // Draw the trail based on current style
          let lastPoint = null;  // Track the last drawn point for all styles
          
          switch(CONFIG.CURRENT_TRAIL_STYLE) {
            case CONFIG.TRAIL_STYLES.CIRCLES:
              p.noStroke();
              p.fill(particle.color);
              particle.trail.forEach(pos => {
                if (lastPoint === null || p.dist(pos.x, pos.y, lastPoint.x, lastPoint.y) >= CONFIG.CIRCLE_SPACING) {
                  p.circle(pos.x, pos.y, CONFIG.CIRCLE_SIZE);
                  lastPoint = pos;
                }
              });
              break;

            case CONFIG.TRAIL_STYLES.STROKE:
              p.noFill();
              p.stroke(particle.color);
              p.strokeWeight(CONFIG.STROKE_WEIGHT);
              for (let i = 0; i < particle.trail.length - 1; i++) {
                const current = particle.trail[i];
                const next = particle.trail[i + 1];
                p.line(current.x, current.y, next.x, next.y);
              }
              break;

            case CONFIG.TRAIL_STYLES.CIRCLES_AND_STROKE:
              // First draw the stroke
              p.noFill();
              p.stroke(particle.color);
              p.strokeWeight(CONFIG.STROKE_WEIGHT);
              for (let i = 0; i < particle.trail.length - 1; i++) {
                const current = particle.trail[i];
                const next = particle.trail[i + 1];
                p.line(current.x, current.y, next.x, next.y);
              }
              // Then draw circles on top
              p.noStroke();
              p.fill(particle.color);
              lastPoint = null;  // Reset for circle placement
              particle.trail.forEach(pos => {
                if (lastPoint === null || p.dist(pos.x, pos.y, lastPoint.x, lastPoint.y) >= CONFIG.CIRCLE_SPACING) {
                  p.circle(pos.x, pos.y, CONFIG.CIRCLE_SIZE);
                  lastPoint = pos;
                }
              });
              break;

            case CONFIG.TRAIL_STYLES.PLUS:
              p.stroke(particle.color);
              p.strokeWeight(CONFIG.PLUS_STROKE_WEIGHT); // Use specific stroke weight for plus
              particle.trail.forEach(pos => {
                if (lastPoint === null || p.dist(pos.x, pos.y, lastPoint.x, lastPoint.y) >= CONFIG.CIRCLE_SPACING) {
                  const halfSize = CONFIG.PLUS_SIZE / 2;
                  p.line(pos.x - halfSize, pos.y, pos.x + halfSize, pos.y);
                  p.line(pos.x, pos.y - halfSize, pos.x, pos.y + halfSize);
                  lastPoint = pos;
                }
              });
              break;

            case CONFIG.TRAIL_STYLES.SQUARES:
              p.noStroke();
              p.fill(particle.color);
              particle.trail.forEach(pos => {
                if (lastPoint === null || p.dist(pos.x, pos.y, lastPoint.x, lastPoint.y) >= CONFIG.CIRCLE_SPACING) {
                  const halfSize = CONFIG.SQUARE_SIZE / 2;
                  p.rectMode(p.CENTER);
                  p.rect(pos.x, pos.y, CONFIG.SQUARE_SIZE, CONFIG.SQUARE_SIZE);
                  lastPoint = pos;
                }
              });
              break;
          }
          p.pop();
        }
      }
    });

    if (allComplete) {
      p.noLoop();
      console.log('All particles complete');
    }
  };

  function getRandomPositionAround(x, y, radius) {
    const angle = p.random(0, p.TWO_PI);
    const r = p.random(0, radius);
    return {
      x: x + r * p.cos(angle),
      y: y + r * p.sin(angle)
    };
  }

  function createParticle(x, y) {
    const colorScheme = CONFIG.COLOR_SCHEMES[CONFIG.CURRENT_COLOR_SCHEME];
    const color = CONFIG.USE_COLORS ? 
      colorScheme[Math.floor(p.random(colorScheme.length))] : 
      '#FFFFFF';
    
    return {
      x: x !== undefined ? x : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
      y: y !== undefined ? y : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
      trail: [],
      color: color,
      speedFactor: p.random(CONFIG.SPEED_FACTOR_RANGE[0], CONFIG.SPEED_FACTOR_RANGE[1]),
      maxTrailLength: CONFIG.TRAIL_LENGTH_RANGE.length === 1 
        ? CONFIG.TRAIL_LENGTH_RANGE[0] 
        : p.floor(p.random(CONFIG.TRAIL_LENGTH_RANGE[0], CONFIG.TRAIL_LENGTH_RANGE[1])),
      isComplete: false
    };
  }

  function isOutOfBounds(particle) {
    if (!particle.trail || particle.trail.length === 0) {
      return (
        particle.x < CONFIG.PARTICLE_RESET_POSITION.MIN_X ||
        particle.x >= CONFIG.PARTICLE_RESET_POSITION.MAX_X() ||
        particle.y < CONFIG.PARTICLE_RESET_POSITION.MIN_Y ||
        particle.y >= CONFIG.PARTICLE_RESET_POSITION.MAX_Y()
      );
    }

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
    } else {
      // Handle window resize when container is not present
      p.resizeCanvas(window.innerWidth, window.innerHeight);
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
    }
  };

  p.keyPressed = function() {
    // Toggle background image visibility
    if (p.key === 'B' || p.key === 'b') {
      CONFIG.SHOW_BG_IMAGE = !CONFIG.SHOW_BG_IMAGE;
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
    }
    
    // Save canvas as PNG
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('flow-field-trails', 'png');
    }

    // Use 'T' for Trail style toggle to avoid conflict with 'S'
    if (p.key === 'T' || p.key === 't') {
      const styles = Object.values(CONFIG.TRAIL_STYLES);
      const currentIndex = styles.indexOf(CONFIG.CURRENT_TRAIL_STYLE);
      const nextIndex = (currentIndex + 1) % styles.length;
      CONFIG.CURRENT_TRAIL_STYLE = styles[nextIndex];
      console.log('Trail style changed to:', CONFIG.CURRENT_TRAIL_STYLE);
    }

    // Color scheme toggle (C key)
    if (p.key === 'C' || p.key === 'c') {
      switch(CONFIG.CURRENT_COLOR_SCHEME) {
        case 'WHITE':
          CONFIG.CURRENT_COLOR_SCHEME = 'GREEN';
          break;
        case 'GREEN':
          CONFIG.CURRENT_COLOR_SCHEME = 'MIXED';
          break;
        default:
          CONFIG.CURRENT_COLOR_SCHEME = 'WHITE';
      }
      // Update all particle colors based on the new color scheme
      particles.forEach(particle => {
        const colorScheme = CONFIG.COLOR_SCHEMES[CONFIG.CURRENT_COLOR_SCHEME];
        particle.color = colorScheme[Math.floor(p.random(colorScheme.length))];
      });
      console.log('Color scheme changed to:', CONFIG.CURRENT_COLOR_SCHEME);
    }

    // Increase number of particles
    if (p.key === '=') {
      const toAdd = Math.min(
        CONFIG.PARTICLE_SETTINGS.INCREMENT,
        CONFIG.PARTICLE_SETTINGS.MAX_COUNT - particles.length
      );
      for (let i = 0; i < toAdd; i++) {
        particles.push(createParticle());
      }
      console.log(`${toAdd} particles added. Total particles: ${particles.length}`);
    }

    // Decrease number of particles
    if (p.key === '-') {
      const toRemove = Math.min(
        CONFIG.PARTICLE_SETTINGS.INCREMENT,
        particles.length - CONFIG.PARTICLE_SETTINGS.MIN_COUNT
      );
      particles.splice(particles.length - toRemove, toRemove);
      console.log(`${toRemove} particles removed. Total particles: ${particles.length}`);
    }

    // Reset particles
    if (p.key === 'R' || p.key === 'r') {
      particles = [];
      for (let i = 0; i < CONFIG.NUM_PARTICLES; i++) {
        particles.push(createParticle());
      }
      if (CONFIG.SHOW_BG_IMAGE) {
        drawBackgroundImage();
      } else {
        p.background(255);
      }
      p.loop();
      console.log('Particles reset.');
    }
  };

  // Removed mouseDragged function as per your original code
}
