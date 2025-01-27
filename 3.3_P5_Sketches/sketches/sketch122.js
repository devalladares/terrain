export default function(p) {
  // 1) Tweakable config:
  const IMAGE_PATH        = 'images/1.jpg';      
  const RESIZE_WIDTH      = 200;                
  const NUM_PARTICLES     = 10;                 
  const DRAW_STEPS_PER_FRAME = 30;              
  
  const SHOW_BG_IMAGE     = false;              
  const BG_OPACITY        = 255;                
  
  const BRAND_PALETTE_LIGHT = ["#003323", "#96D39B", "#57D7F2", "#F098F4"];
  const BRAND_PALETTE_DARK = ["#A1C181", "#4CB944", "#2E86AB", "#E94E77"];
   
  const LINE_WEIGHT       = 1;                  
  
  // 2) Global Variables
  let img;            
  let field = [];     
  let fieldW, fieldH; 
  let particles = []; 
  let currentPalette = BRAND_PALETTE_LIGHT; 
  let backgroundColor = '#ffffff'; 
  let hasToggledMode = false; // Track if we've already toggled the mode
  
  p.preload = function() {
      img = p.loadImage(IMAGE_PATH, loaded => {
          loaded.resize(RESIZE_WIDTH, 0);
      });
  };
  
  p.setup = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
      
      p.createCanvas(containerWidth, containerHeight).parent(container);
      
      // Check if we're in dark mode and need to toggle
      if (document.body.classList.contains('dark-mode') && !hasToggledMode) {
          // Simulate pressing 'D' key to toggle mode
          // window.dispatchEvent(new KeyboardEvent('keydown', {
          //     key: 'd',
          //     bubbles: true
          // }));
          hasToggledMode = true;
      }
      
      fieldW = img.width;
      fieldH = img.height;
      field = new Array(fieldW * fieldH);
    
      img.loadPixels();
      for (let y = 0; y < fieldH; y++) {
          for (let x = 0; x < fieldW; x++) {
              let idx = (x + y * fieldW) * 4;
              let r = img.pixels[idx + 0];
              let g = img.pixels[idx + 1];
              let b = img.pixels[idx + 2];
              let bright = (r + g + b) / 3.0;
              let angle = p.map(bright, 0, 255, 0, p.TWO_PI);
              field[x + y * fieldW] = p.createVector(p.cos(angle), p.sin(angle));
          }
      }
    
      for (let i = 0; i < NUM_PARTICLES; i++) {
          particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              col: p.color(currentPalette[p.floor(p.random(currentPalette.length))])
          });
      }
    
      p.background(backgroundColor);
      p.noStroke();
  };
  
  p.draw = function() {
      if (SHOW_BG_IMAGE) {
          p.push();
          p.tint(255, BG_OPACITY);
          p.image(img, 0, 0, p.width, p.height);
          p.pop();
      }
    
      for (let i = 0; i < DRAW_STEPS_PER_FRAME; i++) {
          let pIndex = p.floor(p.random(particles.length));
          let particle = particles[pIndex];
    
          let ix = p.floor(p.map(particle.x, 0, p.width, 0, fieldW));
          let iy = p.floor(p.map(particle.y, 0, p.height, 0, fieldH));
    
          let oldx = particle.x;
          let oldy = particle.y;
    
          let vx = 0, vy = 0;
          if (ix >= 0 && ix < fieldW && iy >= 0 && iy < fieldH) {
              let v = field[ix + iy * fieldW];
              vx = v.x;
              vy = v.y;
          }
    
          particle.x += vx;
          particle.y += vy;
    
          if (particle.x < 0 || particle.x >= p.width || particle.y < 0 || particle.y >= p.height) {
              particle.x = p.random(p.width);
              particle.y = p.random(p.height);
              continue;
          }
    
          p.stroke(particle.col);
          p.strokeWeight(LINE_WEIGHT);
          p.line(oldx, oldy, particle.x, particle.y);
      }
  };
  
  p.mousePressed = function() {
  };
  
  p.keyPressed = function() {
  };
  
  p.windowResized = function() {
      const container = p.select('#sketch-container');
      const containerWidth = container.width;
      const containerHeight = container.height;
      p.resizeCanvas(containerWidth, containerHeight);
      
      p.background(backgroundColor);
  };

  p.setMode = function(darkMode) {
      if (darkMode) {
          currentPalette = BRAND_PALETTE_DARK;
          backgroundColor = '#121212';
      } else {
          currentPalette = BRAND_PALETTE_LIGHT;
          backgroundColor = '#ffffff';
      }

      for (let i = 0; i < particles.length; i++) {
          particles[i].col = p.color(currentPalette[p.floor(p.random(currentPalette.length))]);
      }

      p.background(backgroundColor);
  };
}