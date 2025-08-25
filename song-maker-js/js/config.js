/**
 * Configuration constants for the Song Maker application.
 * Contains grid dimensions and musical note definitions.
 *
 * This module provides:
 * - Default grid dimensions and constraints
 * - Complete chromatic scale note definitions
 * - Default note ranges for initial setup
 * - Musical constants for audio synthesis
 *
 * All note names use scientific pitch notation (e.g., A4 = 440Hz).
 * The ALL_NOTES array is ordered from highest to lowest pitch for UI convenience.
 */

/**
 * Default number of rows in the grid.
 * @deprecated This constant is kept for compatibility but rows are now determined by note range.
 * @type {number}
 */
export const DEFAULT_ROWS = 8;

/**
 * Default number of columns (beats) in the grid.
 * Represents the number of time divisions in a musical sequence.
 * @type {number}
 */
export const DEFAULT_COLS = 16;

/**
 * Complete chromatic scale of musical notes in Scientific Pitch Notation.
 *
 * Contains all semitones from C8 (highest audible pitch) down to A0 (lowest piano key).
 * Ordered from highest to lowest pitch to match typical musical score layout.
 *
 * Note naming convention:
 * - Natural notes: C, D, E, F, G, A, B
 * - Sharp notes: C#, D#, F#, G#, A#
 * - Octave numbers: 0-8 (A4 = 440Hz reference)
 *
 * @type {string[]}
 * @readonly
 * @example
 * // Get frequency range
 * const highestNote = ALL_NOTES[0];     // 'C8'
 * const lowestNote = ALL_NOTES[105];   // 'A0'
 */
export const ALL_NOTES = [
  "C8",
  "B7",
  "A#7",
  "A7",
  "G#7",
  "G7",
  "F#7",
  "F7",
  "E7",
  "D#7",
  "D7",
  "C#7",
  "C7",
  "B6",
  "A#6",
  "A6",
  "G#6",
  "G6",
  "F#6",
  "F6",
  "E6",
  "D#6",
  "D6",
  "C#6",
  "C6",
  "B5",
  "A#5",
  "A5",
  "G#5",
  "G5",
  "F#5",
  "F5",
  "E5",
  "D#5",
  "D5",
  "C#5",
  "C5",
  "B4",
  "A#4",
  "A4",
  "G#4",
  "G4",
  "F#4",
  "F4",
  "E4",
  "D#4",
  "D4",
  "C#4",
  "C4",
  "B3",
  "A#3",
  "A3",
  "G#3",
  "G3",
  "F#3",
  "F3",
  "E3",
  "D#3",
  "D3",
  "C#3",
  "C3",
  "B2",
  "A#2",
  "A2",
  "G#2",
  "G2",
  "F#2",
  "F2",
  "E2",
  "D#2",
  "D2",
  "C#2",
  "C2",
  "B1",
  "A#1",
  "A1",
  "G#1",
  "G1",
  "F#1",
  "F1",
  "E1",
  "D#1",
  "D1",
  "C#1",
  "C1",
  "B0",
  "A#0",
  "A0",
];

/**
 * Default musical note range for the grid.
 *
 * Represents one octave from C4 (middle C) down to C3, covering a comfortable
 * range for melody and harmony. This selection provides:
 * - C4: Middle C (261.63 Hz) - common reference point
 * - Natural progression through one octave
 * - Good balance for both melody and bass lines
 *
 * Notes are ordered from highest to lowest pitch to match the grid display
 * where higher pitches appear at the top.
 *
 * @type {string[]}
 * @readonly
 */
export const DEFAULT_NOTES = ["C4", "B3", "A3", "G3", "F3", "E3", "D3", "C3"];
