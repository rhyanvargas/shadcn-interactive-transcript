/**
 * Unit tests for media synchronization utilities
 * Testing TextTrack API integration and media synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    createMediaIntegration,
    cleanupMediaIntegration,
    getActiveCue,
    seekToCue,
    seekToTime,
    validateMediaElement
} from '../media-sync'
import { type TranscriptData, MediaSyncError } from '../../types/transcript'

// Mock VTTCue for testing environment
class MockVTTCue {
    id: string = ''
    startTime: number
    endTime: number
    text: string

    constructor(startTime: number, endTime: number, text: string) {
        this.startTime = startTime
        this.endTime = endTime
        this.text = text
    }
}

// Mock TextTrack
class MockTextTrack {
    kind: TextTrackKind = 'captions'
    label: string = ''
    language: string = ''
    mode: TextTrackMode = 'disabled'
    cues: any = null
    activeCues: any = null

    private _cues: MockVTTCue[] = []
    private _activeCues: MockVTTCue[] = []
    private _eventListeners: { [key: string]: EventListener[] } = {}

    constructor() {
        this.cues = {
            length: 0,
            item: (index: number) => this._cues[index] || null,
            getCueById: (id: string) => this._cues.find(cue => cue.id === id) || null
        }

        this.activeCues = {
            length: 0,
            item: (index: number) => this._activeCues[index] || null
        }
    }

    addCue(cue: any): void {
        this._cues.push(cue)
        this.cues.length = this._cues.length
    }

    removeCue(cue: any): void {
        const index = this._cues.indexOf(cue)
        if (index > -1) {
            this._cues.splice(index, 1)
            this.cues.length = this._cues.length
        }
    }

    addEventListener(type: string, listener: EventListener): void {
        if (!this._eventListeners[type]) {
            this._eventListeners[type] = []
        }
        this._eventListeners[type].push(listener)
    }

    removeEventListener(type: string, listener: EventListener): void {
        if (this._eventListeners[type]) {
            const index = this._eventListeners[type].indexOf(listener)
            if (index > -1) {
                this._eventListeners[type].splice(index, 1)
            }
        }
    }

    dispatchEvent(event: Event): boolean {
        const listeners = this._eventListeners[event.type] || []
        listeners.forEach(listener => listener(event))
        return true
    }

    simulateCueChange(activeCues: MockVTTCue[] = []): void {
        this._activeCues = activeCues
        this.activeCues.length = activeCues.length
        this.dispatchEvent(new Event('cuechange'))
    }
}

// Mock HTMLMediaElement
class MockMediaElement {
    currentTime: number = 0
    readyState: number = 4
    crossOrigin: string | null = null
    src: string = ''
    parentNode: Node | null = document.body

    private _textTracks: MockTextTrack[] = []

    addTextTrack(kind: TextTrackKind, label?: string, language?: string): TextTrack {
        const track = new MockTextTrack()
        track.kind = kind
        track.label = label || ''
        track.language = language || ''
        this._textTracks.push(track)
        return track as any
    }
}

// Setup global mocks
global.VTTCue = MockVTTCue as any
global.MutationObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn()
}))

describe('Media Synchronization Utilities', () => {
    let mockMediaElement: MockMediaElement
    let transcriptData: TranscriptData

    beforeEach(() => {
        mockMediaElement = new MockMediaElement()
        transcriptData = {
            cues: [
                {
                    id: 'cue-1',
                    startTime: 0,
                    endTime: 3,
                    text: 'Hello world',
                    speaker: 'Alice'
                },
                {
                    id: 'cue-2',
                    startTime: 3,
                    endTime: 6,
                    text: 'How are you?',
                    speaker: 'Bob'
                }
            ],
            metadata: {
                duration: 6,
                language: 'en'
            }
        }
    })

    describe('createMediaIntegration', () => {
        it('should create media integration with default options', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            expect(integration.mediaElement).toBe(mockMediaElement)
            expect(integration.textTrack).toBeDefined()
            expect(integration.textTrack.kind).toBe('captions')
            expect(integration.textTrack.label).toBe('Interactive Transcript')
            expect(integration.textTrack.language).toBe('en')
            expect(integration.textTrack.mode).toBe('showing')
        })

        it('should throw error for missing media element', () => {
            expect(() => createMediaIntegration(null as any, transcriptData))
                .toThrow(MediaSyncError)
        })

        it('should throw error for empty transcript data', () => {
            expect(() => createMediaIntegration(
                mockMediaElement as any,
                { cues: [] }
            )).toThrow(MediaSyncError)
        })
    })

    describe('validateMediaElement', () => {
        it('should validate correct media element', () => {
            const result = validateMediaElement(mockMediaElement as any)
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject null media element', () => {
            const result = validateMediaElement(null as any)
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Media element is required')
        })
    })

    describe('seekToCue', () => {
        it('should seek to cue by ID', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            const result = seekToCue(
                mockMediaElement as any,
                integration.textTrack,
                'cue-2'
            )

            expect(result).toBe(true)
            expect(mockMediaElement.currentTime).toBe(3)
        })

        it('should return false for non-existent cue', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            const result = seekToCue(
                mockMediaElement as any,
                integration.textTrack,
                'non-existent'
            )

            expect(result).toBe(false)
        })
    })

    describe('seekToTime', () => {
        it('should seek to time and return corresponding cue', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            const cue = seekToTime(
                mockMediaElement as any,
                integration.textTrack,
                4.5
            )

            expect(mockMediaElement.currentTime).toBe(4.5)
            expect(cue).toBeDefined()
            expect(cue?.startTime).toBe(3)
            expect(cue?.endTime).toBe(6)
        })

        it('should return null for negative time', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            const cue = seekToTime(
                mockMediaElement as any,
                integration.textTrack,
                -5
            )

            expect(cue).toBeNull()
        })
    })

    describe('cleanupMediaIntegration', () => {
        it('should clean up media integration', () => {
            const integration = createMediaIntegration(
                mockMediaElement as any,
                transcriptData
            )

            cleanupMediaIntegration(integration)
            expect(integration.textTrack.mode).toBe('disabled')
        })
    })
})