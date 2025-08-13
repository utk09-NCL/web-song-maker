const ROWS = parseInt(window.sessionStorage.getItem("songMaker_ROWS")) || 8; // total number of horizontal pitches (notes)
const COLS = parseInt(window.sessionStorage.getItem("songMaker_COLS")) || 16; // total number of vertical time steps (beats)

window.sessionStorage.setItem("songMaker_ROWS", ROWS);
window.sessionStorage.setItem("songMaker_COLS", COLS);

/**
 * Names for each row / note names.
 * Numbers 3 and 2 refer to octaves. It is arranged in the order of highest note first.
 * More info: {@link https://www.musicandtheory.com/an-easy-guide-to-scientific-pitch-notation/}
 */
const NOTE_NAMES = JSON.parse(
  window.sessionStorage.getItem("songMaker_NOTE_NAMES")
) || ["C3", "B2", "A2", "G2", "F2", "E2", "D2", "C2"];

window.sessionStorage.setItem(
  "songMaker_NOTE_NAMES",
  JSON.stringify(NOTE_NAMES)
);

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

  /**
   * @returns {{gridState: boolean[][], gridInner: HTMLElement, ruler: HTMLElement}}
   * An object containing references to the grid's state and key DOM elements.
   * This allows other parts of the application to interact with the grid.
   */
  return {
    gridState, // The 2D array representing the active notes
    gridInner, // The DOM element containing the grid cells
    ruler, // The DOM element for the top ruler
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
  let audioContext = null; // The AudioContext for playing sound
  let isPlaying = false; // Flag to track playback state
  let currentColumn = 0; // The currently playing column index
  let timerId = null; // ID for the setTimeout loop
  const baseFrequency = 65.41; // frequency of C2, the lowest note

  /**
   * Ensures that an AudioContext is created.
   * An AudioContext is necessary for any web audio operations.
   * It is created on-demand to support browsers that require user interaction first.
   */
  function ensureAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Calculate how long we will wait before moving to the next column, in milliseconds.
   * @returns {number} The duration of each column in ms.
   */
  function getColumnDurationMs() {
    const bpm = parseInt(tempoInput?.value) || 120; // Beats per minute from the tempo input
    // 60,000 ms in a minute / bpm gives duration of one beat.
    // We divide by 4 because we have 4 columns per beat (16th notes).
    return 60_000 / bpm / 4;
  }

  /**
   * Calculates the frequency for a given row index based on a major scale.
   * @param {number} row - The row index (0 is the highest note).
   * @returns {number} The frequency in Hz for the given note.
   */
  function getFrequencyForRow(row) {
    // These are the steps in semitones from the base note for a C-Major scale from high to low.
    const semitoneSteps = [12, 11, 9, 7, 5, 4, 2, 0]; // C3, B2, A2, G2, F2, E2, D2, C2
    const step = semitoneSteps[row] || 0;
    // Formula for calculating frequency from a base frequency and semitone steps.
    return baseFrequency * Math.pow(2, step / 12);
  }

  /**
   * Plays a single note at a specific time.
   * @param {number} row - The row of the note to play.
   * @param {number} time - The time (from audioContext.currentTime) to schedule the note play.
   */
  function playNoteAt(row, time) {
    const frequency = getFrequencyForRow(row);
    const oscillator = audioContext.createOscillator(); // Creates a sound source
    const gainNode = audioContext.createGain(); // Controls the volume

    const waveForm = waveSelect?.value || "sine"; // Get waveform from dropdown
    oscillator.type = waveForm;

    oscillator.frequency.value = frequency; // Set the note's pitch
    gainNode.gain.value = 0.001; // Start with a very low volume
    oscillator.connect(gainNode).connect(audioContext.destination); // Connect oscillator to gain, then to output

    // Create a short volume envelope to make the note sound more natural.
    gainNode.gain.setValueAtTime(0.001, time);
    gainNode.gain.linearRampToValueAtTime(0.2, time + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.25); // Exponential decay

    oscillator.start(time); // Play the note at the scheduled time
    oscillator.stop(time + 0.3); // Stop it after 0.3 seconds
  }

  /**
   * Toggles the visual highlight for a column of cells and its ruler cell.
   * @param {number} col - The column index to highlight.
   * @param {boolean} on - true to add the highlight, false to remove it.
   */
  function highlightColumn(col, on) {
    const gridInner = gridRefs.gridInner;
    const ruler = gridRefs.ruler;
    if (!gridInner || !ruler) {
      console.error("grid or ruler reference missing");
      return;
    }

    // Highlight all cells in the column
    for (let r = 0; r < ROWS; r++) {
      const cellIndex = r * COLS + col;
      const cell = gridInner.children[cellIndex];
      if (cell) {
        cell.classList.toggle("playing-col", on);
      }
    }

    // Highlight the corresponding ruler cell
    const rulerCell = ruler.children[col];
    if (rulerCell) {
      rulerCell.classList.toggle("playing-col", on);
    }
  }

  /**
   * The main playback loop function, called for each time step (column).
   */
  function playbackStep() {
    if (!isPlaying || !audioContext) return; // Stop if playback is paused or audio is not ready
    const now = audioContext.currentTime; // Get the precise current time from the audio engine

    const gridState = gridRefs.gridState;

    // Play all active notes in the current column
    for (let r = 0; r < ROWS; r++) {
      if (gridState[r][currentColumn]) {
        playNoteAt(r, now);
      }
    }

    // Highlight the current column and un-highlight the previous one
    highlightColumn(currentColumn, true);
    const prevColumn = (currentColumn - 1 + COLS) % COLS; // Wrap around for the first column
    highlightColumn(prevColumn, false);

    currentColumn = (currentColumn + 1) % COLS; // Move to the next column, looping back to 0 at the end
    timerId = setTimeout(playbackStep, getColumnDurationMs()); // Schedule the next step
  }

  /**
   * Disables or enables control buttons during playback.
   * @param {boolean} disabled - true to disable, false to enable.
   */
  function setControlsDisabled(disabled) {
    [clearButton, randomiseButton].forEach((eachEl) => {
      if (eachEl) {
        eachEl.disabled = disabled;
      }
    });
  }

  /**
   * Starts the song playback.
   */
  function startPlayback() {
    ensureAudioContext(); // Make sure AudioContext is ready
    // In some browsers, audio context starts suspended and must be resumed by user action.
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
    if (isPlaying) return; // Do nothing if already playing

    isPlaying = true;
    playButton.textContent = "Stop";
    setControlsDisabled(true); // Disable clear & randomise buttons during playback
    currentColumn = 0; // Start from the beginning
    playbackStep(); // Start the playback loop
  }

  /**
   * Stops the song playback.
   */
  function stopPlayback() {
    if (!isPlaying) return; // Do nothing if not playing

    isPlaying = false;
    playButton.textContent = "Play";
    clearTimeout(timerId); // Stop the setTimeout loop
    // Remove all column highlights
    for (let c = 0; c < COLS; c++) {
      highlightColumn(c, false);
    }
    setControlsDisabled(false); // Re-enable controls
  }

  // Add a click event listener to the play/stop button
  playButton.addEventListener("click", () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  // Add a change event listener to the tempo input to adjust speed live
  tempoInput.addEventListener("change", () => {
    if (isPlaying) {
      clearTimeout(timerId); // Stop the current loop
      playbackStep(); // Start a new one with the updated tempo
    }
  });

  // Add a click event listener to the clear button
  clearButton.addEventListener("click", () => {
    const gridState = gridRefs.gridState;
    const gridInner = gridRefs.gridInner;

    for (let eachRow = 0; eachRow < ROWS; eachRow++) {
      for (let eachCol = 0; eachCol < COLS; eachCol++) {
        const cellIndex = eachRow * COLS + eachCol;
        const cell = gridInner.children[cellIndex];
        gridState[eachRow][eachCol] = false; // Set state to inactive
        cell.classList.remove("active"); // Remove css active state
      }
    }
  });

  // Add a click event listener to the randomise button
  randomiseButton.addEventListener("click", () => {
    const probability = 0.2; // 20% chance for a note to be active
    const gridState = gridRefs.gridState;
    const gridInner = gridRefs.gridInner;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const isActive = Math.random() < probability; // Decide if the cell should be active
        gridState[r][c] = isActive;
        const cellIndex = r * COLS + c;
        const cell = gridInner.children[cellIndex];
        cell.classList.toggle("active", isActive); // Update css class
      }
    }
  });
}

// When the initial HTML document has been completely loaded and parsed, run the main function.
window.addEventListener("DOMContentLoaded", () => {
  console.log("Welcome to Song Maker");
  main();
});
