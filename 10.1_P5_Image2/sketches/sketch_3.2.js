// sketch_n.js

export default function sketch1(p) {
    // By Roni Kaufman
    // https://ronikaufman.github.io

    let margin = 1;
    let N = 12;
    let u, gap;
    let palette = ["#F098F4", "#57D7F2", "#96D39B"];

    let rectangles = [];

    // Helper function to generate a random integer between a and b (exclusive)
    let randInt = (a, b) => Math.floor(p.random(a, b));

    // Function to check if two rectangles intersect
    function rectanglesIntersect(recta1, recta2) {
        return (
            ((recta1.i <= recta2.i && recta1.i + recta1.si > recta2.i) ||
                (recta2.i <= recta1.i && recta2.i + recta2.si > recta1.i)) &&
            ((recta1.j <= recta2.j && recta1.j + recta1.sj > recta2.j) ||
                (recta2.j <= recta1.j && recta2.j + recta2.sj > recta1.j))
        );
    }

    // Function to generate a new rectangle
    function generateRectangle() {
        let si = 1,
            sj = randInt(2, 4.5);
        if (p.random() < 0.5) [si, sj] = [sj, si];
        if (p.random() < 0.5) [si, sj] = [2, 2];

        let i = randInt(margin, N - margin - si + 1);
        let j = randInt(margin, N - margin - sj + 1);
        let recta = {
            i: i,
            j: j,
            si: si,
            sj: sj,
        };
        return recta;
    }

    // Function to check possible neighbors for Hamiltonian path
    function possibleNeighbors([i, j], m, n) {
        let possibilities = [];
        if (j < n - 1) possibilities.push([i, j + 1]);
        if (j > 0) possibilities.push([i, j - 1]);
        if (i < m - 1) possibilities.push([i + 1, j]);
        if (i > 0) possibilities.push([i - 1, j]);
        return possibilities;
    }

    // Function to check if a position is in an array
    function inArray([i, j], arr) {
        for (let e of arr) {
            if (e[0] === i && e[1] === j) return true;
        }
        return false;
    }

    // Function to check if the path is disjointed
    function disjointed(arr, m, n) {
        if (arr.length >= m * n) {
            return false;
        }

        // Choose initial point
        let pPoint;
        do {
            pPoint = [p.floor(p.random(m)), p.floor(p.random(n))];
        } while (inArray(pPoint, arr));

        // Traverse the m*n grid where arr was removed, through a DFS
        let discovered = [];
        let stack = [pPoint];
        while (stack.length > 0) {
            let current = stack.pop();
            if (!inArray(current, discovered)) {
                discovered.push(current);
                let neighbors = possibleNeighbors(current, m, n);
                for (let neigh of neighbors) {
                    if (!inArray(neigh, arr)) stack.push(neigh);
                }
            }
        }

        return discovered.length !== m * n - arr.length;
    }

    // Function to count deadends in the path
    function countDeadends(arr, ignoreMe, m, n) {
        let count = 0;
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                if (!inArray([i, j], arr) && !inArray([i, j], ignoreMe)) {
                    let eventualNeighbors = possibleNeighbors([i, j], m, n);
                    let neighbors = [];
                    for (let neigh of eventualNeighbors) {
                        if (!inArray(neigh, arr)) neighbors.push(neigh);
                    }
                    if (neighbors.length < 2) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    // Function to check for cursed corners
    function cursedCorners(arr, M, N) {
        let corner1 =
            !inArray([0, 0], arr) &&
            !inArray([1, 0], arr) &&
            !inArray([0, 1], arr) &&
            !inArray([1, 1], arr) &&
            !inArray([2, 0], arr) &&
            !inArray([0, 2], arr) &&
            inArray([2, 1], arr) &&
            inArray([1, 2], arr) &&
            inArray([2, 2], arr);
        let corner2 =
            !inArray([M - 1, 0], arr) &&
            !inArray([M - 2, 0], arr) &&
            !inArray([M - 1, 1], arr) &&
            !inArray([M - 2, 1], arr) &&
            !inArray([M - 3, 0], arr) &&
            !inArray([M - 1, 2], arr) &&
            inArray([M - 3, 1], arr) &&
            inArray([M - 2, 2], arr) &&
            inArray([M - 3, 2], arr);
        let corner3 =
            !inArray([M - 1, N - 1], arr) &&
            !inArray([M - 2, N - 1], arr) &&
            !inArray([M - 1, N - 2], arr) &&
            !inArray([M - 2, N - 2], arr) &&
            !inArray([M - 3, N - 1], arr) &&
            !inArray([M - 1, N - 3], arr) &&
            inArray([M - 3, N - 2], arr) &&
            inArray([M - 2, N - 3], arr) &&
            inArray([M - 3, N - 3], arr);
        let corner4 =
            !inArray([0, N - 1], arr) &&
            !inArray([1, N - 1], arr) &&
            !inArray([0, N - 2], arr) &&
            !inArray([1, N - 2], arr) &&
            !inArray([2, N - 1], arr) &&
            !inArray([0, N - 3], arr) &&
            inArray([2, N - 2], arr) &&
            inArray([1, N - 3], arr) &&
            inArray([2, N - 3], arr);

        return corner1 || corner2 || corner3 || corner4;
    }

    // Function to create the composition by packing rectangles
    function createComposition() {
        for (let i = 0; i < 2000; i++) {
            let newRecta = generateRectangle();
            let canAdd = true;
            for (let recta of rectangles) {
                if (rectanglesIntersect(newRecta, recta)) {
                    canAdd = false;
                    break;
                }
            }
            if (canAdd) {
                rectangles.push(newRecta);
            }
        }

        // Fill the gaps with 1x1 rectangles
        for (let i = margin; i < N - margin; i++) {
            for (let j = margin; j < N - margin; j++) {
                let newRecta = {
                    i: i,
                    j: j,
                    si: 1,
                    sj: 1,
                };
                let canAdd = true;
                for (let recta of rectangles) {
                    if (rectanglesIntersect(newRecta, recta)) {
                        canAdd = false;
                        break;
                    }
                }
                if (canAdd) {
                    rectangles.push(newRecta);
                }
            }
        }
    }

    // Function to get the direction between two points
    function getDirection(pA, pB) {
        if (pA[0] === pB[0]) {
            if (pA[1] > pB[1]) return "down";
            else return "up";
        } else {
            if (pA[0] > pB[0]) return "right";
            else return "left";
        }
    }

    // Function to draw the extremities of the path
    function drawExtremity(path, i, j, sx, sy, a) {
        let p0 = path[i];
        let p1 = path[j];
        let dir = getDirection(p0, p1);
        if (dir === "down")
            p.rect((p0[0] + a) * sx, p0[1] * sy, (1 - 2 * a) * sx, (1 - a) * sy);
        else if (dir === "up")
            p.rect((p0[0] + a) * sx, (p0[1] + a) * sy, (1 - 2 * a) * sx, (1 - a) * sy);
        else if (dir === "left")
            p.rect((p0[0] + a) * sx, (p0[1] + a) * sy, (1 - a) * sx, (1 - 2 * a) * sy);
        else
            p.rect(p0[0] * sx, (p0[1] + a) * sy, (1 - a) * sx, (1 - 2 * a) * sy);
    }

    // Function to draw the path within a rectangle
    function drawPath(path, x0, y0, w, h, m, n, backCol, lineCol, a) {
        p.push();
        p.translate(x0, y0);

        let sx = w / m,
            sy = h / n;

        p.fill(lineCol);
        drawExtremity(path, 0, 1, sx, sy, a);
        drawExtremity(path, path.length - 1, path.length - 2, sx, sy, a);

        for (let k = 0; k < path.length - 2; k++) {
            let p0 = path[k];
            let p1 = path[k + 1];
            let p2 = path[k + 2];
            let dir01 = getDirection(p0, p1);
            let dir12 = getDirection(p1, p2);

            p.fill(lineCol);
            if (dir01 === dir12) {
                if (dir01 === "down" || dir01 === "up") {
                    p.rect((p1[0] + a) * sx, p1[1] * sy, (1 - 2 * a) * sx, sy);
                } else {
                    p.rect(p1[0] * sx, (p1[1] + a) * sy, sx, (1 - 2 * a) * sy);
                }
            } else {
                if (
                    (dir01 === "up" && dir12 === "right") ||
                    (dir01 === "left" && dir12 === "down")
                ) {
                    p.arc(
                        p1[0] * sx,
                        p1[1] * sy,
                        (2 - 2 * a) * sx,
                        (2 - 2 * a) * sy,
                        0,
                        p.PI / 2
                    );
                    p.fill('white');
                    p.arc(
                        p1[0] * sx,
                        p1[1] * sy,
                        2 * a * sx,
                        2 * a * sy,
                        0,
                        p.PI / 2
                    );
                } else if (
                    (dir01 === "right" && dir12 === "down") ||
                    (dir01 === "up" && dir12 === "left")
                ) {
                    p.arc(
                        (p1[0] + 1) * sx,
                        p1[1] * sy,
                        (2 - 2 * a) * sx,
                        (2 - 2 * a) * sy,
                        p.PI / 2,
                        p.PI
                    );
                    p.fill('white');
                    p.arc(
                        (p1[0] + 1) * sx,
                        p1[1] * sy,
                        2 * a * sx,
                        2 * a * sy,
                        p.PI / 2,
                        p.PI
                    );
                } else if (
                    (dir01 === "down" && dir12 === "left") ||
                    (dir01 === "right" && dir12 === "up")
                ) {
                    p.arc(
                        (p1[0] + 1) * sx,
                        (p1[1] + 1) * sy,
                        (2 - 2 * a) * sx,
                        (2 - 2 * a) * sy,
                        p.PI,
                        (3 * p.PI) / 2
                    );
                    p.fill('white');
                    p.arc(
                        (p1[0] + 1) * sx,
                        (p1[1] + 1) * sy,
                        2 * a * sx,
                        2 * a * sy,
                        p.PI,
                        (3 * p.PI) / 2
                    );
                } else {
                    p.arc(
                        p1[0] * sx,
                        (p1[1] + 1) * sy,
                        (2 - 2 * a) * sx,
                        (2 - 2 * a) * sy,
                        (3 * p.PI) / 2,
                        p.TAU
                    );
                    p.fill('white');
                    p.arc(
                        p1[0] * sx,
                        (p1[1] + 1) * sy,
                        2 * a * sx,
                        2 * a * sy,
                        (3 * p.PI) / 2,
                        p.TAU
                    );
                }
            }
        }

        p.pop();
    }

    // Function to create the composition and initialize rectangles
    function initializeRectangles() {
        createComposition();

        let i = 0;
        if (p.random() < 1 / 10) palette = [250];
        p.shuffle(rectangles, true);
        for (let recta of rectangles) {
            recta.m = (recta.si * u) / gap - 1;
            recta.n = (recta.sj * u) / gap - 1;
            recta.p = [
                2 * randInt(0, recta.m / 2),
                2 * randInt(0, recta.n / 2),
            ];
            recta.path = [];
            recta.done = false;
            recta.backCol = 5;
            recta.lineCol = palette[i++ % palette.length];
        }
    }

    // p5.js setup function
    p.setup = () => {
        p.createCanvas(600, 600, p.WEBGL);
        u = p.width / N;
        gap = u / 4;
        p.noStroke();
        initializeRectangles();
    };

    // p5.js windowResized function
    p.windowResized = () => {
        p.resizeCanvas(600, 600); // Keeping the original size
    };

    // Function to get possible neighbors excluding the path
    function getValidNeighbors(recta) {
        let eventualNeighbors = p.shuffle(
            possibleNeighbors(recta.p, recta.m, recta.n)
        );

        let neighbors = [[], []];
        for (let neigh of eventualNeighbors) {
            let projectedPath = [...recta.path, recta.p, neigh];
            let count = countDeadends(
                projectedPath,
                possibleNeighbors(neigh, recta.m, recta.n),
                recta.m,
                recta.n
            );
            if (
                !inArray(neigh, recta.path) &&
                !disjointed(projectedPath, recta.m, recta.n) &&
                count < 2 &&
                !cursedCorners(projectedPath, recta.m, recta.n)
            ) {
                neighbors[count].push(neigh);
            }
        }
        return neighbors.flat();
    }

    // p5.js draw function
    p.draw = () => {
        p.background(255);
        p.translate(-p.width / 2, -p.height / 2, 0);

        for (let recta of rectangles) {
            if (!recta.done) {
                let neighbors = getValidNeighbors(recta);

                while (neighbors.length === 0) {
                    // Backtracking
                    let previous = recta.path.pop();
                    if (previous) {
                        recta.p = [previous[0], previous[1]];
                        neighbors = previous[2];
                    } else {
                        break; // No more path to backtrack
                    }
                }

                if (neighbors.length > 0) {
                    let pNext = neighbors.shift();
                    recta.path.push([...recta.p, neighbors]);
                    recta.p = pNext;

                    if (recta.path.length === recta.m * recta.n - 1) {
                        recta.done = true;
                    }
                }
            }

            if (recta.si === 1 && recta.sj === 1) {
                // No additional action for 1x1 rectangles
            }

            p.fill('white');
            p.rect(
                recta.i * u + gap / 4,
                recta.j * u + gap / 4,
                (recta.m + 0.5) * gap,
                (recta.n + 0.5) * gap
            );
            drawPath(
                [...recta.path, recta.p],
                recta.i * u + gap / 2,
                recta.j * u + gap / 2,
                recta.m * gap,
                recta.n * gap,
                recta.m,
                recta.n,
                recta.backCol,
                recta.lineCol,
                1 / 6
            );
        }
    };
}
