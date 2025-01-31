export default function adaptedSketchN(p) {
  // VISUAL CONFIGURATION
  const GRID_SIZE = 15;
  const FRAME_RATE = 10;
  const GAP_FACTOR = 0.05;
  const MARGIN = 2;
  
  // RNA CONFIGURATION
  const NUM_STRANDS = 3;           // Number of RNA strands
  const MIN_STRAND_LENGTH = 10;    // Minimum cells in a strand
  const MAX_STRAND_LENGTH = 20;    // Maximum cells in a strand
  const MOVEMENT_SPEED = 0.5;      // How fast strands move
  const WIGGLE_AMOUNT = 0.2;       // How much strands wiggle
  
  // STYLE CONFIGURATION
  const RUNG_COLORS = [
    '#FF69B4',  // Pink
    '#57D7F2',  // Blue
    '#014530'   // Dark green
  ];
  
  // TEXT CONFIGURATION
  const RNA_LETTERS = ['A', 'U', 'G', 'C', '+'];
  const LETTER_SIZE_FACTOR = 0.4;  // Size of letters relative to cell
  
  // Internal variables
  let uX, uY, gapX, gapY, N_COLS, N_ROWS;
  let strands = [];  // Array of RNA strands
  let animationOffset = 0;
  
  // GUI Controls
  const controls = {
    gridSize: GRID_SIZE,
    gapFactor: GAP_FACTOR,
    margin: MARGIN,
    numStrands: NUM_STRANDS,
    pathColor: '#000000',
    strokeColor: '#000000',
    strokeWeight: 0,
    movementSpeed: MOVEMENT_SPEED,
    wiggleAmount: WIGGLE_AMOUNT,
    showLetters: true,
    letterColor: '#FFFFFF',
    colorChangeSpeed: 0.95,
    randomnessAmount: 1.0,
    regenerate: () => initializeStrands()
  };

  class RNAStrand {
    constructor(startX, startY) {
      this.cells = [];
      this.rungs = [];
      this.letters = [];
      this.offset = p.random(1000);  // Random offset for movement
      this.direction = p.random(p.TWO_PI);
      this.velocity = p5.Vector.fromAngle(this.direction).mult(controls.movementSpeed);
      
      // Generate random path
      const length = p.floor(p.random(MIN_STRAND_LENGTH, MAX_STRAND_LENGTH));
      let x = startX;
      let y = startY;
      
      for (let i = 0; i < length; i++) {
        this.cells.push({x, y});
        // Add rung to the right of the main strand
        this.rungs.push({
          pos: {x: x + 1, y},
          colorIndex: p.floor(p.random(RUNG_COLORS.length))
        });
        // Add random RNA letter
        this.letters.push(RNA_LETTERS[p.floor(p.random(RNA_LETTERS.length))]);
        
        // Move to next position with some randomness
        if (i < length - 1) {
          const angle = p.noise(x * 0.1, y * 0.1, i * 0.1) * p.TWO_PI;
          x += p.cos(angle);
          y += p.sin(angle);
        }
      }
    }
    
    update() {
      // Update position with noise-based movement
      const time = p.millis() * 0.001;
      const noiseX = p.noise(time * 0.5 + this.offset);
      const noiseY = p.noise(time * 0.5 + this.offset + 1000);
      
      // Apply forces
      this.velocity.x += (noiseX - 0.5) * controls.wiggleAmount;
      this.velocity.y += (noiseY - 0.5) * controls.wiggleAmount;
      this.velocity.limit(controls.movementSpeed);
      
      // Move all cells
      for (let i = 0; i < this.cells.length; i++) {
        this.cells[i].x += this.velocity.x;
        this.cells[i].y += this.velocity.y;
        this.rungs[i].pos.x = this.cells[i].x + 1;
        this.rungs[i].pos.y = this.cells[i].y;
        
        // Wrap around screen
        this.cells[i].x = (this.cells[i].x + N_COLS) % N_COLS;
        this.cells[i].y = (this.cells[i].y + N_ROWS) % N_ROWS;
        this.rungs[i].pos.x = (this.rungs[i].pos.x + N_COLS) % N_COLS;
        this.rungs[i].pos.y = (this.rungs[i].pos.y + N_ROWS) % N_ROWS;
      }
    }
    
    draw() {
      // Draw main strand
      p.strokeWeight(controls.strokeWeight);
      p.stroke(controls.strokeColor);
      
      for (let i = 0; i < this.cells.length; i++) {
        const cell = this.cells[i];
        drawCell(cell.x, cell.y, controls.pathColor);
        
        // Draw rung with animated color
        const rung = this.rungs[i];
        const time = p.millis() * 0.001 * controls.colorChangeSpeed;
        const colorIndex = Math.floor((i + time + this.offset) * controls.randomnessAmount) % RUNG_COLORS.length;
        drawCell(rung.pos.x, rung.pos.y, RUNG_COLORS[colorIndex]);
        
        // Draw letter
        if (controls.showLetters) {
          const x = cell.x * uX + uX / 2;
          const y = cell.y * uY + uY / 2;
          p.fill(controls.letterColor);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(Math.min(uX, uY) * LETTER_SIZE_FACTOR);
          p.text(this.letters[i], x, y);
        }
      }
    }
  }

  function initializeStrands() {
    strands = [];
    for (let i = 0; i < controls.numStrands; i++) {
      const startX = p.random(N_COLS);
      const startY = p.random(N_ROWS);
      strands.push(new RNAStrand(startX, startY));
    }
  }

  function setupGUI() {
    const gui = new dat.GUI();
    
    const visualsFolder = gui.addFolder('Visual Settings');
    visualsFolder.add(controls, 'gridSize', 10, 50).step(1).onChange(initializeAndGenerate);
    visualsFolder.add(controls, 'gapFactor', 0, 0.05).step(0.001).onChange(initializeAndGenerate);
    visualsFolder.addColor(controls, 'pathColor');
    visualsFolder.addColor(controls, 'strokeColor');
    visualsFolder.add(controls, 'strokeWeight', 0, 5).step(0.5);
    
    const rnaFolder = gui.addFolder('RNA Settings');
    rnaFolder.add(controls, 'numStrands', 1, 10).step(1).onChange(initializeStrands);
    rnaFolder.add(controls, 'movementSpeed', 0.1, 2).step(0.1);
    rnaFolder.add(controls, 'wiggleAmount', 0, 1).step(0.1);
    
    const textFolder = gui.addFolder('Text Settings');
    textFolder.add(controls, 'showLetters');
    textFolder.addColor(controls, 'letterColor');
    
    const animationFolder = gui.addFolder('Animation');
    animationFolder.add(controls, 'colorChangeSpeed', 0.1, 2).step(0.1);
    animationFolder.add(controls, 'randomnessAmount', 0, 2).step(0.1);
    
    visualsFolder.open();
    rnaFolder.open();
    textFolder.open();
    animationFolder.open();
  }

  p.setup = () => {
    const container = p.select('#sketch-container');
    p.createCanvas(container.width, container.height).parent(container);
    p.frameRate(FRAME_RATE);
    setupGUI();
    initializeGrid();
    initializeStrands();
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
    initializeStrands();
  }

  function drawCell(i, j, color) {
    let x = i * uX + gapX / 2;
    let y = j * uY + gapY / 2;
    let cellWidth = uX - gapX;
    let cellHeight = uY - gapY;

    p.fill(color);
    p.rect(x, y, cellWidth, cellHeight);
  }

  p.draw = () => {
    p.background(255);
    
    // Update and draw all strands
    strands.forEach(strand => {
      strand.update();
      strand.draw();
    });
    
    animationOffset += controls.colorChangeSpeed;
  };

  p.windowResized = () => {
    const container = p.select('#sketch-container');
    p.resizeCanvas(container.width, container.height);
    initializeAndGenerate();
  };

  p.mousePressed = () => {
    initializeStrands();
  };

  p.keyPressed = () => {
    if (p.key === 'S' || p.key === 's') {
      p.saveCanvas('multi_rna_visualization', 'png');
    }
  };
}