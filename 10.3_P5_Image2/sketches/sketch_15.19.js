export default function adaptedSketchN(p) {
  let customFont;

  // Controls with added options for text style and flash color
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
    flashDuration: 50,
    freezePattern: '3sequence', // Options: 'row' or '3sequence'
    darkTextColor: '#96D39B',      // Option for text style on dark backgrounds ('green' or 'white')
    flashColor: '#57D7F2',       // Flash color when cells are highlighted

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
  let nextSequenceReady = null; // Pre-compute next sequence
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
    if (!container) {
      console.error("No element with id 'sketch-container' found.");
      return;
    }
    const containerWidth = container.width;
    const containerHeight = container.height;
    p.createCanvas(containerWidth, containerHeight).parent(container);
    setupGUI();
    resetSketch(true);
  };

  // Helper function to determine if a color is dark
  function isColorDark(color) {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }

  // Get contrast color for text based on background.
  // This function will be re-assigned when the GUI changes the textColor or darkTextStyle.
  let getContrastColor = (backgroundColor) => {
    return isColorDark(backgroundColor)
      ? controls.darkTextColor
      : controls.textColor;
  };

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
        // Copy the current vectors using p.createVector
        frozenFlowField[cellKey] = {
          field: p.createVector(field[i][j].x, field[i][j].y),
          letterField: p.createVector(letterField[i][j].x, letterField[i][j].y)
        };
      }
    });
  }

  // Modified updateFreeze function for smoother transitions
  function updateFreeze() {
    if (!isAnimating) return;

    const currentTime = p.millis();
    const elapsed = currentTime - lastFrameTime;

    if (currentSequence.length === 0) {
      if (nextSequenceReady) {
        // Use pre-computed sequence
        currentSequence = nextSequenceReady;
        nextSequenceReady = null;
      } else {
        currentSequence = getNextSequence();
      }
      
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
      
      // Pre-compute next sequence
      nextSequenceReady = getNextSequence();
    } else if (elapsed >= controls.flashDuration) {
      // Freeze the highlighted sequence after flashDuration
      freezeSequence(currentSequence);
      highlightedCells.clear();
      currentSequence = [];
      currentIndex++;
      lastFrameTime = currentTime;
      
      // Immediately start next sequence if available
      if (nextSequenceReady) {
        currentSequence = nextSequenceReady;
        nextSequenceReady = getNextSequence();
        if (currentSequence) {
          highlightedCells = new Set(currentSequence.map(({ i, j }) => `${i},${j}`));
        }
      }
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
          // Use p.createVector with cosine and sine
          field[i][j] = p.createVector(Math.cos(angle), Math.sin(angle));

          let letterAngle = p.noise(i * letterFlowScale, j * letterFlowScale, letterZOffset) * p.TWO_PI * 2;
          letterField[i][j] = p.createVector(Math.cos(letterAngle), Math.sin(letterAngle));
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
          cellColor = controls.flashColor;
        } else {
          let angle = v.heading();
          let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
          index = p.constrain(index, 0, palette.length - 1);
          cellColor = palette[index];
        }

        p.fill(cellColor);
        p.rect(cell.x, cell.y, cell.width + 1, cell.height + 1);

        const computedTextColor = getContrastColor(cellColor);
        p.fill(computedTextColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cell.width, cell.height) * LETTER_SIZE_FACTOR);
        p.textFont(customFont);

        let letter;
        if (frozenCells.has(cellKey)) {
          letter = frozenLetters[cellKey];
        } else if (highlightedCells.has(cellKey)) {
          if (!frozenLetters[cellKey]) {
            frozenLetters[cellKey] = letters[Math.floor(Math.random() * letters.length)];
          }
          letter = frozenLetters[cellKey];
        } else {
          letter = letters[Math.floor(Math.random() * letters.length)];
        }

        p.text(letter, cell.x + cell.width / 2, cell.y + cell.height / 2);
      }
    }
  };

  // Modified reset function to handle all reset cases
  function resetSketch(fullReset = true) {
    // Cancel any pending restart timeout
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }

    // Reset frame rate and background
    p.frameRate(FRAME_RATE);
    p.background(controls.backgroundColor);

    // Recalculate grid dimensions
    N = controls.gridSize;
    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);
    if (N_COLS < 1) N_COLS = 1;
    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * (controls.useGaps ? gapFactor : 0);
    gapY = uY * (controls.useGaps ? gapFactor : 0);

    // Initialize flow fields
    field = Array(N_COLS).fill().map(() => Array(N_ROWS));
    letterField = Array(N_COLS).fill().map(() => Array(N_ROWS));

    // Reset animation state if full reset is requested
    if (fullReset) {
      currentIndex = 0;
      currentSequence = [];
      nextSequenceReady = null;
      frozenCells.clear();
      frozenLetters = {};
      frozenFlowField = {};
      highlightedCells.clear();
      isAnimating = true;
      lastFrameTime = p.millis();
      zOffset = 0;
      letterZOffset = 0;
    }

    // Always update flow fields
    updateFlowFields();
  }

  // Simplified resetAnimation function
  controls.resetAnimation = () => {
    resetSketch(true); // Call with full reset
  };

  // Modified resetSketchAndAnimation function (for GUI use)
  function resetSketchAndAnimation() {
    resetSketch(true);
  }

  // Modified windowResized handler: partial reset to maintain animation state
  p.windowResized = () => {
    const container = p.select('#sketch-container');
    if (container) {
      p.resizeCanvas(container.width, container.height);
      resetSketch(false);
    }
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('dna_flowfield', 'png');
    } else if (p.key === 'R' || p.key === 'r') {
      controls.resetAnimation();
    }
  };

  // Setup the GUI with the updated control folders
  function setupGUI() {
    const gui = new dat.GUI();

    // Grid Controls
    const gridFolder = gui.addFolder('Grid Layout 📐');
    gridFolder.add(controls, 'gridSize', 10, 30).step(1)
      .name('Grid Size')
      .onChange(resetSketchAndAnimation);
    gridFolder.add(controls, 'margin', 0, 3).step(1)
      .name('Edge Spacing')
      .onChange(resetSketchAndAnimation);
    gridFolder.add(controls, 'useGaps')
      .name('Show Gaps Between Cells')
      .onChange(resetSketchAndAnimation);
    gridFolder.add(controls, 'gapFactor', 0, 0.05).step(0.001)
      .name('Gap Size')
      .onChange(resetSketchAndAnimation);

    // Animation Controls
    const animationFolder = gui.addFolder('Animation Settings 🎬');
    animationFolder.add(controls, 'freezePattern', ['row', '3sequence'])
      .name('Freeze Pattern')
      .onChange(resetSketchAndAnimation);
    animationFolder.add(controls, 'flashDuration', 1, 500).step(10)
      .name('Flash Speed (ms)');
    animationFolder.add(controls, 'frameRate', 1, 30).step(1)
      .name('Animation Speed')
      .onChange(value => {
        FRAME_RATE = value;
        p.frameRate(FRAME_RATE);
      });

    // Flow Field Controls
    const flowFolder = gui.addFolder('Flow Field Settings 🌊');
    flowFolder.add(controls, 'flowScale', 0.01, 0.2).step(0.001)
      .name('Pattern Size')
      .onChange(resetSketchAndAnimation);
    flowFolder.add(controls, 'zIncrement', 0.01, 0.1).step(0.001)
      .name('Pattern Speed');

    // Letter Controls
    const letterFolder = gui.addFolder('Letter Settings ✍️');
    letterFolder.add(controls, 'letterSizeFactor', 0.2, 1).step(0.05)
      .name('Letter Size');
    letterFolder.addColor(controls, 'textColor')
      .name('Default Letter Color')
      .onChange(() => {
        getContrastColor = (backgroundColor) => {
          return isColorDark(backgroundColor)
            ? controls.darkTextColor  // Use the new color picker value
            : controls.textColor;
        };
      });
    letterFolder.addColor(controls, 'darkTextColor')  // New color picker
      .name('Dark Background Text')
      .onChange(() => {
        getContrastColor = (backgroundColor) => {
          return isColorDark(backgroundColor)
            ? controls.darkTextColor
            : controls.textColor;
        };
      });

    // Color Controls
    const colorFolder = gui.addFolder('Color Palette 🎨');
    colorFolder.addColor(controls, 'color1').name('Pink')
      .onChange(resetSketchAndAnimation);
    colorFolder.addColor(controls, 'color2').name('Light Green')
      .onChange(resetSketchAndAnimation);
    colorFolder.addColor(controls, 'color3').name('White')
      .onChange(resetSketchAndAnimation);
    colorFolder.addColor(controls, 'color4').name('Gray')
      .onChange(resetSketchAndAnimation);
    colorFolder.addColor(controls, 'color5').name('Dark Green')
      .onChange(resetSketchAndAnimation);
    colorFolder.addColor(controls, 'flashColor').name('Flash Color')
      .onChange(resetSketchAndAnimation);

    // Visual Effects
    const effectsFolder = gui.addFolder('Visual Effects ✨');
    effectsFolder.add(controls, 'showStroke')
      .name('Show Cell Borders');
    effectsFolder.add(controls, 'strokeWeight', 0.5, 3).step(0.5)
      .name('Border Thickness');
    effectsFolder.addColor(controls, 'strokeColor')
      .name('Border Color');
    effectsFolder.addColor(controls, 'backgroundColor')
      .name('Background Color')
      .onChange(resetSketchAndAnimation);

    // Open some folders by default
    gridFolder.open();
    animationFolder.open();
    colorFolder.open();

    // Add reset button at the bottom
    gui.add(controls, 'resetAnimation').name('Reset Animation 🔄');
  }
}
