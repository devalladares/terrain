// sketch_n.js
export default function sketch13(p) {
    // ----------------------
    // Configuration Constants
    // ----------------------
    const N = 24;                  // Base number of cells (height)
    const N_FRAMES = 500;          // Animation loop length (frames)
    const FRAME_RATE = 5;          // Frames per second

    const margin = 1;              // Margin in cell units
    const gapFactor = 0.015;         // Gap between squares as a fraction of cell size

    const palette = ["#F098F4", "#fff", "#96D39B", "#57D7F2"]; // Updated white color to full opacity

    // Noise/animation parameters
    const offset = 10;             // Noise offset
    const rad = 3;                 // Radius amplitude for noise
    const sc = 1 / 100;            // Noise scale

    // -----------------------
    // Internal Variables
    // -----------------------
    let uX, uY;        // Size of each cell in pixels (width and height)
    let gapX, gapY;    // Gap between squares in pixels (width and height)
    let N_COLS, N_ROWS; // Number of columns and rows based on aspect ratio

    // -----------------------
    // Setup Function
    // -----------------------
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
        p.stroke("#2c2060");          // Stroke color
        p.strokeWeight(0.8);           // Stroke weight

        // Set rectangle mode to corner (default)
        p.rectMode(p.CORNER);
    };

    // -----------------------
    // Window Resized Function
    // -----------------------
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

    // -----------------------
    // Draw Function
    // -----------------------
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
    // Function to Draw a Single Grid Cell
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

        // Draw the rectangle with stroke
        p.rect(x, y, sX, sY);
    };

    // -----------------------
    // Optional: Mouse Pressed Function
    // -----------------------
    p.mousePressed = () => {
        // Example: Rotate the palette colors
        // palette.push(palette.shift());
    };

    // -----------------------
    // Optional: Key Pressed Function
    // -----------------------
    p.keyPressed = () => {
        // Example: Toggle a feature or change parameters
    };
}
