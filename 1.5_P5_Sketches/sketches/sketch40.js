// Variables for grid control
let rowsSlider, colsSlider;
let rowsLabel, colsLabel;
let rows, cols;

// Variable for image control
let loadImageButton;
let img;
let imageLoaded = false;

// Canvas dimensions will adapt to window size

function preload() {
  // Load the image. Ensure '1.jpg' is uploaded to your p5.js project.
  img = loadImage('1.jpg', 
    () => {
      console.log('Image loaded successfully.');
    },
    () => {
      console.error('Failed to load image. Please ensure "1.jpg" is uploaded to the project.');
    }
  );
}

function setup() {
  // Create the canvas to fit the window size
  createCanvas(windowWidth, windowHeight * 0.8); // 80% of window height for canvas

  // Set initial background
  background(255); // White background

  // Create Controls Container
  createControls();

  // Initialize grid values
  rows = rowsSlider.value();
  cols = colsSlider.value();

  // Draw the initial grid
  drawGrid();
}

function draw() {
  // No continuous drawing needed
}

function windowResized() {
  // Adjust canvas size when the window is resized
  resizeCanvas(windowWidth, windowHeight * 0.8);
  drawGrid(); // Redraw the grid with new dimensions
}

function createControls() {
  // Create a container div for controls
  let controlsDiv = createDiv();
  controlsDiv.style('padding', '10px');
  controlsDiv.style('background', '#f0f0f0');
  controlsDiv.style('width', '100%');
  controlsDiv.style('box-sizing', 'border-box');

  // Create Rows Slider
  rowsLabel = createSpan('Rows: ');
  rowsLabel.parent(controlsDiv);
  rowsLabel.style('font-weight', 'bold');
  
  rowsSlider = createSlider(1, 50, 10, 1);
  rowsSlider.parent(controlsDiv);
  rowsSlider.style('margin-right', '20px');
  rowsSlider.input(updateGrid); // Update grid on slider input

  // Create Columns Slider
  colsLabel = createSpan('Columns: ');
  colsLabel.parent(controlsDiv);
  colsLabel.style('font-weight', 'bold');
  
  colsSlider = createSlider(1, 50, 10, 1);
  colsSlider.parent(controlsDiv);
  colsSlider.style('margin-right', '20px');
  colsSlider.input(updateGrid); // Update grid on slider input

  // Create Load Image Button
  loadImageButton = createButton('Toggle Image');
  loadImageButton.parent(controlsDiv);
  loadImageButton.mousePressed(toggleImage); // Toggle image on button press
}

function updateGrid() {
  // Update rows and cols based on slider values
  rows = rowsSlider.value();
  cols = colsSlider.value();

  // Redraw the grid
  drawGrid();
}

function drawGrid() {
  background(255); // Clear the canvas with white background
  stroke(0); // Black lines
  strokeWeight(0.5); // Thin lines
  noFill();

  // Calculate cell dimensions
  let cellWidth = width / cols;
  let cellHeight = height / rows;

  // Draw vertical lines
  for (let i = 0; i <= cols; i++) {
    let x = i * cellWidth;
    line(x, 0, x, height);
  }

  // Draw horizontal lines
  for (let j = 0; j <= rows; j++) {
    let y = j * cellHeight;
    line(0, y, width, y);
  }

  // If image is loaded, draw it in each cell
  if (imageLoaded && img) {
    drawImagesInGrid(cellWidth, cellHeight);
  }
}

function toggleImage() {
  // Toggle the imageLoaded flag
  imageLoaded = !imageLoaded;

  if (imageLoaded && !img) {
    console.error('Image not loaded.');
    imageLoaded = false;
    return;
  }

  // Redraw the grid to either show or hide images
  drawGrid();
}

function drawImagesInGrid(cellWidth, cellHeight) {
  // Iterate through each cell and draw the image
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Calculate the position for each image
      let x = col * cellWidth;
      let y = row * cellHeight;

      // Draw the image scaled to fit the cell
      image(img, x, y, cellWidth, cellHeight);
    }
  }
}
