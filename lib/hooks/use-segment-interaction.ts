/**
 * Custom hook for transcript segment interaction handling
 * Manages hover states, focus, and visual feedback for segments
 */

import * as React from "react"
import { type TranscriptCue } from "@/lib/types/transcript"

/**
 * Segment interaction configuration
 */
export interface SegmentInteractionConfig {
    /** Enable hover preview functionality */
    enableHoverPreview?: boolean
    /** Hover delay before showing preview (ms) */
    hoverDelay?: number
    /** Enable keyboard navigation between segments */
    enableKeyboardNav?: boolean
    /** Enable double-click for additional actions */
    enableDoubleClick?: boolean
    /** Debounce delay for click events (ms) */
    clickDebounce?: number
}

/**
 * Segment interaction state
 */
export interface SegmentInteractionState {
    /** Currently hovered segment ID */
    hoveredSegmentId: string | null
    /** Currently focused segment ID */
    focusedSegmentId: string | null
    /** Whether hover preview is active */
    isHoverPreviewActive: boolean
    /** Last interaction timestamp */
    lastInteractionTime: number
}

/**
 * Segment interaction actions
 */
export interface SegmentInteractionActions {
    /** Handle segment hover */
    handleSegmentHover: (cueId: string | null) => void
    /** Handle segment focus */
    handleSegmentFocus: (cueId: string | null) => void
    /** Handle segment click with debouncing */
    handleSegmentClick: (cue: TranscriptCue, event: React.MouseEvent) => void
    /** Handle segment double-click */
    handleSegmentDoubleClick: (cue: TranscriptCue, event: React.MouseEvent) => void
    /** Handle keyboard navigation */
    handleKeyboardNavigation: (event: React.KeyboardEvent, currentCueId: string) => void
    /** Reset interaction state */
    resetInteractionState: () => void
}

/**
 * Segment interaction callbacks
 */
export interface SegmentInteractionCallbacks {
    /** Called when segment is clicked */
    onSegmentClick?: (cue: TranscriptCue, event: React.MouseEvent) => void
    /** Called when segment is double-clicked */
    onSegmentDoubleClick?: (cue: TranscriptCue, event: React.MouseEvent) => void
    /** Called when hover preview should be shown */
    onHoverPreview?: (cue: TranscriptCue) => void
    /** Called when focus changes between segments */
    onFocusChange?: (cueId: string | null) => void
    /** Called for keyboard navigation requests */
    onKeyboardNavigation?: (direction: 'next' | 'prev' | 'first' | 'last', currentCueId: string) => void
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<SegmentInteractionConfig> = {
    enableHoverPreview: true,
    hoverDelay: 300,
    enableKeyboardNav: true,
    enableDoubleClick: true,
    clickDebounce: 150
}

/**
 * Custom hook for segment interaction handling
 */
export function useSegmentInteraction(
    cues: TranscriptCue[],
    config: SegmentInteractionConfig = {},
    callbacks: SegmentInteractionCallbacks = {}
): {
    state: SegmentInteractionState
    actions: SegmentInteractionActions
    getSegmentProps: (cue: TranscriptCue) => {
        onMouseEnter: () => void
        onMouseLeave: () => void
        onFocus: () => void
        onBlur: () => void
        onClick: (event: React.MouseEvent) => void
        onDoubleClick: (event: React.MouseEvent) => void
        onKeyDown: (event: React.KeyboardEvent) => void
        'data-hovered': boolean
        'data-focused': boolean
    }
} {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }
    const {
        onSegmentClick,
        onSegmentDoubleClick,
        onHoverPreview,
        onFocusChange,
        onKeyboardNavigation
    } = callbacks

    // Interaction state
    const [state, setState] = React.useState<SegmentInteractionState>({
        hoveredSegmentId: null,
        focusedSegmentId: null,
        isHoverPreviewActive: false,
        lastInteractionTime: 0
    })

    // Refs for managing timers and debouncing
    const hoverTimeoutRef = React.useRef<NodeJS.Timeout>()
    const clickTimeoutRef = React.useRef<NodeJS.Timeout>()
    const lastClickTimeRef = React.useRef<number>(0)

    // Cleanup timers on unmount
    React.useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current)
            }
        }
    }, [])

    // Handle segment hover
    const handleSegmentHover = React.useCallback((cueId: string | null) => {
        setState(prev => ({ ...prev, hoveredSegmentId: cueId }))

        // Clear existing hover timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }

        if (cueId && mergedConfig.enableHoverPreview) {
            hoverTimeoutRef.current = setTimeout(() => {
                const cue = cues.find(c => c.id === cueId)
                if (cue && onHoverPreview) {
                    setState(prev => ({ ...prev, isHoverPreviewActive: true }))
                    onHoverPreview(cue)
                }
            }, mergedConfig.hoverDelay)
        } else {
            setState(prev => ({ ...prev, isHoverPreviewActive: false }))
        }
    }, [cues, mergedConfig.enableHoverPreview, mergedConfig.hoverDelay, onHoverPreview])

    // Handle segment focus
    const handleSegmentFocus = React.useCallback((cueId: string | null) => {
        setState(prev => ({ ...prev, focusedSegmentId: cueId }))
        onFocusChange?.(cueId)
    }, [onFocusChange])

    // Handle segment click with debouncing
    const handleSegmentClick = React.useCallback((cue: TranscriptCue, event: React.MouseEvent) => {
        const now = Date.now()

        // Clear existing click timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
        }

        // Debounce rapid clicks
        if (now - lastClickTimeRef.current < mergedConfig.clickDebounce) {
            return
        }

        lastClickTimeRef.current = now
        setState(prev => ({ ...prev, lastInteractionTime: now }))

        // Delay execution to allow for potential double-click
        if (mergedConfig.enableDoubleClick) {
            clickTimeoutRef.current = setTimeout(() => {
                onSegmentClick?.(cue, event)
            }, 200) // Standard double-click detection window
        } else {
            onSegmentClick?.(cue, event)
        }
    }, [mergedConfig.clickDebounce, mergedConfig.enableDoubleClick, onSegmentClick])

    // Handle segment double-click
    const handleSegmentDoubleClick = React.useCallback((cue: TranscriptCue, event: React.MouseEvent) => {
        if (!mergedConfig.enableDoubleClick) return

        // Clear single-click timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
        }

        setState(prev => ({ ...prev, lastInteractionTime: Date.now() }))
        onSegmentDoubleClick?.(cue, event)
    }, [mergedConfig.enableDoubleClick, onSegmentDoubleClick])

    // Handle keyboard navigation
    const handleKeyboardNavigation = React.useCallback((event: React.KeyboardEvent, currentCueId: string) => {
        if (!mergedConfig.enableKeyboardNav) return

        const currentIndex = cues.findIndex(cue => cue.id === currentCueId)
        if (currentIndex === -1) return

        let direction: 'next' | 'prev' | 'first' | 'last' | null = null

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                direction = 'next'
                break
            case 'ArrowUp':
            case 'ArrowLeft':
                direction = 'prev'
                break
            case 'Home':
                direction = 'first'
                break
            case 'End':
                direction = 'last'
                break
            default:
                return
        }

        event.preventDefault()
        onKeyboardNavigation?.(direction, currentCueId)

        // Update focus state
        let nextIndex = currentIndex
        switch (direction) {
            case 'next':
                nextIndex = Math.min(currentIndex + 1, cues.length - 1)
                break
            case 'prev':
                nextIndex = Math.max(currentIndex - 1, 0)
                break
            case 'first':
                nextIndex = 0
                break
            case 'last':
                nextIndex = cues.length - 1
                break
        }

        if (nextIndex !== currentIndex) {
            handleSegmentFocus(cues[nextIndex].id)
        }
    }, [mergedConfig.enableKeyboardNav, cues, onKeyboardNavigation, handleSegmentFocus])

    // Reset interaction state
    const resetInteractionState = React.useCallback(() => {
        setState({
            hoveredSegmentId: null,
            focusedSegmentId: null,
            isHoverPreviewActive: false,
            lastInteractionTime: 0
        })

        // Clear any pending timeouts
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
        }
    }, [])

    // Generate props for individual segments
    const getSegmentProps = React.useCallback((cue: TranscriptCue) => {
        const isHovered = state.hoveredSegmentId === cue.id
        const isFocused = state.focusedSegmentId === cue.id

        return {
            onMouseEnter: () => handleSegmentHover(cue.id),
            onMouseLeave: () => handleSegmentHover(null),
            onFocus: () => handleSegmentFocus(cue.id),
            onBlur: () => handleSegmentFocus(null),
            onClick: (event: React.MouseEvent) => handleSegmentClick(cue, event),
            onDoubleClick: (event: React.MouseEvent) => handleSegmentDoubleClick(cue, event),
            onKeyDown: (event: React.KeyboardEvent) => handleKeyboardNavigation(event, cue.id),
            'data-hovered': isHovered,
            'data-focused': isFocused
        }
    }, [
        state.hoveredSegmentId,
        state.focusedSegmentId,
        handleSegmentHover,
        handleSegmentFocus,
        handleSegmentClick,
        handleSegmentDoubleClick,
        handleKeyboardNavigation
    ])

    const actions: SegmentInteractionActions = {
        handleSegmentHover,
        handleSegmentFocus,
        handleSegmentClick,
        handleSegmentDoubleClick,
        handleKeyboardNavigation,
        resetInteractionState
    }

    return {
        state,
        actions,
        getSegmentProps
    }
}

/**
 * Hook for managing segment visual feedback
 */
export function useSegmentVisualFeedback(
    activeSegmentId: string | null,
    hoveredSegmentId: string | null
) {
    const [feedbackState, setFeedbackState] = React.useState({
        showActiveIndicator: false,
        showHoverEffect: false,
        animationClass: ''
    })

    // Handle active segment changes with animation
    React.useEffect(() => {
        if (activeSegmentId) {
            setFeedbackState(prev => ({
                ...prev,
                showActiveIndicator: true,
                animationClass: 'animate-transcript-highlight'
            }))

            // Clear animation class after animation completes
            const timer = setTimeout(() => {
                setFeedbackState(prev => ({
                    ...prev,
                    animationClass: ''
                }))
            }, 500) // Match animation duration

            return () => clearTimeout(timer)
        } else {
            setFeedbackState(prev => ({
                ...prev,
                showActiveIndicator: false,
                animationClass: ''
            }))
        }
    }, [activeSegmentId])

    // Handle hover effects
    React.useEffect(() => {
        setFeedbackState(prev => ({
            ...prev,
            showHoverEffect: !!hoveredSegmentId
        }))
    }, [hoveredSegmentId])

    return feedbackState
}

/**
 * Hook for managing segment accessibility announcements
 */
export function useSegmentAccessibility(
    activeSegmentId: string | null,
    cues: TranscriptCue[]
) {
    const [announcement, setAnnouncement] = React.useState<string>('')

    React.useEffect(() => {
        if (activeSegmentId) {
            const activeCue = cues.find(cue => cue.id === activeSegmentId)
            if (activeCue) {
                const speakerText = activeCue.speaker ? `${activeCue.speaker}: ` : ''
                setAnnouncement(`Now playing: ${speakerText}${activeCue.text}`)
            }
        }
    }, [activeSegmentId, cues])

    return announcement
}