/**
 * Web Audio API wrapper for the Song Maker.
 * Handles audio context initialization, note playback, and volume control.
 *
 * This module provides:
 * - Cross-browser Web Audio API initialization
 * - Musical note synthesis with configurable waveforms
 * - Master volume control
 * - Visual feedback coordination
 * - Audio resource management
 */

import { AUDIO_CONFIG } from "./constants.js";
import { noteToFrequency, showNotification } from "./utilities.js";

/** Web Audio API context instance */
let audioContext = null;
/** Master volume control node */
let volumeNode = null;

/**
 * Initializes or resumes the Web Audio API context.
 * Creates the master volume node on first call.
 * Required due to browser autoplay policies - must be called after user interaction.
 * @returns {AudioContext} The initialized audio context
 */
export function ensureAudioContext() {
  if (!audioContext) {
    // Create new audio context with cross-browser compatibility
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Create master volume control node
    volumeNode = audioContext.createGain();
    volumeNode.connect(audioContext.destination);
    volumeNode.gain.value = 0.5; // Start at 50% volume
  }

  // Resume context if suspended (browser autoplay policy)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

/**
 * Sets the master volume for all audio output.
 * Clamps the volume level to safe ranges and provides error handling.
 *
 * @param {number} level - Volume level between 0.0 (silent) and 1.0 (full volume)
 * @throws {Error} If volume node is not initialized or level is invalid
 * @example
 * setVolume(0.5); // Set to 50% volume
 */
export function setVolume(level) {
  try {
    if (!volumeNode) {
      throw new Error("Volume node not initialized");
    }

    if (typeof level !== "number" || isNaN(level)) {
      throw new Error("Volume level must be a valid number");
    }

    // Clamp volume to safe range
    const clampedLevel = Math.max(0, Math.min(1, level));
    volumeNode.gain.value = clampedLevel;
  } catch (error) {
    console.error("Failed to set volume:", error);
    showNotification("Failed to update volume", "error");
  }
}

/**
 * Plays a musical note using Web Audio API synthesis.
 * Creates an oscillator with envelope shaping for musical note playback.
 *
 * @param {string} noteName - Musical note in scientific notation (e.g., 'A4', 'C#3')
 * @param {number} startTime - AudioContext time when the note should start playing
 * @param {string} [waveType='sine'] - Oscillator waveform ('sine', 'square', 'sawtooth', 'triangle')
 * @throws {Error} If audio context is not initialized or note name is invalid
 * @example
 * playNote('A4', audioContext.currentTime, 'sine');
 */
export function playNote(noteName, startTime, waveType = "sine") {
  try {
    if (!audioContext) {
      throw new Error("Audio context not initialized");
    }

    const frequency = noteToFrequency(noteName);
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    // Set oscillator properties
    oscillator.type = waveType;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Configure ADSR envelope using constants
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(
      AUDIO_CONFIG.ENVELOPE_SUSTAIN,
      startTime + AUDIO_CONFIG.ENVELOPE_ATTACK
    );
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      startTime + AUDIO_CONFIG.ENVELOPE_DECAY
    );

    // Connect audio graph
    oscillator.connect(envelope);
    envelope.connect(volumeNode);

    // Schedule playback
    oscillator.start(startTime);
    oscillator.stop(startTime + AUDIO_CONFIG.ENVELOPE_DECAY);
  } catch (error) {
    console.error("Failed to play note:", error);
    showNotification(`Failed to play note ${noteName}`, "error");
  }
}

/**
 * Highlights or unhighlights a specific column in the grid during playback.
 * Provides visual feedback by adding/removing CSS classes from grid cells and ruler.
 *
 * @param {number} col - Column index to highlight (0-based)
 * @param {boolean} highlight - Whether to highlight (true) or unhighlight (false)
 * @param {HTMLElement} gridInner - The grid container element containing all cells
 * @param {HTMLElement} ruler - The ruler element containing column headers
 * @throws {Error} If required DOM elements are missing or column index is invalid
 * @example
 * highlightColumn(3, true, gridElement, rulerElement); // Highlight column 3
 */
export function highlightColumn(col, highlight, gridInner, ruler) {
  try {
    // Validate inputs
    if (typeof col !== "number" || col < 0) {
      throw new Error("Column index must be a non-negative number");
    }

    if (!gridInner || !ruler) {
      throw new Error("Grid and ruler elements are required");
    }

    const cellsPerRow = parseInt(ruler.children.length);
    const totalRows = Math.floor(gridInner.children.length / cellsPerRow);

    if (col >= cellsPerRow) {
      console.warn(`Column index ${col} exceeds grid width ${cellsPerRow}`);
      return;
    }

    // Highlight cells in this column
    for (let row = 0; row < totalRows; row++) {
      const cellIndex = row * cellsPerRow + col;
      const cell = gridInner.children[cellIndex];
      if (cell) {
        cell.classList.toggle("playing-col", highlight);
      }
    }

    // Highlight ruler cell
    const rulerCell = ruler.children[col];
    if (rulerCell) {
      rulerCell.classList.toggle("playing-col", highlight);
    }
  } catch (error) {
    console.error("Failed to highlight column:", error);
    // Don't show notification for this as it's called frequently during playback
  }
}
