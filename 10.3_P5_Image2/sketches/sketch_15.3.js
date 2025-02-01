export default function adaptedSketchN(p) {
  // VISUAL CONFIGURATION
  const GRID_SIZE = 30;            // Number of base cells (determines detail level)
  const FRAME_RATE = 10;           // Animation speed
  const GAP_FACTOR = 0.015;        // Space between cells (1.5% of cell size)
  const MARGIN = 2;                // Grid margin in cells
  
  // PATH CONFIGURATION
  const PATH_COLOR = '#000000';    // Color of main RNA strand
  const S_CURVE_HEIGHT = 0.7;      // Height of S-curve (0-1, percentage of canvas)
  const CURVE_SECTIONS = 3;        // Number of horizontal sections in S-curve
  
  // RUNG CONFIGURATION
  const RUNG_COLORS = [           // Colors for the side rungs
    '#FF69B4',  // Pink
    '#57D7F2',  // Blue
    '#014530'   // Dark green
  ];
  const ANIMATION_SPEED = 0.1;     // Speed of color change animation
  const COLOR_TRANSITION_MODE = 'sequence';  // 'random' or 'sequence'
  
  // Internal variables (calculated)
  let uX, uY;                      // Unit cell sizes
  let gapX, gapY;                  // Gaps between cells
  let N_COLS, N_ROWS;              // Grid dimensions
  let pathCells = [];              // Stores main path coordinates
  let rungCells = [];              // Stores rung coordinates and colors
  let animationOffset = 0;         // Controls color animation
  
  // GUI Controls
  const controls = {
    gridSize: GRID_SIZE,
    gapFactor: GAP_FACTOR,
    margin: MARGIN,
    curveHeight: S_CURVE_HEIGHT,
    animationSpeed: ANIMATION_SPEED,
    animationMode: COLOR_TRANSITION_MODE,
    regenerate: () => generatePath()
  };

  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight).parent(container);
    p.frameRate(FRAME_RATE);
    setupGUI();
    initializeGrid();
    generatePath();
  };

  function setupGUI() {
    const gui = new dat.GUI();
    gui.add(controls, 'gridSize', 10, 50).step(1).onChange(initializeAndGenerate);
    gui.add(controls, 'gapFactor', 0, 0.05).step(0.001).onChange(initializeAndGenerate);
    gui.add(controls, 'margin', 0, 5).step(1).onChange(initializeAndGenerate);
    gui.add(controls, 'curveHeight', 0.3, 0.9).step(0.1).onChange(initializeAndGenerate);
    gui.add(controls, 'animationSpeed', 0.01, 0.5).step(0.01);
    gui.add(controls, 'animationMode', ['random', 'sequence']);
    gui.add(controls, 'regenerate');
  }

  function initializeAndGenerate() {
    initializeGrid();
    generatePath();
  }

  function initializeGrid() {
    N_ROWS = controls.gridSize;
    N_COLS = Math.floor((p.width / p.height) * N_ROWS);

    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * controls.gapFactor;
    gapY = uY * controls.gapFactor;
  }

  function generatePath() {
    pathCells = [];
    rungCells = [];
    
    // Calculate S-curve parameters
    const startRow = Math.floor(N_ROWS * (1 - controls.curveHeight) / 2);
    const endRow = Math.floor(N_ROWS * (1 + controls.curveHeight) / 2);
    const sectionWidth = Math.floor((N_COLS - 2 * controls.margin) / CURVE_SECTIONS);
    
    // Generate the S-curve path
    for (let section = 0; section < CURVE_SECTIONS; section++) {
      const startX = controls.margin + section * sectionWidth;
      const endX = startX + sectionWidth;
      
      if (section % 2 === 0) {
        // Going down
        for (let y = startRow; y <= endRow; y++) {
          pathCells.push({x: startX, y});
          // Add rung on the right
          rungCells.push({
            pos: {x: startX + 1, y},
            colorIndex: 0
          });
        }
      } else {
        // Going up
        for (let y = endRow; y >= startRow; y--) {
          pathCells.push({x: startX, y});
          // Add rung on the right
          rungCells.push({
            pos: {x: startX + 1, y},
            colorIndex: 0
          });
        }
      }
      
      // Connect sections horizontally
      if (section < CURVE_SECTIONS - 1) {
        const y = section % 2 === 0 ? endRow : startRow;
        for (let x = startX + 1; x <= endX; x++) {
          pathCells.push({x, y});
          rungCells.push({
            pos: {x, y: y + (section % 2 === 0 ? 1 : -1)},
            colorIndex: 0
          });
        }
      }
    }
  }

  p.draw = () => {
    p.background(255);
    animationOffset += controls.animationSpeed;

    // Draw path and rungs
    for (const cell of pathCells) {
      drawCell(cell.x, cell.y, PATH_COLOR);
    }

    // Update and draw rungs
    rungCells.forEach((rung, index) => {
      let colorIndex;
      if (controls.animationMode === 'sequence') {
        colorIndex = Math.floor((index + animationOffset) % RUNG_COLORS.length);
      } else {
        colorIndex = Math.floor((index * 0.5 + animationOffset) * 3) % RUNG_COLORS.length;
      }
      drawCell(rung.pos.x, rung.pos.y, RUNG_COLORS[colorIndex]);
    });
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
    initializeAndGenerate();
  };

  p.mousePressed = () => {
    animationOffset = 0;
    generatePath();
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('mrna_visualization', 'png');
    }
  };
}