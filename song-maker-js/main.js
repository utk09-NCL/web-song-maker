/**
 * Main controller for the Web Song Maker application.
 * Manages application state, grid rendering, audio playback, and user interactions.
 *
 * This module serves as the central hub for:
 * - Application state management
 * - DOM initialization and event binding
 * - Audio playback coordination
 * - User interaction handling
 * - Data persistence via sessionStorage
 */
import { DEFAULT_COLS, DEFAULT_NOTES, ALL_NOTES } from "./js/config.js";
import { renderGrid } from "./js/grid.js";
import {
  ensureAudioContext,
  setVolume,
  playNote,
  highlightColumn,
} from "./js/audio.js";
import { setupControls, populateNoteSelectors } from "./js/ui.js";
import {
  STORAGE_KEYS,
  ELEMENT_IDS,
  GRID_LIMITS,
  AUDIO_CONFIG,
  MESSAGES,
  RANDOMIZE_CONFIG,
} from "./js/constants.js";
import {
  saveToStorage,
  loadFromStorage,
  showNotification,
  getRequiredElement,
  isValidGridState,
  isValidArray,
  isNonEmptyString,
  isNumberInRange,
  calculateNoteDuration,
} from "./js/utilities.js";

/**
 * Global application state object.
 * Centralizes all mutable state to prevent scattered variables and improve maintainability.
 */
let appState = {
  /** Whether the sequencer is currently playing */
  isPlaying: false,
  /** Current column being played (0-indexed) */
  currentColumn: 0,
  /** Timer ID for the playback loop */
  timerId: null,
  /** Number of columns in the current grid */
  cols: DEFAULT_COLS,
  /** Array of musical notes currently displayed in the grid rows */
  notes: [...DEFAULT_NOTES],
  /** 2D boolean array representing which cells are active [row][col] */
  gridState: null,
  /** References to DOM elements for the rendered grid */
  gridRefs: null,
};

/**
 * Main application entry point.
 * Initializes the application by setting up DOM references, loading saved state,
 * configuring event listeners, and rendering the initial interface.
 *
 * @throws {Error} If required DOM elements are not found
 */
function main() {
  try {
    // Get references to key DOM elements with validation
    const gridContainer = getRequiredElement(ELEMENT_IDS.GRID_CONTAINER);
    const playButton = getRequiredElement(ELEMENT_IDS.PLAY_BUTTON);
    const tempoInput = getRequiredElement(ELEMENT_IDS.TEMPO_SLIDER);
    const volumeInput = getRequiredElement(ELEMENT_IDS.VOLUME_SLIDER);
    const waveSelect = getRequiredElement(ELEMENT_IDS.WAVE_SELECT);

    // Load saved state and render the initial grid
    initializeGrid();

    // Wire up core playback controls with error handling
    playButton.addEventListener("click", togglePlayback);
    volumeInput.addEventListener("input", (e) => {
      try {
        const volume = parseFloat(e.target.value);
        setVolume(volume);
      } catch (error) {
        console.error("Failed to set volume:", error);
        showNotification("Failed to update volume", "error");
      }
    });

    // Initialize note selectors with all available notes
    populateNoteSelectors(ALL_NOTES);

    // Initialize all UI controls with callback functions
    setupControls({
      onClear: clearGrid,
      onRandomize: randomizeGrid,
      onGridChange: updateGridConfiguration,
    });

    // Set up keyboard shortcuts
    setupKeyboardShortcuts();

    /**
     * Initializes the grid by loading saved configuration from sessionStorage
     * and rendering the grid with the appropriate state.
     * Handles loading errors gracefully and validates loaded data.
     */
    function initializeGrid() {
      try {
        // Load saved grid dimensions with validation
        const savedCols = loadFromStorage(
          STORAGE_KEYS.COLUMNS,
          DEFAULT_COLS,
          (value) =>
            isNumberInRange(
              value,
              GRID_LIMITS.MIN_COLUMNS,
              GRID_LIMITS.MAX_COLUMNS
            )
        );
        appState.cols = savedCols;

        // Load saved notes with validation
        const savedNotes = loadFromStorage(
          STORAGE_KEYS.NOTE_NAMES,
          [...DEFAULT_NOTES],
          (value) => isValidArray(value, isNonEmptyString)
        );
        appState.notes = savedNotes;

        // Load saved cell states with validation
        const savedState = loadFromStorage(
          STORAGE_KEYS.GRID_STATE,
          null,
          (value) =>
            isValidGridState(value, appState.notes.length, appState.cols)
        );
        appState.gridState = savedState || createEmptyGrid();

        // Render the grid DOM elements and store references for later manipulation
        appState.gridRefs = renderGrid(
          gridContainer,
          appState.notes,
          appState.cols,
          appState.gridState
        );

        // Set up event listener for cell state changes
        setupGridEventListeners(gridContainer);
      } catch (error) {
        console.error("Failed to initialize grid:", error);
        showNotification(MESSAGES.STORAGE_LOAD_ERROR, "error");

        // Fallback to defaults
        appState.cols = DEFAULT_COLS;
        appState.notes = [...DEFAULT_NOTES];
        appState.gridState = createEmptyGrid();
        appState.gridRefs = renderGrid(
          gridContainer,
          appState.notes,
          appState.cols,
          appState.gridState
        );

        // Set up event listener for cell state changes
        setupGridEventListeners(gridContainer);
      }
    }

    /**
     * Creates a 2D boolean array filled with false values.
     * Dimensions are based on current notes (rows) and columns.
     * @returns {boolean[][]} Empty grid state where all cells are inactive
     */
    function createEmptyGrid() {
      return Array.from({ length: appState.notes.length }, () =>
        Array(appState.cols).fill(false)
      );
    }

    /**
     * Persists current application state to browser's sessionStorage.
     * Saves grid cell states, column count, and note configuration.
     * Provides user feedback on save success/failure.
     */
    function saveState() {
      const saveOperations = [
        () => saveToStorage(STORAGE_KEYS.GRID_STATE, appState.gridState),
        () => saveToStorage(STORAGE_KEYS.COLUMNS, appState.cols),
        () => saveToStorage(STORAGE_KEYS.NOTE_NAMES, appState.notes),
      ];

      const allSuccessful = saveOperations.every((operation) => operation());

      if (!allSuccessful) {
        console.warn("Some state data failed to save");
      }
    }

    /**
     * Clears all active cells in the grid and saves the state.
     * Provides user feedback upon completion.
     */
    function clearGrid() {
      try {
        appState.gridState = createEmptyGrid();
        saveState();
        refreshGrid();
        showNotification("Grid cleared successfully", "success");
      } catch (error) {
        console.error("Failed to clear grid:", error);
        showNotification("Failed to clear grid", "error");
      }
    }

    /**
     * Randomly activates cells in the grid with a configured probability.
     * Creates interesting musical patterns while maintaining usability.
     */
    function randomizeGrid() {
      try {
        // First clear the grid
        appState.gridState = createEmptyGrid();

        // Then randomly activate cells based on configuration
        for (let row = 0; row < appState.notes.length; row++) {
          for (let col = 0; col < appState.cols; col++) {
            if (Math.random() < RANDOMIZE_CONFIG.CELL_ACTIVATION_PROBABILITY) {
              appState.gridState[row][col] = true;
            }
          }
        }

        saveState();
        refreshGrid();
        showNotification("Grid randomized successfully", "success");
      } catch (error) {
        console.error("Failed to randomize grid:", error);
        showNotification("Failed to randomize grid", "error");
      }
    }

    function refreshGrid() {
      gridContainer.innerHTML = "";
      appState.gridRefs = renderGrid(
        gridContainer,
        appState.notes,
        appState.cols,
        appState.gridState
      );

      // Re-setup event listeners after grid refresh
      setupGridEventListeners(gridContainer);
    }

    /**
     * Sets up event listeners for grid cell interactions.
     * Listens for custom cellStateChange events and updates application state.
     *
     * @param {HTMLElement} container - Grid container element
     */
    function setupGridEventListeners(container) {
      // Remove existing listener if present
      container.removeEventListener("cellStateChange", handleCellStateChange);

      // Add event listener for cell state changes
      container.addEventListener("cellStateChange", handleCellStateChange);
    }

    /**
     * Sets up keyboard shortcuts for improved user experience.
     * Handles global keyboard events with proper focus management.
     */
    function setupKeyboardShortcuts() {
      document.addEventListener("keydown", (event) => {
        // Don't trigger shortcuts when typing in input fields
        if (event.target.matches("input, select, textarea")) {
          return;
        }

        // Don't trigger shortcuts when help overlay is open (except Escape)
        const helpOverlay = document.getElementById("helpOverlay");
        const isHelpOpen = helpOverlay && !helpOverlay.hasAttribute("hidden");
        if (isHelpOpen && event.key !== "Escape") {
          return;
        }

        try {
          switch (event.key.toLowerCase()) {
            case " ": // Space bar - Play/Stop
              event.preventDefault();
              togglePlayback();
              break;

            case "c": // C - Clear grid
              event.preventDefault();
              clearGrid();
              break;

            case "r": // R - Randomize grid
              event.preventDefault();
              randomizeGrid();
              break;

            case "?": // ? - Toggle help
            case "/": // Also handle / key for help
              if (event.shiftKey || event.key === "?") {
                event.preventDefault();
                if (window.toggleHelp) {
                  window.toggleHelp();
                }
              }
              break;

            case "escape": // Escape - Close help or stop playback
              event.preventDefault();
              if (isHelpOpen && window.toggleHelp) {
                window.toggleHelp();
              } else if (appState.isPlaying) {
                stopPlayback();
              }
              break;
          }
        } catch (error) {
          console.error("Keyboard shortcut failed:", error);
          showNotification("Keyboard shortcut failed", "error");
        }
      });
    }

    /**
     * Updates the grid configuration with new note range and column count.
     * @param {string} startNote - Starting (lowest) note of the range
     * @param {string} endNote - Ending (highest) note of the range
     * @param {number} newColumns - Number of columns in the new grid
     */
    function updateGridConfiguration(startNote, endNote, newColumns) {
      if (appState.isPlaying) {
        stopPlayback();
      }

      // Validate notes
      const startIndex = ALL_NOTES.indexOf(startNote);
      const endIndex = ALL_NOTES.indexOf(endNote);

      if (startIndex === -1 || endIndex === -1) {
        showNotification(MESSAGES.INVALID_NOTES, "error");
        return;
      }

      // Since ALL_NOTES is ordered from high to low, startIndex should be >= endIndex
      // for a valid range from low to high notes
      if (startIndex < endIndex) {
        showNotification(MESSAGES.INVALID_NOTE_RANGE, "error");
        return;
      }

      // Validate columns using utility function
      if (
        !isNumberInRange(
          newColumns,
          GRID_LIMITS.MIN_COLUMNS,
          GRID_LIMITS.MAX_COLUMNS
        )
      ) {
        showNotification(MESSAGES.INVALID_COLUMNS, "error");
        return;
      }

      // Update state - slice from endIndex to startIndex+1 since array is high-to-low
      appState.notes = ALL_NOTES.slice(endIndex, startIndex + 1).reverse();
      appState.cols = newColumns;
      appState.gridState = createEmptyGrid();

      // Save and refresh
      saveState();
      refreshGrid();

      // Re-setup controls for the new grid
      setupControls({
        onClear: clearGrid,
        onRandomize: randomizeGrid,
        onGridChange: updateGridConfiguration,
      });

      // Provide success feedback
      showNotification(MESSAGES.GRID_UPDATED, "success");
    }

    /**
     * Calculates the duration of each grid column based on current tempo.
     * Uses 16th note subdivision for musical timing.
     *
     * @returns {number} Column duration in milliseconds
     */
    function getColumnDurationMs() {
      const bpm = parseInt(tempoInput.value);
      return calculateNoteDuration(bpm, AUDIO_CONFIG.NOTE_SUBDIVISION);
    }

    /**
     * Playback step function called at each column interval.
     * Plays active notes in the current column, updates visual highlights,
     * and schedules the next step.
     * @returns {void}
     */
    function playbackStep() {
      if (!appState.isPlaying) return;

      const now = ensureAudioContext().currentTime;
      const waveForm = waveSelect.value;

      // Play active notes in current column
      for (let row = 0; row < appState.notes.length; row++) {
        if (appState.gridState[row][appState.currentColumn]) {
          playNote(appState.notes[row], now, waveForm);
        }
      }

      // Update visual highlights
      const prevColumn =
        (appState.currentColumn - 1 + appState.cols) % appState.cols;
      highlightColumn(
        prevColumn,
        false,
        appState.gridRefs.gridInner,
        appState.gridRefs.ruler
      );
      highlightColumn(
        appState.currentColumn,
        true,
        appState.gridRefs.gridInner,
        appState.gridRefs.ruler
      );

      // Move to next column
      appState.currentColumn = (appState.currentColumn + 1) % appState.cols;
      appState.timerId = setTimeout(playbackStep, getColumnDurationMs());
    }

    /**
     * Starts the playback loop if not already playing.
     * Initializes playback state and begins the timed sequence.
     * @returns {void}
     */
    function startPlayback() {
      if (appState.isPlaying) return;
      appState.isPlaying = true;
      ensureAudioContext();
      playButton.textContent = "Stop";
      appState.currentColumn = 0;
      playbackStep();
    }

    /**
     * Stops the playback loop if currently playing.
     * Clears playback state and visual highlights.
     * @returns {void}
     */
    function stopPlayback() {
      if (!appState.isPlaying) return;
      appState.isPlaying = false;
      clearTimeout(appState.timerId);
      playButton.textContent = "Play";

      // Clear all highlights
      for (let c = 0; c < appState.cols; c++) {
        highlightColumn(
          c,
          false,
          appState.gridRefs.gridInner,
          appState.gridRefs.ruler
        );
      }
    }

    /**
     * Toggles playback state between playing and stopped.
     * @returns {void}
     */
    function togglePlayback() {
      if (appState.isPlaying) {
        stopPlayback();
      } else {
        startPlayback();
      }
    }

    /**
     * Event handler for grid cell state changes.
     * Updates the application state and persists changes.
     *
     * @param {CustomEvent} event - Custom event containing cell change details
     */
    function handleCellStateChange(event) {
      try {
        const { row, col, isActive } = event.detail;

        if (
          row >= 0 &&
          row < appState.notes.length &&
          col >= 0 &&
          col < appState.cols
        ) {
          appState.gridState[row][col] = isActive;
          saveState();
        } else {
          console.warn(`Invalid cell coordinates: row=${row}, col=${col}`);
        }
      } catch (error) {
        console.error("Failed to handle cell state change:", error);
        showNotification("Failed to update cell state", "error");
      }
    }
  } catch (error) {
    console.error("Failed to initialize application:", error);
    showNotification(
      "Application failed to start. Please refresh the page.",
      "error"
    );
  }
}

// Start the app
window.addEventListener("DOMContentLoaded", main);
