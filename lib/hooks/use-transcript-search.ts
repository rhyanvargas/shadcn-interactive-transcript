/**
 * Custom hook for transcript search functionality
 * Manages search state, debouncing, and result navigation
 */

import * as React from "react"
import { type TranscriptCue } from "@/lib/types/transcript"
import { type SearchResult, type SearchConfig } from "@/components/ui/transcript-search"

/**
 * Search state interface
 */
export interface TranscriptSearchState {
  /** Current search query */
  query: string
  /** Search results */
  results: SearchResult[]
  /** Current result index */
  currentResultIndex: number
  /** Whether search is active */
  isSearching: boolean
  /** Whether search is loading/debouncing */
  isLoading: boolean
  /** Search error if any */
  error: string | null
}

/**
 * Search actions interface
 */
export interface TranscriptSearchActions {
  /** Set search query */
  setQuery: (query: string) => void
  /** Execute search */
  search: (query: string) => void
  /** Navigate to next result */
  nextResult: () => void
  /** Navigate to previous result */
  prevResult: () => void
  /** Navigate to specific result */
  goToResult: (index: number) => void
  /** Clear search */
  clearSearch: () => void
  /** Reset search state */
  resetSearch: () => void
}

/**
 * Search callbacks interface
 */
export interface TranscriptSearchCallbacks {
  /** Called when search results change */
  onResultsChange?: (results: SearchResult[], query: string) => void
  /** Called when current result changes */
  onCurrentResultChange?: (result: SearchResult | null, index: number) => void
  /** Called when search query changes */
  onQueryChange?: (query: string) => void
  /** Called when search is cleared */
  onSearchClear?: () => void
  /** Called when search error occurs */
  onSearchError?: (error: string) => void
}

/**
 * Default search configuration
 */
const DEFAULT_CONFIG: Required<SearchConfig> = {
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
const createSearchRegex = (query: string, config: Required<SearchConfig>): RegExp => {
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
const searchTranscriptCues = (
  cues: TranscriptCue[],
  query: string,
  config: Required<SearchConfig>
): SearchResult[] => {
  if (!query.trim() || query.length < config.minQueryLength) {
    return []
  }

  try {
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
      if (results.length >= config.maxResults) {
        return
      }
    })

    return results.slice(0, config.maxResults)
  } catch (error) {
    throw new Error(`Search error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Custom hook for transcript search functionality
 */
export function useTranscriptSearch(
  cues: TranscriptCue[],
  config: SearchConfig = {},
  callbacks: TranscriptSearchCallbacks = {}
): {
  state: TranscriptSearchState
  actions: TranscriptSearchActions
  currentResult: SearchResult | null
} {
  const mergedConfig = React.useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config])
  const {
    onResultsChange,
    onCurrentResultChange,
    onQueryChange,
    onSearchClear,
    onSearchError
  } = callbacks

  // Search state
  const [state, setState] = React.useState<TranscriptSearchState>({
    query: '',
    results: [],
    currentResultIndex: -1,
    isSearching: false,
    isLoading: false,
    error: null
  })

  // Debounce timeout ref
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout>()

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // Execute search with debouncing
  const executeSearch = React.useCallback((query: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set loading state
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const results = searchTranscriptCues(cues, query, mergedConfig)
        const newCurrentIndex = results.length > 0 ? 0 : -1

        setState(prev => ({
          ...prev,
          results,
          currentResultIndex: newCurrentIndex,
          isSearching: query.length >= mergedConfig.minQueryLength,
          isLoading: false,
          error: null
        }))

        // Trigger callbacks
        onResultsChange?.(results, query)
        if (results.length > 0) {
          onCurrentResultChange?.(results[0], 0)
        } else {
          onCurrentResultChange?.(null, -1)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Search failed'
        setState(prev => ({
          ...prev,
          results: [],
          currentResultIndex: -1,
          isSearching: false,
          isLoading: false,
          error: errorMessage
        }))
        onSearchError?.(errorMessage)
      }
    }, mergedConfig.debounceDelay)
  }, [cues, mergedConfig, onResultsChange, onCurrentResultChange, onSearchError])

  // Set search query
  const setQuery = React.useCallback((query: string) => {
    setState(prev => ({ ...prev, query }))
    onQueryChange?.(query)
    executeSearch(query)
  }, [executeSearch, onQueryChange])

  // Execute search (alias for setQuery for explicit search calls)
  const search = React.useCallback((query: string) => {
    setQuery(query)
  }, [setQuery])

  // Navigate to next result
  const nextResult = React.useCallback(() => {
    setState(prev => {
      if (prev.results.length === 0) return prev

      const newIndex = prev.currentResultIndex < prev.results.length - 1
        ? prev.currentResultIndex + 1
        : 0

      const result = prev.results[newIndex]
      onCurrentResultChange?.(result, newIndex)

      return { ...prev, currentResultIndex: newIndex }
    })
  }, [onCurrentResultChange])

  // Navigate to previous result
  const prevResult = React.useCallback(() => {
    setState(prev => {
      if (prev.results.length === 0) return prev

      const newIndex = prev.currentResultIndex > 0
        ? prev.currentResultIndex - 1
        : prev.results.length - 1

      const result = prev.results[newIndex]
      onCurrentResultChange?.(result, newIndex)

      return { ...prev, currentResultIndex: newIndex }
    })
  }, [onCurrentResultChange])

  // Navigate to specific result
  const goToResult = React.useCallback((index: number) => {
    setState(prev => {
      if (index < 0 || index >= prev.results.length) return prev

      const result = prev.results[index]
      onCurrentResultChange?.(result, index)

      return { ...prev, currentResultIndex: index }
    })
  }, [onCurrentResultChange])

  // Clear search
  const clearSearch = React.useCallback(() => {
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    setState({
      query: '',
      results: [],
      currentResultIndex: -1,
      isSearching: false,
      isLoading: false,
      error: null
    })

    onSearchClear?.()
    onCurrentResultChange?.(null, -1)
  }, [onSearchClear, onCurrentResultChange])

  // Reset search (alias for clearSearch)
  const resetSearch = React.useCallback(() => {
    clearSearch()
  }, [clearSearch])

  // Get current result
  const currentResult = React.useMemo(() => {
    if (state.currentResultIndex >= 0 && state.currentResultIndex < state.results.length) {
      return state.results[state.currentResultIndex]
    }
    return null
  }, [state.results, state.currentResultIndex])

  // Actions object
  const actions: TranscriptSearchActions = React.useMemo(() => ({
    setQuery,
    search,
    nextResult,
    prevResult,
    goToResult,
    clearSearch,
    resetSearch
  }), [setQuery, search, nextResult, prevResult, goToResult, clearSearch, resetSearch])

  return {
    state,
    actions,
    currentResult
  }
}

/**
 * Hook for search keyboard shortcuts
 */
export function useSearchKeyboardShortcuts(
  actions: TranscriptSearchActions,
  isSearchFocused: boolean = false
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when search is not focused to avoid conflicts
      if (isSearchFocused) return

      // Ctrl/Cmd + F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        // This would need to be handled by the parent component
        // as we can't focus elements from this hook
      }

      // F3 or Ctrl/Cmd + G for next result
      if (event.key === 'F3' || ((event.ctrlKey || event.metaKey) && event.key === 'g')) {
        event.preventDefault()
        if (event.shiftKey) {
          actions.prevResult()
        } else {
          actions.nextResult()
        }
      }

      // Escape to clear search
      if (event.key === 'Escape') {
        actions.clearSearch()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [actions, isSearchFocused])
}