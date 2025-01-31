// sketch_n.js
export default function sketch1(p) {
    const width = 700;
    const height = 500;
    
    p.setup = () => {
        p.createCanvas(width, height);
        p.rectMode(p.CENTER); // Optional: makes square position relative to its center
    };
  
    p.windowResized = () => {
        // Keep fixed size
        p.createCanvas(width, height);
    };
  
    p.draw = () => {
        p.background(255, 255, 0);
        
        // Example: Draw square in the middle
        p.square(width/2, height/2, 100);
        
        // Or keep original position
        // p.square(100, 100, 100);
    };
}