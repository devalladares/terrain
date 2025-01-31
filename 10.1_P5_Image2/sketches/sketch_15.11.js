export default function adaptedSketchN(p) {
  let customFont;
  // GUI Controls object
  const controls = {
    // Grid
    gridSize: 30,
    frameRate: 6,
    margin: 1,
    gapFactor: 0.015,
    
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
    // Load the custom font and add console log
    console.log('Loading font...');
    customFont = p.loadFont('woff/FKGroteskMono-Medium.woff', 
      // Success callback
      () => console.log('Font loaded successfully!'),
      // Error callback
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
    });
    gridFolder.add(controls, 'gapFactor', 0, 0.1).step(0.001).onChange(value => {
      gapFactor = value;
      resetSketch();
    });
    
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
    
    // Add reset button
    gui.add(controls, 'resetAnimation');
    
    // Open folders by default
    gridFolder.open();
    typographyFolder.open();
    flowFolder.open();
    colorsFolder.open();
  }

  function resetSketch() {
    p.frameRate(FRAME_RATE);
    p.background(255);

    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);

    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * gapFactor;
    gapY = uY * gapFactor;

    initializeFlowFields();
    p.noStroke();
  }

  p.draw = () => {
    zOffset += zIncrement;
    letterZOffset += letterZIncrement;
    updateFlowFields();

    // Get current palette from controls
    const palette = [
      controls.color1,
      controls.color2,
      controls.color3,
      controls.color4,
      controls.color5
    ];

    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let cellWidth = uX - gapX;
        let cellHeight = uY - gapY;

        let v = field[i][j];
        if (!v) continue;

        let angle = v.heading();
        let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
        index = p.constrain(index, 0, palette.length - 1);
        let c = palette[index];

        p.noStroke();
        p.fill(c);
        p.rect(x, y, cellWidth, cellHeight);

       let letter = letters[Math.floor(Math.random() * letters.length)];

        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cellWidth, cellHeight) * LETTER_SIZE_FACTOR);
        p.textFont(customFont); // Only set the font once
        p.text(letter, x + cellWidth / 2, y + cellHeight / 2);
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
    
    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
        field[i][j] = p5.Vector.fromAngle(angle);
        
        let letterAngle = p.noise(i * letterFlowScale, j * letterFlowScale, letterZOffset) * p.TWO_PI * 2;
        letterField[i][j] = p5.Vector.fromAngle(letterAngle);
      }
    }
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