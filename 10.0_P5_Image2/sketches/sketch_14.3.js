export default function adaptedSketchN(p) {
  // Configuration Constants
  const N = 24;
  const FRAME_RATE = 60;
  const margin = 1;
  const gapFactor = 0.015;

  const palette = [
    "darkgreen",
    "white",
    '#96D39B',
  ];

  const letters = ['A', 'U', 'G', 'C'];

  // Flow field settings for background
  const flowScale = 0.05;
  let zOffset = 0;
  const zIncrement = 0.004;

  // Additional flow field for letter changes
  const letterFlowScale = 0.03;
  let letterZOffset = 0;
  const letterZIncrement = 0.002;

  // Flow Field Variables
  let field = [];
  let letterField = [];

  // Internal Variables
  let uX, uY;
  let gapX, gapY;
  let N_COLS, N_ROWS;

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

  p.draw = () => {
    // Update both flow fields
    zOffset += zIncrement;
    letterZOffset += letterZIncrement;
    updateFlowFields();

    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let cellWidth = uX - gapX;
        let cellHeight = uY - gapY;

        // Background flow field color
        let v = field[i][j];
        if (!v) continue;

        let angle = v.heading();
        let index = p.floor(p.map(angle, -p.PI, p.PI, 0, palette.length));
        index = p.constrain(index, 0, palette.length - 1);
        let c = palette[index];

        // Draw the background rectangle
        p.noStroke();
        p.fill(c);
        p.rect(x, y, cellWidth, cellHeight);

        // Get letter selection from letter flow field
        let letterV = letterField[i][j];
        let letterAngle = letterV.heading();
        let letterIndex = p.floor(p.map(letterAngle, -p.PI, p.PI, 0, letters.length));
        letterIndex = p.constrain(letterIndex, 0, letters.length - 1);
        let letter = letters[letterIndex];

        // Draw the letter
        p.fill('white');
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cellWidth, cellHeight) * 0.6);
        p.textFont('monospace');
        p.text(letter, x + cellWidth / 2, y + cellHeight / 2);
      }
    }
  };

  function initializeFlowFields() {
    // Initialize main flow field
    field = Array(N_COLS).fill().map(() => Array(N_ROWS));
    letterField = Array(N_COLS).fill().map(() => Array(N_ROWS));
    
    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        // Background flow field
        let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
        field[i][j] = p5.Vector.fromAngle(angle);
        
        // Letter flow field
        let letterAngle = p.noise(i * letterFlowScale, j * letterFlowScale, letterZOffset) * p.TWO_PI * 2;
        letterField[i][j] = p5.Vector.fromAngle(letterAngle);
      }
    }
  }

  function updateFlowFields() {
    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        // Update background flow field
        let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI * 2;
        field[i][j] = p5.Vector.fromAngle(angle);
        
        // Update letter flow field
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