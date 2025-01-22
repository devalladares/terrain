// sketches/sketch16.js

export default function sketch16(p) {
  /**
   * p5.js Sketch: Terrain to Wave using Marching Squares (Static Version)
   * 
   * 1. Loads terrain image (1.jpg)
   * 2. Extracts brightness (height) data
   * 3. Runs marching squares for multiple iso-levels
   * 4. Renders static contour lines based on terrain
   */

  // ----------------------
  // Variables at the Top
  // ----------------------
  const IMAGE_PATH = 'images/1.jpg';     // Path to your terrain image
  const CANVAS_WIDTH = 800;       // Canvas width in pixels
  const CANVAS_HEIGHT = 600;      // Canvas height in pixels

  // Iso-levels for contour lines
  const ISO_STEP = 40;             // Step between iso-levels (e.g., 0, 40, 80, ...)
  const MAX_BRIGHTNESS = 255;      // Maximum brightness value

  // Visual Settings
  const BG_COLOR = [20, 20, 20];   // Background color (RGB array)
  const STROKE_COLOR = [120, 255, 120]; // Contour line color (RGB array)
  const STROKE_WEIGHT_VAL = 1;     // Thickness of contour lines

  // Internal Variables
  let img;                         // Loaded image
  let terrainData = [];            // 2D array storing brightness
  let contours = [];               // Array to store all contour segments
  let levels = [];                 // Array of iso-levels

  // -----------------------------------------------------------------------------
  // 1) PRELOAD: Load the Image
  // -----------------------------------------------------------------------------
  p.preload = function() {
    // Ensure '1.jpg' is placed in the 'sketches' folder or update the path accordingly
    img = p.loadImage(IMAGE_PATH);
  };

  // -----------------------------------------------------------------------------
  // 2) SETUP: Initialize Canvas, Process Image, Generate Contours
  // -----------------------------------------------------------------------------
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.noLoop(); // Disable continuous drawing for static rendering

    // Process the loaded image
    processImage();

    // Define iso-levels based on brightness step
    for (let level = 0; level <= MAX_BRIGHTNESS; level += ISO_STEP) {
      levels.push(level);
    }

    // Generate contour segments for all iso-levels
    contours = generateAllContours(terrainData, levels);

    // Log the number of generated segments
    console.log(`Generated ${contours.length} total contour segments.`);
  };

  // -----------------------------------------------------------------------------
  // 3) DRAW: Render the Contours
  // -----------------------------------------------------------------------------
  p.draw = function() {
    p.background(BG_COLOR);

    // Set visual styles for contour lines
    p.stroke(STROKE_COLOR);
    p.strokeWeight(STROKE_WEIGHT_VAL);
    p.noFill();

    p.push();
    // Optionally, center the image-based contours within the canvas
    // Calculate scaling factors if the image size differs from canvas size
    const scaleX = p.width / terrainData[0].length;
    const scaleY = p.height / terrainData.length;
    p.scale(scaleX, scaleY);

    // Draw each contour segment
    contours.forEach(seg => {
      p.line(seg.x1, seg.y1, seg.x2, seg.y2);
    });

    p.pop();
  };

  // -----------------------------------------------------------------------------
  // 4) PROCESS IMAGE: Extract Brightness Data
  // -----------------------------------------------------------------------------
  function processImage() {
    img.loadPixels();
    const imgW = img.width;
    const imgH = img.height;

    // Populate terrainData with brightness values (using the green channel)
    for (let y = 0; y < imgH; y++) {
      terrainData[y] = [];
      for (let x = 0; x < imgW; x++) {
        const index = (x + y * imgW) * 4;
        const g = img.pixels[index + 1]; // Green channel as height
        terrainData[y][x] = g;
      }
    }
  }

  // -----------------------------------------------------------------------------
  // 5) GENERATE CONTOURS: Marching Squares Implementation
  // -----------------------------------------------------------------------------
  function generateAllContours(data, isoLevels) {
    let allSegments = [];
    const h = data.length;
    const w = data[0].length;

    // Iterate through each iso-level
    isoLevels.forEach(level => {
      for (let y = 0; y < h - 1; y++) {
        for (let x = 0; x < w - 1; x++) {
          // Retrieve brightness values of the cell's corners
          const tl = data[y][x];
          const tr = data[y][x + 1];
          const br = data[y + 1][x + 1];
          const bl = data[y + 1][x];

          // Determine the cell index based on which corners exceed the iso-level
          let cellIndex = 0;
          if (tl > level) cellIndex |= 1;  // Top-Left
          if (tr > level) cellIndex |= 2;  // Top-Right
          if (br > level) cellIndex |= 4;  // Bottom-Right
          if (bl > level) cellIndex |= 8;  // Bottom-Left

          // Generate contour segments for the current cell and iso-level
          const segments = edgesForCase(cellIndex, level, tl, tr, br, bl, x, y);
          allSegments.push(...segments);
        }
      }
    });

    return allSegments;
  }

  /**
   * edgesForCase
   * Handles line segment creation based on the cell index and iso-level.
   * @param {number} cellIndex - The binary representation of the cell's corners.
   * @param {number} isoLevel - The current iso-level.
   * @param {number} tl - Top-Left brightness.
   * @param {number} tr - Top-Right brightness.
   * @param {number} br - Bottom-Right brightness.
   * @param {number} bl - Bottom-Left brightness.
   * @param {number} cx - Top-left x-coordinate of the cell.
   * @param {number} cy - Top-left y-coordinate of the cell.
   * @returns {Array} - Array of line segment objects.
   */
  function edgesForCase(cellIndex, isoLevel, tl, tr, br, bl, cx, cy) {
    const corners = [
      { val: tl, x: cx, y: cy },         // 0: Top-Left
      { val: tr, x: cx + 1, y: cy },     // 1: Top-Right
      { val: br, x: cx + 1, y: cy + 1 }, // 2: Bottom-Right
      { val: bl, x: cx, y: cy + 1 }      // 3: Bottom-Left
    ];

    const edges = [
      [0, 1], // Top Edge
      [1, 2], // Right Edge
      [2, 3], // Bottom Edge
      [3, 0]  // Left Edge
    ];

    // Standard marching squares edge table for 16 cases
    const edgeTable = [
      0b0000, // 0: No edges
      0b1001, // 1
      0b0011, // 2
      0b1010, // 3
      0b0110, // 4
      0b1111, // 5
      0b0101, // 6
      0b1100, // 7
      0b1100, // 8
      0b0101, // 9
      0b1111, // 10
      0b0110, // 11
      0b1010, // 12
      0b0011, // 13
      0b1001, // 14
      0b0000  // 15: No edges (fully inside or outside)
    ];

    const usedEdges = edgeTable[cellIndex];
    const lines = [];

    if (usedEdges === 0 || usedEdges === 15) {
      // No contour lines for fully inside or outside cells
      return lines;
    }

    const intersectPoints = [];

    for (let e = 0; e < 4; e++) {
      const mask = 1 << e;
      if ((usedEdges & mask) !== 0) {
        const [c1, c2] = edges[e];
        const point = interpolateIso(corners[c1], corners[c2], isoLevel);
        intersectPoints.push(point);
      }
    }

    // Typically, two intersection points per cell to form a single line segment
    if (intersectPoints.length === 2) {
      const seg = {
        x1: intersectPoints[0].x,
        y1: intersectPoints[0].y,
        x2: intersectPoints[1].x,
        y2: intersectPoints[1].y
      };
      lines.push(seg);
    }

    return lines;
  }

  /**
   * interpolateIso
   * Calculates the intersection point between two corners based on the iso-level.
   * @param {Object} cornerA - First corner with properties val, x, y.
   * @param {Object} cornerB - Second corner with properties val, x, y.
   * @param {number} iso - The iso-level value.
   * @returns {Object} - Intersection point with properties x and y.
   */
  function interpolateIso(cornerA, cornerB, iso) {
    const diff = cornerB.val - cornerA.val;
    // Prevent division by zero
    const t = (diff === 0) ? 0.5 : (iso - cornerA.val) / diff;

    // Clamp t between 0 and 1
    const clampedT = p.constrain(t, 0, 1);

    const x = p.lerp(cornerA.x, cornerB.x, clampedT);
    const y = p.lerp(cornerA.y, cornerB.y, clampedT);

    return { x, y };
  }
}
