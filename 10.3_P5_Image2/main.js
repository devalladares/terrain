// main.js

const CONFIG = {
    useLatestVersionByDefault: false,
    manualDefaultVersion: 15.18
};

// Define available sketches with updated structure
const SKETCHES = [
    // { name: 'sketch_15.1', group: 'Testing' },
    // { name: 'sketch_15.11', group: 'Testing' },
    // { name: 'sketch_15.12', group: 'Testing' },
    // { name: 'sketch_15.13', group: 'Testing' },
    // { name: 'sketch_15.14', group: 'Testing' },
    // { name: 'sketch_15.15', group: 'Testing' },
    // { name: 'sketch_15.16', group: 'Testing' },
    // { name: 'sketch_15.17', group: 'Testing' },
    { name: 'sketch_15.18', label:'rows', group: 'Testing' },
    { name: 'sketch_15.19', label:'3-sequence', group: 'Testing' },
];

let currentP5 = null;
let currentGUI = null;  // Track the current GUI instance

// Helper function to extract version number from sketch name
function getVersionNumber(sketchName) {
    const match = sketchName.match(/sketch_(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
}

// Function to find the highest version number
function findLatestVersion(sketches) {
    return sketches.reduce((maxVersion, sketch) => {
        const version = getVersionNumber(sketch.name);
        return Math.max(maxVersion, version);
    }, 0);
}

// Helper function to generate display name from sketch info
function generateDisplayName(sketch) {
    const baseNumber = sketch.name.replace('sketch_', 'Sketch ');
    return sketch.label ? `${baseNumber} - ${sketch.label}` : baseNumber;
}

// Process SKETCHES array
const PROCESSED_SKETCHES = SKETCHES.map(sketch => ({
    ...sketch,
    label: generateDisplayName(sketch)
}));

// Get the default sketch number based on configuration
const DEFAULT_SKETCH = CONFIG.useLatestVersionByDefault ? 
    `sketch_${findLatestVersion(PROCESSED_SKETCHES)}` : 
    `sketch_${CONFIG.manualDefaultVersion}`;

async function loadSketch(sketchName) {
    if (currentP5) {
        currentP5.remove();
        currentP5 = null;
    }

    // Destroy existing GUI if it exists
    if (currentGUI) {
        currentGUI.destroy();
        currentGUI = null;
    }

    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        const module = await import(`./sketches/${sketchName}.js`);
        const sketchFunction = module.default;

        if (typeof sketchFunction === 'function') {
            currentP5 = new p5((p) => {
                // Keep a reference to the original dat.GUI
                const originalDatGUI = window.dat.GUI;
                // Override dat.GUI so that we capture the new instance
                window.dat.GUI = function(...args) {
                    const gui = new originalDatGUI(...args);
                    currentGUI = gui;
                    return gui;
                };

                // Call the sketch function so it assigns p.preload, p.setup, etc.
                sketchFunction(p);

                // Wrap p.setup (if defined) to restore dat.GUI after it runs.
                // This ensures that the override is still active during setup.
                if (typeof p.setup === 'function') {
                    const originalSetup = p.setup.bind(p);
                    p.setup = function() {
                        originalSetup();
                        // Now that setup has run and the GUI is created, restore dat.GUI.
                        window.dat.GUI = originalDatGUI;
                    };
                } else {
                    // Fallback: restore dat.GUI after a short delay.
                    setTimeout(() => {
                        window.dat.GUI = originalDatGUI;
                    }, 100);
                }
            }, 'sketch-container');
        } else {
            console.error(`Default export in ${sketchName}.js is not a function`);
            displayError(`Sketch "${sketchName}" is not a valid function.`);
        }
    } catch (error) {
        console.error(`Error loading ${sketchName}.js:`, error);
        displayError(`Failed to load sketch "${sketchName}". Please try again.`);
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

function populateSketchOptions() {
    const selector = document.getElementById('sketchSelector');
    const groups = {};

    // Group sketches by their group property
    PROCESSED_SKETCHES.forEach(sketch => {
        if (!groups[sketch.group]) {
            groups[sketch.group] = [];
        }
        groups[sketch.group].push(sketch);
    });

    // Create option groups and populate them
    for (const groupName in groups) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;

        groups[groupName].forEach(sketch => {
            const option = document.createElement('option');
            option.value = sketch.name;
            option.textContent = sketch.label;
            
            if (sketch.name === DEFAULT_SKETCH) {
                option.selected = true;
            }
            
            optgroup.appendChild(option);
        });

        selector.appendChild(optgroup);
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function displayError(message) {
    const container = document.getElementById('sketch-container');
    const existingError = container.querySelector('.error-message');
    if (existingError) existingError.remove();

    const errorMsg = document.createElement('p');
    errorMsg.className = 'error-message';
    errorMsg.textContent = message;
    container.appendChild(errorMsg);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('sketchSelector');
    
    populateSketchOptions();

    let initialSketch = DEFAULT_SKETCH;
    const urlDefault = getQueryParam('defaultSketch');
    if (urlDefault && /^sketch_\d+(\.\d+)?$/.test(urlDefault)) {
        initialSketch = urlDefault;
    }

    if (initialSketch) {
        selector.value = initialSketch;
        loadSketch(initialSketch);
    }

    selector.addEventListener('change', (event) => {
        if (event.target.value) {
            loadSketch(event.target.value);
        }
    });

    // Handle window resize to adjust current sketch
    window.addEventListener('resize', () => {
        if (currentP5 && typeof currentP5.windowResized === 'function') {
            currentP5.windowResized();
        }
    });
    
    const mockupToggle = document.getElementById('mockupToggle');
    const mockupImage = document.getElementById('mockupImage');
    const sketchContainer = document.getElementById('sketch-container');

    mockupToggle.addEventListener('change', (event) => {
        if (event.target.checked) {
            mockupImage.style.display = 'block';
            sketchContainer.classList.add('mockup-active');
        } else {
            mockupImage.style.display = 'none';
            sketchContainer.classList.remove('mockup-active');
        }
    });
});
