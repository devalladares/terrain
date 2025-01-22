// sketches/sketch3.js

export default function(p) {
    // Grid size (in "cells")
    let cols = 90;
    let rows = 90;
    let field = [];
    
    p.setup = function() {
      p.createCanvas(800, 800);
    
      // Generate some noise-based data
      let scale = 0.05;
      for (let y = 0; y < rows; y++) {
        field[y] = [];
        for (let x = 0; x < cols; x++) {
          let n = p.noise(x * scale, y * scale);
          // Scale it up to 0..255
          field[y][x] = n * 255;
        }
      }
    
      p.noLoop();
    };
    
    p.draw = function() {
      p.background(255);
      
      // We'll define some “contour” levels
      let levels = [50, 100, 150, 200];
      
      p.stroke(0);
      p.strokeWeight(1);
    
      for (let level of levels) {
        drawContour(level);
      }
    };
    
    function drawContour(threshold) {
      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          
          // Corner values
          let tlv = field[y][x];
          let trv = field[y][x+1];
          let blv = field[y+1][x];
          let brv = field[y+1][x+1];
          
          // Above/below threshold
          let tl = tlv > threshold ? 1 : 0;
          let tr = trv > threshold ? 1 : 0;
          let bl = blv > threshold ? 1 : 0;
          let br = brv > threshold ? 1 : 0;
          
          // Construct the bit index
          let idx = (tl << 3) | (tr << 2) | (bl << 1) | br;
    
          // Cell corners in pixel space
          let x0 = x     * (p.width/cols);
          let x1 = (x+1) * (p.width/cols);
          let y0 = y     * (p.height/rows);
          let y1 = (y+1) * (p.height/rows);
    
          // Helper: linear interpolation of an edge
          function lerpEdge(valA, valB, start, end) {
            // Avoid division by zero
            let denom = (valB - valA);
            if (p.abs(denom) < 0.00001) {
              return (start + end) / 2; 
            }
            let frac = (threshold - valA) / denom;
            return start + frac * (end - start);
          }
          
          // For each of the 4 edges, compute intersection coords if needed:
          // We'll store them in an object to use below.
          let points = {};
          // top edge: between (x0,y0) and (x1,y0)
          if ((tl > 0) !== (tr > 0)) {
            let interX = lerpEdge(tlv, trv, x0, x1);
            points.top = p.createVector(interX, y0);
          }
          // right edge: between (x1,y0) and (x1,y1)
          if ((tr > 0) !== (br > 0)) {
            let interY = lerpEdge(trv, brv, y0, y1);
            points.right = p.createVector(x1, interY);
          }
          // bottom edge: between (x0,y1) and (x1,y1)
          if ((bl > 0) !== (br > 0)) {
            let interX = lerpEdge(blv, brv, x0, x1);
            points.bottom = p.createVector(interX, y1);
          }
          // left edge: between (x0,y0) and (x0,y1)
          if ((tl > 0) !== (bl > 0)) {
            let interY = lerpEdge(tlv, blv, y0, y1);
            points.left = p.createVector(x0, interY);
          }
    
          // Now each of the 16 cases can be formed by connecting these intersection points
          // The simplest approach is to connect the two intersection points we have (most
          // cases yield exactly two). A couple of cases yield 0 or 4 intersections.
          // We'll do a minimal approach: gather all intersection points in an array
          // and connect them in pairs.
          let corners = Object.keys(points);
          if (corners.length ===2) {
            // If exactly two intersections, draw one line
            p.line(
              points[corners[0]].x, points[corners[0]].y,
              points[corners[1]].x, points[corners[1]].y
            );
          } else if (corners.length === 4) {
            // Sometimes you get a shape that might have two separate lines.
            // For advanced contouring, you'd decide which corners connect.
            // A quick hack is to just connect them in pairs:
            // e.g. top->right and bottom->left. This depends on the index, though.
            // You can figure out the correct pairing from the index or from
            // an official marching-squares table. For demonstration:
            p.line(
              points.top.x, points.top.y,
              points.right.x, points.right.y
            );
            p.line(
              points.bottom.x, points.bottom.y,
              points.left.x, points.left.y
            );
          }
          // If corners.length is 0 or 1, that means no line needed or degenerate.
        }
      }
    }
}
