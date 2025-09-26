/**
 * Core TypeScript interfaces and types for the Interactive Transcript Module
 * Following shadcn/ui patterns and WebVTT API integration
 */

import { type VariantProps } from "class-variance-authority"
import * as React from "react"

// Core transcript data structures
export interface TranscriptCue {
  /** Unique identifier for the cue */
  id: string
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** The transcript text content */
  text: string
  /** Optional speaker identification */
  speaker?: string
}

export interface TranscriptMetadata {
  /** Title of the transcript */
  title?: string
  /** Language code (e.g., 'en', 'es') */
  language?: string
  /** Total duration in seconds */
  duration?: number
  /** Additional metadata */
  [key: string]: unknown
}

export interface TranscriptData {
  /** Array of transcript cues/segments */
  cues: TranscriptCue[]
  /** Optional metadata about the transcript */
  metadata?: TranscriptMetadata
}

// WebVTT transformation and parsing types
export interface TextTransformOptions {
  /** Default segment length in seconds */
  segmentDuration?: number
  /** Enable automatic speaker detection */
  speakerDetection?: boolean
  /** Timestamp format preference */
  timestampFormat?: 'seconds' | 'timecode'
}

export interface WebVTTParseResult {
  /** Parsed transcript data */
  data: TranscriptData
  /** Any parsing warnings */
  warnings?: string[]
}

// Media integration types
export interface MediaIntegration {
  /** Browser TextTrack instance */
  textTrack: TextTrack
  /** Associated media element */
  mediaElement: HTMLMediaElement
  /** Currently active cue */
  activeCue: TextTrackCue | null
  /** Cue change event handler */
  cueChangeHandler: (event: Event) => void
}

// Component state management types
export interface TranscriptState {
  /** All transcript cues */
  cues: TranscriptCue[]
  /** ID of currently active cue */
  activeCueId: string | null
  /** Current search query */
  searchQuery: string
  /** Array of cue indices that match search */
  searchResults: number[]
  /** Current position in search results */
  currentSearchIndex: number
  /** Whether search is active */
  isSearching: boolean
}

export interface TranscriptActions {
  /** Set the active cue by ID */
  setActiveCue: (cueId: string) => void
  /** Perform search across transcript */
  search: (query: string) => void
  /** Navigate between search results */
  navigateSearch: (direction: 'next' | 'prev') => void
  /** Clear current search */
  clearSearch: () => void
  /** Seek to specific time */
  seekToTime: (time: number) => void
}

export interface TranscriptConfig {
  /** Enable search functionality */
  searchable: boolean
  /** Threshold for enabling virtualization */
  virtualizeThreshold: number
  /** Theme preference */
  theme: 'light' | 'dark' | 'system'
}

// Context provider types
export interface TranscriptContextValue {
  /** Current transcript state */
  state: TranscriptState
  /** Available actions */
  actions: TranscriptActions
  /** Component configuration */
  config: TranscriptConfig
}

// Component prop types following shadcn/ui patterns
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string
  /** Render as child component */
  asChild?: boolean
}

// Event handler types
export type CueClickHandler = (cue: TranscriptCue) => void
export type TimeUpdateHandler = (currentTime: number) => void
export type SearchHandler = (query: string, results: TranscriptCue[]) => void

// Utility types for component variants
export type ComponentSize = 'sm' | 'default' | 'lg'
export type ComponentVariant = 'default' | 'ghost' | 'outline'

// Error types
export class WebVTTParseError extends Error {
  constructor(message: string, public line?: number) {
    super(message)
    this.name = 'WebVTTParseError'
  }
}

export class MediaSyncError extends Error {
  constructor(message: string, public mediaElement?: HTMLMediaElement) {
    super(message)
    this.name = 'MediaSyncError'
  }
}

// Re-export commonly used types
export type { VariantProps } from "class-variance-authority"
export type { ClassValue } from "clsx"