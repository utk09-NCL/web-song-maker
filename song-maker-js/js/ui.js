/**
 * UI controls initialization and event handler setup.
 * Manages user interface elements and their interactions.
 *
 * This module handles:
 * - Control panel initialization and event binding
 * - Slider value display management
 * - Grid configuration controls
 * - Note selector population
 * - User input validation and feedback
 */

import { ELEMENT_IDS, GRID_LIMITS, MESSAGES } from "./constants.js";
import {
  showNotification,
  getRequiredElement,
  isNumberInRange,
  isNonEmptyString,
  formatAsPercentage,
} from "./utilities.js";

/**
 * Initializes all user interface controls and event listeners.
 * Sets up event handlers for all interactive elements and provides error handling.
 *
 * @param {Object} callbacks - Object containing callback functions for user actions
 * @param {Function} callbacks.onClear - Function to call when clear button is clicked
 * @param {Function} callbacks.onRandomize - Function to call when randomize button is clicked
 * @param {Function} callbacks.onGridChange - Function to call when grid configuration changes
 * @throws {Error} If required UI elements are not found
 */
export function setupControls(callbacks) {
  try {
    const { onClear, onRandomize, onGridChange } = callbacks;

    // Wire up grid manipulation buttons with error handling
    const clearBtn = getRequiredElement(ELEMENT_IDS.CLEAR_BUTTON);
    const randomBtn = getRequiredElement(ELEMENT_IDS.RANDOM_BUTTON);

    clearBtn.addEventListener("click", () => {
      try {
        onClear();
      } catch (error) {
        console.error("Clear operation failed:", error);
        showNotification("Failed to clear grid", "error");
      }
    });

    randomBtn.addEventListener("click", () => {
      try {
        onRandomize();
      } catch (error) {
        console.error("Randomize operation failed:", error);
        showNotification("Failed to randomize grid", "error");
      }
    });

    // Initialize slider value displays and event handlers
    setupSliderDisplays();

    // Initialize grid configuration controls
    setupGridControls(onGridChange);
  } catch (error) {
    console.error("Failed to setup UI controls:", error);
    showNotification("Failed to initialize controls", "error");
    throw error;
  }
}

/**
 * Sets up tempo and volume sliders with real-time value displays.
 * Updates the display elements whenever slider values change.
 * Provides proper formatting for different value types (BPM vs percentage).
 *
 * @throws {Error} If required slider elements are not found
 */
function setupSliderDisplays() {
  try {
    const tempoSlider = getRequiredElement(ELEMENT_IDS.TEMPO_SLIDER);
    const tempoValue = getRequiredElement(ELEMENT_IDS.TEMPO_VALUE);
    const volumeSlider = getRequiredElement(ELEMENT_IDS.VOLUME_SLIDER);
    const volumeValue = getRequiredElement(ELEMENT_IDS.VOLUME_VALUE);

    // Update tempo display when slider moves (show as BPM)
    tempoSlider.addEventListener("input", () => {
      tempoValue.textContent = `${tempoSlider.value} BPM`;
    });

    // Update volume display when slider moves (show as percentage)
    volumeSlider.addEventListener("input", () => {
      const volumePercent = formatAsPercentage(parseFloat(volumeSlider.value));
      volumeValue.textContent = volumePercent;
    });

    // Initialize displays with current values
    tempoValue.textContent = `${tempoSlider.value} BPM`;
    volumeValue.textContent = formatAsPercentage(
      parseFloat(volumeSlider.value)
    );
  } catch (error) {
    console.error("Failed to setup slider displays:", error);
    showNotification("Failed to initialize sliders", "error");
    throw error;
  }
}

/**
 * Sets up the grid configuration controls for columns and note range.
 * Handles validation and triggers grid reconfiguration when the apply button is clicked.
 * Provides comprehensive input validation with user-friendly error messages.
 *
 * @param {Function} onGridChange - Callback function to handle grid changes
 * @param {string} onGridChange.startNote - The starting (lowest) note of the range
 * @param {string} onGridChange.endNote - The ending (highest) note of the range
 * @param {number} onGridChange.newColumns - The number of columns in the new grid
 * @throws {Error} If required grid control elements are not found
 */
function setupGridControls(onGridChange) {
  try {
    const colSelector = getRequiredElement(ELEMENT_IDS.COLUMNS_INPUT);
    const applyBtn = getRequiredElement(ELEMENT_IDS.APPLY_GRID_BUTTON);
    const startNoteSelect = getRequiredElement(ELEMENT_IDS.START_NOTE_SELECT);
    const endNoteSelect = getRequiredElement(ELEMENT_IDS.END_NOTE_SELECT);

    // Handle apply button clicks to change grid configuration
    applyBtn.addEventListener("click", () => {
      try {
        const selectedCols = parseInt(colSelector.value);
        const startNote = startNoteSelect.value;
        const endNote = endNoteSelect.value;

        // Comprehensive validation with specific error messages
        if (!isNonEmptyString(startNote) || !isNonEmptyString(endNote)) {
          showNotification(MESSAGES.MISSING_NOTE_SELECTION, "warning");
          return;
        }

        if (
          !isNumberInRange(
            selectedCols,
            GRID_LIMITS.MIN_COLUMNS,
            GRID_LIMITS.MAX_COLUMNS
          )
        ) {
          showNotification(MESSAGES.INVALID_COLUMNS, "warning");
          return;
        }

        // Pass parameters in the order expected by updateGridConfiguration
        onGridChange(startNote, endNote, selectedCols);
      } catch (error) {
        console.error("Grid configuration update failed:", error);
        showNotification("Failed to update grid configuration", "error");
      }
    });
  } catch (error) {
    console.error("Failed to setup grid controls:", error);
    showNotification("Failed to initialize grid controls", "error");
    throw error;
  }
}

/**
 * Populates the note selector dropdowns with available notes.
 * Creates option elements for each note and sets reasonable default values.
 * Validates input and provides error handling for DOM operations.
 *
 * @param {string[]} allNotes - Array of all available note strings in scientific notation
 * @throws {Error} If note selector elements are not found or notes array is invalid
 * @example
 * populateNoteSelectors(['C3', 'C#3', 'D3', 'D#3', 'E3']);
 */
export function populateNoteSelectors(allNotes) {
  try {
    // Validate input
    if (!Array.isArray(allNotes) || allNotes.length === 0) {
      throw new Error("allNotes must be a non-empty array");
    }

    const startNoteSelect = getRequiredElement(ELEMENT_IDS.START_NOTE_SELECT);
    const endNoteSelect = getRequiredElement(ELEMENT_IDS.END_NOTE_SELECT);

    // Clear existing options
    startNoteSelect.innerHTML = "";
    endNoteSelect.innerHTML = "";

    // Populate both selectors with all available notes
    allNotes.forEach((note) => {
      if (!isNonEmptyString(note)) {
        console.warn(`Invalid note in array: ${note}`);
        return;
      }

      // Create option for start note selector
      const startOption = document.createElement("option");
      startOption.value = note;
      startOption.textContent = note;
      startNoteSelect.appendChild(startOption);

      // Create option for end note selector
      const endOption = document.createElement("option");
      endOption.value = note;
      endOption.textContent = note;
      endNoteSelect.appendChild(endOption);
    });

    // Set default values to a reasonable musical range (one octave around middle C)
    const defaultStart = "C3";
    const defaultEnd = "C4";

    // Verify defaults exist in the provided notes array
    if (allNotes.includes(defaultStart) && allNotes.includes(defaultEnd)) {
      startNoteSelect.value = defaultStart; // Low C
      endNoteSelect.value = defaultEnd; // Middle C
    } else {
      // Fallback to first and last notes if defaults aren't available
      startNoteSelect.value = allNotes[allNotes.length - 1]; // Lowest note
      endNoteSelect.value = allNotes[0]; // Highest note
    }
  } catch (error) {
    console.error("Failed to populate note selectors:", error);
    showNotification("Failed to initialize note selectors", "error");
    throw error;
  }
}
