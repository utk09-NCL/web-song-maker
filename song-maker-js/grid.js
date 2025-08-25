/**
 * Grid rendering module.
 * Handles DOM creation and event binding for the musical sequencer grid.
 *
 * This module provides:
 * - Complete grid layout generation
 * - Musical note label rendering
 * - Beat ruler creation
 * - Interactive cell grid with event handling
 * - Grid state synchronization
 */

import { CSS_CLASSES, GRID_LIMITS } from "./constants.js";
import { createElement, showNotification } from "./utilities.js";

/**
 * Renders a complete musical grid interface.
 * Creates a responsive grid layout with note labels, ruler, and interactive cells.
 * Validates inputs and provides comprehensive error handling.
 *
 * @param {HTMLElement} container - DOM element to render the grid into
 * @param {string[]} notes - Array of musical note names for row labels (high to low)
 * @param {number} cols - Number of columns (beats) in the grid
 * @param {boolean[][]} gridState - 2D array representing active cells [row][col]
 * @returns {Object} Object containing references to grid DOM elements
 * @returns {HTMLElement} returns.gridInner - Container for all grid cells
 * @returns {HTMLElement} returns.ruler - Container for beat numbers
 * @returns {boolean[][]} returns.gridState - Reference to the provided grid state
 * @throws {Error} If container is invalid or parameters are out of bounds
 * @example
 * const refs = renderGrid(containerEl, ['C4', 'B3', 'A3'], 8, gridStateArray);
 */
export function renderGrid(container, notes, cols, gridState) {
  try {
    // Validate inputs
    if (!container || typeof container.appendChild !== "function") {
      throw new Error("Container must be a valid DOM element");
    }

    if (!Array.isArray(notes) || notes.length === 0) {
      throw new Error("Notes must be a non-empty array");
    }

    if (
      !Number.isInteger(cols) ||
      cols < GRID_LIMITS.MIN_COLUMNS ||
      cols > GRID_LIMITS.MAX_COLUMNS
    ) {
      throw new Error(
        `Columns must be an integer between ${GRID_LIMITS.MIN_COLUMNS} and ${GRID_LIMITS.MAX_COLUMNS}`
      );
    }

    if (!Array.isArray(gridState) || gridState.length !== notes.length) {
      throw new Error("Grid state must be a 2D array matching notes length");
    }
    const gridLayout = createElement("div", CSS_CLASSES.GRID_LAYOUT);

    // Create the left section containing note labels
    const labelsSection = createElement("div", CSS_CLASSES.LABELS_LEFT_SIDE);
    // Add empty spacer to align with the ruler row
    labelsSection.appendChild(createElement("div", CSS_CLASSES.RULER_SPACER));

    // Create container for musical note labels
    const rowLabels = createElement("div", CSS_CLASSES.ROW_LABELS);
    // Set CSS grid rows to match the number of notes using constant for cell size
    rowLabels.style.gridTemplateRows = `repeat(${notes.length}, ${GRID_LIMITS.CELL_SIZE}px)`;

    // Generate a label element for each musical note
    notes.forEach((noteName) => {
      if (typeof noteName !== "string" || !noteName.trim()) {
        console.warn(`Invalid note name: ${noteName}`);
        return;
      }
      const label = createElement("div", CSS_CLASSES.ROW_LABEL_TEXT);
      label.textContent = noteName;
      label.title = `Note: ${noteName}`;
      rowLabels.appendChild(label);
    });

    labelsSection.appendChild(rowLabels);
    gridLayout.appendChild(labelsSection);

    // Right side - ruler and grid
    const rightSection = createElement("div", CSS_CLASSES.GRID_RIGHT_SIDE);

    // Ruler (beat numbers)
    const ruler = createElement("div", CSS_CLASSES.RULER);
    ruler.style.gridTemplateColumns = `repeat(${cols}, ${GRID_LIMITS.CELL_SIZE}px)`;

    for (let col = 1; col <= cols; col++) {
      const beat = createElement("div", CSS_CLASSES.RULER_BEAT);
      beat.textContent = col.toString();
      beat.title = `Beat ${col}`;
      ruler.appendChild(beat);
    }

    rightSection.appendChild(ruler);

    // Grid cells
    const gridInner = createElement("div", CSS_CLASSES.GRID_INNER);
    gridInner.style.gridTemplateColumns = `repeat(${cols}, ${GRID_LIMITS.CELL_SIZE}px)`;

    for (let row = 0; row < notes.length; row++) {
      // Validate each row of grid state
      if (!Array.isArray(gridState[row]) || gridState[row].length !== cols) {
        throw new Error(`Grid state row ${row} is invalid`);
      }

      for (let col = 0; col < cols; col++) {
        const cell = createElement("button", CSS_CLASSES.CELL);

        // Add accessibility attributes
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-label", `${notes[row]} beat ${col + 1}`);
        cell.setAttribute("aria-pressed", gridState[row][col].toString());

        // Set initial state
        if (gridState[row][col]) {
          cell.classList.add(CSS_CLASSES.CELL_ACTIVE);
        }

        // Click handler with error handling
        cell.addEventListener("click", () => {
          try {
            const isActive = !cell.classList.contains(CSS_CLASSES.CELL_ACTIVE);
            cell.classList.toggle(CSS_CLASSES.CELL_ACTIVE, isActive);
            cell.setAttribute("aria-pressed", isActive.toString());

            // Update state through global function (temporary)
            if (window.updateCellState) {
              window.updateCellState(row, col, isActive);
            }
          } catch (error) {
            console.error("Failed to handle cell click:", error);
            showNotification("Failed to update cell", "error");
          }
        });

        gridInner.appendChild(cell);
      }
    }

    rightSection.appendChild(gridInner);
    gridLayout.appendChild(rightSection);
    container.appendChild(gridLayout);

    return { gridInner, ruler, gridState };
  } catch (error) {
    console.error("Failed to render grid:", error);
    showNotification("Failed to render grid", "error");
    throw error;
  }
}
