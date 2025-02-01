export default function adaptedSketchN(p) {
  let customFont;
  // Updated controls with new gridSize and freezePattern selector
  const controls = {
    gridSize: 20,
    frameRate: 10,
    margin: 1,
    gapFactor: 0.015,
    showStroke: false,
    strokeWeight: 1,
    strokeColor: '#000000',
    backgroundColor: '#FFFFFF',
    useGaps: false,
    letterSizeFactor: 0.5,
    // textColor: '#014530',
    textColor: '#014530',
    flowScale: 0.075,
    letterFlowScale: 0.003,
    zIncrement: 0.04,
    letterZIncrement: 0.0002,
    color1: "#F098F4",
    color2: "#96D39B",
    color3: "#FFFFFF",
    color4: "#D5D5D5",
    color5: "#014530",
    
    // Animation controls
    flashDuration: 50,    // Duration (ms) for the flash highlight
    rowFreezeDuration: 0,   // (Unused with auto-restart)
    freezePattern: '3sequence',   // New: 'row' or '3sequence'
    
    // This function will be re-assigned below so it can be called via key 'R'
    resetAnimation: () => {}
  };

  // Global grid and drawing variables
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

  // Animation state variables
  let currentIndex = 0;
  let currentSequence = [];
  let frozenRows = new Set();  // (Retained if you want to expand later)
  let frozenCells = new Set();
  let frozenLetters = {};
  let frozenFlowField = {};
  let highlightedCells = new Set();
  let isAnimating = true;
  let lastFrameTime = 0;
  let restartTimeout = null;

  // Define the letters that will be randomly picked
  const letters = ['A', 'U', 'G', 'C', '+'];
  let field = [];
  let letterField = [];

  // p5 preload: load custom font
  p.preload = () => {
    customFont = p.loadFont('woff/FKGroteskMono-Medium.woff');
  };

  // p5 setup
  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;
    p.createCanvas(containerWidth, containerHeight).parent(container);
    setupGUI();
    resetSketch();
  };

  // Setup the GUI – note that the reset button has been removed since the sketch auto-restarts.
  function setupGUI() {
    const gui = new dat.GUI();
    const animationFolder = gui.addFolder('Animation Settings');
    animationFolder.add(controls, 'freezePattern', ['row', '3sequence']).name('Freeze Pattern');
    animationFolder.add(controls, 'flashDuration', 500, 2000).step(100);
  }

  // Depending on the freeze pattern, get the next sequence of cells to freeze
  function getNextSequence() {
    if (controls.freezePattern === 'row') {
      // Freeze an entire row
      const row = currentIndex;
      if (row >= N_ROWS - margin) return null;
      const sequence = [];
      for (let i = margin; i < N_COLS - margin; i++) {
        sequence.push({ i, j: row });
      }
      return sequence;
    } else {
      // Freeze next 3 cells in sequence (left-to-right, top-to-bottom)
      const effectiveCols = N_COLS - 2 * margin;
      const effectiveRows = N_ROWS - 2 * margin;
      const totalCells = effectiveCols * effectiveRows;
      const startIdx = currentIndex * 3;
      if (startIdx >= totalCells) return null;
      const sequence = [];
      for (let offset = 0; offset < 3 && startIdx + offset < totalCells; offset++) {
        const idx = startIdx + offset;
        const row = Math.floor(idx / effectiveCols) + margin;
        const col = (idx % effectiveCols) + margin;
        sequence.push({ i: col, j: row });
      }
      return sequence;
    }
  }

  // Freeze all cells in the given sequence
  function freezeSequence(sequence) {
    sequence.forEach(({ i, j }) => {
      const cellKey = `${i},${j}`;
      if (!frozenCells.has(cellKey)) {
        frozenCells.add(cellKey);
        frozenLetters[cellKey] = letters[Math.floor(Math.random() * letters.length)];
        frozenFlowField[cellKey] = {
          field: p5.Vector.copy(field[i][j]),
          letterField: p5.Vector.copy(letterField[i][j])
        };
      }
    });
  }

  // Update the freeze logic based on elapsed time
  function updateFreeze() {
    if (!isAnimating) return;

    const currentTime = p.millis();
    const elapsed = currentTime - lastFrameTime;

    if (currentSequence.length === 0) {
      // Grab the next sequence to highlight/freeze
      currentSequence = getNextSequence();
      if (!currentSequence) {
        // No more cells to freeze, so stop animation and auto-restart after 1 second
        isAnimating = false;
        restartTimeout = setTimeout(() => {
          controls.resetAnimation();
        }, 1000);
        return;
      }
      highlightedCells = new Set(currentSequence.map(({ i, j }) => `${i},${j}`));
      lastFrameTime = currentTime;
    } else if (elapsed >= controls.flashDuration) {
      // Freeze the highlighted sequence after flashDuration
      freezeSequence(currentSequence);
      highlightedCells.clear();
      currentSequence = [];
      currentIndex++;
    }
  }

  // Given grid indices, compute the dimensions and position of a cell
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

  // Update flow field vectors for cells that are not yet frozen or highlighted
  function updateFlowFields() {
    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        const cellKey = `${i},${j}`;
        if (!frozenCells.has(cellKey) && !highlightedCells.has(cellKey)) {
          let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
          field[i][j] = p5.Vector.fromAngle(angle);
          let letterAngle = p.noise(i * letterFlowScale, j * letterFlowScale, letterZOffset) * p.TWO_PI * 2;
          letterField[i][j] = p5.Vector.fromAngle(letterAngle);
        }
      }
    }
  }

  // p5 draw loop
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

        // Use frozen flow vector if frozen; otherwise use the current vector
        let v = frozenCells.has(cellKey) ? frozenFlowField[cellKey].field : field[i][j];
        if (!v) continue;

        if (controls.showStroke) {
          p.stroke(controls.strokeColor);
          p.strokeWeight(controls.strokeWeight);
        } else {
          p.noStroke();
        }

        let cellColor;
        if (highlightedCells.has(cellKey)) {
          cellColor = '#57D7F2'; // Flash color when highlighted
        } else {
          let angle = v.heading();
          let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
          index = p.constrain(index, 0, palette.length - 1);
          cellColor = palette[index];
        }

        p.fill(cellColor);
        p.rect(cell.x, cell.y, cell.width + 1, cell.height + 1);

        // Draw the letter
        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cell.width, cell.height) * LETTER_SIZE_FACTOR);
        p.textFont(customFont);

        let letter;
        if (frozenCells.has(cellKey)) {
          letter = frozenLetters[cellKey];
        } else if (highlightedCells.has(cellKey)) {
          // Keep letter static during the flash highlight
          if (!frozenLetters[cellKey]) {
            frozenLetters[cellKey] = letters[Math.floor(Math.random() * letters.length)];
          }
          letter = frozenLetters[cellKey];
        } else {
          // For unfrozen cells, pick a random letter every frame
          letter = letters[Math.floor(Math.random() * letters.length)];
        }

        p.text(letter, cell.x + cell.width / 2, cell.y + cell.height / 2);
      }
    }
  };

  // Reset or initialize the sketch
  function resetSketch() {
    p.frameRate(FRAME_RATE);
    p.background(controls.backgroundColor);

    // Recalculate grid dimensions
    N = controls.gridSize;
    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);
    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * (controls.useGaps ? gapFactor : 0);
    gapY = uY * (controls.useGaps ? gapFactor : 0);

    initializeFlowFields();

    // Reset animation state
    currentIndex = 0;
    currentSequence = [];
    frozenRows = new Set();
    frozenCells.clear();
    frozenLetters = {};
    frozenFlowField = {};
    highlightedCells.clear();
    isAnimating = true;
    lastFrameTime = p.millis();
    zOffset = 0;
    letterZOffset = 0;
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
  }

  p.windowResized = () => {
    const container = p.select('#sketch-container');
    p.resizeCanvas(container.width, container.height);
    resetSketch();
  };

  // Initialize the flow fields
  function initializeFlowFields() {
    field = Array(N_COLS)
      .fill()
      .map(() => Array(N_ROWS));
    letterField = Array(N_COLS)
      .fill()
      .map(() => Array(N_ROWS));
    updateFlowFields();
  }

  // Remove the mousePressed handler (auto-restart is used instead)
  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('dna_flowfield', 'png');
    } else if (p.key === 'R' || p.key === 'r') {
      controls.resetAnimation();
    }
  };

  // Define the resetAnimation function on the controls object
  controls.resetAnimation = () => {
    currentIndex = 0;
    currentSequence = [];
    frozenRows = new Set();
    frozenCells.clear();
    frozenLetters = {};
    frozenFlowField = {};
    highlightedCells.clear();
    isAnimating = true;
    lastFrameTime = p.millis();
    zOffset = 0;
    letterZOffset = 0;
    initializeFlowFields();
  };
}
