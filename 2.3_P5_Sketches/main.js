// main.js

const DEFAULT_SKETCH_NUMBER = 8

let currentP5 = null; // Holds the current p5 instance
let isDarkMode = true; // Tracks the current mode

const SKETCHES = [
    // { name: 'sketch1', label: 'Sketch 1', group: 'Group' },
    // { name: 'sketch2', label: 'Sketch 2', group: 'Group' },
    // { name: 'sketch3', label: 'Sketch 3', group: 'Group' },
    // // { name: 'sketch4', label: 'Sketch 4', group: 'Group' },
    // { name: 'sketch6', label: 'Sketch 6', group: 'Group' },
    // { name: 'sketch6.1', label: 'Sketch 6.1', group: 'Group' },
    // { name: 'sketch6.2', label: 'Sketch 6.2', group: 'Group' },
    // { name: 'sketch6.3', label: 'Sketch 6.3', group: 'Group' },
    // { name: 'sketch6.4', label: 'Sketch 6.4', group: 'Group' },
    // { name: 'sketch6.5', label: 'Sketch 6.5', group: 'Group' },
    // { name: 'sketch7', label: 'Sketch 7', group: 'Group' },
    { name: 'sketch8', label: 'Sketch 8 Drag, Rotate, Scroll', group: 'A. Floating RNA+Contours' },
    { name: 'sketch9', label: 'Sketch 9 Drag, Rotate, Scroll', group: 'A. Floating RNA+Contours' },
    { name: 'sketch10', label: 'Sketch 10 Drag, Rotate, Scroll', group: 'A. Floating RNA+Contours' },
    { name: 'sketch11', label: 'Sketch 11',group: 'A. Floating RNA+Contours' },
    { name: 'sketch12', label: 'Sketch 12', group: 'A. Floating RNA+Contours' },
    { name: 'sketch12.1', label: 'Sketch 12.1', group: 'A. Floating RNA+Contours' },
    // { name: 'sketch12.2', label: 'Sketch 12.2', group: 'Group' },
    // { name: 'sketch12.3', label: 'Sketch 12.3', group: 'Group' },
    { name: 'sketch5', label: 'Sketch 5 Tracing Contours', group: 'B. Contour+RNA' },
    { name: 'sketch5.1', label: 'Sketch 5.1', group: 'B. Contour+RNA' },
    { name: 'sketch5.2', label: 'Sketch 5.2', group: 'B. Contour+RNA' },
    { name: 'sketch5.3', label: 'Sketch 5.3', group: 'B. Contour+RNA' },
    { name: 'sketch5.4', label: 'Sketch 5.4', group: 'B. Contour+RNA' },
    { name: 'sketch5.45', label: 'Sketch 5.45', group: 'B. Contour+RNA' },
    { name: 'sketch5.5', label: 'Sketch 5.5 B. Contour+RNA Particles', group: 'B. Contour+RNA' },
     { name: 'sketch5.6', label: 'Sketch 5.6 Tracing Lines', group: 'B. Contour+RNA' },
    // { name: 'sketch5.7', label: 'Sketch 5.7', group: 'B. Contour+RNA' },
    // { name: 'sketch5.8', label: 'Sketch 5.8', group: 'B. Contour+RNA' },
    // { name: 'sketch5.45', label: 'Sketch 5.45', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.46', label: 'Sketch 5.46', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.47', label: 'Sketch 5.47', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.48', label: 'Sketch 5.48 Drawing Image Colors', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.49', label: 'Sketch 5.49', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.51', label: 'Sketch 5.51', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.52', label: 'Sketch 5.52', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.61', label: 'Sketch 5.61 Moving Lines', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.62', label: 'Sketch 5.62 GLITCH', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.63', label: 'Sketch 5.63', group: 'C. Contour+RNA+UpwardGraph' },
    { name: 'sketch5.64', label: 'Sketch 5.64 Resembling Stars!', group: 'D. Exploration' },
    { name: 'sketch5.65', label: 'Sketch 5.65 RNA Moving through Possibility', group: 'D. Exploration' },
    { name: 'sketch5.66', label: 'Sketch 5.66', group: 'D. Exploration' },
    { name: 'sketch13', label: 'Sketch 13', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch14', label: 'Sketch 14', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch15', label: 'Sketch 15', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch16', label: 'Sketch 16', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch17', label: 'Sketch 17', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch18', label: 'Sketch 18', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch19', label: 'Sketch 19', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch20', label: 'Sketch 20', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch21', label: 'Sketch 21', group: 'E. Waves / Terrain / Possibility' },
    { name: 'sketch22', label: 'Sketch 22', group: 'E. Waves / Terrain / Possibility' },
    // { name: 'sketch23', label: 'Sketch 23', group: 'E. Waves / Terrain / Possibility' },
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
    // displayError(`Failed to load sketch "${sketchName}".`);
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
