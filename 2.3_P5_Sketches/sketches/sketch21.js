// sketches/sketchTemplate.js

export default function(p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    // Updated image path
    const IMAGE_PATH = 'images/1.jpg'; 

    // Example color palettes for light and dark modes
    const COLOR_PALETTE_LIGHT = {
        background: '#B8E6D8',
        elements: ['#003323']
    };

    const COLOR_PALETTE_DARK = {
        background: '#FFFFFF',
        elements: ['#FFFFFF'] // Corrected color code from '#white' to '#FFFFFF'
    };

    // Stroke color variables
    const STROKE_COLOR_LIGHT = COLOR_PALETTE_LIGHT.elements; // Using the elements array for light mode
    const STROKE_COLOR_DARK = ['#FFFFFF']; // Single color for dark mode

    // Displacement Mapping Parameters
    const MIN_WAVE_HEIGHT = 150;   // Minimum wave amplitude
    const MAX_WAVE_HEIGHT = 150;  // Maximum wave amplitude

    // Adjust these parameters to control the wave mesh
    const NUM_ROWS = 50;         // How many horizontal lines
    const NUM_COLS = 200;        // How many points in each line
    const WAVE_HEIGHT = 100;     // Vertical displacement amplitude of the waves (deprecated, replaced by dynamic mapping)
    const NOISE_SCALE = 0.05;    // Perlin noise scale factor (smaller = smoother waves)
    const NOISE_SPEED = 0.002;   // Rate at which waves "move" over time
    const LINE_WEIGHT = 1;

    // -------------------------------
    // 2. Global Variables
    // -------------------------------

    let img;               // Image object
    let currentPalette;    // Current color palette based on mode
    let strokeColor;       // Current stroke color

    // We'll track a global time offset for noise animation
    let noiseOffset = 0;

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
            () => {
                console.log('Image loaded as background.');
                img.loadPixels(); // Ensure pixel data is loaded
            },
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

        // Initialize color palette and stroke color
        setInitialMode();

        // Set stroke properties
        p.strokeWeight(LINE_WEIGHT);
        p.noFill();

        // Ensure the image is resized to fit the canvas
        if (img) {
            img.resize(p.width, p.height);
            img.loadPixels(); // Reload pixel data after resizing
        }
    };

    /**
     * The main draw loop.
     */
    p.draw = function() {
        // Draw the background image covering the entire canvas
        p.image(img, 0, 0, p.width, p.height);

        // Draw the noise-based wave mesh with displacement mapping
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

        // Resize and reload the image to fit the new canvas size
        if (img) {
            img.resize(p.width, p.height);
            img.loadPixels();
        }

        // Redraw background image after resize
        p.image(img, 0, 0, p.width, p.height);
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
            strokeColor = "#ffffff";
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            strokeColor = getRandomLightColor();
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
            strokeColor = "#ffffff";
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            strokeColor = getRandomLightColor();
        }

        // Update visual elements based on the new palette
        updateVisualElements();
    };

    // -------------------------------
    // 5. Wave Mesh System with Displacement Mapping
    // -------------------------------

    /**
     * Draw a series of horizontal lines using Perlin noise
     * to create a flowing, mesh-like wave pattern that responds to image brightness.
     */
    function drawNoiseWaves() {
        // Ensure the image pixels are loaded
        if (img && img.pixels.length > 0) {
            img.loadPixels(); // Update pixel data in case of any changes
        }

        const rowSpacing = p.height / (NUM_ROWS - 1);
        const colSpacing = p.width / (NUM_COLS - 1);

        // For each "row":
        for (let row = 0; row < NUM_ROWS; row++) {
            p.beginShape();
            for (let col = 0; col < NUM_COLS; col++) {
                // Compute x, y positions
                const x = col * colSpacing;
                const baseY = row * rowSpacing;

                // Map x and baseY to image coordinates
                const imgX = p.floor(p.map(x, 0, p.width, 0, img.width));
                const imgY = p.floor(p.map(baseY, 0, p.height, 0, img.height));

                // Initialize brightness value
                let brightnessVal = 0.5; // Default brightness (mid-level)

                // Get brightness from image if within bounds
                if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                    const index = (imgY * img.width + imgX) * 4;
                    if (index >= 0 && index + 2 < img.pixels.length) {
                        const r = img.pixels[index];
                        const g = img.pixels[index + 1];
                        const b = img.pixels[index + 2];
                        const colColor = p.color(r, g, b);
                        brightnessVal = p.brightness(colColor) / 100; // Normalize between 0 and 1
                    }
                }

                // Map brightness to wave height amplitude
                const currentWaveHeight = p.map(brightnessVal, 0, 1, MIN_WAVE_HEIGHT, MAX_WAVE_HEIGHT);

                // Sample Perlin noise for wave displacement
                const noiseVal = p.noise(col * NOISE_SCALE, row * 0.1, noiseOffset);
                const y = baseY + p.map(noiseVal, 0, 1, -currentWaveHeight, currentWaveHeight);

                // Optional: Adjust stroke weight or other properties based on brightness
                // For example, making lines thicker in brighter areas
                // p.strokeWeight(p.map(brightnessVal, 0, 1, 0.2, 1));

                // Get color from image for the stroke
                let c = COLOR_PALETTE_LIGHT.elements[0]; // Default color
                if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                    const index = (imgY * img.width + imgX) * 4;
                    if (index >= 0 && index + 2 < img.pixels.length) {
                        const r = img.pixels[index];
                        const g = img.pixels[index + 1];
                        const b = img.pixels[index + 2];
                        c = p.color(r, g, b);
                    }
                }

                p.stroke(c); // Use the sampled color
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

    /**
     * Select a random color from the light palette elements.
     * @returns {string} - A color string from the light palette.
     */
    function getRandomLightColor() {
        return COLOR_PALETTE_LIGHT.elements[p.floor(p.random(COLOR_PALETTE_LIGHT.elements.length))];
    }

    // -------------------------------
    // 6. Additional Helper Methods
    // -------------------------------
}
