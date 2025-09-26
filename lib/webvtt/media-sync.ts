/**
 * Media Synchronization Utilities
 * Integrates with HTMLMediaElement via TextTrack API for real-time synchronization
 * Following web standards and providing comprehensive media integration
 */

import {
    type TranscriptData,
    type TranscriptCue,
    type MediaIntegration,
    MediaSyncError
} from "../types/transcript"

/**
 * Media synchronization configuration options
 */
export interface MediaSyncOptions {
    /** TextTrack kind (default: 'captions') */
    kind?: TextTrackKind
    /** TextTrack label for display */
    label?: string
    /** Language code for the track */
    language?: string
    /** Whether to set as default track */
    default?: boolean
    /** Custom cue change handler */
    onCueChange?: (activeCue: TextTrackCue | null) => void
    /** Error handler for media sync issues */
    onError?: (error: MediaSyncError) => void
}

/**
 * Default media sync configuration
 */
const DEFAULT_MEDIA_SYNC_OPTIONS: Required<Omit<MediaSyncOptions, 'onCueChange' | 'onError'>> = {
    kind: 'captions',
    label: 'Interactive Transcript',
    language: 'en',
    default: true
}

/**
 * Create and integrate TextTrack with media element
 * @param mediaElement - HTML media element (video/audio)
 * @param transcriptData - Structured transcript data
 * @param options - Media sync configuration options
 * @returns MediaIntegration object with cleanup methods
 */
export function createMediaIntegration(
    mediaElement: HTMLMediaElement,
    transcriptData: TranscriptData,
    options: MediaSyncOptions = {}
): MediaIntegration {
    const config = { ...DEFAULT_MEDIA_SYNC_OPTIONS, ...options }

    if (!mediaElement) {
        throw new MediaSyncError('Media element is required for synchronization')
    }

    if (!transcriptData?.cues?.length) {
        throw new MediaSyncError('Transcript data with cues is required')
    }

    try {
        // Create TextTrack
        const textTrack = mediaElement.addTextTrack(
            config.kind,
            config.label,
            config.language
        )

        // Set track mode to showing for synchronization
        textTrack.mode = 'showing'

        // Add cues to the TextTrack
        addCuesToTextTrack(textTrack, transcriptData.cues)

        // Set up cue change event handler
        const cueChangeHandler = createCueChangeHandler(textTrack, options.onCueChange, options.onError)
        textTrack.addEventListener('cuechange', cueChangeHandler)

        // Set as default if specified
        if (config.default && textTrack instanceof TextTrack) {
            // Note: TextTrack doesn't have a 'default' property in the standard API
            // This would typically be handled by the media element's track selection
        }

        return {
            textTrack,
            mediaElement,
            activeCue: null,
            cueChangeHandler
        }
    } catch (error) {
        const syncError = error instanceof MediaSyncError
            ? error
            : new MediaSyncError(`Failed to create media integration: ${error instanceof Error ? error.message : 'Unknown error'}`, mediaElement)

        if (options.onError) {
            options.onError(syncError)
        }
        throw syncError
    }
}

/**
 * Add transcript cues to TextTrack
 * @param textTrack - TextTrack to add cues to
 * @param cues - Array of transcript cues
 */
function addCuesToTextTrack(textTrack: TextTrack, cues: TranscriptCue[]): void {
    for (const cue of cues) {
        try {
            // Create VTTCue (WebVTT cue)
            const vttCue = new VTTCue(cue.startTime, cue.endTime, cue.text)

            // Set cue ID if available
            if (cue.id) {
                vttCue.id = cue.id
            }

            // Add speaker information as voice tag if present
            if (cue.speaker) {
                // VTTCue text already includes speaker formatting from transformer
                // The text should already be formatted as needed
            }

            // Add cue to track
            textTrack.addCue(vttCue)
        } catch (error) {
            console.warn(`Failed to add cue ${cue.id || 'unknown'}:`, error)
            // Continue adding other cues even if one fails
        }
    }
}

/**
 * Create cue change event handler
 * @param textTrack - TextTrack instance
 * @param onCueChange - Optional custom cue change handler
 * @param onError - Optional error handler
 * @returns Event handler function
 */
function createCueChangeHandler(
    textTrack: TextTrack,
    onCueChange?: (activeCue: TextTrackCue | null) => void,
    onError?: (error: MediaSyncError) => void
): (event: Event) => void {
    return (event: Event) => {
        try {
            // Get currently active cues
            const activeCues = textTrack.activeCues
            const activeCue = activeCues && activeCues.length > 0 ? activeCues[0] : null

            // Call custom handler if provided
            if (onCueChange) {
                onCueChange(activeCue)
            }

            // Update integration state if accessible
            // Note: This would typically be handled by the component using this integration
        } catch (error) {
            const syncError = new MediaSyncError(
                `Cue change handler error: ${error instanceof Error ? error.message : 'Unknown error'}`
            )

            if (onError) {
                onError(syncError)
            } else {
                console.error('Media sync cue change error:', syncError)
            }
        }
    }
}

/**
 * Remove TextTrack integration and clean up event listeners
 * @param integration - MediaIntegration object to clean up
 */
export function cleanupMediaIntegration(integration: MediaIntegration): void {
    try {
        // Remove event listener
        if (integration.textTrack && integration.cueChangeHandler) {
            integration.textTrack.removeEventListener('cuechange', integration.cueChangeHandler)
        }

        // Remove text track from media element
        if (integration.mediaElement && integration.textTrack) {
            // Note: There's no standard way to remove a TextTrack once added
            // Setting mode to 'disabled' is the closest equivalent
            integration.textTrack.mode = 'disabled'

            // Clear all cues
            const cues = Array.from(integration.textTrack.cues || [])
            for (const cue of cues) {
                integration.textTrack.removeCue(cue)
            }
        }
    } catch (error) {
        console.warn('Error during media integration cleanup:', error)
    }
}

/**
 * Get currently active cue from TextTrack
 * @param textTrack - TextTrack to query
 * @returns Currently active cue or null
 */
export function getActiveCue(textTrack: TextTrack): TextTrackCue | null {
    const activeCues = textTrack.activeCues
    return activeCues && activeCues.length > 0 ? activeCues[0] : null
}

/**
 * Seek to a specific cue by ID
 * @param mediaElement - Media element to control
 * @param textTrack - TextTrack containing the cues
 * @param cueId - ID of the cue to seek to
 * @returns True if cue was found and seeked to, false otherwise
 */
export function seekToCue(
    mediaElement: HTMLMediaElement,
    textTrack: TextTrack,
    cueId: string
): boolean {
    try {
        const cues = textTrack.cues
        if (!cues) return false

        // Find cue by ID
        for (let i = 0; i < cues.length; i++) {
            const cue = cues[i]
            if (cue.id === cueId) {
                mediaElement.currentTime = cue.startTime
                return true
            }
        }

        return false
    } catch (error) {
        console.error('Error seeking to cue:', error)
        return false
    }
}

/**
 * Seek to a specific time and get the corresponding cue
 * @param mediaElement - Media element to control
 * @param textTrack - TextTrack containing the cues
 * @param time - Time in seconds to seek to
 * @returns The cue at the specified time, or null if none found
 */
export function seekToTime(
    mediaElement: HTMLMediaElement,
    textTrack: TextTrack,
    time: number
): TextTrackCue | null {
    try {
        if (time < 0) return null

        mediaElement.currentTime = time

        // Find cue at the specified time
        const cues = textTrack.cues
        if (!cues) return null

        for (let i = 0; i < cues.length; i++) {
            const cue = cues[i]
            if (time >= cue.startTime && time <= cue.endTime) {
                return cue
            }
        }

        return null
    } catch (error) {
        console.error('Error seeking to time:', error)
        return null
    }
}

/**
 * Get all cues from a TextTrack as TranscriptCue objects
 * @param textTrack - TextTrack to extract cues from
 * @returns Array of TranscriptCue objects
 */
export function extractCuesFromTextTrack(textTrack: TextTrack): TranscriptCue[] {
    const transcriptCues: TranscriptCue[] = []
    const cues = textTrack.cues

    if (!cues) return transcriptCues

    for (let i = 0; i < cues.length; i++) {
        const cue = cues[i]
        if (cue instanceof VTTCue) {
            // Extract speaker from VTT cue text if present
            const { text, speaker } = extractSpeakerFromVTTCue(cue.text)

            transcriptCues.push({
                id: cue.id || `cue-${i}`,
                startTime: cue.startTime,
                endTime: cue.endTime,
                text,
                speaker
            })
        }
    }

    return transcriptCues
}

/**
 * Extract speaker information from VTT cue text
 * @param cueText - VTT cue text that may contain voice tags
 * @returns Extracted text and speaker
 */
function extractSpeakerFromVTTCue(cueText: string): { text: string; speaker?: string } {
    // Handle <v Speaker> format
    const voiceTagMatch = cueText.match(/^<v\s+([^>]+)>\s*(.*)$/s)
    if (voiceTagMatch) {
        return {
            text: voiceTagMatch[2],
            speaker: voiceTagMatch[1].trim()
        }
    }

    return { text: cueText }
}

/**
 * Validate media element compatibility
 * @param mediaElement - Media element to validate
 * @returns Validation result with any issues
 */
export function validateMediaElement(mediaElement: HTMLMediaElement): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []

    if (!mediaElement) {
        errors.push('Media element is required')
        return { isValid: false, errors, warnings }
    }

    if (!(mediaElement instanceof HTMLMediaElement)) {
        errors.push('Element must be an HTMLMediaElement (video or audio)')
    }

    // Check for TextTrack support
    if (typeof mediaElement.addTextTrack !== 'function') {
        errors.push('Media element does not support TextTrack API')
    }

    // Check if media is loaded
    if (mediaElement.readyState === 0) {
        warnings.push('Media element has no data loaded yet')
    }

    // Check for CORS issues that might affect TextTrack
    if (mediaElement.crossOrigin === null && mediaElement.src && !isSameOrigin(mediaElement.src)) {
        warnings.push('Cross-origin media without CORS may have TextTrack limitations')
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Check if a URL is same-origin
 * @param url - URL to check
 * @returns True if same origin, false otherwise
 */
function isSameOrigin(url: string): boolean {
    try {
        const urlObj = new URL(url, window.location.href)
        return urlObj.origin === window.location.origin
    } catch {
        return false
    }
}

/**
 * Create a media sync utility with automatic cleanup
 * @param mediaElement - Media element to sync with
 * @param transcriptData - Transcript data to sync
 * @param options - Sync options
 * @returns Object with integration and cleanup function
 */
export function createAutoCleanupMediaSync(
    mediaElement: HTMLMediaElement,
    transcriptData: TranscriptData,
    options: MediaSyncOptions = {}
): {
    integration: MediaIntegration
    cleanup: () => void
} {
    const integration = createMediaIntegration(mediaElement, transcriptData, options)

    const cleanup = () => {
        cleanupMediaIntegration(integration)
    }

    // Auto-cleanup when media element is removed from DOM
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const removedNode of mutation.removedNodes) {
                    if (removedNode === mediaElement || (removedNode instanceof Element && removedNode.contains(mediaElement))) {
                        cleanup()
                        observer.disconnect()
                        return
                    }
                }
            }
        }
    })

    if (mediaElement.parentNode) {
        observer.observe(document.body, { childList: true, subtree: true })
    }

    return { integration, cleanup }
}