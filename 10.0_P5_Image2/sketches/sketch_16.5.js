export default function adaptedSketchN(p) {
  // GUI Controls object
  const controls = {
    // Grid Settings
    gridSize: 18,
    frameRate: 3,
    margin: 1,
    gapFactor: 0.015,
    
    // Typography
    letterSizeFactor: 0.5,
    textColor: '#014530',
    
    // mRNA Path Settings
    curveHeight: 0.7,
    pathColor: '#000000',
    
    // Colors for rungs
    rungColors: [
      '#FF69B4',  // Pink
      '#57D7F2',  // Blue
      '#014530'   // Dark green
    ],
    
    // Animation Settings
    colorChangeSpeed: 0.95,
    patternSpeed: 0.5,
    randomnessAmount: 1.0,
    animationMode: 'sequential',
    
    // Reset function
    resetAnimation: () => {
      initializePattern();
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

  // Characters used in the grid
  const letters = ['A', 'U', 'G', 'C', '+'];

  // Path and rung storage
  let pathCells = [];
  let rungCells = [];
  let randomColorIndices = [];
  let animationOffset = 0;

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
    gridFolder.add(controls, 'gapFactor', 0, 0.1).step(0.001).onChange(value => {
      gapFactor = value;
      resetSketch();
    });
    
    // Typography folder
    const typographyFolder = gui.addFolder('Typography');
    typographyFolder.add(controls, 'letterSizeFactor', 0.1, 1).step(0.05);
    typographyFolder.addColor(controls, 'textColor');
    
    // Path folder
    const pathFolder = gui.addFolder('mRNA Path');
    pathFolder.add(controls, 'curveHeight', 0.3, 0.9).step(0.1).onChange(resetSketch);
    pathFolder.addColor(controls, 'pathColor');
    
    // Animation folder
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(controls, 'colorChangeSpeed', 0.01, 2).step(0.01);
    animationFolder.add(controls, 'patternSpeed', 0.1, 2).step(0.1);
    animationFolder.add(controls, 'randomnessAmount', 0, 1).step(0.1);
    animationFolder.add(controls, 'animationMode', ['random', 'sequence', 'wave', 'chaos']);
    
    // Add reset button
    gui.add(controls, 'resetAnimation');
    
    // Open folders by default
    gridFolder.open();
    typographyFolder.open();
    pathFolder.open();
    animationFolder.open();
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

    initializePattern();
    p.noStroke();
  }

  function initializePattern() {
    pathCells = [];
    rungCells = [];
    
    // Calculate pattern parameters
    const centerCol = Math.floor(N_COLS / 2);
    const startRow = Math.floor(N_ROWS * (1 - controls.curveHeight) / 2);
    const endRow = Math.floor(N_ROWS * (1 + controls.curveHeight) / 2);
    const curveSections = 3;
    const sectionWidth = Math.floor((N_COLS - 2 * margin) / curveSections);
    
    // Generate pattern
    for (let section = 0; section < curveSections; section++) {
      const startX = N_COLS - (margin + section * sectionWidth);
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
      if (section < curveSections - 1) {
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
    
    randomizeColors();
  }

  function randomizeColors() {
    randomColorIndices = rungCells.map(() => 
      Math.floor(Math.random() * controls.rungColors.length)
    );
  }

  function getAnimatedColorIndex(baseIndex, position) {
    const time = p.millis() * 0.001 * controls.colorChangeSpeed;
    const randomFactor = Math.sin(time * controls.patternSpeed + position * 0.1);
    const chaos = Math.random() * controls.randomnessAmount;
    
    let index;
    switch(controls.animationMode) {
      case 'sequence':
        index = (baseIndex + Math.floor(time)) % controls.rungColors.length;
        break;
      case 'wave':
        index = Math.floor(((Math.sin(time + position * 0.2) + 1) / 2) * controls.rungColors.length);
        break;
      case 'chaos':
        index = Math.floor(randomFactor * controls.rungColors.length);
        break;
      default: // random
        index = Math.floor((randomFactor + chaos) * controls.rungColors.length);
    }
    return Math.abs(index % controls.rungColors.length);
  }

  p.draw = () => {
    p.background(255);
    
    // Draw base grid with letters
    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let cellWidth = uX - gapX;
        let cellHeight = uY - gapY;

        // Draw letters
        let letter = letters[Math.floor(Math.random() * letters.length)];
        p.fill(controls.textColor);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(Math.min(cellWidth, cellHeight) * LETTER_SIZE_FACTOR);
        p.textFont('monospace');
        p.text(letter, x + cellWidth / 2, y + cellHeight / 2);
      }
    }

    // Draw mRNA path
    p.noStroke();
    
    // Draw path cells
    for (const cell of pathCells) {
      drawCell(cell.x, cell.y, controls.pathColor);
    }

    // Draw rungs with animation
    rungCells.forEach((rung, index) => {
      const colorIndex = getAnimatedColorIndex(randomColorIndices[index], index);
      drawCell(rung.pos.x, rung.pos.y, controls.rungColors[colorIndex]);
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
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.resizeCanvas(containerWidth, containerHeight);
    resetSketch();
  };

  p.mousePressed = () => {
    controls.resetAnimation();
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('mrna_visualization', 'png');
    }
  };
}