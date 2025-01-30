// main.js

const CONFIG = {
    // useLatestVersionByDefault: true,  // Toggle this to switch between auto/manual
    useLatestVersionByDefault: false,  // Toggle this to switch between auto/manual
    manualDefaultVersion: 2.3
};

const SKETCHES = [
    // Include ALL your sketches from the directory
    // { name: 'sketch1.1', group: 'New' }, 
    // { name: 'sketch1.2', group: 'New' },  
    // { name: 'sketch1.3', group: 'New' },  
    // { name: 'sketch1.4', group: 'New' },  
    // { name: 'sketch1.5', group: 'New' },  
    // { name: 'sketch1.6', group: 'New' },  
    // { name: 'sketch1.7', group: 'New' },  
    // { name: 'sketch1.8', group: 'New' },  
    // { name: 'sketch1.9', group: 'New' },  
    // { name: 'sketch2.1', group: 'New' },  
    // { name: 'sketch2.2', group: 'New' },  
    { name: 'sketch2.3', label: 'Press G for finetune controls' ,group: 'New' },  
    // { name: 'sketch2.4', group: 'New' },  
];

let currentP5 = null;

// Helper function to extract version number from sketch name
function getVersionNumber(sketchName) {
    const match = sketchName.match(/sketch(\d+\.\d+|\d+)/);
    return match ? parseFloat(match[1]) : 0;
}

// Function to find the highest version number
function findLatestVersion(sketches) {
    return sketches.reduce((maxVersion, sketch) => {
        const version = getVersionNumber(sketch.name);
        return Math.max(maxVersion, version);
    }, 0);
}

// Helper function to generate label from sketch name
function generateLabel(sketchName) {
    // Remove 'sketch' prefix
    let label = sketchName.replace(/^sketch/, '');
    
    // Split by dots or numbers with optional dots
    const parts = label.split(/[\d.]+/);
    const numbers = label.match(/[\d.]+/);
    
    // Return "Sketch X" + label if it exists
    return `Sketch ${numbers ? numbers[0] : label}`;
}



// Process SKETCHES array and find the latest version
const PROCESSED_SKETCHES = SKETCHES.map(sketch => ({
    ...sketch,
    label: sketch.label ? `${generateLabel(sketch.name)} - ${sketch.label}` : generateLabel(sketch.name)
}));

// Get the default sketch number based on configuration
const DEFAULT_SKETCH_NUMBER = CONFIG.useLatestVersionByDefault ? 
    findLatestVersion(PROCESSED_SKETCHES) : 
    CONFIG.manualDefaultVersion;


async function loadSketch(sketchName) {
    if (currentP5) {
        currentP5.remove();
        currentP5 = null;
    }

    if (!sketchName) {
        clearSketch();
        return;
    }

    try {
        document.getElementById('loadingIndicator').style.display = 'block';
        const module = await import(`./sketches/${sketchName}.js`);
        const sketchFunction = module.default;

        if (typeof sketchFunction === 'function') {
            currentP5 = new p5(sketchFunction, 'sketch-container');
        } else {
            console.error(`Default export in ${sketchName}.js is not a function`);
            displayError(`Sketch "${sketchName}" is not a valid function.`);
        }
    } catch (error) {
        console.error(`Error loading ${sketchName}.js:`, error);
        displayError(`Failed to load sketch "${sketchName}". Please try again later.`);
    } finally {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

function clearSketch() {
    if (currentP5) {
        currentP5.remove();
        currentP5 = null;
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

            if (sketch.name === `sketch${DEFAULT_SKETCH_NUMBER}`) {
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

    let initialSketch = `sketch${DEFAULT_SKETCH_NUMBER}`;
    const urlDefault = getQueryParam('defaultSketch');
    if (urlDefault && /^sketch\d+(\.\d+)?$/.test(urlDefault)) {
        initialSketch = urlDefault;
    }

    if (initialSketch) {
        selector.value = initialSketch;
        loadSketch(initialSketch);
    }

    selector.addEventListener('change', (event) => {
        const selectedSketch = event.target.value;
        loadSketch(selectedSketch);
    });
});