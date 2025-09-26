/**
 * Utility functions for transcript operations
 * Following shadcn/ui patterns and best practices
 */

import { type TranscriptCue, type TranscriptData } from "../types/transcript"

/**
 * Format time in seconds to human-readable format
 * @param seconds - Time in seconds
 * @param format - Format type ('short' for MM:SS, 'long' for HH:MM:SS)
 * @returns Formatted time string
 */
export function formatTime(seconds: number, format: 'short' | 'long' = 'short'): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (format === 'long' || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Parse time string to seconds
 * @param timeString - Time string in format MM:SS or HH:MM:SS
 * @returns Time in seconds
 */
export function parseTimeString(timeString: string): number {
  const parts = timeString.split(':').map(Number)
  
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  
  throw new Error(`Invalid time format: ${timeString}`)
}

/**
 * Find the active cue at a given time
 * @param cues - Array of transcript cues
 * @param currentTime - Current time in seconds
 * @returns Active cue or null if none found
 */
export function findActiveCue(cues: TranscriptCue[], currentTime: number): TranscriptCue | null {
  return cues.find(cue => 
    currentTime >= cue.startTime && currentTime <= cue.endTime
  ) || null
}

/**
 * Search through transcript cues for matching text
 * @param cues - Array of transcript cues
 * @param query - Search query
 * @param caseSensitive - Whether search should be case sensitive
 * @returns Array of cue indices that match the query
 */
export function searchTranscript(
  cues: TranscriptCue[], 
  query: string, 
  caseSensitive: boolean = false
): number[] {
  if (!query.trim()) return []

  const searchQuery = caseSensitive ? query : query.toLowerCase()
  
  return cues.reduce((matches: number[], cue, index) => {
    const text = caseSensitive ? cue.text : cue.text.toLowerCase()
    const speaker = caseSensitive ? (cue.speaker || '') : (cue.speaker || '').toLowerCase()
    
    if (text.includes(searchQuery) || speaker.includes(searchQuery)) {
      matches.push(index)
    }
    
    return matches
  }, [])
}

/**
 * Highlight search matches in text
 * @param text - Original text
 * @param query - Search query to highlight
 * @param caseSensitive - Whether search should be case sensitive
 * @returns Text with highlighted matches
 */
export function highlightSearchMatches(
  text: string, 
  query: string, 
  caseSensitive: boolean = false
): string {
  if (!query.trim()) return text

  const flags = caseSensitive ? 'g' : 'gi'
  const regex = new RegExp(`(${escapeRegExp(query)})`, flags)
  
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>')
}

/**
 * Escape special regex characters in search query
 * @param string - String to escape
 * @returns Escaped string safe for regex
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Generate a unique ID for a cue
 * @param cue - Transcript cue
 * @param index - Optional index for uniqueness
 * @returns Unique cue ID
 */
export function generateCueId(cue: TranscriptCue, index?: number): string {
  if (cue.id) return cue.id
  
  const timeId = `${cue.startTime}-${cue.endTime}`
  const indexSuffix = index !== undefined ? `-${index}` : ''
  
  return `cue-${timeId}${indexSuffix}`
}

/**
 * Validate transcript data structure
 * @param data - Transcript data to validate
 * @returns Validation result with errors if any
 */
export function validateTranscriptData(data: unknown): {
  isValid: boolean
  errors: string[]
  data?: TranscriptData
} {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Transcript data must be an object')
    return { isValid: false, errors }
  }

  const transcriptData = data as Partial<TranscriptData>

  if (!Array.isArray(transcriptData.cues)) {
    errors.push('Transcript data must have a cues array')
    return { isValid: false, errors }
  }

  // Validate each cue
  transcriptData.cues.forEach((cue, index) => {
    if (!cue || typeof cue !== 'object') {
      errors.push(`Cue at index ${index} must be an object`)
      return
    }

    if (typeof cue.startTime !== 'number' || cue.startTime < 0) {
      errors.push(`Cue at index ${index} must have a valid startTime`)
    }

    if (typeof cue.endTime !== 'number' || cue.endTime < 0) {
      errors.push(`Cue at index ${index} must have a valid endTime`)
    }

    if (cue.startTime >= cue.endTime) {
      errors.push(`Cue at index ${index} startTime must be less than endTime`)
    }

    if (typeof cue.text !== 'string') {
      errors.push(`Cue at index ${index} must have text as a string`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? transcriptData as TranscriptData : undefined
  }
}

/**
 * Sort cues by start time
 * @param cues - Array of transcript cues
 * @returns Sorted array of cues
 */
export function sortCuesByTime(cues: TranscriptCue[]): TranscriptCue[] {
  return [...cues].sort((a, b) => a.startTime - b.startTime)
}

/**
 * Calculate transcript duration from cues
 * @param cues - Array of transcript cues
 * @returns Total duration in seconds
 */
export function calculateTranscriptDuration(cues: TranscriptCue[]): number {
  if (cues.length === 0) return 0
  
  const sortedCues = sortCuesByTime(cues)
  return sortedCues[sortedCues.length - 1].endTime
}

/**
 * Debounce function for search input
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}