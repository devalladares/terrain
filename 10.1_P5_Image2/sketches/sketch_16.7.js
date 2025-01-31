export default function adaptedSketchN(p) {
  // GUI Controls object
  const controls = {
    // Grid Settings
    gridSize: 19,
    frameRate: 1,
    margin: 4,
    gapFactor: 0.041,
    
    // Typography
    letterSizeFactor: 0.4,
    textColor: '#000000',
    
    // mRNA Strand Settings
    curveHeight: 0.7,
    pathStrokeWeight: 2,
    pathColor: '#000000',
    horizontalOffset: -0.4,
    verticalOffset: 0,
    strandComplexity: 2,
    strandTension: 0.5,
    extendEnds: true,
    pathStrokePosition: 'left', // 'left', 'right', 'top', 'bottom'
    rungStrokePosition: 'bottom', // Independent rung stroke position
    
    // Colors for rungs
    rungColors: ['#FF69B4', '#57D7F2', '#014530'],
    
    // Animation Settings
    colorChangeSpeed: 1.14,
    patternSpeed: 1.2,
    randomnessAmount: 1.0,
    animationMode: 'sequential',
    
    // Actions
    randomizeStrand: () => {
      controls.horizontalOffset = p.random(-0.5, 0.5);
      controls.verticalOffset = p.random(-0.5, 0.5);
      controls.strandComplexity = p.random(0.5, 2);
      controls.strandTension = p.random(0.3, 0.8);
      controls.curveHeight = p.random(0.4, 0.9);
      initializePattern();
    },
    resetAnimation: () => initializePattern(),
  };

  let N, FRAME_RATE, uX, uY, gapX, gapY, N_COLS, N_ROWS;
  let pathCells = [];
  let rungCells = [];
  let randomColorIndices = [];
  let gridLetters = [];
  
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

    const gridFolder = gui.addFolder('Grid Settings');
    gridFolder.add(controls, 'gridSize', 10, 50).step(1).onChange(value => {
      N = value;
      resetSketch();
    });
    gridFolder.add(controls, 'frameRate', 1, 60).step(1).onChange(value => {
      FRAME_RATE = value;
      p.frameRate(FRAME_RATE);
    });
    gridFolder.add(controls, 'margin', 0, 5).step(1).onChange(resetSketch);
    gridFolder.add(controls, 'gapFactor', 0, 0.1).step(0.001).onChange(resetSketch);

    const typographyFolder = gui.addFolder('Typography');
    typographyFolder.add(controls, 'letterSizeFactor', 0.1, 1).step(0.05);
    typographyFolder.addColor(controls, 'textColor');

    const strandFolder = gui.addFolder('mRNA Strand Controls');
    strandFolder.add(controls, 'horizontalOffset', -1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'verticalOffset', -1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'pathStrokeWeight', 1, 5).step(0.5);
    strandFolder.add(controls, 'strandComplexity', 0.5, 3).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'strandTension', 0.1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'curveHeight', 0.3, 0.9).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'extendEnds').onChange(initializePattern);
    strandFolder.add(controls, 'pathStrokePosition', ['left', 'right', 'top', 'bottom']).onChange(initializePattern);
    strandFolder.add(controls, 'rungStrokePosition', ['left', 'right', 'top', 'bottom']).onChange(initializePattern);
    strandFolder.addColor(controls, 'pathColor');

    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(controls, 'colorChangeSpeed', 0.01, 2).step(0.01);
    animationFolder.add(controls, 'patternSpeed', 0.1, 2).step(0.1);
    animationFolder.add(controls, 'randomnessAmount', 0, 1).step(0.1);
    animationFolder.add(controls, 'animationMode', ['random', 'sequence', 'wave', 'chaos']);

    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add(controls, 'randomizeStrand');
    actionsFolder.add(controls, 'resetAnimation');

    gridFolder.open();
    strandFolder.open();
    animationFolder.open();
    actionsFolder.open();
  }

  function resetSketch() {
    N = controls.gridSize;
    FRAME_RATE = controls.frameRate;
    p.frameRate(FRAME_RATE);

    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);

    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * controls.gapFactor;
    gapY = uY * controls.gapFactor;

    initializeGridLetters();
    initializePattern();
  }

  function initializeGridLetters() {
    gridLetters = [];
    const letters = ['A', 'U', 'G', 'C', '+'];
    for (let i = 0; i < N_COLS; i++) {
      gridLetters[i] = [];
      for (let j = 0; j < N_ROWS; j++) {
        gridLetters[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  function initializePattern() {
    pathCells = [];
    rungCells = [];
    randomColorIndices = [];
  }

  function drawCell(i, j, color, isPath = false, strokePosition = 'bottom') {
    let x = i * uX + gapX / 2;
    let y = j * uY + gapY / 2;
    let cellWidth = uX - gapX;
    let cellHeight = uY - gapY;

    if (isPath) {
      p.stroke(controls.pathColor);
      p.strokeWeight(controls.pathStrokeWeight);
      drawStroke(x, y, cellWidth, cellHeight, strokePosition);
    } else {
      p.noStroke();
      p.fill(color);
      p.rect(x, y, cellWidth, cellHeight);
    }
  }

  function drawStroke(x, y, w, h, position) {
    switch (position) {
      case 'left': p.line(x, y, x, y + h); break;
      case 'right': p.line(x + w, y, x + w, y + h); break;
      case 'top': p.line(x, y, x + w, y); break;
      case 'bottom': p.line(x, y + h, x + w, y + h); break;
    }
  }

  p.draw = () => {
    p.background(255);

    for (let i = 0; i < N_COLS; i++) {
      for (let j = 0; j < N_ROWS; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(uX, uY) * controls.letterSizeFactor);
        p.textFont('monospace');
        p.text(gridLetters[i][j], x + uX / 2, y + uY / 2);
      }
    }

    for (const cell of pathCells) drawCell(cell.x, cell.y, null, true, controls.pathStrokePosition);
    for (const rung of rungCells) drawCell(rung.pos.x, rung.pos.y, controls.rungColors[Math.floor(Math.random() * controls.rungColors.length)], false, controls.rungStrokePosition);
  };
}
