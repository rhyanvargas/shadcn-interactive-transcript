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
import { parseWebVTT, validateWebVTT } from "@/lib/webvtt/parser"
import { textToTranscriptData, validateTransformOptions } from "@/lib/webvtt/transformer"
import {
  type TranscriptCue,
  type TranscriptData,
  type TranscriptConfig,
  type CueClickHandler,
  type TimeUpdateHandler,
  type SearchHandler,
  type TextTransformOptions,
  WebVTTParseError
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
  /** Transcript data - can be WebVTT string, TranscriptData object, or array of cues */
  data: string | TranscriptData | TranscriptCue[]
  /** Options for text-to-transcript transformation (when data is plain text) */
  textTransformOptions?: TextTransformOptions
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
  /** Error handler for data parsing/validation errors */
  onError?: (error: Error) => void
  /** Warning handler for non-critical issues */
  onWarning?: (warnings: string[]) => void
  /** Loading state handler */
  onLoadingChange?: (isLoading: boolean) => void
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
 * Normalize transcript data to cues array with comprehensive error handling
 */
const normalizeTranscriptData = (
  data: string | TranscriptData | TranscriptCue[],
  textTransformOptions?: TextTransformOptions,
  onError?: (error: Error) => void,
  onWarning?: (warnings: string[]) => void
): TranscriptCue[] => {
  try {
    // Handle string input (WebVTT or plain text)
    if (typeof data === 'string') {
      const trimmedData = data.trim()

      if (!trimmedData) {
        throw new Error('Transcript data cannot be empty')
      }

      // Check if it's WebVTT format
      if (trimmedData.startsWith('WEBVTT')) {
        // Validate WebVTT format first
        const validation = validateWebVTT(trimmedData)
        if (!validation.isValid) {
          throw new WebVTTParseError(`Invalid WebVTT format: ${validation.errors.join(', ')}`)
        }

        // Parse WebVTT
        const parseResult = parseWebVTT(trimmedData)

        // Handle warnings
        if (parseResult.warnings && onWarning) {
          onWarning(parseResult.warnings)
        }

        return parseResult.data.cues
      } else {
        // Treat as plain text and transform to transcript data
        if (textTransformOptions) {
          const validation = validateTransformOptions(textTransformOptions)
          if (!validation.isValid) {
            throw new Error(`Invalid transform options: ${validation.errors.join(', ')}`)
          }
        }

        const transcriptData = textToTranscriptData(trimmedData, textTransformOptions)
        return transcriptData.cues
      }
    }

    // Handle TranscriptData object
    if (data && typeof data === 'object' && 'cues' in data) {
      if (!Array.isArray(data.cues)) {
        throw new Error('TranscriptData.cues must be an array')
      }
      return data.cues
    }

    // Handle array of cues
    if (Array.isArray(data)) {
      // Validate cue structure
      for (let i = 0; i < data.length; i++) {
        const cue = data[i]
        if (!cue || typeof cue !== 'object') {
          throw new Error(`Invalid cue at index ${i}: must be an object`)
        }
        if (typeof cue.startTime !== 'number' || typeof cue.endTime !== 'number') {
          throw new Error(`Invalid cue at index ${i}: startTime and endTime must be numbers`)
        }
        if (cue.startTime >= cue.endTime) {
          throw new Error(`Invalid cue at index ${i}: startTime must be less than endTime`)
        }
        if (typeof cue.text !== 'string') {
          throw new Error(`Invalid cue at index ${i}: text must be a string`)
        }
      }
      return data
    }

    throw new Error('Invalid data format: must be WebVTT string, TranscriptData object, or TranscriptCue array')
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error : new Error('Unknown error during data normalization'))
    }
    // Return empty array as fallback
    return []
  }
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
    textTransformOptions,
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
    onError,
    onWarning,
    onLoadingChange,
    config = {},
    size,
    variant,
    layout,
    asChild = false,
    ...props
  }, ref) => {
    // Merge configuration
    const mergedConfig = React.useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])

    // Loading and error state
    const [isLoading, setIsLoading] = React.useState(false)
    const [dataError, setDataError] = React.useState<string | null>(null)

    // Normalize data to cues array with error handling
    const cues = React.useMemo(() => {
      setIsLoading(true)
      setDataError(null)

      const handleError = (error: Error) => {
        setDataError(error.message)
        onError?.(error)
      }

      const handleWarning = (warnings: string[]) => {
        onWarning?.(warnings)
      }

      const result = normalizeTranscriptData(data, textTransformOptions, handleError, handleWarning)

      setIsLoading(false)
      return result
    }, [data, textTransformOptions, onError, onWarning])

    // Notify loading state changes
    React.useEffect(() => {
      onLoadingChange?.(isLoading)
    }, [isLoading, onLoadingChange])

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

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
              <p className="text-sm">Loading transcript...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {dataError && !isLoading && (
          <div className="flex items-center justify-center py-8 text-destructive">
            <div className="text-center max-w-md">
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
                <h3 className="font-medium mb-2">Error Loading Transcript</h3>
                <p className="text-sm">{dataError}</p>
                <p className="text-xs mt-2 text-muted-foreground">
                  Please check your data format and try again.
                </p>
              </div>
            </div>
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
            {cues.length === 0 && !isLoading && !dataError && (
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