const ROWS = 8; // total number of horizontal pitches (notes)
const COLS = 16; // total number of vertical time steps (beats)

/**
 * Names for each row / note names.
 * Numbers 3 and 2 refer to octaves. It is arranged in the order of highest note first.
 * More info: {@link https://www.musicandtheory.com/an-easy-guide-to-scientific-pitch-notation/}
 */
const NOTE_NAMES = ["C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2"]; // TODO: ADD MORE NOTES AND OCTAVES, MAKE IT DYNAMIC DEPENDING ON ROWS

/**
 * Create an HTML element with provided class and id
 * @param {string} tag - HTML tag name (e.g., 'div', 'span', 'button').
 * @param {string} cssClass - Class name(s) for the element.
 * @param {string} idAttr - ID for the element.
 * @returns {HTMLElement} The created HTML element.
 * @example
 * const myElement = el("span", "dummy-class", "dummy-id");
 * // It will create
 * <span class='dummy-class' id='dummy-id'></span>
 */
function el(tag, cssClass, idAttr) {
  const htmlElement = document.createElement(tag);
  if (cssClass) {
    htmlElement.className = cssClass;
  }
  if (idAttr) {
    htmlElement.id = idAttr;
  }
  return htmlElement;
}

/**
 * Render the interactive grid for the song maker.
 * @param {HTMLElement} container - The DOM element to render the grid into.
 */
function renderGrid(container) {
  // Outer grid layout container
  const gridLayout = el("div", "grid-layout", "grid-layout-1");

  // Left column: note labels
  const labelsLeftSide = el("div", "labels-left-side", "labels-left-side-1");
  const rulerSpacer = el("div", "ruler-spacer"); // Spacer for alignment
  labelsLeftSide.appendChild(rulerSpacer);

  // Container for note labels
  const rowLabels = el("div", "row-labels");
  rowLabels.style.gridTemplateRows = `repeat(${ROWS}, 32px)`; // Set rows dynamically

  // Add note labels to the left side
  NOTE_NAMES.forEach((noteName) => {
    const rowLabel = el("div", "row-label");
    rowLabel.textContent = noteName; // Set the text content to the note name
    rowLabels.appendChild(rowLabel); // Append the label to the row labels container
  });
  labelsLeftSide.appendChild(rowLabels); // Add the row labels to the left side
  gridLayout.appendChild(labelsLeftSide); // Add the left side to the grid layout

  // Right column: ruler + clickable cells
  const gridRightSide = el("div", "grid-right-side"); // Right side of the grid

  // Ruler on top to show beat numbers
  const ruler = el("div", "ruler"); // Ruler element
  ruler.style.gridTemplateColumns = `repeat(${COLS}, 32px)`; // Set columns dynamically

  // Add beat numbers to the ruler
  for (let colIdx = 1; colIdx <= COLS; colIdx++) {
    const isBeat = colIdx % 4 === 0; // Highlight every 4th beat. This is done by checking if the column index is divisible by 4.
    const rulerCell = el("div", `ruler-cell${isBeat ? " beat" : ""}`); // Create a ruler cell with a class for beats
    rulerCell.textContent = colIdx;
    ruler.appendChild(rulerCell); // Append the ruler cell to the ruler
  }
  gridRightSide.appendChild(ruler); // Add the ruler to the right side of the grid

  const gridInner = el("div", "grid-inner"); // Inner grid container
  gridInner.style.gridTemplateColumns = `repeat(${COLS}, 32px)`; // Set columns dynamically

  /**
   * 2D array for storing active notes. 'false' means inactive.
   * Each cell corresponds to a note at a specific time step.
   * The gridState is initialized with 'false' for all cells.
   * @type boolean[][]
   * @example
   * const gridState = [
   *   [false, false, false, ...], // Row 0 (C3) with 16 columns (see ROWS and COLS constants)
   *   [false, false, false, ...], // Row 1 (B2) with 16 columns
   * ... // and so on for each row and column
   * ];
   */
  const gridState = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

  /**
   * Update the visual state of a cell based on its active/inactive state.
   * @param {HTMLElement} cell - The cell element to update.
   * @param {number} row - Row index.
   * @param {number} col - Column index.
   */
  function updateCellElement(cell, row, col) {
    const isActive = gridState[row][col];
    cell.classList.toggle("active", isActive); // Toggle the 'active' class based on the cell's state
  }

  /**
   * Toggle the state of a cell and update its appearance.
   * @param {number} rowNumber - Row index.
   * @param {number} colNumber - Column index.
   * @param {HTMLElement} cellElement - The cell element to update.
   */
  function toggleCellState(rowNumber, colNumber, cellElement) {
    gridState[rowNumber][colNumber] = !gridState[rowNumber][colNumber]; // Toggle the state of the cell - true to active, false to inactive
    updateCellElement(cellElement, rowNumber, colNumber); // Update the cell's appearance based on its new state by adding or removing the 'active' class
  }

  // Create grid cells and add click event listeners
  for (let eachRow = 0; eachRow < ROWS; eachRow++) {
    for (let eachCol = 0; eachCol < COLS; eachCol++) {
      const cell = el("button", "cell");

      /**
       * Add click event listener to each cell.
       * When clicked, it toggles the cell's state (false/true).
       * Event Listeners: {@link https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener}
       */
      cell.addEventListener("click", () =>
        toggleCellState(eachRow, eachCol, cell)
      );

      gridInner.appendChild(cell); // Append the cell to the inner grid
    }
  }

  gridRightSide.appendChild(gridInner); // Add the inner grid to the right side of the grid
  gridLayout.appendChild(gridRightSide); // Add the right side to the grid layout
  container.appendChild(gridLayout); // Finally, append the entire grid layout to the container

  return {
    gridState,
    gridInner,
    ruler,
  };
}

/**
 * Main entry point: renders the grid into the #grid element.
 */
function main() {
  const gridContainer = document.getElementById("grid");
  if (!gridContainer) {
    console.error("grid element missing");
    return;
  }
  const gridRefs = renderGrid(gridContainer); // Build the grid UI

  // Access to Controls
  const playButton = document.getElementById("play");
  const tempoInput = document.getElementById("tempo");
  const waveSelect = document.getElementById("waveSelect");
  const clearButton = document.getElementById("clearBtn");
  const randomiseButton = document.getElementById("randomBtn");

  // Playback state management
  let audioContext = null;
  let isPlaying = false;
  let currentColumn = 0;
  let timerId = null;
  const baseFrequency = 65.41; // frequency of C2

  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new window.AudioContext(); // TODO: add window.webkitAudioContext. See: https://github.com/mdn/webaudio-examples/blob/main/violent-theremin/scripts/app.js#L18
    }
  }

  // Calculate how long we will wait before moving to next column
  function getColumnDurationMs() {
    const bpm = parseInt(tempoInput?.value) || 120;
    return 60_000 / bpm / 4; // 60_000 -> 60 seconds * 1000 milliseconds, bpm -> user input of tempo, 4 -> 4 columns per beat
  }

  function getFrequencyForRow(row) {
    const semitoneSteps = [0, 2, 4, 5, 7, 9, 11, 12]; // smallest step difference between pitches in Western music
    const step = semitoneSteps[row] || 0;
    return baseFrequency * Math.pow(2, step / 12);
  }

  function playNoteAt(row, time) {
    const frequency = getFrequencyForRow(row);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const waveForm = waveSelect?.value || "sine";
    oscillator.type = waveForm;

    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.001; // 0.1% volume
    oscillator.connect(gainNode).connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    oscillator.start(time);
    oscillator.stop(time + 0.3);
  }

  function highlightColumn(col, on) {
    const gridInner = gridRefs.gridInner;
    const ruler = gridRefs.ruler;
    if (!gridInner || !ruler) {
      console.error("grid or ruler reference missing");
      return;
    }

    for (let r = 0; r < ROWS; r++) {
      const cellIndex = r * COLS + col;
      const cell = gridInner.children[cellIndex];
      if (cell) {
        cell.classList.toggle("playing-col", on);
      }
    }

    const rulerCell = ruler.children[col];
    if (rulerCell) {
      rulerCell.classList.toggle("playing-col", on);
    }
  }

  function playbackStep() {
    if (!isPlaying || !audioContext) return;
    const now = audioContext.currentTime;

    const gridState = gridRefs.gridState;

    for (let r = 0; r < ROWS; r++) {
      if (gridState[r][currentColumn]) {
        playNoteAt(r, now);
      }
    }

    highlightColumn(currentColumn, true);
    const prevColumn = (currentColumn - 1 + COLS) % COLS;
    highlightColumn(prevColumn, false);

    currentColumn = (currentColumn + 1) % COLS;
    timerId = setTimeout(playbackStep, getColumnDurationMs());
  }

  function setControlsDisabled(disabled) {
    [clearButton, randomiseButton].forEach((eachEl) => {
      if (eachEl) {
        eachEl.disabled = disabled;
      }
    });
  }

  function startPlayback() {
    ensureAudioContext();
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    if (isPlaying) return;

    isPlaying = true;
    playButton.textContent = "Stop";
    setControlsDisabled(true);
    currentColumn = 0;
    playbackStep();
  }

  function stopPlayback() {
    if (!isPlaying) return;

    isPlaying = false;
    playButton.textContent = "Play";
    clearTimeout(timerId); // stop the loop of playing
    for (let c = 0; c < COLS; c++) {
      highlightColumn(c, false);
    }
    setControlsDisabled(false);
  }

  playButton.addEventListener("click", () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  tempoInput.addEventListener("change", () => {
    if (isPlaying) {
      clearTimeout(timerId);
      playbackStep();
    }
  });

  clearButton.addEventListener("click", () => {
    const gridState = gridRefs.gridState;
    const gridInner = gridRefs.gridInner;
    for (let eachRow = 0; eachRow < ROWS; eachRow++) {
      for (let eachCol = 0; eachCol < COLS; eachCol++) {
        const cellIndex = eachRow * COLS + eachCol;
        const cell = gridInner.children[cellIndex];
        gridState[eachRow][eachCol] = false;
        cell.classList.remove("active");
      }
    }
  });

  randomiseButton.addEventListener("click", () => {
    const probability = 0.2; // probability of the note being active
    const gridState = gridRefs.gridState;
    const gridInner = gridRefs.gridInner;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isActive = Math.random() < probability;
        gridState[r][c] = isActive;
        const cellIndex = r * COLS + c;
        const cell = gridInner.children[cellIndex];
        cell.classList.toggle("active", isActive);
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("Welcome to Song Maker");
  main();
}); // Call the main function to run, when the script is loaded
