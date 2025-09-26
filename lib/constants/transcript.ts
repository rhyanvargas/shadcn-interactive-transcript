/**
 * Constants and configuration values for the Interactive Transcript Module
 */

// Default configuration values
export const DEFAULT_CONFIG = {
  /** Default virtualization threshold */
  VIRTUALIZE_THRESHOLD: 100,
  /** Default search debounce delay in milliseconds */
  SEARCH_DEBOUNCE_DELAY: 300,
  /** Default segment duration for text transformation */
  DEFAULT_SEGMENT_DURATION: 5,
  /** Maximum search results to display */
  MAX_SEARCH_RESULTS: 1000,
  /** Default theme */
  DEFAULT_THEME: 'system' as const
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  /** Search shortcut */
  SEARCH: 'ctrl+f',
  /** Next search result */
  SEARCH_NEXT: 'Enter',
  /** Previous search result */
  SEARCH_PREV: 'shift+Enter',
  /** Clear search */
  SEARCH_CLEAR: 'Escape',
  /** Navigate segments */
  SEGMENT_UP: 'ArrowUp',
  SEGMENT_DOWN: 'ArrowDown',
  /** Activate segment */
  SEGMENT_ACTIVATE: 'Enter'
} as const

// ARIA labels and accessibility
export const ARIA_LABELS = {
  TRANSCRIPT_CONTAINER: 'Interactive transcript',
  SEARCH_INPUT: 'Search transcript',
  SEARCH_RESULTS: 'Search results',
  SEGMENT: 'Transcript segment',
  ACTIVE_SEGMENT: 'Active transcript segment',
  TIMESTAMP: 'Timestamp',
  SPEAKER: 'Speaker',
  SEARCH_NEXT: 'Next search result',
  SEARCH_PREV: 'Previous search result',
  SEARCH_CLEAR: 'Clear search'
} as const

// WebVTT related constants
export const WEBVTT_CONSTANTS = {
  /** WebVTT file signature */
  SIGNATURE: 'WEBVTT',
  /** Default cue settings */
  DEFAULT_CUE_SETTINGS: '',
  /** Time format regex */
  TIME_REGEX: /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/,
  /** Cue ID prefix */
  CUE_ID_PREFIX: 'cue-'
} as const

// Error messages
export const ERROR_MESSAGES = {
  INVALID_WEBVTT: 'Invalid WebVTT format',
  INVALID_TRANSCRIPT_DATA: 'Invalid transcript data structure',
  MEDIA_SYNC_FAILED: 'Failed to synchronize with media element',
  SEARCH_FAILED: 'Search operation failed',
  PARSE_ERROR: 'Failed to parse transcript data'
} as const

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  /** When to enable virtualization */
  VIRTUALIZATION_THRESHOLD: 100,
  /** Maximum cues to render without virtualization */
  MAX_RENDERED_CUES: 50,
  /** Search result limit for performance */
  SEARCH_RESULT_LIMIT: 500
} as const