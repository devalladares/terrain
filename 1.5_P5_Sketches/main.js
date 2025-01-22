// main.js

// 1. Define DEFAULT_SKETCH_NUMBER as a number
const DEFAULT_SKETCH_NUMBER = 30

let currentP5 = null; // Holds the current p5 instance

const SKETCHES = [
    { name: 'sketch1', label: 'Sketch 1', group: 'Flocking' },
    { name: 'sketch2', label: 'Sketch 2', group: 'Flocking' },
    { name: 'sketch3', label: 'Sketch 3', group: 'Contours' },
    { name: 'sketch4', label: 'Sketch 4', group: 'Group C' },
    { name: 'sketch5', label: 'Sketch 5', group: 'Flocking' },
    { name: 'sketch6', label: 'Sketch 6', group: 'Flocking' },
    { name: 'sketch7', label: 'Sketch 7', group: 'Flocking' },
    { name: 'sketch8', label: 'Sketch 8', group: 'Flocking' },
    { name: 'sketch9', label: 'Sketch 9', group: 'Contours' },
    { name: 'sketch10', label: 'Sketch 10', group: 'Group C' },
    { name: 'sketch11', label: 'Sketch 11', group: 'Group C' },
    // { name: 'sketch12', label: 'Sketch 12', group: 'Group C' },
    { name: 'sketch13', label: 'Sketch 13', group: 'Contours' },
    { name: 'sketch14', label: 'Sketch 14', group: 'Group C' },
    { name: 'sketch15', label: 'Sketch 15', group: 'Group C' },
    // { name: 'sketch16', label: 'Sketch 16', group: 'Group C' },

    { name: 'sketch17', label: 'Sketch 17', group: 'Group C' },
    { name: 'sketch18', label: 'Sketch 18', group: 'Group C' },
    { name: 'sketch19', label: 'Sketch 19', group: 'Group C' },
    { name: 'sketch20', label: 'Sketch 20', group: 'Group C' },
    { name: 'sketch21', label: 'Sketch 21', group: 'Group C' },
    { name: 'sketch22', label: 'Sketch 22', group: 'Group C' },
    { name: 'sketch23', label: 'Sketch 23', group: 'Group C' },
    { name: 'sketch24', label: 'Sketch 24', group: 'Group C' },
    { name: 'sketch25', label: 'Sketch 25', group: 'Group C' },
    { name: 'sketch26', label: 'Sketch 26', group: 'Group C' },
    { name: 'sketch27', label: 'Sketch 27', group: 'Group C' },
    { name: 'sketch28', label: 'Sketch 28', group: 'Group C' },
    { name: 'sketch29', label: 'Sketch 29', group: 'Group C' },
    { name: 'sketch30', label: 'Sketch 30', group: 'Group C' },
    { name: 'sketch31', label: 'Sketch 31', group: 'Group C' },
    { name: 'sketch32', label: 'Sketch 32', group: 'Group C' },
    { name: 'sketch33', label: 'Sketch 33', group: 'Group C' },
    { name: 'sketch34', label: 'Sketch 34', group: 'Group C' },
    { name: 'sketch35', label: 'Sketch 35', group: 'Group C' },
    { name: 'sketch36', label: 'Sketch 36', group: 'Group C' },
    { name: 'sketch37', label: 'Sketch 37', group: 'Group C' },
    { name: 'sketch38', label: 'Sketch 38', group: 'Group C' },
    { name: 'sketch39', label: 'Sketch 39', group: 'Group C' },
    { name: 'sketch40', label: 'Sketch 40', group: 'Group C' },
    // Add more sketches here as needed
];

/**
 * Loads a sketch by dynamically importing the module.
 * @param {string} sketchName - The name of the sketch file (e.g., 'sketch1')
 */
async function loadSketch(sketchName) {
  // Remove existing p5 instance if any
  if (currentP5) {
    currentP5.remove();
    currentP5 = null;
  }

  // If no sketch is selected, exit the function
  if (!sketchName) {
    clearSketch();
    return;
  }

  try {
    // Show loading indicator
    document.getElementById('loadingIndicator').style.display = 'block';

    // Dynamically import the selected sketch module
    const module = await import(`./sketches/${sketchName}.js`);
    
    // Retrieve the default export (the sketch function)
    const sketchFunction = module.default;

    if (typeof sketchFunction === 'function') {
      // Instantiate the p5 sketch in the 'sketch-container' div
      currentP5 = new p5(sketchFunction, 'sketch-container');
    } else {
      console.error(`Default export in ${sketchName}.js is not a function`);
      displayError(`Sketch "${sketchName}" is not a valid function.`);
    }
  } catch (error) {
    console.error(`Error loading ${sketchName}.js:`, error);
    displayError(`Failed to load sketch "${sketchName}".`);
  } finally {
    // Hide loading indicator
    document.getElementById('loadingIndicator').style.display = 'none';
  }
}

/**
 * Clears the sketch container by removing any existing p5 canvas.
 */
function clearSketch() {
  const container = document.getElementById('sketch-container');
  container.innerHTML = ''; // Remove existing canvas or content
}

/**
 * Dynamically generates the <option> elements for the select dropdown with grouping.
 */
function populateSketchOptions() {
  const selector = document.getElementById('sketchSelector');
  const groups = {};

  // Organize sketches by group
  SKETCHES.forEach(sketch => {
    if (!groups[sketch.group]) {
      groups[sketch.group] = [];
    }
    groups[sketch.group].push(sketch);
  });

  // Create optgroup for each group
  for (const groupName in groups) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = groupName;

    groups[groupName].forEach(sketch => {
      const option = document.createElement('option');
      option.value = sketch.name;
      option.textContent = sketch.label;

      // Set the default sketch as selected
      if (sketch.name === `sketch${DEFAULT_SKETCH_NUMBER}`) {
        option.selected = true;
      }

      optgroup.appendChild(option);
    });

    selector.appendChild(optgroup);
  }
}

/**
 * Retrieves the value of a query parameter from the URL.
 * @param {string} param - The name of the parameter.
 * @returns {string|null} - The value of the parameter or null if not found.
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Displays an error message to the user.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
  const container = document.getElementById('sketch-container');
  container.innerHTML = `<p style="color: red;">${message}</p>`;
}

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('sketchSelector');
  
  // Populate the select dropdown with sketch options
  populateSketchOptions();

  // Determine the default sketch
  let initialSketch = `sketch${DEFAULT_SKETCH_NUMBER}`; // Fallback to DEFAULT_SKETCH_NUMBER
  const urlDefault = getQueryParam('defaultSketch');
  if (urlDefault && /^sketch\d+$/.test(urlDefault)) {
    initialSketch = urlDefault;
  }

  // Set the dropdown to the initial sketch and load it
  if (initialSketch) {
    selector.value = initialSketch;
    loadSketch(initialSketch);
  }

  // Listen for changes in the dropdown menu
  selector.addEventListener('change', (event) => {
    const selectedSketch = event.target.value;
    loadSketch(selectedSketch);
  });
});
