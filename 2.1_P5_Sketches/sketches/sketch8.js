// sketches/sketch6.js

export default function(p) {
    /**************************************************
     * Interactive Contour Lines Sketch
     * 
     * Features:
     * 1. White contour lines overlaid on the display image.
     * 2. Detailed configuration parameters with comments for easy tweaking.
     * 3. Starts in dark mode.
     * 4. Uses a high-contrast image for contour detection while displaying the original image.
     * 5. Displays images at the highest available resolution.
     * 
     **************************************************/

    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    // Image Paths
    const DISPLAY_IMAGE_PATH = 'images/1.jpg';             // Path to the display image
    const FLOW_FIELD_IMAGE_PATH = 'images/1contrast.jpg';  // Path to the high-contrast image for contour detection

    // Image Resizing
    const RESIZE_DISPLAY_WIDTH = 0;        // Width to resize the display image (0 maintains original width)
    const RESIZE_DISPLAY_HEIGHT = 0;       // Height to resize the display image (0 maintains original height)
    const RESIZE_FLOW_WIDTH = 0;           // Width to resize the flow field image (0 maintains original width)

    // Edge Detection Configuration
    const EDGE_THRESHOLD = 100;            // Threshold for edge detection (adjust based on image contrast)

    // Line Configuration
    const LINE_COLOR = '#FFFFFF';          // Color of the contour lines (white)
    const LINE_WEIGHT = 1;                 // Stroke weight for lines

    // Background Configuration
    const INITIAL_BACKGROUND_COLOR = '#121212'; // Dark background color

    // -------------------------------
    // 2. Global Variables
    // -------------------------------

    let displayImg;          // Image object for display
    let flowFieldImg;        // Image object for flow field calculations

    let edgePixels = [];     // Array to store edge pixels

    let backgroundColor;    // Current background color

    // -------------------------------
    // 3. p5.js Lifecycle Methods
    // -------------------------------

    /**
     * Preload assets before the sketch starts.
     */
    p.preload = function() {
        // Load the display image
        displayImg = p.loadImage(DISPLAY_IMAGE_PATH, () => {
            // Successfully loaded display image
            if (RESIZE_DISPLAY_WIDTH > 0 || RESIZE_DISPLAY_HEIGHT > 0) {
                displayImg.resize(RESIZE_DISPLAY_WIDTH, RESIZE_DISPLAY_HEIGHT);
            }
        }, () => {
            console.error(`Failed to load display image at path: ${DISPLAY_IMAGE_PATH}`);
        });

        // Load the high-contrast flow field image
        flowFieldImg = p.loadImage(FLOW_FIELD_IMAGE_PATH, () => {
            // Successfully loaded flow field image
            if (RESIZE_FLOW_WIDTH > 0) {
                flowFieldImg.resize(RESIZE_FLOW_WIDTH, 0); // Resize width; height auto
            }
        }, () => {
            console.error(`Failed to load flow field image at path: ${FLOW_FIELD_IMAGE_PATH}`);
        });
    };

    /**
     * Setup the sketch environment.
     */
    p.setup = function() {
        // Create the canvas with display image's dimensions
        // Since preload is asynchronous, ensure images are loaded
        p.createCanvas(800, 600); // Temporary size

        const checkImagesLoaded = setInterval(() => {
            if (displayImg && flowFieldImg) {
                clearInterval(checkImagesLoaded);

                // Resize flow field image to match display image size if necessary
                if (flowFieldImg.width !== displayImg.width || flowFieldImg.height !== displayImg.height) {
                    flowFieldImg.resize(displayImg.width, displayImg.height);
                }

                // Resize display image if specified
                if (RESIZE_DISPLAY_WIDTH > 0 || RESIZE_DISPLAY_HEIGHT > 0) {
                    displayImg.resize(RESIZE_DISPLAY_WIDTH, RESIZE_DISPLAY_HEIGHT);
                    p.resizeCanvas(displayImg.width, displayImg.height);
                }

                // Initialize color palette and background color
                setInitialMode();

                // Draw the display image on the canvas
                p.image(displayImg, 0, 0, p.width, p.height);

                // Perform edge detection on the flow field image
                detectEdges();

                // Overlay the contour lines on the display image
                displayEdges();

                // Disable continuous looping since the image and contours are static
                p.noLoop();
            }
        }, 100); // Check every 100ms
    };

    /**
     * The main draw loop.
     * Not used in this static implementation.
     */
    p.draw = function() {
        // No drawing needed here since everything is drawn in setup()
    };

    /**
     * Handle window resizing to maintain responsiveness.
     */
    p.windowResized = function() {
        // Optional: Implement responsiveness if needed
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
            backgroundColor = INITIAL_BACKGROUND_COLOR; // Dark background color
        } else {
            backgroundColor = '#FFFFFF'; // Light background color
        }

        // Set the initial background color
        p.background(backgroundColor);
    }

    /**
     * Method to set the current mode (light or dark).
     * This method will be called externally from main.js when toggling modes.
     * @param {boolean} darkMode - True for dark mode, false for light mode.
     */
    p.setMode = function(darkMode) {
        if (darkMode) {
            backgroundColor = INITIAL_BACKGROUND_COLOR;
        } else {
            backgroundColor = '#FFFFFF';
        }

        // Update the background color
        p.background(backgroundColor);

        // Redraw the display image
        p.image(displayImg, 0, 0, p.width, p.height);

        // Redraw the contour lines
        displayEdges();
    };

    // -------------------------------
    // 5. Edge Detection Methods
    // -------------------------------

    /**
     * Perform edge detection using the Sobel operator on the flow field image.
     */
    function detectEdges() {
        // Create a grayscale version of the flow field image
        let grayImg = flowFieldImg.get();
        grayImg.filter('GRAY');
        grayImg.loadPixels();

        // Define Sobel operator kernels
        let kernelX = [
            -1, 0, 1,
            -2, 0, 2,
            -1, 0, 1
        ];

        let kernelY = [
            -1, -2, -1,
             0,  0,  0,
             1,  2,  1
        ];

        // Iterate over each pixel (excluding the border pixels)
        for (let y = 1; y < grayImg.height - 1; y++) {
            for (let x = 1; x < grayImg.width - 1; x++) {
                let sumX = 0;
                let sumY = 0;

                // Apply the Sobel kernels to the neighborhood
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        let pixel = grayImg.get(x + kx, y + ky)[0]; // Grayscale: R=G=B
                        sumX += pixel * kernelX[(ky + 1) * 3 + (kx + 1)];
                        sumY += pixel * kernelY[(ky + 1) * 3 + (kx + 1)];
                    }
                }

                // Calculate the gradient magnitude
                let magnitude = p.sqrt(sumX * sumX + sumY * sumY);

                // If the magnitude exceeds the threshold, mark it as an edge
                if (magnitude > EDGE_THRESHOLD) {
                    edgePixels.push({x: x, y: y});
                }
            }
        }

        console.log(`Detected ${edgePixels.length} edge pixels.`);
    }

    /**
     * Display the detected edges by drawing white points over the display image.
     */
    function displayEdges() {
        p.stroke(LINE_COLOR);
        p.strokeWeight(LINE_WEIGHT);
        edgePixels.forEach(pixel => {
            p.point(pixel.x, pixel.y);
        });
    }
}
