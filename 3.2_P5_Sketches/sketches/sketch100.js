// sketches/sketchTemplate.js

export default function(p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    // Updated image path
    const IMAGE_PATH = 'images/4.png'; 

    // -------------------------------
    // 2. Global Variables
    // -------------------------------

    let img; // Image object

    // -------------------------------
    // 3. p5.js Lifecycle Methods
    // -------------------------------

    /**
     * Preload assets before the sketch starts.
     */
    p.preload = function() {
        // Load the background image
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Image loaded as background.'),
            () => console.error(`Failed to load image at path: ${IMAGE_PATH}`)
        );
    };

    /**
     * Setup the sketch environment.
     */
    p.setup = function() {
        // Select the sketch container from the HTML
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        // Create a canvas that matches the container's size
        p.createCanvas(containerWidth, containerHeight).parent(container);
    };

    /**
     * The main draw loop.
     */
    p.draw = function() {
        // Draw the background image covering the entire canvas
        p.image(img, 0, 0, p.width, p.height);
    };

    /**
     * Handle window resizing to maintain responsiveness.
     */
    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);

        // Redraw background image after resize
        p.image(img, 0, 0, p.width, p.height);
    };
}