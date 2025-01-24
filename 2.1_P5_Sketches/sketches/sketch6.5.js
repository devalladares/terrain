// sketches/sketchFluidLines3D.js

export default function(p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    const COLOR_PALETTE_LIGHT = {
        background: '#ffffff',
        elements: ['#003323', '#96D39B', '#57D7F2', '#F098F4']
    };

    const COLOR_PALETTE_DARK = {
        background: '#121212',
        elements: ['#A1C181', '#4CB944', '#2E86AB', '#E94E77']
    };

    // 2. Parameters Object for GUI
    const params = {
        numLines: 10, // Increased for more contours
        pointsPerLine: 200,
        maxAmplitude: 50,
        noiseSpeed: 0.005,
        strokeWeight: 2,
        backgroundColor: '#ffffff',
        // Add more parameters as needed
    };

    // -------------------------------
    // 3. Global Variables
    // -------------------------------
    let lines = [];
    let noiseOffsets = [];
    let lineColors = [];
    let currentPalette;
    let backgroundColor;
    let zoom = 1;
    let gui; // dat.GUI instance

    // Declare variables for dynamic parameters
    let NUM_LINES = params.numLines;
    let POINTS_PER_LINE = params.pointsPerLine;
    let MAX_AMPLITUDE = params.maxAmplitude;
    let NOISE_SPEED = params.noiseSpeed;

    // -------------------------------
    // 4. p5.js Lifecycle Methods
    // -------------------------------

    p.preload = function() {
        // Image is not needed for 3D contour lines
    };

    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        // Create and attach WEBGL canvas
        p.createCanvas(containerWidth, containerHeight, p.WEBGL).parent(container);

        // Set perspective
        let fov = 60 * (Math.PI / 180);
        let cameraZ = (containerHeight / 2.0) / p.tan(fov / 2.0);
        p.perspective(fov, containerWidth / containerHeight, cameraZ / 10.0, cameraZ * 10.0);

        // Set mode based on body class
        setInitialMode();

        // Initialize our lines
        initializeLines();

        // Set stroke weight from params
        p.strokeWeight(params.strokeWeight);

        p.noFill();  // We’ll be drawing stroked lines

        // Initialize dat.GUI
        setupGUI();

        // Listen to scroll events for zoom
        window.addEventListener('wheel', function(event) {
            zoom += event.deltaY * -0.001;
            zoom = p.constrain(zoom, 0.5, 3);
        });
    };

    p.draw = function() {
        // Clear with background color
        p.background(backgroundColor);
        
        // Set up lighting
        p.ambientLight(100);
        p.pointLight(255, 255, 255, 0, 0, 500);
        
        p.push();
        p.scale(zoom);
        
        // Camera rotation based on mouse
        let rotX = p.map(p.mouseY, 0, p.height, -0.5, 0.5);
        let rotY = p.map(p.mouseX, 0, p.width, -0.5, 0.5);
        
        p.rotateX(rotX);
        p.rotateY(rotY);
        
        // Draw the lines
        drawFluidLines();
        
        p.pop();
    };

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);
        
        // Update perspective after resize
        let fov = 60 * (Math.PI / 180);
        let cameraZ = (containerHeight / 2.0) / p.tan(fov / 2.0);
        p.perspective(fov, containerWidth / containerHeight, cameraZ / 10.0, cameraZ * 10.0);
        
        p.background(backgroundColor);
    };

    // -------------------------------
    // 5. Mode Handling Methods
    // -------------------------------
    function setInitialMode() {
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            currentPalette = COLOR_PALETTE_DARK;
            backgroundColor = COLOR_PALETTE_DARK.background;
            params.backgroundColor = COLOR_PALETTE_DARK.background; // Sync with GUI
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            backgroundColor = COLOR_PALETTE_LIGHT.background;
            params.backgroundColor = COLOR_PALETTE_LIGHT.background; // Sync with GUI
        }
    }

    p.setMode = function(darkMode) {
        if (darkMode) {
            currentPalette = COLOR_PALETTE_DARK;
            backgroundColor = COLOR_PALETTE_DARK.background;
            params.backgroundColor = COLOR_PALETTE_DARK.background; // Sync with GUI
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            backgroundColor = COLOR_PALETTE_LIGHT.background;
            params.backgroundColor = COLOR_PALETTE_LIGHT.background; // Sync with GUI
        }
        updateLineColors();
        p.background(backgroundColor);
    };

    // -------------------------------
    // 6. Fluid Lines System
    // -------------------------------

    function initializeLines() {
        lines = [];
        noiseOffsets = [];
        lineColors = [];

        // Update variables based on params
        NUM_LINES = params.numLines;
        POINTS_PER_LINE = params.pointsPerLine;
        MAX_AMPLITUDE = params.maxAmplitude;
        NOISE_SPEED = params.noiseSpeed;

        const centerX = 0; // Center in WEBGL is (0,0,0)
        const centerY = 0;

        // Define maximum radius based on canvas size
        const maxRadius = Math.min(p.width, p.height) / 2 - 50; // Leave some padding

        // Define radius step based on number of lines
        const radiusStep = maxRadius / NUM_LINES;

        for (let i = 0; i < NUM_LINES; i++) {
            const linePoints = [];
            const radius = maxRadius - i * radiusStep; // Decreasing radius for concentric circles

            for (let j = 0; j < POINTS_PER_LINE; j++) {
                const angle = p.map(j, 0, POINTS_PER_LINE, 0, p.TWO_PI);
                const x = radius * p.cos(angle);
                const y = radius * p.sin(angle);
                const z = 0; // Initial z-position

                linePoints.push({ x, y, z });
            }

            lines.push(linePoints);
            noiseOffsets.push(p.random(10000));
            lineColors.push(p.color(randomColorFromPalette()));
        }
    }

    function updateLineColors() {
        for (let i = 0; i < NUM_LINES; i++) {
            lineColors[i] = p.color(randomColorFromPalette());
        }
    }

    function drawFluidLines() {
        for (let i = 0; i < NUM_LINES; i++) {
            // Calculate zOffset based on noise
            let totalZOffset = 0;
            p.beginShape(p.CLOSE); // Corrected to p.CLOSE

            for (let j = 0; j < POINTS_PER_LINE; j++) {
                const pt = lines[i][j];
                const noiseVal = p.noise(
                    noiseOffsets[i] + j * 0.1 + p.frameCount * NOISE_SPEED + i * 0.3
                );
                const zOffset = p.map(noiseVal, 0, 1, -MAX_AMPLITUDE, MAX_AMPLITUDE);
                totalZOffset += zOffset;

                p.vertex(pt.x, pt.y, zOffset);
            }

            p.endShape(p.CLOSE); // Corrected to p.CLOSE

            // Optional: Adjust stroke based on zOffset or other factors
            // For example, changing opacity based on elevation
            const avgZOffset = totalZOffset / POINTS_PER_LINE;
            const baseColor = p.color(lineColors[i]);
            baseColor.setAlpha(p.map(Math.abs(avgZOffset), 0, MAX_AMPLITUDE, 150, 255));
            p.stroke(baseColor);

            // Increment noise offset to animate
            noiseOffsets[i] += 0.005; // You might want to use NOISE_SPEED here
        }
    }

    // -------------------------------
    // 7. GUI Setup and Callback Methods
    // -------------------------------

    function setupGUI() {
        gui = new dat.GUI({ autoPlace: false });
        const guiContainer = p.select('#gui-container'); // Ensure you have a div with id 'gui-container'
        if (guiContainer) {
            guiContainer.html(''); // Clear any existing content
            guiContainer.elt.appendChild(gui.domElement);
        } else {
            document.body.appendChild(gui.domElement); // Fallback to body
        }

        // Number of Lines
        gui.add(params, 'numLines', 1, 20).step(1).name('Number of Lines').onChange(updateNumLines);

        // Points per Line
        gui.add(params, 'pointsPerLine', 50, 300).step(10).name('Points per Line').onChange(updatePointsPerLine);

        // Maximum Amplitude
        gui.add(params, 'maxAmplitude', 10, 200).step(5).name('Max Amplitude').onChange(updateMaxAmplitude);

        // Noise Speed
        gui.add(params, 'noiseSpeed', 0.001, 0.05).step(0.001).name('Noise Speed').onChange(updateNoiseSpeed);

        // Stroke Weight
        gui.add(params, 'strokeWeight', 0.5, 5).step(0.1).name('Stroke Weight').onChange(updateStrokeWeight);

        // Background Color
        gui.addColor(params, 'backgroundColor').name('Background Color').onChange(updateBackgroundColor);

        // Add more controllers as needed
    }

    // Callback functions to handle parameter changes

    function updateNumLines(value) {
        NUM_LINES = value;
        initializeLines();
    }

    function updatePointsPerLine(value) {
        POINTS_PER_LINE = value;
        initializeLines();
    }

    function updateMaxAmplitude(value) {
        MAX_AMPLITUDE = value;
    }

    function updateNoiseSpeed(value) {
        NOISE_SPEED = value;
    }

    function updateStrokeWeight(value) {
        p.strokeWeight(value);
    }

    function updateBackgroundColor(value) {
        backgroundColor = value;
    }

    // -------------------------------
    // 8. Additional Helper Methods
    // -------------------------------

    function randomColorFromPalette() {
        const palette = currentPalette.elements;
        return palette[p.floor(p.random(palette.length))];
    }
}
