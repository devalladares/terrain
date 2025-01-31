export default function adaptedSketchN(p) {
  // VISUAL CONFIGURATION
  const GRID_SIZE = 15;
  const FRAME_RATE = 10;
  const GAP_FACTOR = 0.05;
  const MARGIN = 2;
  
  // PATH CONFIGURATION
  const S_CURVE_HEIGHT = 0.7;
  const CURVE_SECTIONS = 3;
  
  // RUNG CONFIGURATION
  const RUNG_COLORS = [
    '#FF69B4',  // Pink
    '#57D7F2',  // Blue
    '#014530'   // Dark green
  ];
  
  // Internal variables
  let uX, uY, gapX, gapY, N_COLS, N_ROWS;
  let pathCells = [];
  let rungCells = [];
  let animationOffset = 0;
  let randomColorIndices = [];
  
  // GUI Controls
  const controls = {
    // Grid & Visual Settings
    gridSize: GRID_SIZE,
    gapFactor: GAP_FACTOR,
    margin: MARGIN,
    curveHeight: S_CURVE_HEIGHT,
    
    // Animation Settings
    frameRate: 4,
    colorChangeSpeed: 0.95,
    patternSpeed: 0.5,
    randomnessAmount: 1.0,
    
    // Colors & Style
    pathColor: '#000000',
    strokeColor: '#000000',
    strokeWeight: 0,
    letterSizeFactor: 0.5,
    
    // Path Configuration
    extendLeft: false,
    extendRight: false,
    
    // Animation Modes
    animationMode: 'sequential',
    colorMode: 'all',  // 'all', 'pairs', 'sequential'
    
    // Actions
    shuffleColors: () => randomizeColors(),
    regenerate: () => generatePath(),
    
    // Advanced Options
    smoothness: 0.5,
    complexity: 1.0,
    density: 1.0
  };

  function setupGUI() {
    const gui = new dat.GUI();
    
    // Visual Settings
    const visualsFolder = gui.addFolder('Visual Settings');
    visualsFolder.add(controls, 'gridSize', 10, 50).step(1).onChange(initializeAndGenerate);
    visualsFolder.add(controls, 'gapFactor', 0, 0.05).step(0.001).onChange(initializeAndGenerate);
    visualsFolder.add(controls, 'margin', 0, 5).step(1).onChange(initializeAndGenerate);
    visualsFolder.add(controls, 'curveHeight', 0.3, 0.9).step(0.1).onChange(initializeAndGenerate);
    visualsFolder.addColor(controls, 'pathColor');
    visualsFolder.addColor(controls, 'strokeColor');
    visualsFolder.add(controls, 'strokeWeight', 0, 5).step(0.5);
    
    // Animation Settings
    const animationFolder = gui.addFolder('Animation Settings');
    animationFolder.add(controls, 'frameRate', 1, 60).step(1).onChange(v => p.frameRate(v));
    animationFolder.add(controls, 'colorChangeSpeed', 0.01, 2).step(0.01);
    animationFolder.add(controls, 'patternSpeed', 0.1, 2).step(0.1);
    animationFolder.add(controls, 'randomnessAmount', 0, 1).step(0.1);
    animationFolder.add(controls, 'animationMode', ['random', 'sequence', 'wave', 'chaos']);
    animationFolder.add(controls, 'colorMode', ['all', 'pairs', 'sequential']);
    
    // Path Configuration
    const pathFolder = gui.addFolder('Path Configuration');
    pathFolder.add(controls, 'extendLeft').onChange(initializeAndGenerate);
    pathFolder.add(controls, 'extendRight').onChange(initializeAndGenerate);
    pathFolder.add(controls, 'smoothness', 0, 1).step(0.1);
    pathFolder.add(controls, 'complexity', 0.1, 2).step(0.1);
    pathFolder.add(controls, 'density', 0.5, 2).step(0.1);
    
    // Actions
    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add(controls, 'shuffleColors');
    actionsFolder.add(controls, 'regenerate');
    
    // Open folders
    visualsFolder.open();
    animationFolder.open();
    pathFolder.open();
    actionsFolder.open();
  }

  function generatePath() {
    pathCells = [];
    rungCells = [];
    
    // Calculate S-curve parameters with horizontal flip
    const centerCol = Math.floor(N_COLS / 2);
    const startRow = Math.floor(N_ROWS * (1 - controls.curveHeight) / 2);
    const endRow = Math.floor(N_ROWS * (1 + controls.curveHeight) / 2);
    const sectionWidth = Math.floor((N_COLS - 2 * controls.margin) / CURVE_SECTIONS);
    
    // Generate horizontally flipped S-curve
    for (let section = 0; section < CURVE_SECTIONS; section++) {
      const startX = N_COLS - (controls.margin + section * sectionWidth);
      const endX = startX - sectionWidth;
      
      if (section % 2 === 0) {
        // Going down
        for (let y = startRow; y <= endRow; y++) {
          pathCells.push({x: startX, y});
          rungCells.push({
            pos: {x: startX - 1, y},
            colorIndex: 0
          });
        }
      } else {
        // Going up
        for (let y = endRow; y >= startRow; y--) {
          pathCells.push({x: startX, y});
          rungCells.push({
            pos: {x: startX - 1, y},
            colorIndex: 0
          });
        }
      }
      
      // Connect sections
      if (section < CURVE_SECTIONS - 1) {
        const y = section % 2 === 0 ? endRow : startRow;
        for (let x = startX - 1; x >= endX; x--) {
          pathCells.push({x, y});
          rungCells.push({
            pos: {x, y: y + (section % 2 === 0 ? 1 : -1)},
            colorIndex: 0
          });
        }
      }
    }

    // Add extensions if enabled
    if (controls.extendLeft) {
      const x = pathCells[pathCells.length - 1].x;
      const y = pathCells[pathCells.length - 1].y;
      for (let i = 1; i <= 5; i++) {
        pathCells.push({x: x - i, y});
        rungCells.push({pos: {x: x - i, y: y + 1}, colorIndex: 0});
      }
    }

    if (controls.extendRight) {
      const x = pathCells[0].x;
      const y = pathCells[0].y;
      for (let i = 1; i <= 5; i++) {
        pathCells.unshift({x: x + i, y});
        rungCells.unshift({pos: {x: x + i, y: y + 1}, colorIndex: 0});
      }
    }
    
    randomizeColors();
  }

  function randomizeColors() {
    randomColorIndices = rungCells.map(() => Math.floor(Math.random() * RUNG_COLORS.length));
  }

  function getAnimatedColorIndex(baseIndex, position) {
    const time = p.millis() * 0.001 * controls.colorChangeSpeed;
    const randomFactor = Math.sin(time * controls.patternSpeed + position * 0.1);
    const chaos = Math.random() * controls.randomnessAmount;
    
    let index;
    switch(controls.animationMode) {
      case 'sequence':
        index = (baseIndex + Math.floor(time)) % RUNG_COLORS.length;
        break;
      case 'wave':
        index = Math.floor(((Math.sin(time + position * 0.2) + 1) / 2) * RUNG_COLORS.length);
        break;
      case 'chaos':
        index = Math.floor(randomFactor * RUNG_COLORS.length);
        break;
      default: // random
        index = Math.floor((randomFactor + chaos) * RUNG_COLORS.length);
    }
    return Math.abs(index % RUNG_COLORS.length);
  }

  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight).parent(container);
    p.frameRate(controls.frameRate);
    setupGUI();
    initializeGrid();
    generatePath();
  };

  function initializeGrid() {
    N_ROWS = controls.gridSize;
    N_COLS = Math.floor((p.width / p.height) * N_ROWS);
    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * controls.gapFactor;
    gapY = uY * controls.gapFactor;
  }

  function initializeAndGenerate() {
    initializeGrid();
    generatePath();
  }

  p.draw = () => {
    p.background(255);
    p.strokeWeight(controls.strokeWeight);
    p.stroke(controls.strokeColor);

    // Draw path
    for (const cell of pathCells) {
      drawCell(cell.x, cell.y, controls.pathColor);
    }

    // Draw rungs with animation
    rungCells.forEach((rung, index) => {
      const colorIndex = getAnimatedColorIndex(randomColorIndices[index], index);
      drawCell(rung.pos.x, rung.pos.y, RUNG_COLORS[colorIndex]);
    });

    animationOffset += controls.colorChangeSpeed;
  };

  function drawCell(i, j, color) {
    let x = i * uX + gapX / 2;
    let y = j * uY + gapY / 2;
    let cellWidth = uX - gapX;
    let cellHeight = uY - gapY;

    p.fill(color);
    p.rect(x, y, cellWidth, cellHeight);
  }

  p.windowResized = () => {
    const container = p.select('#sketch-container');
    p.resizeCanvas(container.width, container.height);
    initializeAndGenerate();
  };

  p.mousePressed = () => {
    randomizeColors();
    animationOffset = 0;
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('mrna_visualization', 'png');
    }
  };
}