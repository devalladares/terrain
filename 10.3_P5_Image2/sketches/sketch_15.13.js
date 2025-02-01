export default function adaptedSketchN(p) {
  let customFont;
  // GUI Controls object
  const controls = {
    // Previous controls remain the same
    gridSize: 24,
    frameRate: 30, // Increased for smoother animation
    margin: 1,
    gapFactor: 0.015,
    showStroke: false,
    strokeWeight: 1,
    strokeColor: '#000000',
    backgroundColor: '#FFFFFF',
    useGaps: false,
    letterSizeFactor: 0.5,
    textColor: '#014530',
    flowScale: 0.075,
    letterFlowScale: 0.003,
    zIncrement: 0.04,
    letterZIncrement: 0.0002,
    color1: "#014530",
    color2: "#96D39B",
    color3: "#FFFFFF",
    color4: "#D5D5D5",
    color5: "#B4E8B8",
    
    // Animation controls
    flashDuration: 200,    // Duration of red flash in ms
    rowFreezeDuration: 300, // Time between freezing rows
    
    resetAnimation: () => {
      zOffset = 0;
      letterZOffset = 0;
      currentRow = margin;
      frozenCells.clear();
      frozenLetters = {};
      highlightedRow = null;
      isAnimating = true;
      lastFreezeTime = 0;
      initializeFlowFields();
    }
  };

  // Previous configurations
  let N = controls.gridSize;
  let FRAME_RATE = controls.frameRate;
  let margin = controls.margin;
  let gapFactor = controls.gapFactor;
  let uX, uY, gapX, gapY, N_COLS, N_ROWS;
  let LETTER_SIZE_FACTOR = controls.letterSizeFactor;
  let flowScale = controls.flowScale;
  let letterFlowScale = controls.letterFlowScale;
  let zOffset = 0;
  let letterZOffset = 0;
  let zIncrement = controls.zIncrement;
  let letterZIncrement = controls.letterZIncrement;
  
  // Animation state
  let currentRow = margin;
  let frozenCells = new Set();
  let frozenLetters = {};
  let highlightedRow = null;
  let isAnimating = true;
  let lastFreezeTime = 0;
  
  const letters = ['A', 'U', 'G', 'C', '+'];
  let field = [];
  let letterField = [];

  p.preload = () => {
    customFont = p.loadFont('woff/FKGroteskMono-Medium.woff');
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
    
    // Animation controls
    const animationFolder = gui.addFolder('Animation Settings');
    animationFolder.add(controls, 'flashDuration', 50, 500).step(50);
    animationFolder.add(controls, 'rowFreezeDuration', 100, 1000).step(50);
    
    gui.add(controls, 'resetAnimation');
  }

  function updateFreeze() {
    if (currentRow >= N_ROWS - margin) {
      isAnimating = false;
      return;
    }

    const currentTime = p.millis();
    const timeSinceLastFreeze = currentTime - lastFreezeTime;

    // Flash red then freeze
    if (timeSinceLastFreeze <= controls.flashDuration) {
      highlightedRow = currentRow;
    } else if (timeSinceLastFreeze > controls.flashDuration && 
               timeSinceLastFreeze <= controls.rowFreezeDuration) {
      // Freeze the current row
      highlightedRow = null;
      for (let i = margin; i < N_COLS - margin; i++) {
        const cellKey = `${i},${currentRow}`;
        if (!frozenCells.has(cellKey)) {
          frozenCells.add(cellKey);
          frozenLetters[cellKey] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    } else {
      // Move to next row
      currentRow++;
      lastFreezeTime = currentTime;
    }
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

  p.draw = () => {
    p.background(controls.backgroundColor);
    
    if (isAnimating) {
      updateFreeze();
      zOffset += zIncrement;
      letterZOffset += letterZIncrement;
      updateFlowFields();
    }

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
        const cellKey = `${i},${j}`;
        
        let v = field[i][j];
        if (!v) continue;

        if (controls.showStroke) {
          p.stroke(controls.strokeColor);
          p.strokeWeight(controls.strokeWeight);
        } else {
          p.noStroke();
        }
        
        // Determine cell color
        let cellColor;
        if (j === highlightedRow) {
          cellColor = '#FF0000'; // Bright red flash
        } else {
          let angle = v.heading();
          let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
          index = p.constrain(index, 0, palette.length - 1);
          cellColor = palette[index];
        }
        
        p.fill(cellColor);
        p.rect(cell.x, cell.y, cell.width + 1, cell.height + 1);

        // Draw letter
        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cell.width, cell.height) * LETTER_SIZE_FACTOR);
        p.textFont(customFont);
        
        // Use frozen letter if cell is frozen, otherwise random
        const letter = frozenCells.has(cellKey) 
          ? frozenLetters[cellKey]
          : letters[Math.floor(Math.random() * letters.length)];
        
        p.text(letter, cell.x + cell.width / 2, cell.y + cell.height / 2);
      }
    }
  };

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
    
    // Reset animation state
    currentRow = margin;
    frozenCells.clear();
    frozenLetters = {};
    highlightedRow = null;
    isAnimating = true;
    lastFreezeTime = p.millis();
  }

  // Window resize handler
  p.windowResized = () => {
    const container = p.select('#sketch-container');
    p.resizeCanvas(container.width, container.height);
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
    } else if (p.key === 'R' || p.key === 'r') {
      controls.resetAnimation();
    }
  };
}