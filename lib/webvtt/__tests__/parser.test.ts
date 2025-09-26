/**
 * Unit tests for WebVTT parser utility
 * Testing various WebVTT formats and error conditions
 */

import { describe, it, expect } from 'vitest'
import { parseWebVTT, validateWebVTT } from '../parser'
import { WebVTTParseError } from '../../types/transcript'

describe('WebVTT Parser', () => {
  describe('parseWebVTT', () => {
    it('should parse basic WebVTT format', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
Hello, this is the first cue.

00:00:03.000 --> 00:00:06.000
This is the second cue.`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(2)
      expect(result.data.cues[0]).toEqual({
        id: 'cue-0',
        startTime: 0,
        endTime: 3,
        text: 'Hello, this is the first cue.',
        speaker: undefined
      })
      expect(result.data.cues[1]).toEqual({
        id: 'cue-1',
        startTime: 3,
        endTime: 6,
        text: 'This is the second cue.',
        speaker: undefined
      })
    })

    it('should parse WebVTT with cue IDs', () => {
      const vttContent = `WEBVTT

intro
00:00:00.000 --> 00:00:03.000
Welcome to the presentation.

main-content
00:00:03.000 --> 00:00:06.000
Here's the main content.`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(2)
      expect(result.data.cues[0].id).toBe('intro')
      expect(result.data.cues[1].id).toBe('main-content')
    })

    it('should parse WebVTT with speaker tags (<v Speaker>)', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
<v Alice>Hello everyone!

00:00:03.000 --> 00:00:06.000
<v Bob>Nice to meet you, Alice.`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0]).toEqual({
        id: 'cue-0',
        startTime: 0,
        endTime: 3,
        text: 'Hello everyone!',
        speaker: 'Alice'
      })
      expect(result.data.cues[1]).toEqual({
        id: 'cue-1',
        startTime: 3,
        endTime: 6,
        text: 'Nice to meet you, Alice.',
        speaker: 'Bob'
      })
    })

    it('should parse WebVTT with speaker colon format', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
Alice: Hello everyone!

00:00:03.000 --> 00:00:06.000
Bob: Nice to meet you, Alice.`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].speaker).toBe('Alice')
      expect(result.data.cues[0].text).toBe('Hello everyone!')
      expect(result.data.cues[1].speaker).toBe('Bob')
      expect(result.data.cues[1].text).toBe('Nice to meet you, Alice.')
    })

    it('should parse WebVTT with multiline cues', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
This is a multiline cue
that spans multiple lines
for better readability.`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].text).toBe('This is a multiline cue\nthat spans multiple lines\nfor better readability.')
    })

    it('should parse WebVTT with cue settings', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000 line:0 position:50% align:center
Centered subtitle at top`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].text).toBe('Centered subtitle at top')
      // Settings are parsed but not included in TranscriptCue (as per current interface)
    })

    it('should handle MM:SS.mmm timestamp format', () => {
      const vttContent = `WEBVTT

00:30.500 --> 01:15.750
Short format timestamp`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].startTime).toBe(30.5)
      expect(result.data.cues[0].endTime).toBe(75.75)
    })

    it('should sort cues by start time', () => {
      const vttContent = `WEBVTT

00:00:10.000 --> 00:00:15.000
Second cue chronologically

00:00:05.000 --> 00:00:10.000
First cue chronologically`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].text).toBe('First cue chronologically')
      expect(result.data.cues[1].text).toBe('Second cue chronologically')
    })

    it('should calculate duration from last cue', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
First cue

00:00:05.000 --> 00:01:30.500
Last cue`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.metadata?.duration).toBe(90.5)
    })

    it('should extract language from header', () => {
      const vttContent = `WEBVTT lang:en

00:00:00.000 --> 00:00:03.000
English content`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.metadata?.language).toBe('en')
    })

    it('should handle WebVTT with notes and styles (skip non-cue content)', () => {
      const vttContent = `WEBVTT

NOTE This is a comment

STYLE
::cue {
  background-color: black;
}

00:00:00.000 --> 00:00:03.000
Actual cue content`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(1)
      expect(result.data.cues[0].text).toBe('Actual cue content')
    })

    it('should handle empty cues with warnings', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000

00:00:03.000 --> 00:00:06.000
Valid cue`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(2)
      expect(result.warnings).toContain('Empty cue text at line 3')
    })
  })

  describe('parseWebVTT error handling', () => {
    it('should throw error for missing WEBVTT header', () => {
      const invalidContent = `00:00:00.000 --> 00:00:03.000
No header`

      expect(() => parseWebVTT(invalidContent)).toThrow(WebVTTParseError)
      expect(() => parseWebVTT(invalidContent)).toThrow('Invalid WebVTT file: missing WEBVTT header')
    })

    it('should throw error for invalid timing format', () => {
      const invalidContent = `WEBVTT

00:00:00.000 -> 00:00:03.000
Invalid arrow format`

      expect(() => parseWebVTT(invalidContent)).toThrow(WebVTTParseError)
    })

    it('should throw error for malformed timestamps', () => {
      const invalidContent = `WEBVTT

25:61:99.999 --> 00:00:03.000
Invalid timestamp`

      expect(() => parseWebVTT(invalidContent)).toThrow(WebVTTParseError)
    })

    it('should throw error when start time >= end time', () => {
      const invalidContent = `WEBVTT

00:00:05.000 --> 00:00:03.000
End before start`

      expect(() => parseWebVTT(invalidContent)).toThrow(WebVTTParseError)
      expect(() => parseWebVTT(invalidContent)).toThrow('Start time must be less than end time')
    })

    it('should throw error for invalid timestamp format', () => {
      const invalidContent = `WEBVTT

00:00:60.000 --> 00:00:03.000
Invalid seconds`

      expect(() => parseWebVTT(invalidContent)).toThrow(WebVTTParseError)
    })
  })

  describe('validateWebVTT', () => {
    it('should validate correct WebVTT format', () => {
      const validContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
Valid content`

      const result = validateWebVTT(validContent)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty content', () => {
      const result = validateWebVTT('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WebVTT content must be a non-empty string')
    })

    it('should reject non-string content', () => {
      const result = validateWebVTT(null as any)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WebVTT content must be a non-empty string')
    })

    it('should reject content without WEBVTT header', () => {
      const invalidContent = `Some content without header

00:00:00.000 --> 00:00:03.000
Content`

      const result = validateWebVTT(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WebVTT file must start with "WEBVTT" header')
    })

    it('should reject content without timing information', () => {
      const invalidContent = `WEBVTT

Just some text without timing`

      const result = validateWebVTT(invalidContent)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('WebVTT file must contain at least one cue with timing information')
    })
  })

  describe('edge cases', () => {
    it('should handle Windows line endings (CRLF)', () => {
      const vttContent = `WEBVTT\r\n\r\n00:00:00.000 --> 00:00:03.000\r\nWindows line endings`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(1)
      expect(result.data.cues[0].text).toBe('Windows line endings')
    })

    it('should handle mixed line endings', () => {
      const vttContent = `WEBVTT\n\n00:00:00.000 --> 00:00:03.000\r\nMixed line endings`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(1)
    })

    it('should handle extra whitespace', () => {
      const vttContent = `WEBVTT   

   00:00:00.000   -->   00:00:03.000   
   Whitespace handling   `

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].text).toBe('Whitespace handling')
    })

    it('should handle very long speaker names (should not extract as speaker)', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
This is a very long line that might look like a speaker but is actually just regular content: and this continues`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues[0].speaker).toBeUndefined()
      expect(result.data.cues[0].text).toContain('This is a very long line')
    })

    it('should handle cues with only whitespace', () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:03.000
   
   
00:00:03.000 --> 00:00:06.000
Valid content`

      const result = parseWebVTT(vttContent)
      
      expect(result.data.cues).toHaveLength(2)
      expect(result.data.cues[0].text).toBe('')
      expect(result.data.cues[1].text).toBe('Valid content')
    })
  })
})