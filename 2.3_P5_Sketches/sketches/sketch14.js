// sketches/sketchTemplate.js

export default function(p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    // Example image path (not actually used by this wave sketch, but left here for reference)
    const IMAGE_PATH = 'images/example.jpg'; 

    // Example color palettes for light and dark modes
    // (Kept the light palette here as-is, but you can remove it if you only use dark mode.)
    const COLOR_PALETTE_LIGHT = {
        background: '#ffffff',
        elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };

    // Dark palette: background = #003323, line color = #4CB944
    const COLOR_PALETTE_DARK = {
        background: '#003323',
        elements: ['#4CB944'] // single color in the array
    };

    // Adjust these parameters to control the wave mesh
    const NUM_ROWS = 70;         // How many horizontal lines
    const NUM_COLS = 200;        // How many points in each line
    const WAVE_HEIGHT = 100;     // Vertical displacement amplitude of the waves
    const NOISE_SCALE = 0.01;    // Perlin noise scale factor (smaller = smoother waves)
    const NOISE_SPEED = 0.005;   // Rate at which waves "move" over time
    const LINE_WEIGHT = 1;

    // -------------------------------
    // 2. Global Variables
    // -------------------------------

    let img;               // Image object (not used here, but loaded for reference)
    let currentPalette;    // Current color palette based on mode
    let backgroundColor;   // Current background color

    // We'll track a global time offset for noise animation
    let noiseOffset = 0;

    // -------------------------------
    // 3. p5.js Lifecycle Methods
    // -------------------------------

    /**
     * Preload assets before the sketch starts.
     */
    p.preload = function() {
        // We load an image just to demonstrate how preload works.
        // This image is *not* used by the wave mesh code below.
        img = p.loadImage(
            IMAGE_PATH,
            () => console.log('Image loaded (not used in wave sketch).'),
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

        // Initialize color palette and background color
        setInitialMode();

        // Set initial background
        p.background(backgroundColor);

        // Set stroke properties
        p.strokeWeight(LINE_WEIGHT);
        p.noFill();
    };

    /**
     * The main draw loop.
     */
    p.draw = function() {
        // Clear the background each frame so we see a “steady” wave
        p.background(backgroundColor);

        // Draw the noise-based wave mesh
        drawNoiseWaves();

        // Increment the time offset so waves move over time
        noiseOffset += NOISE_SPEED;
    };

    /**
     * Handle window resizing to maintain responsiveness.
     */
    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);

        // Redraw background (otherwise you’ll see artifacts after resize)
        p.background(backgroundColor);
    };

    // -------------------------------
    // 4. Mode Handling Methods
    // -------------------------------

    /**
     * Initialize the mode based on the current state of the HTML body.
     */
    function setInitialMode() {
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            currentPalette = COLOR_PALETTE_DARK;
            backgroundColor = COLOR_PALETTE_DARK.background;
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            backgroundColor = COLOR_PALETTE_LIGHT.background;
        }
    }

    /**
     * Method to set the current mode (light or dark).
     * This method will be called externally from main.js when toggling modes.
     * @param {boolean} darkMode - True for dark mode, false for light mode.
     */
    p.setMode = function(darkMode) {
        if (darkMode) {
            currentPalette = COLOR_PALETTE_DARK;
            backgroundColor = COLOR_PALETTE_DARK.background;
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            backgroundColor = COLOR_PALETTE_LIGHT.background;
        }

        // Update visual elements based on the new palette
        updateVisualElements();

        // Update the background
        p.background(backgroundColor);
    };

    // -------------------------------
    // 5. Wave Mesh System
    // -------------------------------

    /**
     * Draw a series of horizontal lines using Perlin noise
     * to create a flowing, mesh-like wave pattern.
     */
    function drawNoiseWaves() {
        // We append '22' to the hex color for a soft transparency
        // e.g. #4CB94422 ~ 13% opacity.
        p.stroke(randomColorFromPalette() + '80');

        const rowSpacing = p.height / (NUM_ROWS - 1);
        const colSpacing = p.width / (NUM_COLS - 1);

        // For each "row":
        for (let row = 0; row < NUM_ROWS; row++) {
            p.beginShape();
            for (let col = 0; col < NUM_COLS; col++) {
                // Compute x, y positions
                const x = col * colSpacing;
                const baseY = row * rowSpacing;

                // Sample Perlin noise for wave displacement
                const noiseVal = p.noise(col * NOISE_SCALE, row * 0.1, noiseOffset);
                const y = baseY + p.map(noiseVal, 0, 1, -WAVE_HEIGHT, WAVE_HEIGHT);

                p.vertex(x, y);
            }
            p.endShape();
        }
    }

    /**
     * Update visual elements when the mode changes.
     * Customize this function based on your sketch's requirements.
     */
    function updateVisualElements() {
        // For this wave mesh, we only need to recolor if desired.
        // The palette is already set, so no extra logic is necessary.
    }

    /**
     * Select a random color from the current palette.
     * @returns {string} - A color string from the palette (e.g. "#4CB944").
     */
    function randomColorFromPalette() {
        const palette = currentPalette.elements;
        return palette[p.floor(p.random(palette.length))];
    }

    // -------------------------------
    // 6. Additional Helper Methods
    // -------------------------------
}
