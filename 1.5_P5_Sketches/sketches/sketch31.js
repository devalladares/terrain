/*
  --- BRAND COLOR VARIABLES ---
  TB_PINK_500   : A medium-bright pink
  TB_BLUE_500   : A vibrant aqua/blue
  TB_GREEN_900  : A dark green
  TB_GREEN_500  : A lighter green
  BRAND_WHITE   : Basic white
  
  --- OTHER VARIABLES ---
  spacing       : Distance in pixels between each grid point
  noiseScale    : Scale factor for the Perlin noise function
*/

let TB_PINK_500;
let TB_BLUE_500;
let TB_GREEN_900;
let TB_GREEN_500;
let BRAND_WHITE;

let spacing;    
let noiseScale; 

function setup() {
  createCanvas(600, 600);
  noLoop(); // We'll draw only once

  // Define the brand colors (feel free to swap out the hex codes with your exact ones)
  TB_PINK_500  = '#F49EC2';
  TB_BLUE_500  = '#00F5FA';
  TB_GREEN_900 = '#003F2F';
  TB_GREEN_500 = '#77C98D';
  BRAND_WHITE  = '#FFFFFF';

  // Define our drawing parameters
  spacing    = 10;      // Distance between grid points
  noiseScale = 0.01;    // Scale for noise

  // Use HSB mode for easier color manipulations if needed
  colorMode(HSB, 360, 100, 100);
}

function draw() {
  // Use one of the brand greens as the background
  background(TB_GREEN_500);

  // We’ll draw crosses (“+” signs) in a grid
  strokeWeight(1);

  // Loop through a grid of points using spacing
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      // Sample noise
      let n = noise(x * noiseScale, y * noiseScale);

      // You could map noise to a hue if you want color variation
      // let hueVal = map(n, 0, 1, 80, 160);

      // For now, let’s just set stroke to brand white for visibility
      stroke(BRAND_WHITE);

      // Vary cross size based on noise
      let crossSize = map(n, 0, 1, 2, spacing * 1.2);

      // Draw the “+” sign
      // Horizontal line
      line(x - crossSize / 2, y, x + crossSize / 2, y);
      // Vertical line
      line(x, y - crossSize / 2, x, y + crossSize / 2);
    }
  }
}
