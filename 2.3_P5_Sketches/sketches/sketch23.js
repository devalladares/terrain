// sketches/sketchTemplate.js

export default function(p) {
    // -------------------------------
    // 1. Configuration Parameters
    // -------------------------------

    // Array of image paths
    const IMAGE_PATHS = [
        'images/layer1.png',
        'images/layer2.png',
        'images/layer3.png'
    ];

    // Example color palettes for light and dark modes
    const COLOR_PALETTE_LIGHT = {
        background: '#B8E6D8',
        elements: ['#003323', '#006644', '#009966']
    };

    const COLOR_PALETTE_DARK = {
        background: '#1A1A1A',
        elements: ['#FFFFFF', '#CCCCCC', '#999999']
    };

    // Stroke color variables
    const STROKE_COLOR_LIGHT = COLOR_PALETTE_LIGHT.elements;
    const STROKE_COLOR_DARK = COLOR_PALETTE_DARK.elements;

    // Displacement Mapping Parameters
    const MIN_WAVE_HEIGHT = 50;
    const MAX_WAVE_HEIGHT = 200;

    // -------------------------------
    // 2. Global Variables
    // -------------------------------

    let images = [];               // Array to hold image objects
    let currentPalette;            // Current color palette based on mode
    let strokeColors = [];         // Array of stroke colors per layer

    let noiseOffsets = [];         // Array of noise offsets per layer

    // Array to hold layer-specific wave parameters
    const layerParams = [
        {
            waveHeight: 100,
            noiseScale: 0.02,
            noiseSpeed: 0.001,
            numRows: 40,
            numCols: 150,
            lineWeight: 1,
            blendMode: p.BLEND
        },
        {
            waveHeight: 150,
            noiseScale: 0.04,
            noiseSpeed: 0.002,
            numRows: 60,
            numCols: 200,
            lineWeight: 2,
            blendMode: p.ADD
        },
        {
            waveHeight: 80,
            noiseScale: 0.03,
            noiseSpeed: 0.0015,
            numRows: 50,
            numCols: 180,
            lineWeight: 1.5,
            blendMode: p.MULTIPLY
        }
    ];

    // New: GUI Parameters Object for Multiple Layers
    const guiParams = {
        // Controls can be extended per layer if needed
        globalWaveSpeed: 0.002,
        toggleMode: function() {
            if (this.mode === 'Light') {
                this.mode = 'Dark';
                p.setMode(true);
            } else {
                this.mode = 'Light';
                p.setMode(false);
            }
        },
        mode: 'Light'
    };

    // -------------------------------
    // 3. p5.js Lifecycle Methods
    // -------------------------------

    p.preload = function() {
        // Load all images
        IMAGE_PATHS.forEach((path, index) => {
            p.loadImage(
                path,
                img => {
                    images[index] = img;
                    console.log(`Image ${index + 1} loaded.`);
                    img.loadPixels();
                },
                () => console.error(`Failed to load image at path: ${path}`)
            );
        });
    };

    p.setup = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;

        p.createCanvas(containerWidth, containerHeight).parent(container);

        setInitialMode();

        p.noFill();

        // Initialize stroke colors and noise offsets for each layer
        strokeColors = currentPalette.elements;
        layerParams.forEach(() => noiseOffsets.push(0));

        // Initialize GUI
        initGUI();
    };

    p.draw = function() {
        p.background(currentPalette.background);

        // Draw each image layer with its own wave mesh
        images.forEach((img, layerIndex) => {
            if (img) {
                img.resize(p.width, p.height);
                p.image(img, 0, 0, p.width, p.height);
            }

            p.blendMode(layerParams[layerIndex].blendMode);
            drawNoiseWaves(layerIndex);
            p.blendMode(p.BLEND);

            // Update noise offset for animation
            noiseOffsets[layerIndex] += layerParams[layerIndex].noiseSpeed;
        });
    };

    p.windowResized = function() {
        const container = p.select('#sketch-container');
        const containerWidth = container.width;
        const containerHeight = container.height;
        p.resizeCanvas(containerWidth, containerHeight);

        // Resize and reload images
        images.forEach(img => {
            if (img) {
                img.resize(p.width, p.height);
                img.loadPixels();
            }
        });
    };

    // -------------------------------
    // 4. Mode Handling Methods
    // -------------------------------

    function setInitialMode() {
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            currentPalette = COLOR_PALETTE_DARK;
            strokeColors = STROKE_COLOR_DARK;
            guiParams.mode = 'Dark';
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            strokeColors = STROKE_COLOR_LIGHT;
            guiParams.mode = 'Light';
        }
    }

    p.setMode = function(darkMode) {
        if (darkMode) {
            currentPalette = COLOR_PALETTE_DARK;
            strokeColors = STROKE_COLOR_DARK;
            guiParams.mode = 'Dark';
        } else {
            currentPalette = COLOR_PALETTE_LIGHT;
            strokeColors = STROKE_COLOR_LIGHT;
            guiParams.mode = 'Light';
        }

        updateVisualElements();
    };

    // -------------------------------
    // 5. Wave Mesh System with Displacement Mapping
    // -------------------------------

    function drawNoiseWaves(layerIndex) {
        const params = layerParams[layerIndex];
        const img = images[layerIndex];
        const noiseOffset = noiseOffsets[layerIndex];

        if (img && img.pixels.length > 0) {
            img.loadPixels();
        }

        const rowSpacing = p.height / (params.numRows - 1);
        const colSpacing = p.width / (params.numCols - 1);

        for (let row = 0; row < params.numRows; row++) {
            p.beginShape();
            for (let col = 0; col < params.numCols; col++) {
                const x = col * colSpacing;
                const baseY = row * rowSpacing;

                const imgX = p.floor(p.map(x, 0, p.width, 0, img.width));
                const imgY = p.floor(p.map(baseY, 0, p.height, 0, img.height));

                let brightnessVal = 0.5;

                if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                    const index = (imgY * img.width + imgX) * 4;
                    if (index >= 0 && index + 2 < img.pixels.length) {
                        const r = img.pixels[index];
                        const g = img.pixels[index + 1];
                        const b = img.pixels[index + 2];
                        const colColor = p.color(r, g, b);
                        brightnessVal = p.brightness(colColor) / 100;
                    }
                }

                const currentWaveHeight = p.map(brightnessVal, 0, 1, MIN_WAVE_HEIGHT, params.waveHeight);
                const noiseVal = p.noise(col * params.noiseScale, row * 0.1, noiseOffset);
                const y = baseY + p.map(noiseVal, 0, 1, -currentWaveHeight, currentWaveHeight);

                let c = strokeColors[layerIndex % strokeColors.length];
                if (imgX >= 0 && imgX < img.width && imgY >= 0 && imgY < img.height) {
                    const index = (imgY * img.width + imgX) * 4;
                    if (index >= 0 && index + 2 < img.pixels.length) {
                        const r = img.pixels[index];
                        const g = img.pixels[index + 1];
                        const b = img.pixels[index + 2];
                        c = p.color(r, g, b);
                    }
                }

                p.stroke(c);
                p.vertex(x, y);
            }
            p.endShape();
        }
    }

    // -------------------------------
    // 6. GUI Initialization
    // -------------------------------

    function initGUI() {
        gui = new dat.GUI();

        const modeFolder = gui.addFolder('Mode');
        modeFolder.add(guiParams, 'mode').name('Current Mode').listen();
        modeFolder.add(guiParams, 'toggleMode').name('Toggle Light/Dark');
        modeFolder.open();

        const waveFolder = gui.addFolder('Layer Parameters');

        layerParams.forEach((params, index) => {
            const layerFolder = waveFolder.addFolder(`Layer ${index + 1}`);
            layerFolder.add(params, 'waveHeight', 50, 300).name('Wave Height');
            layerFolder.add(params, 'noiseScale', 0.01, 0.1).name('Noise Scale');
            layerFolder.add(params, 'noiseSpeed', 0.001, 0.01).name('Noise Speed');
            layerFolder.add(params, 'numRows', 10, 100, 1).name('Number of Rows');
            layerFolder.add(params, 'numCols', 50, 300, 1).name('Number of Columns');
            layerFolder.add(params, 'lineWeight', 1, 5).name('Line Weight');
            layerFolder.add(params, 'blendMode', {
                'BLEND': p.BLEND,
                'ADD': p.ADD,
                'DARKEST': p.DARKEST,
                'LIGHTEST': p.LIGHTEST,
                'MULTIPLY': p.MULTIPLY,
                'EXCLUSION': p.EXCLUSION,
                'SCREEN': p.SCREEN,
                'REPLACE': p.REPLACE,
                'OVERLAY': p.OVERLAY,
                'HARD_LIGHT': p.HARD_LIGHT,
                'SOFT_LIGHT': p.SOFT_LIGHT,
                'DODGE': p.DODGE,
                'BURN': p.BURN
            }, 'blendMode').name('Blend Mode');
            layerFolder.open();
        });

        waveFolder.open();
    }

    // -------------------------------
    // 7. Additional Helper Methods
    // -------------------------------

    function updateVisualElements() {
        // If additional visual elements are present, update them here
    }
}
