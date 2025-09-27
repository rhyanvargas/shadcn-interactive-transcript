/**
 * Unit tests for useSegmentInteraction hook
 * Testing interaction handling, keyboard navigation, and visual feedback
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSegmentInteraction, useSegmentVisualFeedback, useSegmentAccessibility } from '../use-segment-interaction'
import { type TranscriptCue } from '@/lib/types/transcript'

// Mock transcript cues
const mockCues: TranscriptCue[] = [
    {
        id: 'cue-1',
        startTime: 0,
        endTime: 3,
        text: 'First segment',
        speaker: 'Alice'
    },
    {
        id: 'cue-2',
        startTime: 3,
        endTime: 6,
        text: 'Second segment',
        speaker: 'Bob'
    },
    {
        id: 'cue-3',
        startTime: 6,
        endTime: 9,
        text: 'Third segment',
        speaker: undefined
    }
]

// Mock React events
const createMockMouseEvent = (overrides = {}) => ({
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: {},
    target: {},
    altKey: false,
    button: 0,
    buttons: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    getModifierState: vi.fn(),
    metaKey: false,
    movementX: 0,
    movementY: 0,
    pageX: 0,
    pageY: 0,
    relatedTarget: null,
    screenX: 0,
    screenY: 0,
    shiftKey: false,
    detail: 0,
    view: window,
    bubbles: false,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    nativeEvent: {} as MouseEvent,
    timeStamp: Date.now(),
    type: 'click',
    persist: vi.fn(),
    isDefaultPrevented: vi.fn(() => false),
    isPropagationStopped: vi.fn(() => false),
    ...overrides
}) as unknown as React.MouseEvent

const createMockKeyboardEvent = (key: string, overrides = {}) => ({
    key,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: {},
    target: {},
    altKey: false,
    charCode: 0,
    ctrlKey: false,
    code: key,
    getModifierState: vi.fn(),
    keyCode: 0,
    locale: '',
    location: 0,
    metaKey: false,
    repeat: false,
    shiftKey: false,
    which: 0,
    detail: 0,
    view: window,
    bubbles: false,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    nativeEvent: {} as KeyboardEvent,
    timeStamp: Date.now(),
    type: 'keydown',
    persist: vi.fn(),
    isDefaultPrevented: vi.fn(() => false),
    isPropagationStopped: vi.fn(() => false),
    ...overrides
}) as unknown as React.KeyboardEvent

describe('useSegmentInteraction', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    describe('basic functionality', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            expect(result.current.state).toEqual({
                hoveredSegmentId: null,
                focusedSegmentId: null,
                isHoverPreviewActive: false,
                lastInteractionTime: 0
            })
        })

        it('should provide segment props with event handlers', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            const segmentProps = result.current.getSegmentProps(mockCues[0])

            expect(segmentProps).toHaveProperty('onMouseEnter')
            expect(segmentProps).toHaveProperty('onMouseLeave')
            expect(segmentProps).toHaveProperty('onFocus')
            expect(segmentProps).toHaveProperty('onBlur')
            expect(segmentProps).toHaveProperty('onClick')
            expect(segmentProps).toHaveProperty('onDoubleClick')
            expect(segmentProps).toHaveProperty('onKeyDown')
            expect(segmentProps).toHaveProperty('data-hovered')
            expect(segmentProps).toHaveProperty('data-focused')
        })
    })

    describe('hover handling', () => {
        it('should update hovered segment on mouse enter', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
            })

            expect(result.current.state.hoveredSegmentId).toBe('cue-1')
        })

        it('should clear hovered segment on mouse leave', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
            })

            act(() => {
                result.current.actions.handleSegmentHover(null)
            })

            expect(result.current.state.hoveredSegmentId).toBeNull()
        })

        it('should trigger hover preview after delay', () => {
            const onHoverPreview = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { hoverDelay: 100 }, { onHoverPreview })
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
            })

            // Fast-forward time
            act(() => {
                vi.advanceTimersByTime(100)
            })

            expect(onHoverPreview).toHaveBeenCalledWith(mockCues[0])
            expect(result.current.state.isHoverPreviewActive).toBe(true)
        })

        it('should cancel hover preview when hover is cleared', () => {
            const onHoverPreview = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { hoverDelay: 100 }, { onHoverPreview })
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
            })

            act(() => {
                result.current.actions.handleSegmentHover(null)
            })

            act(() => {
                vi.advanceTimersByTime(100)
            })

            expect(onHoverPreview).not.toHaveBeenCalled()
            expect(result.current.state.isHoverPreviewActive).toBe(false)
        })
    })

    describe('focus handling', () => {
        it('should update focused segment', () => {
            const onFocusChange = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onFocusChange })
            )

            act(() => {
                result.current.actions.handleSegmentFocus('cue-2')
            })

            expect(result.current.state.focusedSegmentId).toBe('cue-2')
            expect(onFocusChange).toHaveBeenCalledWith('cue-2')
        })

        it('should clear focused segment', () => {
            const onFocusChange = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onFocusChange })
            )

            act(() => {
                result.current.actions.handleSegmentFocus('cue-2')
            })

            act(() => {
                result.current.actions.handleSegmentFocus(null)
            })

            expect(result.current.state.focusedSegmentId).toBeNull()
            expect(onFocusChange).toHaveBeenCalledWith(null)
        })
    })

    describe('click handling', () => {
        it('should handle single click', () => {
            const onSegmentClick = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableDoubleClick: false }, { onSegmentClick })
            )

            const mockEvent = createMockMouseEvent()

            act(() => {
                result.current.actions.handleSegmentClick(mockCues[0], mockEvent)
            })

            expect(onSegmentClick).toHaveBeenCalledWith(mockCues[0], mockEvent)
        })

        it('should debounce rapid clicks', () => {
            const onSegmentClick = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { clickDebounce: 100, enableDoubleClick: false }, { onSegmentClick })
            )

            const mockEvent = createMockMouseEvent()

            act(() => {
                result.current.actions.handleSegmentClick(mockCues[0], mockEvent)
                result.current.actions.handleSegmentClick(mockCues[0], mockEvent)
                result.current.actions.handleSegmentClick(mockCues[0], mockEvent)
            })

            expect(onSegmentClick).toHaveBeenCalledTimes(1)
        })

        it('should handle double click', () => {
            const onSegmentDoubleClick = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onSegmentDoubleClick })
            )

            const mockEvent = createMockMouseEvent()

            act(() => {
                result.current.actions.handleSegmentDoubleClick(mockCues[0], mockEvent)
            })

            expect(onSegmentDoubleClick).toHaveBeenCalledWith(mockCues[0], mockEvent)
        })

        it('should delay single click when double click is enabled', () => {
            const onSegmentClick = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableDoubleClick: true }, { onSegmentClick })
            )

            const mockEvent = createMockMouseEvent()

            act(() => {
                result.current.actions.handleSegmentClick(mockCues[0], mockEvent)
            })

            expect(onSegmentClick).not.toHaveBeenCalled()

            act(() => {
                vi.advanceTimersByTime(200)
            })

            expect(onSegmentClick).toHaveBeenCalledWith(mockCues[0], mockEvent)
        })
    })

    describe('keyboard navigation', () => {
        it('should handle arrow down navigation', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('ArrowDown')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            expect(mockEvent.preventDefault).toHaveBeenCalled()
            expect(onKeyboardNavigation).toHaveBeenCalledWith('next', 'cue-1')
        })

        it('should handle arrow up navigation', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('ArrowUp')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-2')
            })

            expect(onKeyboardNavigation).toHaveBeenCalledWith('prev', 'cue-2')
        })

        it('should handle home key navigation', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('Home')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-2')
            })

            expect(onKeyboardNavigation).toHaveBeenCalledWith('first', 'cue-2')
        })

        it('should handle end key navigation', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('End')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            expect(onKeyboardNavigation).toHaveBeenCalledWith('last', 'cue-1')
        })

        it('should ignore non-navigation keys', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, {}, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('Enter')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            expect(mockEvent.preventDefault).not.toHaveBeenCalled()
            expect(onKeyboardNavigation).not.toHaveBeenCalled()
        })

        it('should update focus state during navigation', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            const mockEvent = createMockKeyboardEvent('ArrowDown')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            expect(result.current.state.focusedSegmentId).toBe('cue-2')
        })

        it('should not navigate beyond boundaries', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            // First set focus to the first item
            act(() => {
                result.current.actions.handleSegmentFocus('cue-1')
            })

            const mockEvent = createMockKeyboardEvent('ArrowUp')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            // Should stay at the first item since we can't go beyond boundaries
            expect(result.current.state.focusedSegmentId).toBe('cue-1')
        })
    })

    describe('configuration options', () => {
        it('should disable hover preview when configured', () => {
            const onHoverPreview = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableHoverPreview: false }, { onHoverPreview })
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
            })

            act(() => {
                vi.advanceTimersByTime(1000)
            })

            expect(onHoverPreview).not.toHaveBeenCalled()
        })

        it('should disable keyboard navigation when configured', () => {
            const onKeyboardNavigation = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableKeyboardNav: false }, { onKeyboardNavigation })
            )

            const mockEvent = createMockKeyboardEvent('ArrowDown')

            act(() => {
                result.current.actions.handleKeyboardNavigation(mockEvent, 'cue-1')
            })

            expect(onKeyboardNavigation).not.toHaveBeenCalled()
        })

        it('should disable double click when configured', () => {
            const onSegmentDoubleClick = vi.fn()
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableDoubleClick: false }, { onSegmentDoubleClick })
            )

            const mockEvent = createMockMouseEvent()

            act(() => {
                result.current.actions.handleSegmentDoubleClick(mockCues[0], mockEvent)
            })

            expect(onSegmentDoubleClick).not.toHaveBeenCalled()
        })
    })

    describe('state management', () => {
        it('should reset interaction state', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
                result.current.actions.handleSegmentFocus('cue-2')
            })

            act(() => {
                result.current.actions.resetInteractionState()
            })

            expect(result.current.state).toEqual({
                hoveredSegmentId: null,
                focusedSegmentId: null,
                isHoverPreviewActive: false,
                lastInteractionTime: 0
            })
        })

        it('should update last interaction time on click', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues, { enableDoubleClick: false })
            )

            const initialTime = result.current.state.lastInteractionTime

            act(() => {
                result.current.actions.handleSegmentClick(mockCues[0], createMockMouseEvent())
            })

            expect(result.current.state.lastInteractionTime).toBeGreaterThan(initialTime)
        })
    })

    describe('getSegmentProps', () => {
        it('should return correct data attributes', () => {
            const { result } = renderHook(() =>
                useSegmentInteraction(mockCues)
            )

            act(() => {
                result.current.actions.handleSegmentHover('cue-1')
                result.current.actions.handleSegmentFocus('cue-1')
            })

            const props = result.current.getSegmentProps(mockCues[0])
            expect(props['data-hovered']).toBe(true)
            expect(props['data-focused']).toBe(true)

            const otherProps = result.current.getSegmentProps(mockCues[1])
            expect(otherProps['data-hovered']).toBe(false)
            expect(otherProps['data-focused']).toBe(false)
        })
    })
})

describe('useSegmentVisualFeedback', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should show active indicator when segment is active', () => {
        const { result } = renderHook(() =>
            useSegmentVisualFeedback('cue-1', null)
        )

        expect(result.current.showActiveIndicator).toBe(true)
        expect(result.current.animationClass).toBe('animate-transcript-highlight')
    })

    it('should clear animation class after timeout', () => {
        const { result } = renderHook(() =>
            useSegmentVisualFeedback('cue-1', null)
        )

        act(() => {
            vi.advanceTimersByTime(500)
        })

        expect(result.current.animationClass).toBe('')
    })

    it('should show hover effect when segment is hovered', () => {
        const { result } = renderHook(() =>
            useSegmentVisualFeedback(null, 'cue-1')
        )

        expect(result.current.showHoverEffect).toBe(true)
    })
})

describe('useSegmentAccessibility', () => {
    it('should generate announcement for active segment', () => {
        const { result } = renderHook(() =>
            useSegmentAccessibility('cue-1', mockCues)
        )

        expect(result.current).toBe('Now playing: Alice: First segment')
    })

    it('should handle segment without speaker', () => {
        const { result } = renderHook(() =>
            useSegmentAccessibility('cue-3', mockCues)
        )

        expect(result.current).toBe('Now playing: Third segment')
    })

    it('should return empty string when no active segment', () => {
        const { result } = renderHook(() =>
            useSegmentAccessibility(null, mockCues)
        )

        expect(result.current).toBe('')
    })
})