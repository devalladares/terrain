export default function(p) {
    const CONFIG = {
      IMAGE_PATH: 'images/4.png',
      RESIZE_WIDTH: 0,
      NUM_PARTICLES: 200,
      SHOW_BG_IMAGE: true,
      BG_OPACITY: 0,
      COLORS: [
        '#ffffff',
        '#96D39B'
      ],
      USE_COLORS: true,
      LINE_WEIGHT: 2,
      TRAIL_LENGTH: 0,
      FLOW_VECTOR_SCALE: 3,
      LINE_OPACITY: 255,
      PARTICLE_RESET_POSITION: {
        MIN_X: -100,
        MAX_X: () => p.width,
        MIN_Y: -100,
        MAX_Y: () => p.height
      },
      PARTICLE_SETTINGS: {
        BASE_COUNT: 100,
        INCREMENT: 10,
        MAX_COUNT: 500,
        MIN_COUNT: 10
      },
      SPEED_FACTOR_RANGE: [0.8, 1.2],
      TRAIL_LENGTH_RANGE: [200, 300],
      MOUSE_SPAWN_RADIUS: 40,
      TRAIL_STYLE: 'circle',
      CIRCLE_SIZE: 2,
      CIRCLE_SPACING: 5.25,
      DASH_LENGTH: 10,
      GAP_LENGTH: 20
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
      const containerWidth = container.width;
      const containerHeight = container.height;
      
      p.createCanvas(containerWidth, containerHeight).parent(container);
      
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
      // Remove the background wiping/fading effect
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
            p.strokeWeight(CONFIG.LINE_WEIGHT);
            p.noFill();
  
            if (CONFIG.TRAIL_STYLE === 'circle') {
              p.noStroke();
              p.fill(particle.color);
              let lastCircle = null;
              particle.trail.forEach(pos => {
                if (lastCircle === null || p.dist(pos.x, pos.y, lastCircle.x, lastCircle.y) >= CONFIG.CIRCLE_SPACING) {
                  p.circle(pos.x, pos.y, CONFIG.CIRCLE_SIZE);
                  lastCircle = pos;
                }
              });
            } else if (CONFIG.TRAIL_STYLE === 'dashed') {
              p.drawingContext.setLineDash([CONFIG.DASH_LENGTH, CONFIG.GAP_LENGTH]);
              p.stroke(particle.color);
              p.strokeWeight(CONFIG.LINE_WEIGHT);
              for (let i = 0; i < particle.trail.length - 1; i++) {
                const current = particle.trail[i];
                const next = particle.trail[i + 1];
                p.line(current.x, current.y, next.x, next.y);
              }
              p.drawingContext.setLineDash([]);
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
      const color = CONFIG.USE_COLORS ? 
        CONFIG.COLORS[Math.floor(p.random(CONFIG.COLORS.length))] : 
        '#FFFFFF';
      
      return {
        x: x !== undefined ? x : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_X, CONFIG.PARTICLE_RESET_POSITION.MAX_X()),
        y: y !== undefined ? y : p.random(CONFIG.PARTICLE_RESET_POSITION.MIN_Y, CONFIG.PARTICLE_RESET_POSITION.MAX_Y()),
        trail: [],
        color: color,
        speedFactor: p.random(CONFIG.SPEED_FACTOR_RANGE[0], CONFIG.SPEED_FACTOR_RANGE[1]),
        maxTrailLength: p.floor(p.random(CONFIG.TRAIL_LENGTH_RANGE[0], CONFIG.TRAIL_LENGTH_RANGE[1])),
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
      }
    };
  
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
  
      if (p.key === 'C' || p.key === 'c') {
        CONFIG.USE_COLORS = !CONFIG.USE_COLORS;
        particles.forEach(particle => {
          particle.color = CONFIG.USE_COLORS ? 
            CONFIG.COLORS[Math.floor(p.random(CONFIG.COLORS.length))] : 
            '#FFFFFF';
        });
      }
  
      if (p.key === 'T' || p.key === 't') {
        CONFIG.TRAIL_STYLE = CONFIG.TRAIL_STYLE === 'circle' ? 'dashed' : 'circle';
      }
  
      if (p.key === '=') {
        const toAdd = Math.min(
          CONFIG.PARTICLE_SETTINGS.INCREMENT,
          CONFIG.PARTICLE_SETTINGS.MAX_COUNT - particles.length
        );
        for (let i = 0; i < toAdd; i++) {
          particles.push(createParticle());
        }
      }
  
      if (p.key === '-') {
        const toRemove = Math.min(
          CONFIG.PARTICLE_SETTINGS.INCREMENT,
          particles.length - CONFIG.PARTICLE_SETTINGS.MIN_COUNT
        );
        particles.splice(particles.length - toRemove, toRemove);
      }
  
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
      }
    };
  
    // Removed mouseDragged function
  }