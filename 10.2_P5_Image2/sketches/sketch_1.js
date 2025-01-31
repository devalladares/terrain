// sketch_1.js

export default function sketch1(p) {
    let plusSpacing = 30;
    let arcs = [];

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        for (let i = 0; i < 200; i++) {
            arcs.push({
                x1: p.random(p.width),
                y1: p.random(p.height),
                x2: p.random(p.width),
                y2: p.random(p.height),
                c: p.color(p.random(50, 100), p.random(150, 200), p.random(150, 255), 150)
            });
        }
    };

    p.draw = () => {
        p.background(245);
        
        // draw "data" grid
        p.stroke(0, 50);
        p.strokeWeight(1);
        for (let x = 0; x < p.width; x += plusSpacing) {
            for (let y = 0; y < p.height; y += plusSpacing) {
                p.push();
                p.translate(x, y);
                p.line(-3, 0, 3, 0);
                p.line(0, -3, 0, 3);
                p.pop();
            }
        }

        // draw "rna" arcs
        p.noFill();
        arcs.forEach(a => {
            p.stroke(a.c);
            p.strokeWeight(1 + p.random(0.25));
            p.arc((a.x1+a.x2)/2, (a.y1+a.y2)/2, 
                  p.dist(a.x1,a.y1,a.x2,a.y2), 
                  p.dist(a.x1,a.y1,a.x2,a.y2), 
                  0, p.PI);
        });
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
}
