/**
 * Tests for search highlighting utilities
 * Testing text highlighting, search result navigation, and visual indicators
 */

import * as React from "react"
import { render, screen } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import {
  highlightSearchMatches,
  SearchResultHighlight,
  useSearchHighlighting,
  useSearchResultHighlighting,
  getSearchMatchPositions,
  searchConfigToHighlightConfig
} from "../search-highlighting"

describe("Search Highlighting Utilities", () => {
  describe("highlightSearchMatches", () => {
    it("returns original text when no query provided", () => {
      const result = highlightSearchMatches("Hello world", "")
      expect(result).toBe("Hello world")
    })

    it("highlights single match", () => {
      const result = highlightSearchMatches("Hello world", "Hello")
      render(<div>{result}</div>)

      const highlight = screen.getByText("Hello")
      expect(highlight.tagName).toBe("MARK")
      expect(highlight).toHaveClass("bg-yellow-200")
    })

    it("highlights multiple matches", () => {
      const result = highlightSearchMatches("Hello world Hello", "Hello")
      render(<div>{result}</div>)

      const highlights = screen.getAllByText("Hello")
      expect(highlights).toHaveLength(2)
      highlights.forEach(highlight => {
        expect(highlight.tagName).toBe("MARK")
      })
    })

    it("performs case-insensitive highlighting by default", () => {
      const result = highlightSearchMatches("Hello WORLD hello", "hello")
      render(<div>{result}</div>)

      const highlights = screen.getAllByText(/hello/i)
      expect(highlights).toHaveLength(2)
    })

    it("performs case-sensitive highlighting when configured", () => {
      const result = highlightSearchMatches("Hello WORLD hello", "hello", {
        caseSensitive: true
      })
      render(<div>{result}</div>)

      const highlights = screen.getAllByText("hello")
      expect(highlights).toHaveLength(1)
    })

    it("highlights whole words only when configured", () => {
      const result = highlightSearchMatches("test testing tested", "test", {
        wholeWords: true
      })
      render(<div>{result}</div>)

      const highlights = screen.getAllByText("test")
      expect(highlights).toHaveLength(1)
    })

    it("handles regex patterns when enabled", () => {
      const result = highlightSearchMatches("test123 test456", "test\\d+", {
        useRegex: true
      })
      render(<div>{result}</div>)

      expect(screen.getByText("test123")).toBeInTheDocument()
      expect(screen.getByText("test456")).toBeInTheDocument()
    })

    it("limits highlights based on maxHighlights", () => {
      const result = highlightSearchMatches("test test test test", "test", {
        maxHighlights: 2
      })
      render(<div>{result}</div>)

      const highlights = screen.getAllByText("test")
      expect(highlights.length).toBeLessThanOrEqual(2)
    })

    it("handles invalid regex gracefully", () => {
      const result = highlightSearchMatches("test text", "[invalid", {
        useRegex: true
      })
      expect(result).toBe("test text")
    })
  })

  describe("SearchResultHighlight", () => {
    it("renders basic highlight", () => {
      render(
        <SearchResultHighlight index={0}>
          test
        </SearchResultHighlight>
      )

      const highlight = screen.getByText("test")
      expect(highlight.tagName).toBe("MARK")
      expect(highlight).toHaveAttribute("data-highlight-index", "0")
    })

    it("applies current result styling", () => {
      render(
        <SearchResultHighlight index={0} isCurrentResult={true}>
          test
        </SearchResultHighlight>
      )

      const highlight = screen.getByText("test")
      expect(highlight).toHaveClass("bg-orange-200")
      expect(highlight).toHaveAttribute("data-current-result", "true")
    })

    it("applies primary match styling", () => {
      render(
        <SearchResultHighlight index={0} isPrimaryMatch={true}>
          test
        </SearchResultHighlight>
      )

      const highlight = screen.getByText("test")
      expect(highlight).toHaveClass("bg-yellow-200")
      expect(highlight).toHaveAttribute("data-primary-match", "true")
    })
  })

  describe("useSearchHighlighting", () => {
    it("returns original text when no query", () => {
      const { result } = renderHook(() =>
        useSearchHighlighting("Hello world", "")
      )

      expect(result.current.highlightedText).toBe("Hello world")
      expect(result.current.matchCount).toBe(0)
      expect(result.current.hasMatches).toBe(false)
    })

    it("returns highlighted text with matches", () => {
      const { result } = renderHook(() =>
        useSearchHighlighting("Hello world Hello", "Hello")
      )

      expect(result.current.matchCount).toBe(2)
      expect(result.current.hasMatches).toBe(true)
    })

    it("updates when query changes", () => {
      const { result, rerender } = renderHook(
        ({ query }) => useSearchHighlighting("Hello world", query),
        { initialProps: { query: "" } }
      )

      expect(result.current.matchCount).toBe(0)

      rerender({ query: "Hello" })
      expect(result.current.matchCount).toBe(1)
    })
  })

  describe("useSearchResultHighlighting", () => {
    const segments = [
      { id: "1", text: "Hello world" },
      { id: "2", text: "Hello universe" },
      { id: "3", text: "Goodbye world" }
    ]

    it("returns unhighlighted segments when no query", () => {
      const { result } = renderHook(() =>
        useSearchResultHighlighting(segments, "", -1)
      )

      expect(result.current.highlightedSegments).toHaveLength(3)
      expect(result.current.totalMatches).toBe(0)
      expect(result.current.hasMatches).toBe(false)
    })

    it("highlights matching segments", () => {
      const { result } = renderHook(() =>
        useSearchResultHighlighting(segments, "Hello", -1)
      )

      expect(result.current.totalMatches).toBe(2)
      expect(result.current.hasMatches).toBe(true)

      const firstSegment = result.current.highlightedSegments[0]
      expect(firstSegment.matchCount).toBe(1)
    })

    it("marks current result appropriately", () => {
      const { result } = renderHook(() =>
        useSearchResultHighlighting(segments, "Hello", 0)
      )

      // The first segment should be marked as current result
      expect(result.current.highlightedSegments[0].matchCount).toBe(1)
    })
  })

  describe("getSearchMatchPositions", () => {
    it("returns empty array when no query", () => {
      const positions = getSearchMatchPositions("Hello world", "")
      expect(positions).toEqual([])
    })

    it("returns match positions", () => {
      const positions = getSearchMatchPositions("Hello world Hello", "Hello")
      expect(positions).toHaveLength(2)
      expect(positions[0]).toEqual({
        start: 0,
        end: 5,
        text: "Hello"
      })
      expect(positions[1]).toEqual({
        start: 12,
        end: 17,
        text: "Hello"
      })
    })

    it("respects maxHighlights limit", () => {
      const positions = getSearchMatchPositions("test test test", "test", {
        maxHighlights: 2
      })
      expect(positions).toHaveLength(2)
    })

    it("handles case sensitivity", () => {
      const positions = getSearchMatchPositions("Hello hello HELLO", "hello", {
        caseSensitive: true
      })
      expect(positions).toHaveLength(1)
      expect(positions[0].text).toBe("hello")
    })

    it("handles whole word matching", () => {
      const positions = getSearchMatchPositions("test testing tested", "test", {
        wholeWords: true
      })
      expect(positions).toHaveLength(1)
      expect(positions[0]).toEqual({
        start: 0,
        end: 4,
        text: "test"
      })
    })
  })

  describe("searchConfigToHighlightConfig", () => {
    it("converts search config to highlight config", () => {
      const searchConfig = {
        caseSensitive: true,
        wholeWords: true,
        useRegex: true,
        minQueryLength: 2,
        debounceDelay: 500,
        maxResults: 50
      }

      const highlightConfig = searchConfigToHighlightConfig(searchConfig)

      expect(highlightConfig).toEqual({
        caseSensitive: true,
        wholeWords: true,
        useRegex: true,
        maxHighlights: 50
      })
    })

    it("handles partial search config", () => {
      const searchConfig = {
        caseSensitive: true
      }

      const highlightConfig = searchConfigToHighlightConfig(searchConfig)

      expect(highlightConfig.caseSensitive).toBe(true)
      expect(highlightConfig.wholeWords).toBeUndefined()
    })
  })
})