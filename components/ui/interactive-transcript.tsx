/**
 * InteractiveTranscript Component
 * Main component that combines all transcript functionality
 * Built with shadcn/ui patterns and comprehensive TypeScript support
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { TranscriptSegment } from "./transcript-segment"
import { TranscriptSearch } from "./transcript-search"
import { useTranscriptSearch } from "@/lib/hooks/use-transcript-search"
import { useSegmentInteraction } from "@/lib/hooks/use-segment-interaction"
import {
  type TranscriptCue,
  type TranscriptData,
  type TranscriptConfig,
  type CueClickHandler,
  type TimeUpdateHandler,
  type SearchHandler
} from "@/lib/types/transcript"

/**
 * Component variants using class-variance-authority
 */
const interactiveTranscriptVariants = cva(
  "relative flex flex-col gap-4 w-full",
  {
    variants: {
      size: {
        sm: "text-sm gap-2",
        default: "text-base gap-4",
        lg: "text-lg gap-6"
      },
      variant: {
        default: "bg-background text-foreground",
        card: "bg-card text-card-foreground border rounded-lg p-4 shadow-sm",
        ghost: "bg-transparent"
      },
      layout: {
        default: "flex-col",
        compact: "flex-col gap-2",
        spacious: "flex-col gap-8"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      layout: "default"
    }
  }
)

/**
 * Transcript container variants
 */
const transcriptContainerVariants = cva(
  "flex flex-col gap-2 overflow-hidden",
  {
    variants: {
      scrollable: {
        true: "max-h-96 overflow-y-auto",
        false: ""
      },
      bordered: {
        true: "border rounded-lg p-4",
        false: ""
      }
    },
    defaultVariants: {
      scrollable: false,
      bordered: false
    }
  }
)

/**
 * InteractiveTranscript component props
 */
export interface InteractiveTranscriptProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSearch'>,
  VariantProps<typeof interactiveTranscriptVariants> {
  /** Transcript data - can be TranscriptData object or array of cues */
  data: TranscriptData | TranscriptCue[]
  /** Currently active cue ID */
  activeCueId?: string
  /** Whether search functionality is enabled */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Whether transcript container should be scrollable */
  scrollable?: boolean
  /** Whether transcript container should have borders */
  bordered?: boolean
  /** Maximum height for scrollable container */
  maxHeight?: string
  /** Whether to show timestamps */
  showTimestamps?: boolean
  /** Whether to show speaker labels */
  showSpeakers?: boolean
  /** Timestamp position */
  timestampPosition?: "left" | "right" | "top" | "hidden"
  /** Custom timestamp formatter */
  formatTimestamp?: (time: number) => string
  /** Custom speaker formatter */
  formatSpeaker?: (speaker: string) => string
  /** Cue click handler */
  onCueClick?: CueClickHandler
  /** Cue double-click handler */
  onCueDoubleClick?: CueClickHandler
  /** Time update handler */
  onTimeUpdate?: TimeUpdateHandler
  /** Search handler */
  onSearch?: SearchHandler
  /** Search query change handler */
  onSearchQueryChange?: (query: string) => void
  /** Search clear handler */
  onSearchClear?: () => void
  /** Component configuration */
  config?: Partial<TranscriptConfig>
  /** Render as child component */
  asChild?: boolean
  /** Custom CSS class for transcript container */
  containerClassName?: string
  /** Custom CSS class for search component */
  searchClassName?: string
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TranscriptConfig = {
  searchable: true,
  virtualizeThreshold: 100,
  theme: 'system'
}

/**
 * Default timestamp formatter
 */
const defaultTimestampFormatter = (time: number): string => {
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Default speaker formatter
 */
const defaultSpeakerFormatter = (speaker: string): string => `${speaker}:`

/**
 * Normalize transcript data to cues array
 */
const normalizeTranscriptData = (data: TranscriptData | TranscriptCue[]): TranscriptCue[] => {
  if (Array.isArray(data)) {
    return data
  }
  return data.cues || []
}

/**
 * InteractiveTranscript component
 */
const InteractiveTranscript = React.forwardRef<HTMLDivElement, InteractiveTranscriptProps>(
  ({
    className,
    containerClassName,
    searchClassName,
    data,
    activeCueId,
    searchable = true,
    searchPlaceholder = "Search transcript...",
    scrollable = false,
    bordered = false,
    maxHeight,
    showTimestamps = true,
    showSpeakers = true,
    timestampPosition = "left",
    formatTimestamp = defaultTimestampFormatter,
    formatSpeaker = defaultSpeakerFormatter,
    onCueClick,
    onCueDoubleClick,
    onTimeUpdate,
    onSearch,
    onSearchQueryChange,
    onSearchClear,
    config = {},
    size,
    variant,
    layout,
    asChild = false,
    ...props
  }, ref) => {
    // Merge configuration
    const mergedConfig = React.useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])

    // Normalize data to cues array
    const cues = React.useMemo(() => normalizeTranscriptData(data), [data])

    // Search functionality
    const searchEnabled = searchable && mergedConfig.searchable
    const { state: searchState, actions: searchActions, currentResult } = useTranscriptSearch(
      cues,
      {
        caseSensitive: false,
        wholeWords: false,
        useRegex: false,
        minQueryLength: 1,
        debounceDelay: 300,
        maxResults: 100
      },
      {
        onResultsChange: (results, query) => {
          onSearch?.(query, results.map(r => r.cue))
        },
        onQueryChange: onSearchQueryChange,
        onSearchClear
      }
    )

    // Segment interaction handling
    const { actions: interactionActions, getSegmentProps } = useSegmentInteraction(
      cues,
      {
        enableHoverPreview: true,
        enableKeyboardNav: true,
        enableDoubleClick: true
      },
      {
        onSegmentClick: onCueClick,
        onSegmentDoubleClick: onCueDoubleClick
      }
    )

    // Handle search navigation
    const handleSearchNavigation = (direction: 'next' | 'prev') => {
      if (direction === 'next') {
        searchActions.nextResult()
      } else {
        searchActions.prevResult()
      }
    }

    // Handle search result selection
    const handleSearchResultSelection = (result: any, index: number) => {
      searchActions.goToResult(index)
      if (result.cue && onCueClick) {
        onCueClick(result.cue, {} as React.MouseEvent)
      }
    }

    // Determine active cue
    const effectiveActiveCueId = activeCueId || (currentResult?.cue.id)

    // Container styles
    const containerStyles = React.useMemo(() => {
      const styles: React.CSSProperties = {}
      if (maxHeight) {
        styles.maxHeight = maxHeight
      }
      return styles
    }, [maxHeight])

    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        className={cn(interactiveTranscriptVariants({ size, variant, layout }), className)}
        {...props}
      >
        {/* Search Component */}
        {searchEnabled && (
          <div className="flex-shrink-0">
            <TranscriptSearch
              cues={cues}
              query={searchState.query}
              results={searchState.results}
              currentResultIndex={searchState.currentResultIndex}
              isSearching={searchState.isSearching}
              onQueryChange={searchActions.setQuery}
              onSearch={(query, results) => {
                onSearch?.(query, results.map(r => r.cue))
              }}
              onNavigateResult={handleSearchNavigation}
              onSelectResult={handleSearchResultSelection}
              onClearSearch={searchActions.clearSearch}
              placeholder={searchPlaceholder}
              showNavigation={true}
              showClearButton={true}
              className={cn("w-full", searchClassName)}
            />
          </div>
        )}

        {/* Transcript Container */}
        <div
          className={cn(
            transcriptContainerVariants({ scrollable, bordered }),
            containerClassName
          )}
          style={containerStyles}
        >
          {/* Transcript Segments */}
          <div className="space-y-1" role="log" aria-label="Transcript content">
            {cues.map((cue) => {
              const isActive = effectiveActiveCueId === cue.id
              const isSearchMatch = searchState.results.some(result => result.cue.id === cue.id)
              const isCurrentSearchResult = currentResult?.cue.id === cue.id
              const segmentProps = getSegmentProps(cue)

              return (
                <TranscriptSegment
                  key={cue.id}
                  cue={cue}
                  active={isActive}
                  searchMatch={isSearchMatch}
                  highlighted={isCurrentSearchResult}
                  searchQuery={searchState.query}
                  onCueClick={onCueClick}
                  onCueDoubleClick={onCueDoubleClick}
                  timestampConfig={{
                    show: showTimestamps,
                    position: timestampPosition,
                    format: formatTimestamp
                  }}
                  speakerConfig={{
                    show: showSpeakers,
                    format: formatSpeaker
                  }}
                  size={size}
                  {...segmentProps}
                  className={cn(
                    "transition-all duration-200",
                    isCurrentSearchResult && "ring-2 ring-orange-400 dark:ring-orange-600",
                    isSearchMatch && !isCurrentSearchResult && "ring-1 ring-yellow-400 dark:ring-yellow-600"
                  )}
                />
              )
            })}

            {/* Empty state */}
            {cues.length === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">No transcript content available</p>
                  <p className="text-xs mt-1">Load transcript data to see segments here</p>
                </div>
              </div>
            )}

            {/* Search no results */}
            {searchEnabled && searchState.query && searchState.results.length === 0 && cues.length > 0 && (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <div className="text-center">
                  <p className="text-sm">No search results found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Results Summary */}
        {searchEnabled && searchState.query && searchState.results.length > 0 && (
          <div className="flex-shrink-0 text-center text-xs text-muted-foreground">
            <p>
              Found {searchState.results.length} segment{searchState.results.length === 1 ? '' : 's'}
              {currentResult && ` • Currently viewing result ${searchState.currentResultIndex + 1}`}
            </p>
          </div>
        )}

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {effectiveActiveCueId && (
            (() => {
              const activeCue = cues.find(cue => cue.id === effectiveActiveCueId)
              if (activeCue) {
                const speakerText = activeCue.speaker ? `${activeCue.speaker}: ` : ''
                return `Now active: ${speakerText}${activeCue.text}`
              }
              return null
            })()
          )}
        </div>
      </Comp>
    )
  }
)

InteractiveTranscript.displayName = "InteractiveTranscript"

export { InteractiveTranscript, interactiveTranscriptVariants, transcriptContainerVariants }
export type { InteractiveTranscriptProps }