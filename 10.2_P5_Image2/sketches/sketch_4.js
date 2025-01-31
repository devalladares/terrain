export default function sketch1(p) {
    const M = 8, N = M;
    let path = [], currentPoint;

    function possibleNeighbors([i, j], m, n) {
        let possibilities = [];
        if (j < n-1) possibilities.push([i, j+1]);
        if (j > 0) possibilities.push([i, j-1]);
        if (i < m-1) possibilities.push([i+1, j]);
        if (i > 0) possibilities.push([i-1, j]);
        return possibilities;
    }

    function inArray([i, j], arr) {
        for (let e of arr) {
            if (e[0] === i && e[1] === j) return true;
        }
        return false;
    }

    function disjointed(arr, m, n) {
        if (arr.length >= m*n) return false;
        
        let startPoint;
        do {
            startPoint = [p.floor(p.random(m)), p.floor(p.random(n))];
        } while (inArray(startPoint, arr));
            
        let discovered = [];
        let stack = [startPoint];
        
        while (stack.length > 0) {
            let point = stack.pop();
            if (!inArray(point, discovered)) {
                discovered.push(point);
                let neighbors = possibleNeighbors(point, m, n);
                for (let neigh of neighbors) {
                    if (!inArray(neigh, arr)) stack.push(neigh);
                }
            }
        }
        
        return discovered.length != m*n-arr.length;
    }

    function countDeadends(arr, ignoreMe, m, n) {
        let count = 0;
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (!inArray([i, j], arr) && !inArray([i, j], ignoreMe)) {
                    let eventualNeighbors = possibleNeighbors([i, j], m, n);
                    let neighbors = eventualNeighbors.filter(neigh => !inArray(neigh, arr));
                    if (neighbors.length < 2) count++;
                }
            }
        }
        return count;
    }

    function getDirection(pA, pB) {
        if (pA[0] == pB[0]) {
            if (pA[1] > pB[1]) return "down";
            else return "up";
        } else {
            if (pA[0] > pB[0]) return "right";
            else return "left";
        }
    }

    function getDrawnPath(path, point) {
        let drawnPath = [];
        for (let k = 0; k < path.length-1; k++) {
            let p0 = path[k], p1 = path[k+1];
            drawnPath.push(p0);
            if (p.abs(p0[0]-p1[0]) > 1 || p.abs(p0[1]-p1[1]) > 1) {
                drawnPath.push([(p0[0]+p1[0])/2, (p0[1]+p1[1])/2]);
            }
        }
        drawnPath.push(path[path.length-1]);
        drawnPath.push(point);
        return drawnPath;
    }

    function drawExtremity(path, start, sx, sy, a, b, c) {
        let i = 0, j = 1;
        if (!start) {
            i = path.length-1;
            j = path.length-2;
        }
        let p0 = path[i];
        let p1 = path[j];
        let dir = getDirection(p0, p1);
        
        if (dir == "down") {
            if (start) p.rect((p0[0]+a)*sx, p0[1]*sy, (1-a-b)*sx, (1-c)*sy);
            else p.rect((p0[0]+b)*sx, p0[1]*sy, (1-a-b)*sx, (1-c)*sy);
        } else if (dir == "up") {
            if (start) p.rect((p0[0]+b)*sx, (p0[1]+c)*sy, (1-a-b)*sx, (1-c)*sy);
            else p.rect((p0[0]+a)*sx, (p0[1]+c)*sy, (1-a-b)*sx, (1-c)*sy);
        } else if (dir == "left") {
            if (start) p.rect((p0[0]+c)*sx, (p0[1]+a)*sy, (1-c)*sx, (1-a-b)*sy);
            else p.rect((p0[0]+c)*sx, (p0[1]+b)*sy, (1-c)*sx, (1-a-b)*sy);
        } else {
            if (start) p.rect(p0[0]*sx, (p0[1]+b)*sy, (1-c)*sx, (1-a-b)*sy);
            else p.rect(p0[0]*sx, (p0[1]+a)*sy, (1-c)*sx, (1-a-b)*sy);
        }
    }

    function drawPathPortion(path, k, x0, y0, w, h, m, n, lineCol, a, b, c) {
        p.push();
        p.translate(x0, y0);
        
        let sx = w/m, sy = h/n;
        
        p.noStroke();
        p.fill(lineCol);
        
        if (k == 0) {
            drawExtremity(path, true, sx, sy, a, b, c);
        } else if (k == path.length-1) {
            drawExtremity(path, false, sx, sy, a, b, c);
        } else {
            let p0 = path[k-1];
            let p1 = path[k];
            let p2 = path[k+1];
            let dir01 = getDirection(p0, p1);
            let dir12 = getDirection(p1, p2);
            
            if (dir01 == dir12) {
                p.noStroke();
                p.fill(lineCol);
                if (dir01 == "down") {
                    p.rect((p1[0]+a)*sx, p1[1]*sy, (1-a-b)*sx, sy);
                } else if (dir01 == "up") {
                    p.rect((p1[0]+b)*sx, p1[1]*sy, (1-a-b)*sx, sy);
                } else if (dir01 == "left") {
                    p.rect(p1[0]*sx, (p1[1]+a)*sy, sx, (1-a-b)*sy);
                } else {
                    p.rect(p1[0]*sx, (p1[1]+b)*sy, sx, (1-a-b)*sy);
                }
            } else {
                p.noFill();
                p.stroke(lineCol);
                p.strokeWeight(sx*(1-a-b)*1.05); // Slightly thicker to match rect width
                p.strokeCap(p.SQUARE);
                
                // Handle curves at corners
                if (dir01 == "up" && dir12 == "right") {
                    p.arc(p1[0]*sx, p1[1]*sy, (1-a+b)*sx, (1-a+b)*sy, 0, p.PI/2);
                } else if (dir01 == "left" && dir12 == "down") {
                    p.arc(p1[0]*sx, p1[1]*sy, (1+a-b)*sx, (1+a-b)*sy, 0, p.PI/2);
                } else if (dir01 == "right" && dir12 == "down") {
                    p.arc((p1[0]+1)*sx, p1[1]*sy, (1-a+b)*sx, (1-a+b)*sy, p.PI/2, p.PI);
                } else if (dir01 == "up" && dir12 == "left") {
                    p.arc((p1[0]+1)*sx, p1[1]*sy, (1+a-b)*sx, (1+a-b)*sy, p.PI/2, p.PI);
                } else if (dir01 == "down" && dir12 == "left") {
                    p.arc((p1[0]+1)*sx, (p1[1]+1)*sy, (1-a+b)*sx, (1-a+b)*sy, p.PI, 3*p.PI/2);
                } else if (dir01 == "right" && dir12 == "up") {
                    p.arc((p1[0]+1)*sx, (p1[1]+1)*sy, (1+a-b)*sx, (1+a-b)*sy, p.PI, 3*p.PI/2);
                } else if (dir01 == "left" && dir12 == "up") {
                    p.arc(p1[0]*sx, (p1[1]+1)*sy, (1-a+b)*sx, (1-a+b)*sy, 3*p.PI/2, p.TWO_PI);
                } else {
                    p.arc(p1[0]*sx, (p1[1]+1)*sy, (1+a-b)*sx, (1+a-b)*sy, 3*p.PI/2, p.TWO_PI);
                }
            }
        }
        
        p.pop();
    }

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.pixelDensity(1);
        currentPoint = [2*p.floor(p.random(M/2)), 2*p.floor(p.random(N/2))];
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    p.draw = () => {
        p.background("#fffbe6");
        
        let eventualNeighbors = possibleNeighbors(currentPoint, M, N);
        p.shuffle(eventualNeighbors, true);
            
        let neighbors = [[], []];
        for (let neigh of eventualNeighbors) {
            let projectedPath = [...path, currentPoint, neigh];
            let count = countDeadends(projectedPath, possibleNeighbors(neigh, M, N), M, N);
            if (!inArray(neigh, path) && !disjointed(projectedPath, M, N) && count < 2) {
                neighbors[count].push(neigh);
            }
        }
        neighbors = neighbors.flat(1);
            
        while (neighbors.length === 0 && path.length > 0) {
            let previous = path.pop();
            currentPoint = [previous[0], previous[1]];
            neighbors = previous[2];
        }
            
        if (neighbors.length > 0) {
            let nextPoint = neighbors.shift();
            path.push([...currentPoint, neighbors]);
            currentPoint = nextPoint;
        }
        
        let drawnPath = getDrawnPath(path, currentPoint);
        
        let margin = 50;
        let w = p.width - 2*margin;
        let h = p.height - 2*margin;
        
        let colors = ["#abcd5e", "#14976b", "#2b67af", "#62b6de", "#f589a3", "#ef562f", "#fc8405", "#f9d531"];
        
        for (let k = 0; k < drawnPath.length - 1; k++) {
            drawPathPortion(drawnPath, k, margin, margin, w, h, M, N, 
                          colors[k % colors.length], 0.2, 0.2, 0.1);
        }
        
        if (path.length === M*N-1) {
            p.noLoop();
        }
    };
};