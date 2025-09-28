/**
 * Tests for InteractiveTranscript component
 * Testing main component functionality, integration, and accessibility
 */

import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { InteractiveTranscript } from "../interactive-transcript"
import { type TranscriptCue, type TranscriptData } from "@/lib/types/transcript"

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

const mockTranscriptData: TranscriptData = {
  cues: mockCues,
  metadata: {
    title: "Test Transcript",
    language: "en",
    duration: 20
  }
}

describe("InteractiveTranscript", () => {
  const defaultProps = {
    data: mockCues,
    onCueClick: vi.fn(),
    onCueDoubleClick: vi.fn(),
    onSearch: vi.fn(),
    onSearchQueryChange: vi.fn(),
    onSearchClear: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders with cues array data", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      expect(screen.getByRole("log", { name: "Transcript content" })).toBeInTheDocument()
      expect(screen.getAllByRole("button")).toHaveLength(4) // 4 transcript segments
    })

    it("renders with TranscriptData object", () => {
      render(<InteractiveTranscript {...defaultProps} data={mockTranscriptData} />)

      expect(screen.getByRole("log", { name: "Transcript content" })).toBeInTheDocument()
      expect(screen.getAllByRole("button")).toHaveLength(4)
    })

    it("renders search component by default", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      expect(screen.getByPlaceholderText("Search transcript...")).toBeInTheDocument()
      expect(screen.getByRole("search")).toBeInTheDocument()
    })

    it("hides search when searchable is false", () => {
      render(<InteractiveTranscript {...defaultProps} searchable={false} />)

      expect(screen.queryByPlaceholderText("Search transcript...")).not.toBeInTheDocument()
      expect(screen.queryByRole("search")).not.toBeInTheDocument()
    })

    it("shows empty state when no cues provided", () => {
      render(<InteractiveTranscript {...defaultProps} data={[]} />)

      expect(screen.getByText("No transcript content available")).toBeInTheDocument()
      expect(screen.getByText("Load transcript data to see segments here")).toBeInTheDocument()
    })

    it("applies custom placeholder text", () => {
      render(
        <InteractiveTranscript
          {...defaultProps}
          searchPlaceholder="Find in transcript..."
        />
      )

      expect(screen.getByPlaceholderText("Find in transcript...")).toBeInTheDocument()
    })
  })

  describe("Component Variants", () => {
    it("applies size variants", () => {
      const { rerender } = render(<InteractiveTranscript {...defaultProps} size="sm" />)
      let container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("text-sm", "gap-2")

      rerender(<InteractiveTranscript {...defaultProps} size="lg" />)
      container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("text-lg", "gap-6")
    })

    it("applies variant styles", () => {
      const { rerender } = render(<InteractiveTranscript {...defaultProps} variant="card" />)
      let container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("bg-card", "border", "rounded-lg", "p-4", "shadow-sm")

      rerender(<InteractiveTranscript {...defaultProps} variant="ghost" />)
      container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("bg-transparent")
    })

    it("applies layout variants", () => {
      const { rerender } = render(<InteractiveTranscript {...defaultProps} layout="compact" />)
      let container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("gap-2")

      rerender(<InteractiveTranscript {...defaultProps} layout="spacious" />)
      container = screen.getByRole("log").parentElement?.parentElement
      expect(container).toHaveClass("gap-8")
    })
  })

  describe("Container Options", () => {
    it("applies scrollable container", () => {
      render(<InteractiveTranscript {...defaultProps} scrollable />)

      const container = screen.getByRole("log").parentElement
      expect(container).toHaveClass("max-h-96", "overflow-y-auto")
    })

    it("applies bordered container", () => {
      render(<InteractiveTranscript {...defaultProps} bordered />)

      const container = screen.getByRole("log").parentElement
      expect(container).toHaveClass("border", "rounded-lg", "p-4")
    })

    it("applies custom max height", () => {
      render(<InteractiveTranscript {...defaultProps} maxHeight="500px" />)

      const container = screen.getByRole("log").parentElement
      expect(container).toHaveStyle({ maxHeight: "500px" })
    })

    it("applies custom CSS classes", () => {
      render(
        <InteractiveTranscript
          {...defaultProps}
          className="custom-transcript"
          containerClassName="custom-container"
          searchClassName="custom-search"
        />
      )

      const transcript = screen.getByRole("log").parentElement?.parentElement
      expect(transcript).toHaveClass("custom-transcript")

      const container = screen.getByRole("log").parentElement
      expect(container).toHaveClass("custom-container")

      const search = screen.getByRole("search")
      expect(search).toHaveClass("custom-search")
    })
  })

  describe("Timestamp and Speaker Configuration", () => {
    it("shows timestamps by default", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      // Check for timestamp elements (time tags)
      const timestamps = screen.getAllByRole("time")
      expect(timestamps.length).toBeGreaterThan(0)
    })

    it("hides timestamps when showTimestamps is false", () => {
      render(<InteractiveTranscript {...defaultProps} showTimestamps={false} />)

      // Should not find any time elements
      expect(screen.queryAllByRole("time")).toHaveLength(0)
    })

    it("shows speakers by default", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      expect(screen.getByText("Speaker 1:")).toBeInTheDocument()
      expect(screen.getByText("Speaker 2:")).toBeInTheDocument()
    })

    it("uses custom timestamp formatter", () => {
      const customFormatter = (time: number) => `${time}s`
      render(
        <InteractiveTranscript
          {...defaultProps}
          formatTimestamp={customFormatter}
        />
      )

      expect(screen.getByText("0s")).toBeInTheDocument()
      expect(screen.getByText("5s")).toBeInTheDocument()
    })

    it("uses custom speaker formatter", () => {
      const customFormatter = (speaker: string) => `[${speaker}]`
      render(
        <InteractiveTranscript
          {...defaultProps}
          formatSpeaker={customFormatter}
        />
      )

      expect(screen.getByText("[Speaker 1]")).toBeInTheDocument()
      expect(screen.getByText("[Speaker 2]")).toBeInTheDocument()
    })
  })

  describe("Active Cue Handling", () => {
    it("highlights active cue", () => {
      render(<InteractiveTranscript {...defaultProps} activeCueId="2" />)

      const segments = screen.getAllByRole("button")
      const activeSegment = segments[1] // Second segment (id: "2")
      expect(activeSegment).toHaveAttribute("aria-pressed", "true")
    })

    it("updates active cue when activeCueId changes", () => {
      const { rerender } = render(
        <InteractiveTranscript {...defaultProps} activeCueId="1" />
      )

      let segments = screen.getAllByRole("button")
      expect(segments[0]).toHaveAttribute("aria-pressed", "true")
      expect(segments[1]).toHaveAttribute("aria-pressed", "false")

      rerender(<InteractiveTranscript {...defaultProps} activeCueId="2" />)

      segments = screen.getAllByRole("button")
      expect(segments[0]).toHaveAttribute("aria-pressed", "false")
      expect(segments[1]).toHaveAttribute("aria-pressed", "true")
    })
  })

  describe("Cue Interaction", () => {
    it("calls onCueClick when segment is clicked", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const firstSegment = screen.getAllByRole("button")[0]
      await user.click(firstSegment)

      expect(defaultProps.onCueClick).toHaveBeenCalledWith(
        mockCues[0],
        expect.any(Object)
      )
    })

    it("calls onCueDoubleClick when segment is double-clicked", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const firstSegment = screen.getAllByRole("button")[0]
      await user.dblClick(firstSegment)

      expect(defaultProps.onCueDoubleClick).toHaveBeenCalledWith(
        mockCues[0],
        expect.any(Object)
      )
    })
  })

  describe("Search Functionality", () => {
    it("performs search and highlights results", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "test")

      // Wait for debounced search
      await waitFor(() => {
        expect(defaultProps.onSearch).toHaveBeenCalledWith(
          "test",
          expect.arrayContaining([
            expect.objectContaining({ text: expect.stringContaining("test") })
          ])
        )
      })
    })

    it("calls onSearchQueryChange when typing", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "t")

      expect(defaultProps.onSearchQueryChange).toHaveBeenCalledWith("t")
    })

    it("shows search results summary", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "test")

      await waitFor(() => {
        expect(screen.getByText(/Found \d+ segment/)).toBeInTheDocument()
      })
    })

    it("shows no results message when search finds nothing", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "nonexistent")

      await waitFor(() => {
        expect(screen.getByText("No search results found")).toBeInTheDocument()
        expect(screen.getByText("Try a different search term")).toBeInTheDocument()
      })
    })

    it("navigates search results with keyboard", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "test")

      // Wait for search results
      await waitFor(() => {
        expect(screen.getByText(/Found \d+ segment/)).toBeInTheDocument()
      })

      // Navigate to next result
      await user.type(searchInput, "{Enter}")

      // Should show current result indicator
      await waitFor(() => {
        expect(screen.getByText(/Currently viewing result/)).toBeInTheDocument()
      })
    })

    it("clears search when clear button is clicked", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const searchInput = screen.getByPlaceholderText("Search transcript...")
      await user.type(searchInput, "test")

      const clearButton = screen.getByLabelText("Clear search")
      await user.click(clearButton)

      expect(defaultProps.onSearchClear).toHaveBeenCalled()
      expect(searchInput).toHaveValue("")
    })
  })

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      expect(screen.getByRole("log", { name: "Transcript content" })).toBeInTheDocument()
      expect(screen.getByRole("search", { name: "Search transcript" })).toBeInTheDocument()
    })

    it("announces active cue changes to screen readers", () => {
      render(<InteractiveTranscript {...defaultProps} activeCueId="1" />)

      const announcement = screen.getByText("Now active: Speaker 1: Hello world, this is a test transcript")
      expect(announcement).toHaveClass("sr-only")
      expect(announcement.parentElement).toHaveAttribute("aria-live", "polite")
    })

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup()
      render(<InteractiveTranscript {...defaultProps} />)

      const firstSegment = screen.getAllByRole("button")[0]
      firstSegment.focus()

      // Should be focusable
      expect(firstSegment).toHaveFocus()

      // Should respond to Enter key
      await user.keyboard("{Enter}")
      expect(defaultProps.onCueClick).toHaveBeenCalled()
    })

    it("has proper tabindex for segments", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      const segments = screen.getAllByRole("button")
      segments.forEach(segment => {
        expect(segment).toHaveAttribute("tabindex", "0")
      })
    })
  })

  describe("Configuration", () => {
    it("merges custom configuration", () => {
      const customConfig = {
        searchable: false,
        virtualizeThreshold: 50,
        theme: 'dark' as const
      }

      render(<InteractiveTranscript {...defaultProps} config={customConfig} />)

      // Search should be disabled
      expect(screen.queryByRole("search")).not.toBeInTheDocument()
    })

    it("uses default configuration when none provided", () => {
      render(<InteractiveTranscript {...defaultProps} />)

      // Search should be enabled by default
      expect(screen.getByRole("search")).toBeInTheDocument()
    })
  })

  describe("AsChild Pattern", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <InteractiveTranscript {...defaultProps} asChild>
          <section data-testid="custom-wrapper" />
        </InteractiveTranscript>
      )

      expect(screen.getByTestId("custom-wrapper")).toBeInTheDocument()
    })
  })
})