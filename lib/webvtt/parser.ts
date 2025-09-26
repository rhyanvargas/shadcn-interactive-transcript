/**
 * WebVTT Parser Utility
 * Parses WebVTT format strings into structured transcript data
 * Following web standards and providing comprehensive error handling
 */

import { 
  type TranscriptData, 
  type TranscriptCue, 
  type WebVTTParseResult,
  WebVTTParseError 
} from "../types/transcript"

/**
 * WebVTT cue settings interface
 */
interface WebVTTCueSettings {
  vertical?: 'rl' | 'lr'
  line?: number | string
  position?: number | string
  size?: number
  align?: 'start' | 'center' | 'end' | 'left' | 'right'
}

/**
 * Internal WebVTT cue representation during parsing
 */
interface ParsedWebVTTCue {
  id?: string
  startTime: number
  endTime: number
  text: string
  settings?: WebVTTCueSettings
}

/**
 * Parse WebVTT format string into structured transcript data
 * @param vttString - WebVTT format string
 * @returns Parsed transcript data with warnings
 */
export function parseWebVTT(vttString: string): WebVTTParseResult {
  const warnings: string[] = []
  const lines = vttString.split(/\r?\n/)
  
  // Validate WebVTT header
  if (lines.length === 0 || !lines[0].startsWith('WEBVTT')) {
    throw new WebVTTParseError('Invalid WebVTT file: missing WEBVTT header', 1)
  }

  const cues: TranscriptCue[] = []
  let currentLine = 1 // Skip header
  
  // Skip header and any metadata
  while (currentLine < lines.length && lines[currentLine].trim() !== '') {
    currentLine++
  }
  currentLine++ // Skip empty line after header

  try {
    while (currentLine < lines.length) {
      const result = parseCueBlock(lines, currentLine)
      if (result.cue) {
        cues.push(convertToTranscriptCue(result.cue, cues.length))
      }
      if (result.warnings) {
        warnings.push(...result.warnings)
      }
      currentLine = result.nextLine
    }
  } catch (error) {
    if (error instanceof WebVTTParseError) {
      throw error
    }
    throw new WebVTTParseError(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`, currentLine)
  }

  // Sort cues by start time to ensure proper order
  cues.sort((a, b) => a.startTime - b.startTime)

  // Calculate duration from last cue
  const duration = cues.length > 0 ? cues[cues.length - 1].endTime : 0

  return {
    data: {
      cues,
      metadata: {
        duration,
        language: extractLanguageFromHeader(lines[0])
      }
    },
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Parse a single cue block from WebVTT lines
 * @param lines - Array of WebVTT lines
 * @param startLine - Starting line index
 * @returns Parsed cue and next line index
 */
function parseCueBlock(lines: string[], startLine: number): {
  cue?: ParsedWebVTTCue
  warnings?: string[]
  nextLine: number
} {
  const warnings: string[] = []
  let currentLine = startLine

  // Skip empty lines
  while (currentLine < lines.length && lines[currentLine].trim() === '') {
    currentLine++
  }

  if (currentLine >= lines.length) {
    return { nextLine: currentLine }
  }

  // Check if this line contains timing information or is a cue identifier
  const timingLine = findTimingLine(lines, currentLine)
  if (!timingLine) {
    // Check if this looks like a malformed timing line
    if (isMalformedTimingLine(lines[currentLine])) {
      throw new WebVTTParseError(`Invalid timing format: ${lines[currentLine]}`, currentLine + 1)
    }
    // Skip non-cue content (notes, styles, etc.)
    while (currentLine < lines.length && lines[currentLine].trim() !== '') {
      currentLine++
    }
    return { nextLine: currentLine + 1 }
  }

  let cueId: string | undefined
  
  // If timing is not on current line, current line is cue ID
  if (timingLine.lineIndex !== currentLine) {
    cueId = lines[currentLine].trim()
    currentLine = timingLine.lineIndex
  }

  // Parse timing line
  const timing = parseTimingLine(lines[currentLine], currentLine + 1)
  currentLine++

  // Parse cue text (everything until next empty line or end of file)
  const textLines: string[] = []
  while (currentLine < lines.length && lines[currentLine].trim() !== '') {
    textLines.push(lines[currentLine])
    currentLine++
  }

  if (textLines.length === 0) {
    warnings.push(`Empty cue text at line ${currentLine}`)
  }

  const cue: ParsedWebVTTCue = {
    id: cueId,
    startTime: timing.startTime,
    endTime: timing.endTime,
    text: textLines.join('\n'),
    settings: timing.settings
  }

  return {
    cue,
    warnings: warnings.length > 0 ? warnings : undefined,
    nextLine: currentLine + 1
  }
}

/**
 * Find the line containing timing information
 * @param lines - Array of lines
 * @param startLine - Starting line index
 * @returns Timing line info or null
 */
function findTimingLine(lines: string[], startLine: number): { lineIndex: number } | null {
  // Check current line and next line for timing pattern
  for (let i = startLine; i < Math.min(startLine + 2, lines.length); i++) {
    if (isTimingLine(lines[i])) {
      return { lineIndex: i }
    }
  }
  return null
}

/**
 * Check if a line contains WebVTT timing information
 * @param line - Line to check
 * @returns True if line contains timing
 */
function isTimingLine(line: string): boolean {
  // WebVTT timing pattern: timestamp --> timestamp [settings]
  // Supports both HH:MM:SS.mmm and MM:SS.mmm formats
  const timingPattern = /^\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}\s*-->\s*(?:\d{1,2}:)?\d{1,2}:\d{2}\.\d{3}/
  return timingPattern.test(line)
}

/**
 * Check if a line looks like it might be attempting to be a timing line but is malformed
 * @param line - Line to check
 * @returns True if line appears to be malformed timing
 */
function isMalformedTimingLine(line: string): boolean {
  // Look for patterns that suggest timing but are malformed
  return /^\s*\d+.*->.*\d+/.test(line) || /^\s*\d+:\d+.*->.*\d+/.test(line)
}

/**
 * Parse WebVTT timing line
 * @param line - Timing line string
 * @param lineNumber - Line number for error reporting
 * @returns Parsed timing information
 */
function parseTimingLine(line: string, lineNumber: number): {
  startTime: number
  endTime: number
  settings?: WebVTTCueSettings
} {
  // Split on --> to separate start/end times from settings
  const parts = line.split('-->')
  if (parts.length !== 2) {
    throw new WebVTTParseError(`Invalid timing format: ${line}`, lineNumber)
  }

  const startTimeStr = parts[0].trim()
  const endAndSettings = parts[1].trim().split(/\s+/)
  const endTimeStr = endAndSettings[0]
  const settingsStr = endAndSettings.slice(1)

  try {
    const startTime = parseWebVTTTimestamp(startTimeStr)
    const endTime = parseWebVTTTimestamp(endTimeStr)

    if (startTime >= endTime) {
      throw new WebVTTParseError(`Start time must be less than end time: ${line}`, lineNumber)
    }

    const settings = settingsStr.length > 0 ? parseWebVTTSettings(settingsStr) : undefined

    return { startTime, endTime, settings }
  } catch (error) {
    throw new WebVTTParseError(
      `Invalid timestamp format in line: ${line}. ${error instanceof Error ? error.message : 'Unknown error'}`, 
      lineNumber
    )
  }
}

/**
 * Parse WebVTT timestamp to seconds
 * @param timestamp - WebVTT timestamp string (HH:MM:SS.mmm or MM:SS.mmm)
 * @returns Time in seconds
 */
function parseWebVTTTimestamp(timestamp: string): number {
  // WebVTT supports both HH:MM:SS.mmm and MM:SS.mmm formats
  const timestampPattern = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\.(\d{3})$/
  const match = timestamp.match(timestampPattern)
  
  if (!match) {
    throw new Error(`Invalid timestamp format: ${timestamp}`)
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0
  const minutes = parseInt(match[2], 10)
  const seconds = parseInt(match[3], 10)
  const milliseconds = parseInt(match[4], 10)

  // Validate time components
  if (minutes >= 60 || seconds >= 60 || milliseconds >= 1000) {
    throw new Error(`Invalid time values in timestamp: ${timestamp}`)
  }

  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
}

/**
 * Parse WebVTT cue settings
 * @param settingsArray - Array of setting strings
 * @returns Parsed settings object
 */
function parseWebVTTSettings(settingsArray: string[]): WebVTTCueSettings {
  const settings: WebVTTCueSettings = {}

  for (const setting of settingsArray) {
    const [key, value] = setting.split(':')
    if (!key || !value) continue

    switch (key.toLowerCase()) {
      case 'vertical':
        if (value === 'rl' || value === 'lr') {
          settings.vertical = value
        }
        break
      case 'line':
        const lineValue = value.includes('%') ? value : parseInt(value, 10)
        if (!isNaN(lineValue as number) || typeof lineValue === 'string') {
          settings.line = lineValue
        }
        break
      case 'position':
        const posValue = value.includes('%') ? value : parseInt(value, 10)
        if (!isNaN(posValue as number) || typeof posValue === 'string') {
          settings.position = posValue
        }
        break
      case 'size':
        const sizeValue = parseInt(value, 10)
        if (!isNaN(sizeValue)) {
          settings.size = sizeValue
        }
        break
      case 'align':
        if (['start', 'center', 'end', 'left', 'right'].includes(value)) {
          settings.align = value as WebVTTCueSettings['align']
        }
        break
    }
  }

  return settings
}

/**
 * Convert parsed WebVTT cue to TranscriptCue format
 * @param webvttCue - Parsed WebVTT cue
 * @param index - Cue index for ID generation
 * @returns TranscriptCue object
 */
function convertToTranscriptCue(webvttCue: ParsedWebVTTCue, index: number): TranscriptCue {
  // Extract speaker from text if present (format: "Speaker: text" or "<v Speaker>text")
  const { text, speaker } = extractSpeakerFromText(webvttCue.text)

  return {
    id: webvttCue.id || `cue-${index}`,
    startTime: webvttCue.startTime,
    endTime: webvttCue.endTime,
    text: text.trim(),
    speaker
  }
}

/**
 * Extract speaker information from WebVTT cue text
 * @param text - Original cue text
 * @returns Extracted text and speaker
 */
function extractSpeakerFromText(text: string): { text: string; speaker?: string } {
  // Handle <v Speaker> format
  const voiceTagMatch = text.match(/^<v\s+([^>]+)>\s*(.*)$/s)
  if (voiceTagMatch) {
    return {
      text: voiceTagMatch[2],
      speaker: voiceTagMatch[1].trim()
    }
  }

  // Handle "Speaker: text" format
  const speakerColonMatch = text.match(/^([^:]+):\s*(.*)$/s)
  if (speakerColonMatch && speakerColonMatch[1].length < 50) { // Reasonable speaker name length
    return {
      text: speakerColonMatch[2],
      speaker: speakerColonMatch[1].trim()
    }
  }

  return { text }
}

/**
 * Extract language from WebVTT header
 * @param headerLine - First line of WebVTT file
 * @returns Language code if present
 */
function extractLanguageFromHeader(headerLine: string): string | undefined {
  const langMatch = headerLine.match(/WEBVTT\s+(?:.*\s+)?lang[=:]?\s*([a-z]{2}(?:-[A-Z]{2})?)/i)
  return langMatch ? langMatch[1] : undefined
}

/**
 * Validate WebVTT string format
 * @param vttString - WebVTT string to validate
 * @returns Validation result
 */
export function validateWebVTT(vttString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!vttString || typeof vttString !== 'string') {
    errors.push('WebVTT content must be a non-empty string')
    return { isValid: false, errors }
  }

  if (vttString.trim() === '') {
    errors.push('WebVTT content cannot be empty')
    return { isValid: false, errors }
  }

  const lines = vttString.split(/\r?\n/)
  
  if (lines.length === 0) {
    errors.push('WebVTT content cannot be empty')
    return { isValid: false, errors }
  }

  if (!lines[0].startsWith('WEBVTT')) {
    errors.push('WebVTT file must start with "WEBVTT" header')
  }

  // Basic structure validation - look for at least one timing line
  const hasTimingLine = lines.some(line => isTimingLine(line))
  if (!hasTimingLine) {
    errors.push('WebVTT file must contain at least one cue with timing information')
  }

  return { isValid: errors.length === 0, errors }
}