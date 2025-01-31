// sketch_n.js
export default function sketch13(p) {
    // ----------------------
    // Configuration Constants
    // ----------------------
    const N = 20;                  // Base number of cells (height)
    const N_FRAMES = 500;          // Animation loop length (frames)
    const FRAME_RATE = 30;         // Frames per second

    const margin = 2;              // Margin in cell units
    const gapFactor = 0.05;         // Gap between squares as a fraction of cell size

    const palette = ["#003323", "white", "#96D39B", "#57D7F2", "#F098F4"];

    // Noise/animation parameters
    const offset = 10;             // Noise offset
    const rad = 1;                 // Radius amplitude for noise
    const sc = 1 / 50;             // Noise scale

    // -----------------------
    // Internal Variables
    // -----------------------
    let uX, uY;        // Size of each cell in pixels (width and height)
    let gapX, gapY;    // Gap between squares in pixels (width and height)
    let N_COLS, N_ROWS; // Number of columns and rows based on aspect ratio

    p.setup = () => {
        // Select the container
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        // Create canvas matching the container's dimensions
        p.createCanvas(containerWidth, containerHeight).parent(container);
        p.frameRate(FRAME_RATE);

        // Calculate number of columns based on aspect ratio to maintain square cells
        N_ROWS = N;
        N_COLS = Math.floor((containerWidth / containerHeight) * N);

        // Calculate cell size and gaps
        uX = containerWidth / N_COLS;
        uY = containerHeight / N_ROWS;
        gapX = uX * gapFactor;
        gapY = uY * gapFactor;

        // Set stroke properties
        p.stroke("#2c2060");
        p.strokeWeight(1);

        // Optional: Set rectangle mode to corner (default)
        p.rectMode(p.CORNER);
    };

    p.windowResized = () => {
        // Select the container again in case it has resized
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        // Resize the canvas to match the new container size
        p.resizeCanvas(containerWidth, containerHeight);

        // Recalculate number of columns based on new aspect ratio
        N_ROWS = N;
        N_COLS = Math.floor((containerWidth / containerHeight) * N);

        // Recalculate cell sizes and gaps
        uX = containerWidth / N_COLS;
        uY = containerHeight / N_ROWS;
        gapX = uX * gapFactor;
        gapY = uY * gapFactor;
    };

    p.draw = () => {
        p.background("white"); // Set background color

        // Calculate theta for animation
        let theta = p.TWO_PI * (p.frameCount % N_FRAMES) / N_FRAMES;

        // Iterate over the grid excluding margins
        for (let j = margin; j < N_ROWS - margin; j++) {
            for (let i = margin; i < N_COLS - margin; i++) {
                drawCell(i, j, theta);
            }
        }
    };

    // ---------------------------------------
    // Function to draw a single grid cell
    // ---------------------------------------
    const drawCell = (i, j, theta) => {
        // Convert grid coordinates to pixel coordinates
        let x = i * uX + gapX / 2;
        let y = j * uY + gapY / 2;
        let sX = uX - gapX; // Width of the rectangle
        let sY = uY - gapY; // Height of the rectangle

        // Use Perlin noise to determine color index
        let nVal = p.noise(
            offset + rad * p.cos(x * sc + theta),
            offset + rad * p.sin(x * sc + theta),
            y * sc
        );

        // Select color from palette
        let idx = p.floor(nVal * palette.length) % palette.length;
        p.fill(palette[idx]);

        // Draw the rectangle
        p.noStroke(); // Optional: Remove stroke for cleaner look
        p.rect(x, y, sX, sY);
    };

    // Optional: Handle mouse press events
    p.mousePressed = () => {
        // Example: Rotate the palette colors
        // palette.push(palette.shift());
    };

    // Optional: Handle key press events
    p.keyPressed = () => {
        // Example: Toggle a feature or change parameters
    };
}
