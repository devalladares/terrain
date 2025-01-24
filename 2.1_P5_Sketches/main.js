// main.js

const DEFAULT_SKETCH_NUMBER = 6.6

let currentP5 = null; // Holds the current p5 instance
let isDarkMode = false; // Tracks the current mode

const SKETCHES = [
    { name: 'sketch1', label: 'Sketch 1', group: 'Group' },
    { name: 'sketch2', label: 'Sketch 2', group: 'Group' },
    { name: 'sketch3', label: 'Sketch 3', group: 'Group' },
    { name: 'sketch4', label: 'Sketch 4', group: 'Group' },
    { name: 'sketch5', label: 'Sketch 5', group: 'Group' },
    { name: 'sketch6', label: 'Sketch 6', group: 'Group' },
    { name: 'sketch6.1', label: 'Sketch 6.1', group: 'Group' },
    { name: 'sketch6.2', label: 'Sketch 6.2', group: 'Group' },
    { name: 'sketch6.3', label: 'Sketch 6.3', group: 'Group' },
    { name: 'sketch6.4', label: 'Sketch 6.4', group: 'Group' },
    { name: 'sketch6.5', label: 'Sketch 6.5', group: 'Group' },
    { name: 'sketch7', label: 'Sketch 7', group: 'Group' },
    { name: 'sketch8', label: 'Sketch 8', group: 'Group' },
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
      
      // After loading the sketch, update its mode
      if (isDarkMode && currentP5 && currentP5.setMode) {
        currentP5.setMode(true);
      }
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
  if (currentP5) {
    currentP5.remove();
    currentP5 = null;
  }
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
  // Remove existing error messages
  const existingError = container.querySelector('.error-message');
  if (existingError) existingError.remove();

  const errorMsg = document.createElement('p');
  errorMsg.className = 'error-message';
  errorMsg.textContent = message;
  container.appendChild(errorMsg);
}

/**
 * Toggles between light and dark modes.
 */
function toggleMode() {
  const body = document.body;
  const overlayImage = document.getElementById('overlay-image');

  if (isDarkMode) {
    // Switch to Light Mode
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    overlayImage.src = 'images/cover_black.png'; // Assuming cover_black.png suits light mode
  } else {
    // Switch to Dark Mode
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    overlayImage.src = 'images/cover_white.png'; // Assuming cover_white.png suits dark mode
  }

  isDarkMode = !isDarkMode;

  // Notify the current p5.js sketch about the mode change
  if (currentP5 && currentP5.setMode) {
    currentP5.setMode(isDarkMode);
  }
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

  // Listen for keydown events to toggle mode with 'D' key
  window.addEventListener('keydown', (event) => {
    // Check if 'D' or 'd' is pressed and no modifier keys are active
    if ((event.key === 'd' || event.key === 'D') && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
      toggleMode();
    }
  });
});
