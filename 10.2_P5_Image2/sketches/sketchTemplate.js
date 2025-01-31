// sketch_n.js

export default function sketch1(p) {
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        // Additional setup code if needed
    };
  
    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  
    p.draw = () => {
        p.background(255, 255, 0);
        // Your sketch code here
    };
  }
  