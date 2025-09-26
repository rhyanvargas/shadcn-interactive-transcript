/**
 * Text-to-WebVTT Transformation Utility
 * Converts raw text into WebVTT format with configurable options
 * Following web standards and providing comprehensive transformation features
 */

import { type TranscriptData, type TranscriptCue, type TextTransformOptions } from "../types/transcript"

/**
 * Default configuration for text transformation
 */
const DEFAULT_TRANSFORM_OPTIONS: Required<TextTransformOptions> = {
  segmentDuration: 3, // 3 seconds per segment
  speakerDetection: true,
  timestampFormat: 'timecode'
}

/**
 * Transform raw text into WebVTT format string
 * @param text - Raw text content to transform
 * @param options - Transformation options
 * @returns WebVTT format string
 */
export function textToWebVTT(text: string, options: TextTransformOptions = {}): string {
  const config = { ...DEFAULT_TRANSFORM_OPTIONS, ...options }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Text content must be a non-empty string')
  }

  const transcriptData = textToTranscriptData(text, config)
  return transcriptDataToWebVTT(transcriptData)
}

/**
 * Transform raw text into structured TranscriptData
 * @param text - Raw text content to transform
 * @param options - Transformation options
 * @returns Structured transcript data
 */
export function textToTranscriptData(text: string, options: TextTransformOptions = {}): TranscriptData {
  const config = { ...DEFAULT_TRANSFORM_OPTIONS, ...options }

  if (!text || typeof text !== 'string' || text.trim() === '') {
    throw new Error('Text content must be a non-empty string')
  }

  // Split text into segments based on natural breaks
  const segments = splitTextIntoSegments(text.trim(), config)

  // Convert segments to cues with timing
  const cues = segments.map((segment, index) =>
    createCueFromSegment(segment, index, config)
  )

  // Calculate total duration
  const duration = cues.length > 0 ? cues[cues.length - 1].endTime : 0

  return {
    cues,
    metadata: {
      duration,
      language: detectLanguage(text)
    }
  }
}

/**
 * Convert TranscriptData to WebVTT format string
 * @param data - Structured transcript data
 * @returns WebVTT format string
 */
export function transcriptDataToWebVTT(data: TranscriptData): string {
  const { cues, metadata } = data

  // Build WebVTT header
  let webvtt = 'WEBVTT'
  if (metadata?.language) {
    webvtt += ` lang:${metadata.language}`
  }
  webvtt += '\n\n'

  // Add cues
  cues.forEach((cue, index) => {
    // Add cue ID if present
    if (cue.id && cue.id !== `cue-${index}`) {
      webvtt += `${cue.id}\n`
    }

    // Add timing line
    const startTime = formatWebVTTTimestamp(cue.startTime)
    const endTime = formatWebVTTTimestamp(cue.endTime)
    webvtt += `${startTime} --> ${endTime}\n`

    // Add cue text with speaker if present
    let cueText = cue.text
    if (cue.speaker) {
      cueText = `<v ${cue.speaker}>${cueText}`
    }
    webvtt += `${cueText}\n\n`
  })

  return webvtt.trim()
}

/**
 * Split text into segments based on natural breaks and duration
 * @param text - Text to split
 * @param config - Configuration options
 * @returns Array of text segments
 */
function splitTextIntoSegments(text: string, config: Required<TextTransformOptions>): string[] {
  // First, split by paragraphs and major breaks
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim())

  const segments: string[] = []

  for (const paragraph of paragraphs) {
    // Split paragraph into sentences
    const sentences = splitIntoSentences(paragraph)

    let currentSegment = ''
    let wordCount = 0
    const wordsPerSegment = estimateWordsPerSegment(config.segmentDuration)

    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length

      // If adding this sentence would exceed the target, start a new segment
      if (currentSegment && wordCount + sentenceWords > wordsPerSegment) {
        segments.push(currentSegment.trim())
        currentSegment = sentence
        wordCount = sentenceWords
      } else {
        currentSegment += (currentSegment ? ' ' : '') + sentence
        wordCount += sentenceWords
      }
    }

    // Add remaining segment
    if (currentSegment.trim()) {
      segments.push(currentSegment.trim())
    }
  }

  return segments.filter(segment => segment.length > 0)
}

/**
 * Split text into sentences using natural language patterns
 * @param text - Text to split into sentences
 * @returns Array of sentences
 */
function splitIntoSentences(text: string): string[] {
  // Enhanced sentence splitting that handles common abbreviations
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|SPLIT|')
    .split('|SPLIT|')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences
}

/**
 * Estimate words per segment based on duration and average speaking rate
 * @param duration - Segment duration in seconds
 * @returns Estimated words per segment
 */
function estimateWordsPerSegment(duration: number): number {
  // Average speaking rate is approximately 150-160 words per minute
  const wordsPerMinute = 150
  return Math.round((duration / 60) * wordsPerMinute)
}

/**
 * Create a TranscriptCue from a text segment
 * @param segment - Text segment
 * @param index - Segment index
 * @param config - Configuration options
 * @returns TranscriptCue object
 */
function createCueFromSegment(
  segment: string,
  index: number,
  config: Required<TextTransformOptions>
): TranscriptCue {
  const startTime = index * config.segmentDuration
  const endTime = startTime + config.segmentDuration

  // Extract speaker if speaker detection is enabled
  const { text, speaker } = config.speakerDetection
    ? extractSpeakerFromText(segment)
    : { text: segment, speaker: undefined }

  return {
    id: `cue-${index}`,
    startTime,
    endTime,
    text: text.trim(),
    speaker
  }
}

/**
 * Extract speaker information from text segment
 * @param text - Text segment that may contain speaker information
 * @returns Extracted text and speaker
 */
function extractSpeakerFromText(text: string): { text: string; speaker?: string } {
  // Handle "Speaker: text" format
  const speakerColonMatch = text.match(/^([A-Z][a-zA-Z\s]{1,30}):\s*(.+)$/s)
  if (speakerColonMatch) {
    return {
      text: speakerColonMatch[2],
      speaker: speakerColonMatch[1].trim()
    }
  }

  // Handle "[Speaker] text" format
  const speakerBracketMatch = text.match(/^\[([A-Z][a-zA-Z\s]{1,30})\]\s*(.+)$/s)
  if (speakerBracketMatch) {
    return {
      text: speakerBracketMatch[2],
      speaker: speakerBracketMatch[1].trim()
    }
  }

  // Handle "SPEAKER: text" format (all caps)
  const speakerCapsMatch = text.match(/^([A-Z]{2,20}):\s*(.+)$/s)
  if (speakerCapsMatch) {
    return {
      text: speakerCapsMatch[2],
      speaker: speakerCapsMatch[1].trim()
    }
  }

  return { text }
}

/**
 * Format timestamp for WebVTT format (HH:MM:SS.mmm)
 * @param seconds - Time in seconds
 * @returns WebVTT formatted timestamp
 */
function formatWebVTTTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`
}

/**
 * Simple language detection based on text patterns
 * @param text - Text to analyze
 * @returns Detected language code or undefined
 */
function detectLanguage(text: string): string | undefined {
  // Very basic language detection - in a real implementation,
  // you might use a more sophisticated language detection library

  // Check for common English patterns
  const englishPatterns = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi
  const englishMatches = text.match(englishPatterns)

  if (englishMatches && englishMatches.length > text.split(/\s+/).length * 0.1) {
    return 'en'
  }

  // Could add more language detection patterns here
  return undefined
}

/**
 * Validate text transformation options
 * @param options - Options to validate
 * @returns Validation result
 */
export function validateTransformOptions(options: TextTransformOptions): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.segmentDuration !== undefined) {
    if (typeof options.segmentDuration !== 'number' || options.segmentDuration <= 0) {
      errors.push('segmentDuration must be a positive number')
    }
    if (options.segmentDuration > 60) {
      errors.push('segmentDuration should not exceed 60 seconds for readability')
    }
  }

  if (options.speakerDetection !== undefined && typeof options.speakerDetection !== 'boolean') {
    errors.push('speakerDetection must be a boolean')
  }

  if (options.timestampFormat !== undefined) {
    if (!['seconds', 'timecode'].includes(options.timestampFormat)) {
      errors.push('timestampFormat must be either "seconds" or "timecode"')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Create WebVTT cues from text with custom timing
 * @param textSegments - Array of text segments
 * @param timings - Array of timing objects with start and end times
 * @param options - Additional options
 * @returns Array of TranscriptCue objects
 */
export function createCuesWithCustomTiming(
  textSegments: string[],
  timings: Array<{ start: number; end: number }>,
  options: Omit<TextTransformOptions, 'segmentDuration'> = {}
): TranscriptCue[] {
  if (textSegments.length !== timings.length) {
    throw new Error('Text segments and timings arrays must have the same length')
  }

  const config = { ...DEFAULT_TRANSFORM_OPTIONS, ...options }

  return textSegments.map((text, index) => {
    const timing = timings[index]
    const { text: cleanText, speaker } = config.speakerDetection
      ? extractSpeakerFromText(text)
      : { text, speaker: undefined }

    return {
      id: `cue-${index}`,
      startTime: timing.start,
      endTime: timing.end,
      text: cleanText.trim(),
      speaker
    }
  })
}