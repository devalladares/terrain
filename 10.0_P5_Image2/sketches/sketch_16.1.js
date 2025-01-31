export default function adaptedSketchN(p) {
  // Grid Configuration
  const N = 30;  
  const FRAME_RATE = 8;
  const margin = 1;
  const gapFactor = 0.015;

  // Path Configuration
  let pathCells = [];  // Stores the cells that make up the main path
  let sideBlocks = []; // Stores the colored blocks attached to the path
  const PATH_COLOR = '#000000';
  const SIDE_COLORS = [
    '#FF69B4',  // Pink
    '#57D7F2',  // Blue
    '#014530'   // Dark green
  ];
  
  // Movement settings
  const STEPS_PER_DIRECTION = 5;  // How many cells to move in each direction
  const CHANGE_DIRECTION_PROBABILITY = 0.3;  // Chance to change direction at each step

  // Cell & Typography Settings
  let uX, uY, gapX, gapY, N_COLS, N_ROWS;

  p.setup = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.createCanvas(containerWidth, containerHeight).parent(container);
    p.frameRate(FRAME_RATE);
    p.background(255);

    initializeGrid();
    generatePath();
    p.noStroke();
  };

  function initializeGrid() {
    N_ROWS = N;
    N_COLS = Math.floor((p.width / p.height) * N);

    uX = p.width / N_COLS;
    uY = p.height / N_ROWS;
    gapX = uX * gapFactor;
    gapY = uY * gapFactor;
  }

  function generatePath() {
    pathCells = [];
    sideBlocks = [];
    
    // Start from middle of left side
    let currentPos = {
      x: margin,
      y: Math.floor(N_ROWS / 2)
    };
    
    let direction = {x: 1, y: 0};  // Start moving right
    let stepsInCurrentDirection = 0;

    // Generate path until we reach near the right edge
    while (currentPos.x < N_COLS - margin && 
           currentPos.y >= margin && 
           currentPos.y < N_ROWS - margin) {
      
      // Add current position to path
      pathCells.push({...currentPos});
      
      // Add a side block every few steps
      if (pathCells.length % 3 === 0) {
        let sidePos = {
          x: currentPos.x + direction.y,  // Perpendicular to current direction
          y: currentPos.y - direction.x
        };
        
        if (isValidPosition(sidePos)) {
          sideBlocks.push({
            pos: sidePos,
            color: SIDE_COLORS[Math.floor(Math.random() * SIDE_COLORS.length)]
          });
        }
      }

      // Move to next position
      stepsInCurrentDirection++;
      
      // Consider changing direction
      if (stepsInCurrentDirection >= STEPS_PER_DIRECTION && 
          Math.random() < CHANGE_DIRECTION_PROBABILITY) {
        
        // Change direction (up or down if moving right)
        if (direction.x === 1) {
          direction = {
            x: 0,
            y: Math.random() < 0.5 ? 1 : -1
          };
        } else {
          // Go right if moving vertically
          direction = {x: 1, y: 0};
        }
        stepsInCurrentDirection = 0;
      }

      // Move to next position
      currentPos.x += direction.x;
      currentPos.y += direction.y;
    }
  }

  function isValidPosition(pos) {
    return pos.x >= margin && 
           pos.x < N_COLS - margin && 
           pos.y >= margin && 
           pos.y < N_ROWS - margin;
  }

  p.draw = () => {
    p.background(255);

    // Draw the path and side blocks
    for (let i = margin; i < N_COLS - margin; i++) {
      for (let j = margin; j < N_ROWS - margin; j++) {
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let cellWidth = uX - gapX;
        let cellHeight = uY - gapY;

        // Check if this cell is part of the main path
        let isPath = pathCells.some(pos => pos.x === i && pos.y === j);
        
        // Check if this cell is a side block
        let sideBlock = sideBlocks.find(block => block.pos.x === i && block.pos.y === j);

        if (isPath) {
          p.fill(PATH_COLOR);
          p.rect(x, y, cellWidth, cellHeight);
        } else if (sideBlock) {
          p.fill(sideBlock.color);
          p.rect(x, y, cellWidth, cellHeight);
        }
      }
    }
  };

  p.windowResized = () => {
    const container = p.select('#sketch-container');
    const containerWidth = container.width;
    const containerHeight = container.height;

    p.resizeCanvas(containerWidth, containerHeight);
    initializeGrid();
    generatePath();
  };

  p.mousePressed = () => {
    generatePath();  // Generate a new path when clicked
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('mrna_visualization', 'png');
    }
  };
}