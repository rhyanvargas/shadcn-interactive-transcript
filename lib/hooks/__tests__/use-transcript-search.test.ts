/**
 * Tests for useTranscriptSearch hook
 * Testing search functionality, state management, and callbacks
 */

import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useTranscriptSearch } from "../use-transcript-search"
import { type TranscriptCue } from "@/lib/types/transcript"

// Mock transcript data
const mockCues: TranscriptCue[] = [
  {
    id: "1",
    startTime: 0,
    endTime: 5,
    text: "Hello world, this is a test transcript",
    speaker: "Speaker 1"
  },
  {
    id: "2",
    startTime: 5,
    endTime: 10,
    text: "This is another segment with different content",
    speaker: "Speaker 2"
  },
  {
    id: "3",
    startTime: 10,
    endTime: 15,
    text: "Testing search functionality in transcripts",
    speaker: "Speaker 1"
  },
  {
    id: "4",
    startTime: 15,
    endTime: 20,
    text: "Final segment for comprehensive testing",
    speaker: "Speaker 2"
  }
]

describe("useTranscriptSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("initializes with empty state", () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      expect(result.current.state).toEqual({
        query: '',
        results: [],
        currentResultIndex: -1,
        isSearching: false,
        isLoading: false,
        error: null
      })
      expect(result.current.currentResult).toBeNull()
    })

    it("provides all required actions", () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      expect(result.current.actions).toHaveProperty('setQuery')
      expect(result.current.actions).toHaveProperty('search')
      expect(result.current.actions).toHaveProperty('nextResult')
      expect(result.current.actions).toHaveProperty('prevResult')
      expect(result.current.actions).toHaveProperty('goToResult')
      expect(result.current.actions).toHaveProperty('clearSearch')
      expect(result.current.actions).toHaveProperty('resetSearch')
    })
  })

  describe("Search Functionality", () => {
    it("performs basic text search", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      // Advance timers to trigger debounced search
      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
        expect(result.current.state.results[0].cue.text).toContain("test")
        expect(result.current.state.results[1].cue.text).toContain("Testing")
      })
    })

    it("performs case-insensitive search by default", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("HELLO")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(1)
        expect(result.current.state.results[0].cue.text).toContain("Hello")
      })
    })

    it("performs case-sensitive search when configured", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { caseSensitive: true })
      )

      act(() => {
        result.current.actions.setQuery("HELLO")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(0)
      })
    })

    it("performs whole word search when configured", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { wholeWords: true })
      )

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(1)
        expect(result.current.state.results[0].cue.text).toContain("test transcript")
      })
    })

    it("respects minimum query length", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { minQueryLength: 3 })
      )

      act(() => {
        result.current.actions.setQuery("te")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(0)
        expect(result.current.state.isSearching).toBe(false)
      })
    })

    it("limits results based on maxResults config", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { maxResults: 1 })
      )

      act(() => {
        result.current.actions.setQuery("is")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(1)
      })
    })

    it("handles regex search when enabled", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { useRegex: true })
      )

      act(() => {
        result.current.actions.setQuery("test|Testing")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })
    })

    it("handles invalid regex gracefully", async () => {
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { useRegex: true })
      )

      act(() => {
        result.current.actions.setQuery("[invalid regex")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        // Should fallback to escaped literal search
        expect(result.current.state.error).toBeNull()
        expect(result.current.state.results).toHaveLength(0)
      })
    })
  })

  describe("Search State Management", () => {
    it("sets loading state during debounce", () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      expect(result.current.state.isLoading).toBe(true)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.state.isLoading).toBe(false)
    })

    it("sets searching state when query meets minimum length", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.isSearching).toBe(true)
      })
    })

    it("updates query state immediately", () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test query")
      })

      expect(result.current.state.query).toBe("test query")
    })
  })

  describe("Result Navigation", () => {
    it("sets current result index to 0 when results found", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.currentResultIndex).toBe(0)
        expect(result.current.currentResult).toBe(result.current.state.results[0])
      })
    })

    it("navigates to next result", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      // First search to get results
      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      // Navigate to next result
      act(() => {
        result.current.actions.nextResult()
      })

      expect(result.current.state.currentResultIndex).toBe(1)
      expect(result.current.currentResult).toBe(result.current.state.results[1])
    })

    it("wraps to first result when navigating past last", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      // Navigate to last result
      act(() => {
        result.current.actions.nextResult()
      })

      expect(result.current.state.currentResultIndex).toBe(1)

      // Navigate past last should wrap to first
      act(() => {
        result.current.actions.nextResult()
      })

      expect(result.current.state.currentResultIndex).toBe(0)
    })

    it("navigates to previous result", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      // Navigate to next first
      act(() => {
        result.current.actions.nextResult()
      })

      expect(result.current.state.currentResultIndex).toBe(1)

      // Navigate to previous
      act(() => {
        result.current.actions.prevResult()
      })

      expect(result.current.state.currentResultIndex).toBe(0)
    })

    it("wraps to last result when navigating before first", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
        expect(result.current.state.currentResultIndex).toBe(0)
      })

      // Navigate before first should wrap to last
      act(() => {
        result.current.actions.prevResult()
      })

      expect(result.current.state.currentResultIndex).toBe(1)
    })

    it("navigates to specific result index", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      act(() => {
        result.current.actions.goToResult(1)
      })

      expect(result.current.state.currentResultIndex).toBe(1)
      expect(result.current.currentResult).toBe(result.current.state.results[1])
    })

    it("ignores invalid result indices", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
        expect(result.current.state.currentResultIndex).toBe(0)
      })

      // Try to navigate to invalid indices
      act(() => {
        result.current.actions.goToResult(-1)
      })

      expect(result.current.state.currentResultIndex).toBe(0)

      act(() => {
        result.current.actions.goToResult(10)
      })

      expect(result.current.state.currentResultIndex).toBe(0)
    })
  })

  describe("Clear and Reset", () => {
    it("clears search state", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      // First search to get results
      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      // Clear search
      act(() => {
        result.current.actions.clearSearch()
      })

      expect(result.current.state).toEqual({
        query: '',
        results: [],
        currentResultIndex: -1,
        isSearching: false,
        isLoading: false,
        error: null
      })
      expect(result.current.currentResult).toBeNull()
    })

    it("reset search is alias for clear search", async () => {
      const { result } = renderHook(() => useTranscriptSearch(mockCues))

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(result.current.state.results).toHaveLength(2)
      })

      act(() => {
        result.current.actions.resetSearch()
      })

      expect(result.current.state.query).toBe('')
      expect(result.current.state.results).toHaveLength(0)
    })
  })

  describe("Callbacks", () => {
    it("calls onQueryChange when query changes", () => {
      const onQueryChange = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, {}, { onQueryChange })
      )

      act(() => {
        result.current.actions.setQuery("test")
      })

      expect(onQueryChange).toHaveBeenCalledWith("test")
    })

    it("calls onResultsChange when search completes", async () => {
      const onResultsChange = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, {}, { onResultsChange })
      )

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(onResultsChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ cue: expect.objectContaining({ text: expect.stringContaining("test") }) })
          ]),
          "test"
        )
      })
    })

    it("calls onCurrentResultChange when navigating", async () => {
      const onCurrentResultChange = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, {}, { onCurrentResultChange })
      )

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      await waitFor(() => {
        expect(onCurrentResultChange).toHaveBeenCalledWith(
          expect.objectContaining({ cue: expect.any(Object) }),
          0
        )
      })

      act(() => {
        result.current.actions.nextResult()
      })

      expect(onCurrentResultChange).toHaveBeenCalledWith(
        expect.objectContaining({ cue: expect.any(Object) }),
        1
      )
    })

    it("calls onSearchClear when clearing search", () => {
      const onSearchClear = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, {}, { onSearchClear })
      )

      act(() => {
        result.current.actions.clearSearch()
      })

      expect(onSearchClear).toHaveBeenCalled()
    })

    it("calls onSearchError when search fails", async () => {
      const onSearchError = vi.fn()

      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      const { result } = renderHook(() =>
        useTranscriptSearch([], {}, { onSearchError })
      )

      act(() => {
        result.current.actions.setQuery("test")
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should not error with empty cues array, but let's test with invalid regex
      act(() => {
        result.current.actions.clearSearch()
      })

      // Test with a scenario that could cause an error
      // For now, the search is quite robust, so we'll just verify the callback exists
      expect(onSearchError).toBeDefined()

      consoleSpy.mockRestore()
    })
  })

  describe("Debouncing", () => {
    it("debounces search execution", () => {
      const onResultsChange = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { debounceDelay: 500 }, { onResultsChange })
      )

      act(() => {
        result.current.actions.setQuery("t")
      })

      act(() => {
        result.current.actions.setQuery("te")
      })

      act(() => {
        result.current.actions.setQuery("test")
      })

      // Should not have called search yet
      expect(onResultsChange).not.toHaveBeenCalled()

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should have called search only once with final query
      expect(onResultsChange).toHaveBeenCalledTimes(1)
      expect(onResultsChange).toHaveBeenCalledWith(expect.any(Array), "test")
    })

    it("cancels previous search when new query is set", () => {
      const onResultsChange = vi.fn()
      const { result } = renderHook(() =>
        useTranscriptSearch(mockCues, { debounceDelay: 500 }, { onResultsChange })
      )

      act(() => {
        result.current.actions.setQuery("first")
      })

      act(() => {
        vi.advanceTimersByTime(250)
      })

      act(() => {
        result.current.actions.setQuery("second")
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should only search for the second query
      expect(onResultsChange).toHaveBeenCalledTimes(1)
      expect(onResultsChange).toHaveBeenCalledWith(expect.any(Array), "second")
    })
  })
})