// sketches/sketchN.js

export default function(p) {
  /**********************************************
   * p5.js Sketch:
   * - White background
   * - Dense grid of crosses
   * - Each cross is colored by the pixel color 
   *   from an underlying image ("1.jpg")
   * - Cross sizes vary with Perlin noise over time
   **********************************************/

  // ---------------------------------------------
  // VARIABLE LIST:
  // 1) img             : the source image
  // 2) spacing         : distance (in px) between cross centers
  // 3) minCrossSize    : minimum cross arm length
  // 4) maxCrossSize    : maximum cross arm length
  // 5) crossWeight     : line thickness for each cross
  // 6) sampleOffsetX   : shift used to sample from the image 
  // 7) sampleOffsetY   : shift used to sample from the image 
  // 8) noiseScale      : noise "zoom" factor
  // 9) zOffset         : "z dimension" (time) for noise, advanced each frame
  // 10) animateSpeed    : how fast the noise "evolves" each frame
  // ---------------------------------------------

  // -- FLOW FIELD SETTINGS --
  let img;                   // the source image
  const spacing = 10;         // distance between cross centers
  const minCrossSize = 1;    // minimum cross arm length
  const maxCrossSize = 15;    // maximum cross arm length
  const crossWeight = 2;     // stroke thickness

  // If the image size differs from the window, you can offset sampling:
  let sampleOffsetX = 0;
  let sampleOffsetY = 0;

  // Noise parameters
  const noiseScale = 0.01;   // noise "zoom"
  let zOffset = 0;            // time offset for noise
  const animateSpeed = 0.05;  // how fast zOffset changes each frame

  // Optional rotation parameters
  let angle = 0;              // rotation angle for crosses (if used)
  let n = 200;                 // parameter used to initialize angle

  p.preload = function() {
    // Load "images/1.jpg" (ensure it's in your project folder or use correct path)
    img = p.loadImage('images/1.jpg');
  };

  p.setup = function() {
    // Create a canvas the size of the window
    p.createCanvas(p.windowWidth, p.windowHeight);

    // Initialize angle (if rotation is used)
    angle = n * p.TWO_PI * 0.2;

    // Set drawing properties
    p.strokeWeight(crossWeight);
    p.noFill();
  };

  p.draw = function() {
    // Fill the background with white
    p.background(255);

    // Loop through a grid across the canvas
    for (let x = 0; x < p.width; x += spacing) {
      for (let y = 0; y < p.height; y += spacing) {

        // Figure out which pixel of the image to sample
        let sampleX = x + sampleOffsetX;
        let sampleY = y + sampleOffsetY;

        // Bound-check in case x or y exceed the image size
        sampleX = p.constrain(sampleX, 0, img.width - 1);
        sampleY = p.constrain(sampleY, 0, img.height - 1);

        // Get the pixel color from the image at (sampleX, sampleY)
        let c = img.get(sampleX, sampleY);

        // 1) Get noise value for this position + time
        //    We add zOffset as a 3rd dimension so it changes each frame
        let noiseVal = p.noise(sampleX * noiseScale, sampleY * noiseScale, zOffset);

        // 2) Map noise [0..1] to a range of cross sizes
        let currentCrossSize = p.map(noiseVal, 0, 1, minCrossSize, maxCrossSize);

        // (Optional) If you also want rotation, you can use:
        // let crossAngle = noiseVal * p.TWO_PI;  // or multiply further for faster spin

        // Draw a “+” sign using that color, at (x, y)
        p.push();
        p.translate(x, y);
        
        // Uncomment the next line if you want the crosses to rotate based on noise
        // p.rotate(crossAngle);

        p.stroke(c);
        p.strokeWeight(crossWeight);
        p.noFill();

        // Horizontal line
        p.line(-currentCrossSize / 2, 0, currentCrossSize / 2, 0);
        // Vertical line
        p.line(0, -currentCrossSize / 2, 0, currentCrossSize / 2);

        p.pop();
      }
    }

    // Advance the noise "time" offset so we get animation
    zOffset += animateSpeed;
  };

  // Handle window resizing to keep the canvas responsive
  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // Redraw once after resizing
    // (since we animate, it's called every frame anyway)
  };

  // Optional: Handle mouse press events
  p.mousePressed = function() {
    // Example: Reset the noise offset to create a jump effect
    zOffset = p.random(1000);
  };

  // Optional: Handle key press events
  p.keyPressed = function() {
    // Example: Toggle rotation on/off with the 'R' key
    if (p.key === 'R' || p.key === 'r') {
      // Implement toggle logic if rotation is used
      // For example, toggle a boolean flag that controls rotation
    }
  };
}
