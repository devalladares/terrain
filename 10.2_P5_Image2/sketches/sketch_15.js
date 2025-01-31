// sketch_n.js

export default function mRNASketch(p) {
    // Configuration Constants
    const CELL_SIZE = 20;        // Size of each grid cell
    const GAP_FACTOR = 0.15;     // Gap between cells as fraction of cell size
    const FRAME_RATE = 30;       // Animation frame rate
    
    // mRNA-specific settings
    const NUCLEOTIDES = ['A', 'U', 'G', 'C'];
    const COLORS = {
      A: '#FF6B6B',  // Adenine - Red
      U: '#4ECDC4',  // Uracil - Teal
      G: '#45B7D1',  // Guanine - Blue
      C: '#96CEB4'   // Cytosine - Green
    };
  
    // Flow field settings
    let flowField = [];
    const flowScale = 0.05;
    let zOffset = 0;
    const zIncrement = 0.002;
  
    // Internal variables
    let cols, rows;
    let cellWidth, cellHeight;
    let gapX, gapY;
  
    p.setup = () => {
      p.createCanvas(p.windowWidth, p.windowHeight);
      p.frameRate(FRAME_RATE);
      p.textAlign(p.CENTER, p.CENTER);
      p.textFont('monospace');
      
      initializeGrid();
      initializeFlowField();
    };
  
    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      initializeGrid();
      initializeFlowField();
    };
  
    function initializeGrid() {
      cols = Math.floor(p.width / CELL_SIZE);
      rows = Math.floor(p.height / CELL_SIZE);
      cellWidth = p.width / cols;
      cellHeight = p.height / rows;
      gapX = cellWidth * GAP_FACTOR;
      gapY = cellHeight * GAP_FACTOR;
    }
  
    function initializeFlowField() {
      flowField = new Array(cols);
      for (let i = 0; i < cols; i++) {
        flowField[i] = new Array(rows);
        for (let j = 0; j < rows; j++) {
          let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI;
          flowField[i][j] = p5.Vector.fromAngle(angle);
        }
      }
    }
  
    p.draw = () => {
      p.background(255); // Dark background
      
      // Update flow field
      zOffset += zIncrement;
      updateFlowField();
  
      // Draw grid
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let x = i * cellWidth + gapX / 2;
          let y = j * cellHeight + gapY / 2;
          let w = cellWidth - gapX;
          let h = cellHeight - gapY;
  
          // Get flow vector and calculate color
          let vector = flowField[i][j];
          let angle = vector.heading();
          
          // Choose nucleotide based on noise
          let nucleotideIndex = Math.floor(
            p.map(p.noise(i * 0.1, j * 0.1, zOffset * 0.5), 0, 1, 0, NUCLEOTIDES.length)
          );
          let nucleotide = NUCLEOTIDES[nucleotideIndex];
          let cellColor = COLORS[nucleotide];
  
          // Draw cell background
          p.noStroke();
          p.fill(cellColor);
          p.rect(x, y, w, h);
  
          // Draw nucleotide letter
          p.fill(255);
          p.textSize(Math.min(w, h) * 0.6);
          p.text(nucleotide, x + w/2, y + h/2);
  
          // Optionally draw plus sign behind letter (commented out)
          /*
          p.stroke(255, 100);
          p.strokeWeight(1);
          let crossSize = Math.min(w, h) * 0.3;
          p.line(x + w/2 - crossSize/2, y + h/2, x + w/2 + crossSize/2, y + h/2);
          p.line(x + w/2, y + h/2 - crossSize/2, x + w/2, y + h/2 + crossSize/2);
          */
        }
      }
    };
  
    function updateFlowField() {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let angle = p.noise(i * flowScale, j * flowScale, zOffset) * p.TWO_PI;
          flowField[i][j] = p5.Vector.fromAngle(angle);
        }
      }
    }
  
    // Optional: Save functionality
    p.keyPressed = () => {
      if (p.key === 's' || p.key === 'S') {
        p.saveCanvas('mrna_visualization', 'png');
      }
    };
  }