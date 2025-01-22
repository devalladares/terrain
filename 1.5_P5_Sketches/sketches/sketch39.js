/*
  ---------------------------------------------
  P5.JS SKETCH:
   - White background
   - Dense grid of crosses
   - Each cross is colored by the pixel color 
     from an underlying image ("1.jpg")
   - Cross sizes vary with Perlin noise over time
  ---------------------------------------------

  VARIABLE LIST:
  1) img             : the source image
  2) spacing         : distance (in px) between cross centers
  3) minCrossSize    : minimum cross arm length
  4) maxCrossSize    : maximum cross arm length
  5) crossWeight     : line thickness for each cross
  6) sampleOffsetX   : shift used to sample from the image 
  7) sampleOffsetY   : shift used to sample from the image 
  8) noiseScale      : noise "zoom" factor
  9) zOffset         : "z dimension" (time) for noise, advanced each frame
 10) animateSpeed    : how fast the noise "evolves" each frame
*/

let img;                // the source image
let spacing = 8;        // distance between cross centers
let minCrossSize = 1;   // minimum cross arm length
let maxCrossSize = 5;  // maximum cross arm length
let crossWeight = 6;    // stroke thickness

// If the image size differs from the window, you can offset sampling:
let sampleOffsetX = 0;
let sampleOffsetY = 0;

// Noise parameters
let noiseScale = 0.001;  // noise "zoom"
let zOffset = 0;        // time offset for noise
let animateSpeed = 0.05; // how fast zOffset changes each frame
let angle
let n=20

function preload() {
  // Load "1.jpg" (ensure it's in your project folder or use correct path)
  img = loadImage('1.jpg');
}

function setup() {
  // Create a canvas the size of the window
  createCanvas(windowWidth, windowHeight);
let angle = n * TWO_PI * 0.2;
  // Remove noLoop() so we animate each frame
  // noLoop();
}

function draw() {
  // Fill the background with white
  background(255);

  // Loop in a grid across the canvas
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {

      // Figure out which pixel of the image to sample
      let sampleX = x + sampleOffsetX;
      let sampleY = y + sampleOffsetY;

      // Bound-check in case x or y exceed the image size
      sampleX = constrain(sampleX, 0, img.width - 1);
      sampleY = constrain(sampleY, 0, img.height - 1);

      // Get the pixel color from the image at (sampleX, sampleY)
      let c = img.get(sampleX, sampleY);

      // 1) Get noise value for this position + time
      //    We add zOffset as a 3rd dimension so it changes each frame
      let n = noise(sampleX * noiseScale, sampleY * noiseScale, zOffset);

      // 2) Map noise [0..1] to a range of cross sizes
      let currentCrossSize = map(n, 0, 1, minCrossSize, maxCrossSize);

      // (Optional) If you also want rotation, you can use:
      // let angle = n * TWO_PI;  // or multiply further for faster spin

      // Draw a “+” sign using that color, at (x, y)
      push();
      translate(x, y);
      rotate(angle); // <-- Uncomment if you want them to also rotate

      stroke(c);
      strokeWeight(crossWeight);
      noFill();

      // Horizontal line
      line(-currentCrossSize / 2, 0, currentCrossSize / 2, 0);
      // Vertical line
      line(0, -currentCrossSize / 2, 0, currentCrossSize / 2);

      pop();
    }
  }

  // Advance the noise "time" offset so we get animation
  zOffset += animateSpeed;
}

// If you want the sketch to resize with the window:
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Redraw once after resizing
  // (since we animate, it's called every frame anyway)
}
