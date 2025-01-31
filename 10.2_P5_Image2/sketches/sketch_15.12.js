export default function adaptedSketchN(p) {
  let customFont;
  // GUI Controls object
  const controls = {
    // Grid
    gridSize: 30,
    frameRate: 6,
    margin: 1,
    gapFactor: 0.015,
    
    // Visual Settings
    showStroke: false,
    strokeWeight: 1,
    strokeColor: '#000000',
    backgroundColor: '#FFFFFF',
    useGaps: false,
    
    // Typography
    letterSizeFactor: 0.5,
    textColor: '#014530',
    
    // Flow Fields
    flowScale: 0.05,
    letterFlowScale: 0.003,
    zIncrement: 0.04,
    letterZIncrement: 0.0002,
    
    // Colors
    color1: "#014530",
    color2: "#96D39B",
    color3: "#FFFFFF",
    color4: "#D5D5D5",
    color5: "#B4E8B8",
    
    // Reset function
    resetAnimation: () => {
      zOffset = 0;
      letterZOffset = 0;
      initializeFlowFields();
    }
  };

  // Grid Configuration
  let N = controls.gridSize;
  let FRAME_RATE = controls.frameRate;
  let margin = controls.margin;
  let gapFactor = controls.gapFactor;

  // Cell & Typography Settings
  let uX, uY, gapX, gapY, N_COLS, N_ROWS;
  let LETTER_SIZE_FACTOR = controls.letterSizeFactor;

  // Flow Field Configuration
  let flowScale = controls.flowScale;
  let letterFlowScale = controls.letterFlowScale;
  let zOffset = 0;
  let letterZOffset = 0;
  let zIncrement = controls.zIncrement;
  let letterZIncrement = controls.letterZIncrement;

  // Characters used in the grid
  const letters = ['A', 'U', 'G', 'C', '+'];

  // Flow Field Storage
  let field = [];
  let letterField = [];

  p.preload = () => {
    console.log('Loading font...');
    customFont = p.loadFont('woff/FKGroteskMono-Medium.woff', 
      () => console.log('Font loaded successfully!'),
      (err) => console.error('Font loading error:', err)
    );
  };

  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight).parent(container);
    setupGUI();
    resetSketch();
  };

  function setupGUI() {
    const gui = new dat.GUI();
    
    // Grid folder
    const gridFolder = gui.addFolder('Grid Settings');
    gridFolder.add(controls, 'gridSize', 10, 50).step(1).onChange(value => {
      N = value;
      resetSketch();
    });
    gridFolder.add(controls, 'frameRate', 1, 60).step(1).onChange(value => {
      FRAME_RATE = value;
      p.frameRate(FRAME_RATE);
    });
    gridFolder.add(controls, 'margin', 0, 5).step(1).onChange(value => {
      margin = value;
      resetSketch();
    });
    
    // Visual Settings folder
    const visualFolder = gui.addFolder('Visual Settings');
    visualFolder.add(controls, 'useGaps').onChange(resetSketch);
    visualFolder.add(controls, 'gapFactor', 0, 0.1).step(0.001).onChange(value => {
      gapFactor = value;
      resetSketch();
    });
    visualFolder.add(controls, 'showStroke');
    visualFolder.add(controls, 'strokeWeight', 0, 5).step(0.5);
    visualFolder.addColor(controls, 'strokeColor');
    visualFolder.addColor(controls, 'backgroundColor');
    
    // Typography folder
    const typographyFolder = gui.addFolder('Typography');
    typographyFolder.add(controls, 'letterSizeFactor', 0.1, 1).step(0.05).onChange(value => {
      LETTER_SIZE_FACTOR = value;
    });
    typographyFolder.addColor(controls, 'textColor');
    
    // Flow Field folder
    const flowFolder = gui.addFolder('Flow Field');
    flowFolder.add(controls, 'flowScale', 0.01, 0.5).step(0.01).onChange(value => {
      flowScale = value;
    });
    flowFolder.add(controls, 'letterFlowScale', 0.001, 0.1).step(0.001).onChange(value => {
      letterFlowScale = value;
    });
    flowFolder.add(controls, 'zIncrement', 0.001, 0.1).step(0.001).onChange(value => {
      zIncrement = value;
    });
    flowFolder.add(controls, 'letterZIncrement', 0.0001, 0.01).step(0.0001).onChange(value => {
      letterZIncrement = value;
    });
    
    // Colors folder
    const colorsFolder = gui.addFolder('Colors');
    colorsFolder.addColor(controls, 'color1');
    colorsFolder.addColor(controls, 'color2');
    colorsFolder.addColor(controls, 'color3');
    colorsFolder.addColor(controls, 'color4');
    colorsFolder.addColor(controls, 'color5');
    
    gui.add(controls, 'resetAnimation');
    
    // Open folders
    gridFolder.open();
    visualFolder.open();
    typographyFolder.open();
    flowFolder.open();
    colorsFolder.open();
  }

  function calculateCellDimensions(i, j) {
    const x = Math.floor(i * uX);
    const y = Math.floor(j * uY);
    const gap = controls.useGaps ? { x: gapX, y: gapY } : { x: 0, y: 0 };
    
    return {
      x: x + gap.x / 2,
      y: y + gap.y / 2,
      width: Math.floor(uX - gap.x),
      height: Math.floor(uY - gap.y)
    };
  }

  function resetSketch() {
    p.frameRate(FRAME_RATE);
    p.background(controls.backgroundColor);

    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);

    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * (controls.useGaps ? gapFactor : 0);
    gapY = uY * (controls.useGaps ? gapFactor : 0);

    initializeFlowFields();
  }

  p.draw = () => {
    p.background(controls.backgroundColor);
    
    zOffset += zIncrement;
    letterZOffset += letterZIncrement;
    updateFlowFields();

    const palette = [
      controls.color1,
      controls.color2,
      controls.color3,
      controls.color4,
      controls.color5
    ];

    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        const cell = calculateCellDimensions(i, j);
        
        let v = field[i][j];
        if (!v) continue;

        let angle = v.heading();
        let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
        index = p.constrain(index, 0, palette.length - 1);
        let c = palette[index];

        // Handle stroke settings
        if (controls.showStroke) {
          p.stroke(controls.strokeColor);
          p.strokeWeight(controls.strokeWeight);
        } else {
          p.noStroke();
        }
        
        p.fill(c);
        // Add 1 pixel to prevent gaps
        p.rect(cell.x, cell.y, cell.width + 1, cell.height + 1);

        // Draw letter
        let letter = letters[Math.floor(Math.random() * letters.length)];
        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cell.width, cell.height) * LETTER_SIZE_FACTOR);
        p.textFont(customFont);
        p.text(letter, cell.x + cell.width / 2, cell.y + cell.height / 2);
      }
    }
  };

  p.windowResized = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.resizeCanvas(containerWidth, containerHeight);
    resetSketch();
  };

  function initializeFlowFields() {
    field = Array(N_COLS).fill().map(() => Array(N_ROWS));
    letterField = Array(N_COLS).fill().map(() => Array(N_ROWS));
    updateFlowFields();
  }

  function updateFlowFields() {
    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
        field[i][j] = p5.Vector.fromAngle(angle);
        
        let letterAngle = p.noise(i * letterFlowScale, j * letterFlowScale, letterZOffset) * p.TWO_PI * 2;
        letterField[i][j] = p5.Vector.fromAngle(letterAngle);
      }
    }
  }

  p.mousePressed = () => {
    controls.resetAnimation();
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('dna_flowfield', 'png');
    }
  };
}
