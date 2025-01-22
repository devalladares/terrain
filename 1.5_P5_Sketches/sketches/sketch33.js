/*
  ---------------------------------------------
  P5.JS SKETCH:
   - Full window canvas
   - Background image "1.png"
   - Grid of white crosses, each gently rotating
     and pulsating in scale over time
  ---------------------------------------------
*/

let img;                 // background image
let spacing = 120;       // spacing between crosses
let baseCrossSize = 20;  // the average size of each cross
let rotationSpeed = 0.4; // how fast crosses rotate
let scaleAmplitude = 0.0; // how much crosses pulse in scale

function preload() {
  // Make sure "1.png" is in your project folder or a correct path
  img = loadImage('1.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  // Draw the background image
  background(img);

  // We'll use the current time (in seconds) for our animations
  let time = millis() * 0.001;

  // Loop through a grid of points
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      
      // Use x+y as an offset so crosses rotate out of sync
      let offset = (x + y) * 0.001;
      
      // Calculate an angle for rotation
      // The factor "rotationSpeed" controls how quickly they spin
      let angle = (time + offset) * rotationSpeed;
      
      // Calculate a scale factor that gently pulses via sine
      // scaleAmplitude = 0.2 => 20% bigger at peak
      let scaleFactor = 1 + scaleAmplitude * sin(time + offset);
      
      // Final cross size
      let crossSize = baseCrossSize * scaleFactor;
      
      // Draw each cross in its own coordinate space
      push();
      translate(x, y);
      rotate(angle);
      
      // White stroke, no fill
      stroke(255);
      strokeWeight(2);
      noFill();
      
      // Draw the “+” sign
      line(-crossSize / 2, 0, crossSize / 2, 0);
      line(0, -crossSize / 2, 0, crossSize / 2);
      
      pop();
    }
  }
}

// (Optional) Adjust the canvas size if the window is resized
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
