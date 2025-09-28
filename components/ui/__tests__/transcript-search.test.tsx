/**
 * Tests for TranscriptSearch component
 * Testing search functionality, keyboard navigation, and accessibility
 */

import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { TranscriptSearch, type SearchResult } from "../transcript-search"
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

// Mock search results
const mockSearchResults: SearchResult[] = [
  {
    cue: mockCues[0],
    cueIndex: 0,
    matches: [{ start: 0, end: 5, text: "Hello" }]
  },
  {
    cue: mockCues[2],
    cueIndex: 2,
    matches: [{ start: 0, end: 7, text: "Testing" }]
  }
]

describe("TranscriptSearch", () => {
  const defaultProps = {
    cues: mockCues,
    placeholder: "Search transcript...",
    onQueryChange: vi.fn(),
    onSearch: vi.fn(),
    onNavigateResult: vi.fn(),
    onSelectResult: vi.fn(),
    onClearSearch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders search input with placeholder", () => {
      render(<TranscriptSearch {...defaultProps} />)

      expect(screen.getByPlaceholderText("Search transcript...")).toBeInTheDocument()
      expect(screen.getByLabelText("Search transcript content")).toBeInTheDocument()
    })

    it("renders search icon", () => {
      render(<TranscriptSearch {...defaultProps} />)

      const searchIcon = screen.getByRole("search").querySelector("svg")
      expect(searchIcon).toBeInTheDocument()
    })

    it("renders with custom placeholder", () => {
      render(<TranscriptSearch {...defaultProps} placeholder="Find in transcript..." />)

      expect(screen.getByPlaceholderText("Find in transcript...")).toBeInTheDocument()
    })

    it("applies custom className", () => {
      render(<TranscriptSearch {...defaultProps} className="custom-class" />)

      const searchContainer = screen.getByRole("search")
      expect(searchContainer).toHaveClass("custom-class")
    })
  })

  describe("Search Input", () => {
    it("calls onQueryChange when typing", async () => {
      const user = userEvent.setup()
      render(<TranscriptSearch {...defaultProps} />)

      const input = screen.getByLabelText("Search transcript content")

      await user.type(input, "test")

      // Check that onQueryChange was called
      expect(defaultProps.onQueryChange).toHaveBeenCalled()
      expect(defaultProps.onQueryChange).toHaveBeenCalledTimes(4)
    })

    it("shows controlled query value", () => {
      render(<TranscriptSearch {...defaultProps} query="controlled query" />)

      const input = screen.getByDisplayValue("controlled query")
      expect(input).toBeInTheDocument()
    })

    it("auto-focuses when autoFocus is true", () => {
      render(<TranscriptSearch {...defaultProps} autoFocus />)

      const input = screen.getByLabelText("Search transcript content")
      expect(input).toHaveFocus()
    })
  })

  describe("Search Results", () => {
    it("displays search results count", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      expect(screen.getByText("1 of 2")).toBeInTheDocument()
    })

    it("displays no results message", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="nonexistent"
          results={[]}
        />
      )

      expect(screen.getByText("No results")).toBeInTheDocument()
    })

    it("hides navigation when showNavigation is false", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          showNavigation={false}
        />
      )

      expect(screen.queryByText("1 of 2")).not.toBeInTheDocument()
      expect(screen.queryByLabelText("Next result")).not.toBeInTheDocument()
      expect(screen.queryByLabelText("Previous result")).not.toBeInTheDocument()
    })
  })

  describe("Navigation Controls", () => {
    it("renders navigation buttons with results", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      expect(screen.getByLabelText("Next result")).toBeInTheDocument()
      expect(screen.getByLabelText("Previous result")).toBeInTheDocument()
    })

    it("calls onNavigateResult when clicking next button", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      const nextButton = screen.getByLabelText("Next result")
      await user.click(nextButton)

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("next")
    })

    it("calls onNavigateResult when clicking previous button", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={1}
        />
      )

      const prevButton = screen.getByLabelText("Previous result")
      await user.click(prevButton)

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("prev")
    })

    it("does not show navigation buttons when no results", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={[]}
        />
      )

      expect(screen.queryByLabelText("Next result")).not.toBeInTheDocument()
      expect(screen.queryByLabelText("Previous result")).not.toBeInTheDocument()
      expect(screen.getByText("No results")).toBeInTheDocument()
    })
  })

  describe("Clear Button", () => {
    it("renders clear button when query exists", () => {
      render(<TranscriptSearch {...defaultProps} query="test" />)

      expect(screen.getByLabelText("Clear search")).toBeInTheDocument()
    })

    it("hides clear button when no query", () => {
      render(<TranscriptSearch {...defaultProps} query="" />)

      expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument()
    })

    it("calls onClearSearch when clicking clear button", async () => {
      const user = userEvent.setup()
      render(<TranscriptSearch {...defaultProps} query="test" />)

      const clearButton = screen.getByLabelText("Clear search")
      await user.click(clearButton)

      expect(defaultProps.onClearSearch).toHaveBeenCalled()
    })

    it("hides clear button when showClearButton is false", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          showClearButton={false}
        />
      )

      expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument()
    })
  })

  describe("Keyboard Navigation", () => {
    it("navigates to next result on Enter key", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      const input = screen.getByLabelText("Search transcript content")
      await user.type(input, "{Enter}")

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("next")
    })

    it("navigates to previous result on Shift+Enter", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={1}
        />
      )

      const input = screen.getByLabelText("Search transcript content")
      await user.type(input, "{Shift>}{Enter}{/Shift}")

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("prev")
    })

    it("navigates to next result on ArrowDown", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      const input = screen.getByLabelText("Search transcript content")
      await user.type(input, "{ArrowDown}")

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("next")
    })

    it("navigates to previous result on ArrowUp", async () => {
      const user = userEvent.setup()
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={1}
        />
      )

      const input = screen.getByLabelText("Search transcript content")
      await user.type(input, "{ArrowUp}")

      expect(defaultProps.onNavigateResult).toHaveBeenCalledWith("prev")
    })

    it("clears search on Escape key", async () => {
      const user = userEvent.setup()
      render(<TranscriptSearch {...defaultProps} query="test" />)

      const input = screen.getByLabelText("Search transcript content")
      await user.type(input, "{Escape}")

      expect(defaultProps.onClearSearch).toHaveBeenCalled()
    })
  })

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<TranscriptSearch {...defaultProps} />)

      expect(screen.getByRole("search")).toHaveAttribute("aria-label", "Search transcript")
      expect(screen.getByLabelText("Search transcript content")).toBeInTheDocument()
    })

    it("associates input with results info", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      const input = screen.getByLabelText("Search transcript content")
      expect(input).toHaveAttribute("aria-describedby", "search-results-info")
    })

    it("announces search results to screen readers", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
        />
      )

      const announcement = screen.getByText('Found 2 results for "test"')
      expect(announcement).toHaveClass("sr-only")
      expect(announcement).toHaveAttribute("aria-live", "polite")
    })

    it("has proper button titles for tooltips", () => {
      render(
        <TranscriptSearch
          {...defaultProps}
          query="test"
          results={mockSearchResults}
          currentResultIndex={0}
        />
      )

      expect(screen.getByLabelText("Next result")).toHaveAttribute("title", "Next result (Enter or ↓)")
      expect(screen.getByLabelText("Previous result")).toHaveAttribute("title", "Previous result (Shift+Enter or ↑)")
      expect(screen.getByLabelText("Clear search")).toHaveAttribute("title", "Clear search (Escape)")
    })
  })

  describe("Component Variants", () => {
    it("applies size variants", () => {
      const { rerender } = render(<TranscriptSearch {...defaultProps} size="sm" />)
      let container = screen.getByRole("search")
      expect(container).toHaveClass("p-1.5", "gap-1.5")

      rerender(<TranscriptSearch {...defaultProps} size="lg" />)
      container = screen.getByRole("search")
      expect(container).toHaveClass("p-3", "gap-3")
    })

    it("applies variant styles", () => {
      const { rerender } = render(<TranscriptSearch {...defaultProps} variant="ghost" />)
      let container = screen.getByRole("search")
      expect(container).toHaveClass("border-transparent", "shadow-none")

      rerender(<TranscriptSearch {...defaultProps} variant="outline" />)
      container = screen.getByRole("search")
      expect(container).toHaveClass("border-border", "bg-card")
    })

    it("applies state styles", () => {
      const { rerender } = render(<TranscriptSearch {...defaultProps} state="active" />)
      let container = screen.getByRole("search")
      expect(container).toHaveClass("border-ring", "ring-1", "ring-ring/20")

      rerender(<TranscriptSearch {...defaultProps} state="error" />)
      container = screen.getByRole("search")
      expect(container).toHaveClass("border-destructive", "ring-1", "ring-destructive/20")
    })
  })

  describe("Search Debouncing", () => {
    it("calls onSearch after typing", async () => {
      render(<TranscriptSearch {...defaultProps} />)

      const input = screen.getByLabelText("Search transcript content")
      await userEvent.type(input, "test")

      // Wait for debounced search to execute
      await waitFor(() => {
        expect(defaultProps.onSearch).toHaveBeenCalled()
      }, { timeout: 1000 })
    })
  })
})