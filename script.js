const Config = {
  canvas: document.getElementById("canvas"),
  width: 100,
  height: 100,
  cellSize: 6,
  added_noise: 0.3,
  fps: 10,
  colors: [255, 0, 50, 75, 100, 125, 150, 175, 200, 225, 250],
  automationRules: [
    // Game of Life rules
    [2, 3],
    [3],
    2
  ]
};

/**
 * Calculates cell index on coordinates (x,y) with cell size being w*h pixels
 */
function cellNum(x, y, w, h) {
  return ((y + h) % h) * w + ((x + w) % w);
}

/**
 * Creates an automation function that transforms array of cell to another
 * This function is universal, rules are in the format described here:
 * http://conwaylife.com/wiki/Rulestring
 */
function makeGenerationsAutomation(survive, born, count) {
  const setSurvive = new Set(survive);
  const setBorn = new Set(born);

  return (cells, w, h) => {
    const newCells = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const i = cellNum(x, y, w, h);

        let neighbors = -cells[i]; // to not count current cell twice
        for (let dx = -1; dx <= 1; dx += 1) {
          for (let dy = -1; dy <= 1; dy += 1) {
            neighbors += cells[cellNum(x + dx, y + dy, w, h)];
          }
        }

        if (
          (cells[i] === 0 && setBorn.has(neighbors)) ||
          (cells[i] === 1 && setSurvive.has(neighbors))
        ) {
          newCells[i] = 1;
        } else if (cells[i] === 0) {
          newCells[i] = 0;
        } else {
          newCells[i] = (cells[i] + 1) % count;
        }
      }
    }
    return newCells;
  };
}

/**
 * Creates a draw function that draws the cells array to a specified canvas
 */
function makeDrawFunction(canvas, w, h, cellSize) {
  const ctx = canvas.getContext("2d");
  return function drawCells(cells) {
    const img = ctx.createImageData(w * cellSize, h * cellSize);
    for (let y = 0; y < h * cellSize; y += 1) {
      for (let x = 0; x < w * cellSize; x += 1) {
        const xCell = Math.floor(x / cellSize);
        const yCell = Math.floor(y / cellSize);
        const cell = cells[cellNum(xCell, yCell, w, h)];
        const color = Config.colors[Math.min(cell, Config.colors.length)];
        const i = cellNum(x, y, w * cellSize, h * cellSize) * 4;
        img.data[i] = color;
        img.data[i + 1] = color;
        img.data[i + 2] = color;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  };
}

/**
 * Starts the simulation
 */
(() => {
  Config.canvas.width = Config.width * Config.cellSize;
  Config.canvas.height = Config.height * Config.cellSize;
  const draw = makeDrawFunction(
    Config.canvas,
    Config.width,
    Config.height,
    Config.cellSize,
    Config.colors
  );
  const automation = makeGenerationsAutomation(...Config.automationRules);
  let cells = new Uint8ClampedArray(Config.width * Config.height);

  // Add noise
  for (let i = 0; i < Config.width * Config.height; i += 1) {
    if (Math.random() < Config.added_noise) cells[i] = 1;
  }

  function updateCells() {
    if (document.hasFocus()) {
      window.requestAnimationFrame(() => draw(cells));
      cells = automation(cells, Config.width, Config.height);
    }
    window.setTimeout(updateCells, 1000 / Config.fps);
  }
  updateCells();
})();
