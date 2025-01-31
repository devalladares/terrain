export default function adaptedSketchN(p) {
  // GUI Controls object
  const controls = {
    // Grid Settings
    gridSize: 20,
    frameRate: 2,
    margin: 1,
    gapFactor: 0.015,
    
    // Typography
    letterSizeFactor: 0.4,
    textColor: '#014530',
    
    // mRNA Strand Settings
    curveHeight: 0.7,
    pathColor: '#000000',
    pathThickness: 1, // Scale factor for path thickness
    horizontalOffset: -0.4, // -1 to 1
    verticalOffset: 0,  // -1 to 1
    strandComplexity: 2, // Affects number of curves
    strandTension: 0.5, // Affects curve smoothness
    extendEnds: true,
    
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
    
    // Actions
    randomizeStrand: () => {
      controls.horizontalOffset = p.random(-0.5, 0.5);
      controls.verticalOffset = p.random(-0.5, 0.5);
      controls.strandComplexity = p.random(0.5, 2);
      controls.strandTension = p.random(0.3, 0.8);
      controls.curveHeight = p.random(0.4, 0.9);
      initializePattern();
    },
    
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
    gridFolder.add(controls, 'margin', 0, 5).step(1).onChange(resetSketch);
    gridFolder.add(controls, 'gapFactor', 0, 0.1).step(0.001).onChange(resetSketch);
    
    // Typography folder
    const typographyFolder = gui.addFolder('Typography');
    typographyFolder.add(controls, 'letterSizeFactor', 0.1, 1).step(0.05);
    typographyFolder.addColor(controls, 'textColor');
    
    // Strand Control folder
    const strandFolder = gui.addFolder('mRNA Strand Controls');
    strandFolder.add(controls, 'horizontalOffset', -1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'verticalOffset', -1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'pathThickness', 0.5, 3).step(0.1);
    strandFolder.add(controls, 'strandComplexity', 0.5, 3).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'strandTension', 0.1, 1).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'curveHeight', 0.3, 0.9).step(0.1).onChange(initializePattern);
    strandFolder.add(controls, 'extendEnds').onChange(initializePattern);
    strandFolder.addColor(controls, 'pathColor');
    
    // Animation folder
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(controls, 'colorChangeSpeed', 0.01, 2).step(0.01);
    animationFolder.add(controls, 'patternSpeed', 0.1, 2).step(0.1);
    animationFolder.add(controls, 'randomnessAmount', 0, 1).step(0.1);
    animationFolder.add(controls, 'animationMode', ['random', 'sequence', 'wave', 'chaos']);
    
    // Actions folder
    const actionsFolder = gui.addFolder('Actions');
    actionsFolder.add(controls, 'randomizeStrand');
    actionsFolder.add(controls, 'resetAnimation');
    
    // Open folders by default
    gridFolder.open();
    strandFolder.open();
    animationFolder.open();
    actionsFolder.open();
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
    
    // Calculate pattern parameters with offsets
    const baseStartRow = Math.floor(N_ROWS * (1 - controls.curveHeight) / 2);
    const baseEndRow = Math.floor(N_ROWS * (1 + controls.curveHeight) / 2);
    
    // Apply vertical offset
    const verticalShift = Math.floor(controls.verticalOffset * N_ROWS / 4);
    const startRow = baseStartRow + verticalShift;
    const endRow = baseEndRow + verticalShift;
    
    // Apply horizontal offset and complexity
    const horizontalShift = Math.floor(controls.horizontalOffset * N_COLS / 4);
    const curveSections = Math.floor(3 * controls.strandComplexity);
    const sectionWidth = Math.floor((N_COLS - 2 * margin) / curveSections);
    
    // Generate pattern with adjusted complexity and tension
    for (let section = 0; section < curveSections; section++) {
      const startX = N_COLS - (margin + section * sectionWidth) + horizontalShift;
      const endX = startX - sectionWidth;
      
      // Adjust curve based on tension
      const curveStep = Math.max(1, Math.floor(controls.strandTension * 2));
      
      if (section % 2 === 0) {
        // Going down
        for (let y = startRow; y <= endRow; y += curveStep) {
          pathCells.push({x: startX, y});
          rungCells.push({
            pos: {x: startX - 1, y},
            colorIndex: 0
          });
        }
      } else {
        // Going up
        for (let y = endRow; y >= startRow; y -= curveStep) {
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
    
    // Add extensions if enabled
    if (controls.extendEnds) {
      const extensionLength = 5;
      // Extend start
      const startCell = pathCells[0];
      for (let i = 1; i <= extensionLength; i++) {
        pathCells.unshift({x: startCell.x + i, y: startCell.y});
        rungCells.unshift({
          pos: {x: startCell.x + i, y: startCell.y + 1},
          colorIndex: 0
        });
      }
      
      // Extend end
      const endCell = pathCells[pathCells.length - 1];
      for (let i = 1; i <= extensionLength; i++) {
        pathCells.push({x: endCell.x - i, y: endCell.y});
        rungCells.push({
          pos: {x: endCell.x - i, y: endCell.y + 1},
          colorIndex: 0
        });
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

    // Apply thickness scaling to path cells
    if (color === controls.pathColor) {
      const scaleFactor = controls.pathThickness;
      x -= (cellWidth * (scaleFactor - 1)) / 2;
      y -= (cellHeight * (scaleFactor - 1)) / 2;
      cellWidth *= scaleFactor;
      cellHeight *= scaleFactor;
    }

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
