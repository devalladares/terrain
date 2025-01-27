// main.js

// const DEFAULT_SKETCH_NUMBER = 101
const DEFAULT_SKETCH_NUMBER = 101

// const DEFAULT_SKETCH_NUMBER = 102.2
// const DEFAULT_SKETCH_NUMBER = 105.1
// const DEFAULT_SKETCH_NUMBER = 106.2
// const DEFAULT_SKETCH_NUMBER = 106.4
// const DEFAULT_SKETCH_NUMBER = 106.15
// const DEFAULT_SKETCH_NUMBER = 106.1
// const DEFAULT_SKETCH_NUMBER = 102.1 //chat
// const DEFAULT_SKETCH_NUMBER = 102.3 //chat
// const DEFAULT_SKETCH_NUMBER = 102.4 //chat

// const DEFAULT_SKETCH_NUMBER = 103.1 // claude
// const DEFAULT_SKETCH_NUMBER = 103.2 // claude
// const DEFAULT_SKETCH_NUMBER = 103.3 // claude
// const DEFAULT_SKETCH_NUMBER = 103.4 // claude
// const DEFAULT_SKETCH_NUMBER = 103.5 // claude

// const DEFAULT_SKETCH_NUMBER = 11 // DS

let currentP5 = null;
let isDarkMode = true;

// Helper function to generate label from sketch name
function generateLabel(sketchName) {
    // Remove 'sketch' prefix
    let label = sketchName.replace(/^sketch/, '');
    
    // Split by dots or numbers with optional dots
    const parts = label.split(/[\d.]+/);
    const numbers = label.match(/[\d.]+/);
    
    // If we have a descriptive part after the number, use it as the label
    if (parts[1]) {
        return `Sketch ${numbers[0]}${parts[1]}`;
    }
    
    // Otherwise just return "Sketch X"
    return `Sketch ${numbers[0]}`;
}

const SKETCHES = [
    // You only need to specify label if it's different from the auto-generated one
  
     { name: 'sketch101', group: 'Sequence Space' },
    { name: 'sketch102', group: 'Sequence Space' },
    { name: 'sketch102.1', group: 'Sequence Space' },
    { name: 'sketch102.2', group: 'Sequence Space' },
    { name: 'sketch103', group: 'Sequence Space' },
    { name: 'sketch103.3', group: 'Sequence Space' },
    { name: 'sketch110.1', group: 'Sequence Space' },
    { name: 'sketch110.2', group: 'Sequence Space' },
    { name: 'sketch110.3', label:'Sketch 110.3 hover and click', group: 'Sequence Space' },
    { name: 'sketch105.1', label:'Sketch 105.1 Plus+', group: 'Sequence Space' },
    // { name: 'sketch106.1', label:'Sketch 105.1 Plus+', group: 'Sequence Space' },
    { name: 'sketch106.4', group: 'Sequence Space' },
    { name: 'sketch106.5', group: 'Sequence Space' },
    { name: 'sketch106.6', group: 'Sequence Space' },
    { name: 'sketch106.7', group: 'Sequence Space' },
    { name: 'sketch106.9', group: 'Sequence Space' },
    { name: 'sketch106.11', group: 'Sequence Space' },
    // { name: 'sketch106.12', group: 'Sequence Space' },
    { name: 'sketch106.13', group: 'Sequence Space' },
    { name: 'sketch106.14', group: 'Sequence Space' },
    { name: 'sketch120', group: 'Graph+Contour' },
    { name: 'sketch121', group: 'Graph+Contour' },
    { name: 'sketch122', group: 'Graph+Contour' },
    { name: 'sketch123', group: 'Graph+Contour' },
    ////////////////////////////////////////////////////////////
    // { name: 'sketch11', group: 'Old' },
    // { name: 'sketch12.1', group: 'Old' },
    // { name: 'sketch5.3', group: 'Old' },
    // { name: 'sketch5.6', label: 'Sketch 5.6 Tracing Lines', group: 'Old' },
    // { name: 'sketch5.48', label: 'Sketch 5.48 Drawing Image Colors', group: 'Old' },
    //  { name: 'sketch17', group: 'Old' },
    //  { name: 'sketch20', group: 'Old' },
];

// Process SKETCHES array to ensure all entries have labels
const PROCESSED_SKETCHES = SKETCHES.map(sketch => ({
    ...sketch,
    label: sketch.label || generateLabel(sketch.name)
}));

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
            
            // Special handling for sketch4
            if (sketchName === 'sketch122') {
                // Temporarily update UI to light mode for sketch4 only
                document.body.classList.remove('dark-mode');
                document.body.classList.add('light-mode');
                document.getElementById('overlay-image').src = 'images/cover_black.png';
                if (currentP5 && currentP5.setMode) {
                    currentP5.setMode(false); // false = light mode
                }
            } else {
                // For all other sketches, respect the current isDarkMode state
                if (isDarkMode) {
                    document.body.classList.remove('light-mode');
                    document.body.classList.add('dark-mode');
                    document.getElementById('overlay-image').src = 'images/cover_white.png';
                    if (currentP5 && currentP5.setMode) {
                        currentP5.setMode(true);
                    }
                } else {
                    document.body.classList.remove('dark-mode');
                    document.body.classList.add('light-mode');
                    document.getElementById('overlay-image').src = 'images/cover_black.png';
                    if (currentP5 && currentP5.setMode) {
                        currentP5.setMode(false);
                    }
                }
            }
        } else {
            console.error(`Default export in ${sketchName}.js is not a function`);
            displayError(`Sketch "${sketchName}" is not a valid function.`);
        }
    } catch (error) {
        console.error(`Error loading ${sketchName}.js:`, error);
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

    PROCESSED_SKETCHES.forEach(sketch => {
        if (!groups[sketch.group]) {
            groups[sketch.group] = [];
        }
        groups[sketch.group].push(sketch);
    });

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

function toggleMode() {
    const body = document.body;
    const overlayImage = document.getElementById('overlay-image');

    if (isDarkMode) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        overlayImage.src = 'images/cover_black.png';
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        overlayImage.src = 'images/cover_white.png';
    }

    isDarkMode = !isDarkMode;

    if (currentP5 && currentP5.setMode) {
        currentP5.setMode(isDarkMode);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('sketchSelector');
    
    populateSketchOptions();

    let initialSketch = `sketch${DEFAULT_SKETCH_NUMBER}`;
    const urlDefault = getQueryParam('defaultSketch');
    if (urlDefault && /^sketch\d+$/.test(urlDefault)) {
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

    window.addEventListener('keydown', (event) => {
        if ((event.key === 'd' || event.key === 'D') && 
            !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
            toggleMode();
        }
    });
});