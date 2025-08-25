/**
 * Application constants and configuration values.
 * Centralizes all magic strings, numbers, and configuration to improve maintainability.
 */

// ===== STORAGE KEYS =====
/**
 * SessionStorage keys used for persisting application state.
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = {
  /** Grid cell states - 2D boolean array */
  GRID_STATE: "songMaker_gridState",
  /** Number of columns in the grid */
  COLUMNS: "songMaker_COLS",
  /** Array of note names currently displayed */
  NOTE_NAMES: "songMaker_NOTE_NAMES",
  /** Current tempo/BPM setting */
  TEMPO: "songMaker_tempo",
  /** Current volume level (0-1) */
  VOLUME: "songMaker_volume",
  /** Selected waveform type */
  WAVEFORM: "songMaker_waveform",
};

// ===== GRID CONSTRAINTS =====
/**
 * Grid size constraints and defaults.
 * @readonly
 */
export const GRID_LIMITS = {
  /** Minimum number of columns allowed */
  MIN_COLUMNS: 4,
  /** Maximum number of columns allowed */
  MAX_COLUMNS: 32,
  /** Default number of columns */
  DEFAULT_COLUMNS: 16,
  /** Grid cell size in pixels */
  CELL_SIZE: 32,
};

// ===== AUDIO SETTINGS =====
/**
 * Audio playback and synthesis configuration.
 * @readonly
 */
export const AUDIO_CONFIG = {
  /** Default master volume (0-1) */
  DEFAULT_VOLUME: 0.5,
  /** Note envelope attack time in seconds */
  ENVELOPE_ATTACK: 0.01,
  /** Note envelope decay time in seconds */
  ENVELOPE_DECAY: 0.3,
  /** Note envelope sustain level (0-1) */
  ENVELOPE_SUSTAIN: 0.3,
  /** Minimum tempo in BPM */
  MIN_TEMPO: 60,
  /** Maximum tempo in BPM */
  MAX_TEMPO: 240,
  /** Default tempo in BPM */
  DEFAULT_TEMPO: 120,
  /** Subdivision for timing (16th notes) */
  NOTE_SUBDIVISION: 4,
};

// ===== WAVEFORM TYPES =====
/**
 * Available oscillator waveform types for audio synthesis.
 * @readonly
 * @enum {string}
 */
export const WAVEFORMS = {
  SINE: "sine",
  SQUARE: "square",
  SAWTOOTH: "sawtooth",
  TRIANGLE: "triangle",
};

// ===== DOM ELEMENT IDS =====
/**
 * HTML element IDs used throughout the application.
 * @readonly
 * @enum {string}
 */
export const ELEMENT_IDS = {
  // Main containers
  GRID_CONTAINER: "grid",

  // Playback controls
  PLAY_BUTTON: "play",
  TEMPO_SLIDER: "tempo",
  TEMPO_VALUE: "tempoValue",
  VOLUME_SLIDER: "volume",
  VOLUME_VALUE: "volumeValue",
  WAVE_SELECT: "waveSelect",

  // Grid controls
  CLEAR_BUTTON: "clearBtn",
  RANDOM_BUTTON: "randomBtn",

  // Grid configuration
  COLUMNS_INPUT: "columnsInput",
  START_NOTE_SELECT: "startNote",
  END_NOTE_SELECT: "endNote",
  APPLY_GRID_BUTTON: "applyGridBtn",

  // Notification system
  NOTIFICATION_CONTAINER: "notificationContainer",
};

// ===== CSS CLASSES =====
/**
 * CSS class names used for styling and state management.
 * @readonly
 * @enum {string}
 */
export const CSS_CLASSES = {
  // Grid cell states
  CELL_ACTIVE: "active",
  CELL_PLAYING: "playing-col",

  // Grid layout
  GRID_LAYOUT: "grid-layout",
  GRID_INNER: "grid-inner",
  LABELS_LEFT_SIDE: "labels-left-side",
  GRID_RIGHT_SIDE: "grid-right-side",
  ROW_LABELS: "row-labels",
  ROW_LABEL_TEXT: "row-label-text",
  RULER: "ruler",
  RULER_BEAT: "ruler-beat",
  RULER_SPACER: "ruler-spacer",
  CELL: "cell",

  // Notifications
  NOTIFICATION: "notification",
  NOTIFICATION_SUCCESS: "notification--success",
  NOTIFICATION_WARNING: "notification--warning",
  NOTIFICATION_ERROR: "notification--error",
  NOTIFICATION_INFO: "notification--info",
};

// ===== VALIDATION MESSAGES =====
/**
 * User-friendly validation and error messages.
 * @readonly
 * @enum {string}
 */
export const MESSAGES = {
  // Validation errors
  INVALID_NOTES: "Please select valid start and end notes",
  INVALID_NOTE_RANGE:
    "Start note must be lower in pitch than end note (e.g., C3 to C4)",
  INVALID_COLUMNS: "Columns must be a number between 4 and 32",
  MISSING_NOTE_SELECTION: "Please select both start and end notes",

  // Storage errors
  STORAGE_SAVE_ERROR: "Failed to save your changes. Please try again.",
  STORAGE_LOAD_ERROR:
    "Failed to load saved data. Starting with default settings.",
  STORAGE_NOT_AVAILABLE:
    "Browser storage is not available. Changes will not be saved.",

  // Audio errors
  AUDIO_CONTEXT_ERROR:
    "Failed to initialize audio. Please try refreshing the page.",
  AUDIO_PLAYBACK_ERROR:
    "Audio playback failed. Please check your browser settings.",

  // Success messages
  GRID_UPDATED: "Grid configuration updated successfully",
  SETTINGS_SAVED: "Settings saved successfully",
};

// ===== TIMING CONSTANTS =====
/**
 * Timing-related constants for animations and interactions.
 * @readonly
 */
export const TIMING = {
  /** Notification display duration in milliseconds */
  NOTIFICATION_DURATION: 3000,
  /** Debounce delay for user input in milliseconds */
  DEBOUNCE_DELAY: 300,
  /** Animation duration in milliseconds */
  ANIMATION_DURATION: 200,
};

// ===== RANDOMIZATION SETTINGS =====
/**
 * Settings for the randomize grid functionality.
 * @readonly
 */
export const RANDOMIZE_CONFIG = {
  /** Probability of activating each cell (0-1) */
  CELL_ACTIVATION_PROBABILITY: 0.25,
};
