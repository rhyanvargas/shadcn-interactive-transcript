/**
 * TranscriptSearch Component
 * Search functionality for transcript content with highlighting and navigation
 * Built with shadcn/ui patterns and accessibility support
 */

import * as React from "react"
import { Search, X, ChevronUp, ChevronDown } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { type TranscriptCue } from "@/lib/types/transcript"

/**
 * Search component variants
 */
const transcriptSearchVariants = cva(
  "relative flex items-center gap-2 rounded-md border bg-background p-2 shadow-sm transition-colors",
  {
    variants: {
      size: {
        sm: "p-1.5 gap-1.5",
        default: "p-2 gap-2",
        lg: "p-3 gap-3"
      },
      variant: {
        default: "border-input",
        ghost: "border-transparent shadow-none",
        outline: "border-border bg-card"
      },
      state: {
        default: "",
        active: "border-ring ring-1 ring-ring/20",
        error: "border-destructive ring-1 ring-destructive/20"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      state: "default"
    }
  }
)

/**
 * Search result navigation variants
 */
const searchNavVariants = cva(
  "flex items-center gap-1 text-xs text-muted-foreground",
  {
    variants: {
      size: {
        sm: "text-xs",
        default: "text-xs",
        lg: "text-sm"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

/**
 * Search button variants
 */
const searchButtonVariants = cva(
  "inline-flex items-center justify-center rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-6 w-6",
        default: "h-7 w-7",
        lg: "h-8 w-8"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

/**
 * Search result interface
 */
export interface SearchResult {
  /** Cue that matches the search */
  cue: TranscriptCue
  /** Index of the cue in the original array */
  cueIndex: number
  /** Match positions within the text */
  matches: Array<{
    start: number
    end: number
    text: string
  }>
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Case sensitive search */
  caseSensitive?: boolean
  /** Match whole words only */
  wholeWords?: boolean
  /** Use regular expressions */
  useRegex?: boolean
  /** Minimum query length to trigger search */
  minQueryLength?: number
  /** Debounce delay in milliseconds */
  debounceDelay?: number
  /** Maximum number of results to show */
  maxResults?: number
}

/**
 * TranscriptSearch component props
 */
export interface TranscriptSearchProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSearch'>,
  VariantProps<typeof transcriptSearchVariants> {
  /** Transcript cues to search through */
  cues: TranscriptCue[]
  /** Current search query */
  query?: string
  /** Search configuration */
  config?: SearchConfig
  /** Placeholder text for search input */
  placeholder?: string
  /** Whether search is currently active */
  isSearching?: boolean
  /** Current search results */
  results?: SearchResult[]
  /** Current result index */
  currentResultIndex?: number
  /** Search query change handler */
  onQueryChange?: (query: string) => void
  /** Search execution handler */
  onSearch?: (query: string, results: SearchResult[]) => void
  /** Result navigation handler */
  onNavigateResult?: (direction: 'next' | 'prev') => void
  /** Result selection handler */
  onSelectResult?: (result: SearchResult, index: number) => void
  /** Search clear handler */
  onClearSearch?: () => void
  /** Search focus handler */
  onSearchFocus?: () => void
  /** Search blur handler */
  onSearchBlur?: () => void
  /** Show search navigation controls */
  showNavigation?: boolean
  /** Show clear button */
  showClearButton?: boolean
  /** Auto-focus search input */
  autoFocus?: boolean
  /** Render as child component */
  asChild?: boolean
}

/**
 * Default search configuration
 */
const DEFAULT_SEARCH_CONFIG: Required<SearchConfig> = {
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  minQueryLength: 1,
  debounceDelay: 300,
  maxResults: 100
}

/**
 * Escape special regex characters
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create search regex from query and config
 */
const createSearchRegex = (query: string, config: SearchConfig): RegExp => {
  let pattern = config.useRegex ? query : escapeRegExp(query)

  if (config.wholeWords) {
    pattern = `\\b${pattern}\\b`
  }

  const flags = config.caseSensitive ? 'g' : 'gi'

  try {
    return new RegExp(pattern, flags)
  } catch {
    // Fallback to escaped pattern if regex is invalid
    return new RegExp(escapeRegExp(query), flags)
  }
}

/**
 * Search through transcript cues
 */
const searchCues = (cues: TranscriptCue[], query: string, config: SearchConfig): SearchResult[] => {
  if (!query.trim() || query.length < config.minQueryLength!) {
    return []
  }

  const regex = createSearchRegex(query, config)
  const results: SearchResult[] = []

  cues.forEach((cue, cueIndex) => {
    const matches: SearchResult['matches'] = []
    let match: RegExpExecArray | null

    // Reset regex lastIndex for global search
    regex.lastIndex = 0

    while ((match = regex.exec(cue.text)) !== null && matches.length < 10) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      })

      // Prevent infinite loop with zero-length matches
      if (match[0].length === 0) {
        regex.lastIndex++
      }
    }

    if (matches.length > 0) {
      results.push({
        cue,
        cueIndex,
        matches
      })
    }

    // Limit total results
    if (results.length >= config.maxResults!) {
      return results.slice(0, config.maxResults!)
    }
  })

  return results
}

/**
 * TranscriptSearch component
 */
const TranscriptSearch = React.forwardRef<HTMLDivElement, TranscriptSearchProps>(
  ({
    className,
    cues,
    query = "",
    config = {},
    placeholder = "Search transcript...",
    isSearching = false,
    results = [],
    currentResultIndex = -1,
    onQueryChange,
    onSearch,
    onNavigateResult,
    onSelectResult,
    onClearSearch,
    onSearchFocus,
    onSearchBlur,
    showNavigation = true,
    showClearButton = true,
    autoFocus = false,
    size,
    variant,
    state,
    asChild = false,
    ...props
  }, ref) => {
    const mergedConfig = { ...DEFAULT_SEARCH_CONFIG, ...config }
    const [internalQuery, setInternalQuery] = React.useState(query)
    const [internalResults, setInternalResults] = React.useState<SearchResult[]>([])
    const [currentIndex, setCurrentIndex] = React.useState(-1)

    const inputRef = React.useRef<HTMLInputElement>(null)
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout>()

    // Use controlled or uncontrolled state
    const currentQuery = query !== undefined ? query : internalQuery
    const currentResults = results.length > 0 ? results : internalResults
    const currentResultIdx = currentResultIndex >= 0 ? currentResultIndex : currentIndex

    // Auto-focus input
    React.useEffect(() => {
      if (autoFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }, [autoFocus])

    // Debounced search execution
    const executeSearch = React.useCallback((searchQuery: string) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        const searchResults = searchCues(cues, searchQuery, mergedConfig)

        if (results.length === 0) {
          setInternalResults(searchResults)
          setCurrentIndex(searchResults.length > 0 ? 0 : -1)
        }

        onSearch?.(searchQuery, searchResults)
      }, mergedConfig.debounceDelay)
    }, [cues, mergedConfig, onSearch, results.length])

    // Handle query changes
    const handleQueryChange = (newQuery: string) => {
      if (query === undefined) {
        setInternalQuery(newQuery)
      }
      onQueryChange?.(newQuery)
      executeSearch(newQuery)
    }

    // Handle input change
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      handleQueryChange(event.target.value)
    }

    // Handle clear search
    const handleClearSearch = () => {
      handleQueryChange("")
      if (results.length === 0) {
        setInternalResults([])
        setCurrentIndex(-1)
      }
      onClearSearch?.()
      inputRef.current?.focus()
    }

    // Handle result navigation
    const handleNavigateResult = (direction: 'next' | 'prev') => {
      if (currentResults.length === 0) return

      let newIndex = currentResultIdx

      if (direction === 'next') {
        newIndex = currentResultIdx < currentResults.length - 1 ? currentResultIdx + 1 : 0
      } else {
        newIndex = currentResultIdx > 0 ? currentResultIdx - 1 : currentResults.length - 1
      }

      if (currentResultIndex < 0) {
        setCurrentIndex(newIndex)
      }

      onNavigateResult?.(direction)

      // Select the result
      if (currentResults[newIndex]) {
        onSelectResult?.(currentResults[newIndex], newIndex)
      }
    }

    // Handle keyboard shortcuts
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          if (currentResults.length > 0) {
            if (event.shiftKey) {
              handleNavigateResult('prev')
            } else {
              handleNavigateResult('next')
            }
          }
          break
        case 'Escape':
          event.preventDefault()
          handleClearSearch()
          break
        case 'ArrowDown':
          event.preventDefault()
          handleNavigateResult('next')
          break
        case 'ArrowUp':
          event.preventDefault()
          handleNavigateResult('prev')
          break
      }
    }

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }
      }
    }, [])

    // Determine component state
    const componentState = isSearching ? "active" : currentResults.length === 0 && currentQuery.length >= mergedConfig.minQueryLength ? "error" : state || "default"

    return (
      <div
        ref={ref}
        className={cn(transcriptSearchVariants({ size, variant, state: componentState }), className)}
        role="search"
        aria-label="Search transcript"
        {...props}
      >
        {/* Search icon */}
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />

        {/* Search input */}
        <Input
          ref={inputRef}
          type="text"
          value={currentQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          placeholder={placeholder}
          className="flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          aria-label="Search transcript content"
          aria-describedby={currentResults.length > 0 ? "search-results-info" : undefined}
        />

        {/* Search results info and navigation */}
        {showNavigation && currentQuery && (
          <div className={cn(searchNavVariants({ size }))} id="search-results-info">
            {currentResults.length > 0 ? (
              <>
                <span>
                  {currentResultIdx + 1} of {currentResults.length}
                </span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleNavigateResult('prev')}
                    disabled={currentResults.length === 0}
                    className={cn(searchButtonVariants({ size }))}
                    aria-label="Previous result"
                    title="Previous result (Shift+Enter or ↑)"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigateResult('next')}
                    disabled={currentResults.length === 0}
                    className={cn(searchButtonVariants({ size }))}
                    aria-label="Next result"
                    title="Next result (Enter or ↓)"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              </>
            ) : currentQuery.length >= mergedConfig.minQueryLength ? (
              <span>No results</span>
            ) : null}
          </div>
        )}

        {/* Clear button */}
        {showClearButton && currentQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={cn(searchButtonVariants({ size }))}
            aria-label="Clear search"
            title="Clear search (Escape)"
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Screen reader announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {currentResults.length > 0 && currentQuery && (
            `Found ${currentResults.length} result${currentResults.length === 1 ? '' : 's'} for "${currentQuery}"`
          )}
        </div>
      </div>
    )
  }
)

TranscriptSearch.displayName = "TranscriptSearch"

export { TranscriptSearch, transcriptSearchVariants, searchNavVariants, searchButtonVariants }
export type { TranscriptSearchProps, SearchResult, SearchConfig }