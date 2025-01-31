export default function adaptedSketchN(p) {
  // Grid Configuration
  const N = 15;                    // Base number of cells (determines row count)
  const FRAME_RATE = 10;           // Animation speed in frames per second
  const margin = 1;                // Number of cells to skip around the edges
  const gapFactor = 0.015;         // Space between cells (1.5% of cell size)

  // Cell & Typography Settings
  let uX;                          // Cell width (calculated from canvas width)
  let uY;                          // Cell height (calculated from canvas height)
  let gapX;                        // Horizontal gap between cells
  let gapY;                        // Vertical gap between cells
  let N_COLS;                      // Number of columns (calculated from aspect ratio)
  let N_ROWS;                      // Number of rows (equals N)
  const LETTER_SIZE_FACTOR = 0.5;  // Letter size relative to cell size

  // Flow Field Configuration
  const flowScale = 0.05;           // Scale of the background flow field (larger = more variation)
  const letterFlowScale = 0.003;    // Scale of the letter flow field (smaller = more gradual changes)
  let zOffset = 0;                 // Z-offset for background flow field animation
  let letterZOffset = 0;           // Z-offset for letter flow field animation
  const zIncrement = 0.04;        // Speed of background flow field animation
  const letterZIncrement = 0.0002; // Speed of letter flow field animation

  // Visual Elements
  const palette = [
    "#014530",                     // Dark green
    '#96D39B',                     // Light green
    // '#57D7F2',                     // Light blue
    '#FFF',                        // White
    '#D5D5D5', // Green 2
    '#B4E8B8',             // Light gray
  ];

  // Characters used in the grid
  const letters = ['A', 'U', 'G', 'C', '+'];

  // Flow Field Storage
  let field = [];                  // Stores background flow vectors
  let letterField = [];           // Stores letter selection vectors

  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight).parent(container);
    p.frameRate(FRAME_RATE);
    p.background(255);

    N_ROWS = N;
    N_COLS = Math.floor((containerWidth / containerHeight) * N);

    uX = containerWidth / N_COLS;
    uY = containerHeight / N_ROWS;
    gapX = uX * gapFactor;
    gapY = uY * gapFactor;

    initializeFlowFields();
    p.noStroke();
  };

  p.draw = () => {
    zOffset += zIncrement;
    letterZOffset += letterZIncrement;
    updateFlowFields();

    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let cellWidth = uX - gapX;
        let cellHeight = uY - gapY;

        // Background color based on flow field
        let v = field[i][j];
        if (!v) continue;

        let angle = v.heading();
        let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
        index = p.constrain(index, 0, palette.length - 1);
        let c = palette[index];

        p.noStroke();
        p.fill(c);
        p.rect(x, y, cellWidth, cellHeight);

        // Randomize letter selection instead of using flow field
        let letter = letters[Math.floor(Math.random() * letters.length)];

        p.fill('white');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cellWidth, cellHeight) * LETTER_SIZE_FACTOR);
        p.textFont('monospace');
        p.text(letter, x + cellWidth / 2, y + cellHeight / 2);
      }
    }
  };

  // Rest of the functions remain the same
  p.windowResized = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.resizeCanvas(containerWidth, containerHeight);
    p.background(0);

    N_ROWS = N;
    N_COLS = Math.floor((containerWidth / containerHeight) * N);

    uX = containerWidth / N_COLS;
    uY = containerHeight / N_ROWS;
    gapX = uX * gapFactor;
    gapY = uY * gapFactor;

    field = [];
    letterField = [];
    initializeFlowFields();
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
    zOffset = 0;
    letterZOffset = 0;
    initializeFlowFields();
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('dna_flowfield', 'png');
    }
  };
}