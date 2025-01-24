export default function(p) {
  // -----------------------------------------
  // 1. Configuration
  // -----------------------------------------
  const GRID_SPACING = 10;      // Distance between grid points (x,y)
  const GRID_COLS    = 50;      // Number of cells horizontally
  const GRID_ROWS    = 50;      // Number of cells vertically
  const NOISE_SCALE_INITIAL  = 0.01;    // Initial noise scale
  const HEIGHT_SCALE_INITIAL = 500;    // Initial height scale
  
  const NUM_LEVELS_INITIAL   = 15;       // Initial number of contour levels
  
  // Palettes
  const COLOR_PALETTE_LIGHT = {
    background: '#ffffff',
    elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
  };
  const COLOR_PALETTE_DARK = {
    background: '#121212',
    elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
  };

  // -----------------------------------------
  // 2. Global variables
  // -----------------------------------------
  let currentPalette;
  let backgroundColor;

  let corners = [];
  let levelColors = [];

  // Animation time
  let time = 0;

  // GUI parameters
  let params = {
    noiseScale: NOISE_SCALE_INITIAL,
    heightScale: HEIGHT_SCALE_INITIAL,
    numLevels: NUM_LEVELS_INITIAL,
    animate: true,
    darkMode: false
  };

  let gui;

  // -----------------------------------------
  // 3. p5 Setup
  // -----------------------------------------
  p.setup = function() {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

    setInitialMode();
    
    // Initialize grid corners without z
    for (let j = 0; j <= GRID_ROWS; j++) {
      corners[j] = [];
      for (let i = 0; i <= GRID_COLS; i++) {
        let x = i * GRID_SPACING;
        let y = j * GRID_SPACING;
        corners[j][i] = { x, y, z: 0 };
      }
    }

    // Initialize contour colors
    assignLevelColors();
    
    p.noFill();
    p.strokeWeight(2);

    // Setup GUI
    setupGUI();
  };

  // -----------------------------------------
  // 4. p5 Draw
  // -----------------------------------------
  p.draw = function() {
    p.background(backgroundColor);

    p.orbitControl();
    
    p.translate(- (GRID_COLS * GRID_SPACING)/2, 
                - (GRID_ROWS * GRID_SPACING)/2, 
                -params.heightScale/2);

    // Update z values if animation is enabled
    if (params.animate) {
      updateZValues();
      time += 0.01;
    }
    
    // Draw contour lines
    for (let lvl = 0; lvl < params.numLevels; lvl++) {
      let threshold = p.map(lvl, 0, params.numLevels - 1, 0, params.heightScale);
      p.stroke(levelColors[lvl]);

      // Marching squares
      for (let j = 0; j < GRID_ROWS; j++) {
        for (let i = 0; i < GRID_COLS; i++) {
          let cTL = corners[j][i];
          let cTR = corners[j][i+1];
          let cBL = corners[j+1][i];
          let cBR = corners[j+1][i+1];

          let tl = cTL.z >= threshold;
          let tr = cTR.z >= threshold;
          let bl = cBL.z >= threshold;
          let br = cBR.z >= threshold;
          
          let pts = [];

          function interp3D(A, B, T) {
            let denom = (B.z - A.z) || 0.00001; 
            let frac = (T - A.z) / denom;
            return {
              x: A.x + frac * (B.x - A.x),
              y: A.y + frac * (B.y - A.y),
              z: T
            };
          }

          // Determine intersections
          if (tl !== tr) pts.push(interp3D(cTL, cTR, threshold));
          if (tr !== br) pts.push(interp3D(cTR, cBR, threshold));
          if (bl !== br) pts.push(interp3D(cBL, cBR, threshold));
          if (tl !== bl) pts.push(interp3D(cTL, cBL, threshold));

          if (pts.length === 2) {
            p.line(
              pts[0].x, pts[0].y, pts[0].z,
              pts[1].x, pts[1].y, pts[1].z
            );
          }
        }
      }
    }
  };

  p.windowResized = function() {
    const container = p.select('#sketch-container');
    p.resizeCanvas(container.width, container.height);
  };

  // -----------------------------------------
  // 5. Mode Handling (Dark/Light)
  // -----------------------------------------
  function setInitialMode() {
    const body = document.body;
    if (body.classList.contains('dark-mode')) {
      currentPalette = COLOR_PALETTE_DARK;
      backgroundColor = COLOR_PALETTE_DARK.background;
      params.darkMode = true;
    } else {
      currentPalette = COLOR_PALETTE_LIGHT;
      backgroundColor = COLOR_PALETTE_LIGHT.background;
      params.darkMode = false;
    }
  }

  p.setMode = function(darkMode) {
    if (darkMode) {
      currentPalette = COLOR_PALETTE_DARK;
      backgroundColor = COLOR_PALETTE_DARK.background;
      params.darkMode = true;
    } else {
      currentPalette = COLOR_PALETTE_LIGHT;
      backgroundColor = COLOR_PALETTE_LIGHT.background;
      params.darkMode = false;
    }
    assignLevelColors();
    p.background(backgroundColor);
  };

  // -----------------------------------------
  // 6. Utility: Assign colors to contour levels
  // -----------------------------------------
  function assignLevelColors() {
    levelColors = [];
    for (let lvl = 0; lvl < params.numLevels; lvl++) {
      levelColors[lvl] = p.color(randomColorFromPalette());
    }
  }

  function randomColorFromPalette() {
    const palette = currentPalette.elements;
    return palette[p.floor(p.random(palette.length))];
  }

  // -----------------------------------------
  // 7. Animate Z-values
  // -----------------------------------------
  function updateZValues() {
    for (let j = 0; j <= GRID_ROWS; j++) {
      for (let i = 0; i <= GRID_COLS; i++) {
        let x = i * GRID_SPACING;
        let y = j * GRID_SPACING;
        
        let nx = i * params.noiseScale;
        let ny = j * params.noiseScale;
        let n = p.noise(nx, ny, time);
        
        let z = n * params.heightScale;
        
        corners[j][i].z = z;
      }
    }
  }

  // -----------------------------------------
  // 8. Setup GUI Controls
  // -----------------------------------------
  function setupGUI() {
    gui = new dat.GUI();
    
    gui.add(params, 'noiseScale', 0.01, 0.5).step(0.01).name('Noise Scale').onChange(() => {
      assignLevelColors();
    });
    
    gui.add(params, 'heightScale', 100, 1000).step(10).name('Height Scale').onChange(() => {
      assignLevelColors();
    });
    
    gui.add(params, 'numLevels', 5, 30).step(1).name('Contour Levels').onChange(() => {
      assignLevelColors();
    });
    
    gui.add(params, 'animate').name('Animate');
    
    gui.add(params, 'darkMode').name('Dark Mode').onChange((value) => {
      p.setMode(value);
    });
  }
}
