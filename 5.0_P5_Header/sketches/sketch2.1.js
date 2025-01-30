export default function(p) {
  const CONFIG = {
    IMAGE_PATH: 'images/4.png',
    NUM_PARTICLES: 5,
    SHOW_BG_IMAGE: true,
    BG_OPACITY: 20,
    LINE_COLOR: '#ffffff',
    LINE_WEIGHT: 0.5,
    FLOW_VECTOR_SCALE: 2,
    BASE_SPEED: 1,
    STROKE_ALPHA: 150,
    
    // Simplified timing controls
    PATH_PERSIST_FRAMES: 10000, // How many frames to keep in path history
    PARTICLE_LIFETIME_FRAMES: 3000 // How many frames before resetting particle
  };

  // Store original config for reset functionality
  const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));
  
  let img, field = [], fieldW, fieldH, container;
  let particles = [];
  let gui;
  let guiVisible = false;

  class Particle {
    constructor(index) {
      this.index = index;
      this.reset();
    }

    reset() {
      this.x = p.random(0, p.width);
      this.y = p.random(0, p.height);
      this.age = 0;
      this.active = true;
      this.path = [];
      
      // Stagger particle ages based on their index
      if (this.index !== undefined) {
        this.age = (this.index * CONFIG.PARTICLE_LIFETIME_FRAMES / CONFIG.NUM_PARTICLES) % CONFIG.PARTICLE_LIFETIME_FRAMES;
      }
    }

    update() {
      if (!this.active) return;

      // Store current position
      this.path.push({x: this.x, y: this.y});
      
      // Keep path length within limits
      while (this.path.length > CONFIG.PATH_PERSIST_FRAMES) {
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
        this.reset();
      }

      // Reset particle if it exceeds lifetime
      this.age++;
      if (this.age >= CONFIG.PARTICLE_LIFETIME_FRAMES) {
        this.reset();
      }
    }

    draw() {
      if (!this.active || this.path.length < 2) return;

      p.push();
      p.noFill();
      p.strokeWeight(CONFIG.LINE_WEIGHT);
      
      const c = p.color(CONFIG.LINE_COLOR);
      p.stroke(p.red(c), p.green(c), p.blue(c), CONFIG.STROKE_ALPHA);

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
    p.frameRate(60);
    setupCanvas();
    initializeField();
    initializeParticles();
    initGUI();
  };

  function setupCanvas() {
    container = p.select('#sketch-container');
    p.createCanvas(container.width, container.height).parent(container);
  }

  function initializeField() {
    img.resize(0, 0); // Use original image size
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
        vector.mult(CONFIG.BASE_SPEED);
        field[x + y * fieldW] = vector;
      }
    }
  }

  function initializeParticles() {
    particles = Array.from({length: CONFIG.NUM_PARTICLES}, (_, i) => new Particle(i));
  }

  p.draw = function() {
    if (CONFIG.SHOW_BG_IMAGE) {
      p.push();
      p.tint(255, CONFIG.BG_OPACITY);
      p.image(img, 0, 0, p.width, p.height);
      p.pop();
    } else {
      p.background(0);
    }

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
  };

  p.windowResized = function() {
    if (container) {
      p.resizeCanvas(container.width, container.height);
      if (CONFIG.SHOW_BG_IMAGE) {
        p.image(img, 0, 0, p.width, p.height);
      }
      resetSketch();
    }
  };

  p.keyPressed = function() {
    if (p.key === 'g' || p.key === 'G') {
      toggleGUI();
    }
  };

  function initGUI() {
    gui = new dat.GUI({ autoPlace: false });
    const guiContainer = createGUIContainer();
    
    // Simplified GUI controls
    addGUIControls();
    
    gui.domElement.style.display = 'none';
    applyGUIStyles();
  }

  function createGUIContainer() {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '1000';
    container.appendChild(gui.domElement);
    document.body.appendChild(container);
    return container;
  }

  function addGUIControls() {
    // Core visual controls
    gui.add(CONFIG, 'NUM_PARTICLES', 1, 50).step(1).name('Number of Trails')
      .onChange(resetSketch);
    
    gui.add(CONFIG, 'LINE_WEIGHT', 0.1, 5).step(0.1).name('Line Weight')
      .onChange(resetSketch);
    
    gui.add(CONFIG, 'STROKE_ALPHA', 0, 255).step(1).name('Trail Opacity')
      .onChange(resetSketch);
    
    gui.addColor(CONFIG, 'LINE_COLOR').name('Trail Color')
      .onChange(resetSketch);

    // Movement controls
    gui.add(CONFIG, 'FLOW_VECTOR_SCALE', 0.1, 10).step(0.1).name('Flow Speed')
      .onChange(resetSketch);
    
    // Path controls
    gui.add(CONFIG, 'PATH_PERSIST_FRAMES', 10, 5000).step(10).name('Trail Length')
      .onChange(resetSketch);

    // Reset controls
    gui.add({ resetAll }, 'resetAll').name('Reset All');
    gui.add({ resetSketch }, 'resetSketch').name('Reset Paths');
  }

  function toggleGUI() {
    guiVisible = !guiVisible;
    gui.domElement.style.display = guiVisible ? 'block' : 'none';
  }

  function resetSketch() {
    initializeParticles();
  }

  function resetAll() {
    Object.assign(CONFIG, JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    gui.__controllers.forEach(controller => controller.updateDisplay());
    resetSketch();
  }

  function applyGUIStyles() {
    const css = `
      .dg .c .title { color: #ffffff !important; }
      .dg .c .property-name, .dg .c .value { color: #ffffff !important; }
      .dg .c button {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: none !important;
        padding: 5px 10px !important;
        cursor: pointer !important;
      }
      .dg .c button:hover { background-color: #dddddd !important; }
    `;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }
}