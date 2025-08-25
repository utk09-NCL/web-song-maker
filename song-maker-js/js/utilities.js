/**
 * Utility functions for common operations throughout the Web Song Maker application.
 * Contains reusable helpers for DOM manipulation, validation, storage, and formatting.
 */

import { STORAGE_KEYS, MESSAGES, CSS_CLASSES, TIMING } from "./constants.js";

// ===== DOM UTILITIES =====

/**
 * Creates a DOM element with optional CSS class and ID.
 * @param {string} tagName - HTML tag name (e.g., 'div', 'button')
 * @param {string} [className=''] - CSS class to apply to the element
 * @param {string} [id=''] - ID attribute to set on the element
 * @returns {HTMLElement} Newly created DOM element
 * @example
 * const button = createElement('button', 'btn btn-primary', 'submitBtn');
 */
export function createElement(tagName, className = "", id = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (id) element.id = id;
  return element;
}

/**
 * Safely queries for a DOM element by ID with error handling.
 * @param {string} elementId - The ID of the element to find
 * @returns {HTMLElement|null} The found element or null if not found
 * @throws {Error} If element is required but not found
 * @example
 * const playButton = getElementSafely('play');
 */
export function getElementSafely(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element with ID '${elementId}' not found`);
  }
  return element;
}

/**
 * Safely queries for a required DOM element, throwing an error if not found.
 * @param {string} elementId - The ID of the element to find
 * @returns {HTMLElement} The found element
 * @throws {Error} If element is not found
 * @example
 * const playButton = getRequiredElement('play');
 */
export function getRequiredElement(elementId) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Required element with ID '${elementId}' not found`);
  }
  return element;
}

// ===== NOTIFICATION SYSTEM =====

// Track active notifications to prevent duplicates
const activeNotifications = new Set();

/**
 * Shows a notification message to the user with proper styling.
 * Automatically removes old notifications and properly cleans up DOM elements.
 * Prevents duplicate messages from stacking up.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} [type='info'] - The type of notification
 * @param {number} [duration=3000] - How long to show the notification in milliseconds
 * @example
 * showNotification('Settings saved!', 'success');
 * showNotification('Invalid input', 'error', 5000);
 */
export function showNotification(
  message,
  type = "info",
  duration = TIMING.NOTIFICATION_DURATION
) {
  try {
    // Prevent duplicate notifications
    const notificationKey = `${type}:${message}`;
    if (activeNotifications.has(notificationKey)) {
      return; // Don't show duplicate notification
    }
    activeNotifications.add(notificationKey);

    // Ensure notification container exists
    let container = document.getElementById("notificationContainer");
    if (!container) {
      container = createElement(
        "div",
        "notification-container",
        "notificationContainer"
      );
      document.body.appendChild(container);
    }

    // Limit number of concurrent notifications (remove oldest if too many)
    const maxNotifications = 3;
    while (container.children.length >= maxNotifications) {
      const oldestNotification = container.children[0];
      if (oldestNotification) {
        // Clean up from tracking
        const oldMessage = oldestNotification.getAttribute("data-key");
        if (oldMessage) {
          activeNotifications.delete(oldMessage);
        }
        container.removeChild(oldestNotification);
      }
    }

    // Create notification element
    const notification = createElement(
      "div",
      `${CSS_CLASSES.NOTIFICATION} ${
        CSS_CLASSES[`NOTIFICATION_${type.toUpperCase()}`]
      }`
    );
    notification.textContent = message;
    notification.setAttribute("data-key", notificationKey); // For cleanup tracking

    // Add to container immediately (no fade-in needed for simplicity)
    container.appendChild(notification);

    // Create removal function
    const removeNotification = () => {
      // Remove from tracking
      activeNotifications.delete(notificationKey);

      // Remove from DOM if still present
      if (notification.parentNode) {
        try {
          // Simple fade out
          notification.style.transition =
            "opacity 0.3s ease-out, transform 0.3s ease-out";
          notification.style.opacity = "0";
          notification.style.transform = "translateX(100%)";

          // Remove after animation
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300); // Fixed 300ms timeout
        } catch (error) {
          console.warn("Failed to remove notification:", error);
          // Force removal if animation fails
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }
      }
    };

    // Set up auto-removal
    const removalTimeout = setTimeout(removeNotification, duration);

    // Allow manual dismissal by clicking
    notification.addEventListener("click", () => {
      clearTimeout(removalTimeout); // Cancel auto-removal
      removeNotification();
    });
  } catch (error) {
    console.error("Failed to show notification:", error);
    // Fallback to console log if notifications fail
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}

// ===== STORAGE UTILITIES =====

/**
 * Safely saves data to sessionStorage with error handling.
 * @param {string} key - The storage key
 * @param {any} data - The data to store (will be JSON stringified)
 * @returns {boolean} True if save was successful, false otherwise
 * @example
 * const success = saveToStorage(STORAGE_KEYS.GRID_STATE, gridData);
 */
export function saveToStorage(key, data) {
  try {
    if (typeof Storage === "undefined") {
      showNotification(MESSAGES.STORAGE_NOT_AVAILABLE, "warning");
      return false;
    }

    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Failed to save to storage:", error);
    showNotification(MESSAGES.STORAGE_SAVE_ERROR, "error");
    return false;
  }
}

/**
 * Safely loads data from sessionStorage with error handling and validation.
 * @param {string} key - The storage key
 * @param {any} [defaultValue=null] - Default value to return if loading fails
 * @param {Function} [validator] - Optional validation function for loaded data
 * @returns {any} The loaded and validated data, or default value
 * @example
 * const gridState = loadFromStorage(STORAGE_KEYS.GRID_STATE, [], Array.isArray);
 */
export function loadFromStorage(key, defaultValue = null, validator = null) {
  try {
    if (typeof Storage === "undefined") {
      return defaultValue;
    }

    const item = sessionStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    const parsed = JSON.parse(item);

    // Validate if validator function provided
    if (validator && !validator(parsed)) {
      console.warn(
        `Invalid data loaded from storage key '${key}', using default`
      );
      return defaultValue;
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load from storage:", error);
    if (defaultValue === null) {
      showNotification(MESSAGES.STORAGE_LOAD_ERROR, "warning");
    }
    return defaultValue;
  }
}

/**
 * Clears all application data from storage.
 * @returns {boolean} True if clear was successful
 * @example
 * const cleared = clearAppStorage();
 */
export function clearAppStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error("Failed to clear storage:", error);
    return false;
  }
}

// ===== VALIDATION UTILITIES =====

/**
 * Validates that a value is a number within a specified range.
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value (inclusive)
 * @param {number} max - Maximum allowed value (inclusive)
 * @returns {boolean} True if value is a valid number in range
 * @example
 * const isValidTempo = isNumberInRange(120, 60, 240); // true
 */
export function isNumberInRange(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validates that a value is a non-empty string.
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is a non-empty string
 * @example
 * const isValid = isNonEmptyString('C4'); // true
 */
export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates that a value is an array with optional element validator.
 * @param {any} value - Value to validate
 * @param {Function} [elementValidator] - Optional function to validate each element
 * @returns {boolean} True if value is a valid array
 * @example
 * const isValidNotes = isValidArray(notes, isNonEmptyString);
 */
export function isValidArray(value, elementValidator = null) {
  if (!Array.isArray(value)) return false;
  if (!elementValidator) return true;
  return value.every(elementValidator);
}

/**
 * Validates a 2D grid state array.
 * @param {any} value - Value to validate
 * @param {number} [expectedRows] - Expected number of rows
 * @param {number} [expectedCols] - Expected number of columns
 * @returns {boolean} True if value is a valid 2D boolean array
 * @example
 * const isValidGrid = isValidGridState(gridState, 8, 16);
 */
export function isValidGridState(
  value,
  expectedRows = null,
  expectedCols = null
) {
  if (!Array.isArray(value)) return false;

  if (expectedRows !== null && value.length !== expectedRows) return false;

  return value.every((row) => {
    if (!Array.isArray(row)) return false;
    if (expectedCols !== null && row.length !== expectedCols) return false;
    return row.every((cell) => typeof cell === "boolean");
  });
}

// ===== DEBOUNCING UTILITY =====

/**
 * Creates a debounced version of a function that delays execution.
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 * @example
 * const debouncedSave = debounce(() => saveState(), 300);
 */
export function debounce(func, delay = TIMING.DEBOUNCE_DELAY) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// ===== FORMATTING UTILITIES =====

/**
 * Formats a number as a percentage string.
 * @param {number} value - Value between 0 and 1
 * @param {number} [decimals=0] - Number of decimal places
 * @returns {string} Formatted percentage string
 * @example
 * const percent = formatAsPercentage(0.75); // "75%"
 */
export function formatAsPercentage(value, decimals = 0) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Clamps a number between min and max values.
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 * @example
 * const clamped = clamp(150, 60, 240); // 150
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ===== MUSICAL UTILITIES =====

/**
 * Converts a musical note name to its frequency in Hz.
 * @param {string} noteName - Note name in scientific notation (e.g., 'A4', 'C#3')
 * @returns {number} Frequency in Hz
 * @throws {Error} If note name is invalid
 * @example
 * const freq = noteToFrequency('A4'); // 440
 */
export function noteToFrequency(noteName) {
  const noteMap = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };

  if (!noteName || typeof noteName !== "string") {
    throw new Error("Invalid note name: must be a non-empty string");
  }

  const note = noteName.slice(0, -1);
  const octaveStr = noteName.slice(-1);
  const octave = parseInt(octaveStr);

  if (!(note in noteMap)) {
    throw new Error(
      `Invalid note name: ${note}. Must be one of: ${Object.keys(noteMap).join(
        ", "
      )}`
    );
  }

  if (isNaN(octave) || octave < 0 || octave > 8) {
    throw new Error(
      `Invalid octave: ${octaveStr}. Must be a number between 0 and 8`
    );
  }

  // A4 = 440Hz, calculate semitones from A4
  const semitones = (octave - 4) * 12 + noteMap[note] - noteMap["A"];
  return 440 * Math.pow(2, semitones / 12);
}

/**
 * Calculates timing duration for musical notes based on BPM.
 * @param {number} bpm - Beats per minute
 * @param {number} [subdivision=4] - Note subdivision (4 = 16th notes)
 * @returns {number} Duration in milliseconds
 * @example
 * const duration = calculateNoteDuration(120, 4); // 125ms for 16th notes at 120 BPM
 */
export function calculateNoteDuration(bpm, subdivision = 4) {
  if (!isNumberInRange(bpm, 1, 1000)) {
    throw new Error("BPM must be a positive number");
  }
  return ((60 / bpm) * 1000) / subdivision;
}
