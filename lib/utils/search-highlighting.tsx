/**
 * Search highlighting utilities
 * Provides functions for highlighting search matches in text with various options
 */

import * as React from "react"
import { type SearchConfig } from "@/components/ui/transcript-search"

/**
 * Highlight configuration options
 */
export interface HighlightConfig {
  /** CSS class for highlighted matches */
  highlightClass?: string
  /** Whether to highlight case-sensitively */
  caseSensitive?: boolean
  /** Whether to match whole words only */
  wholeWords?: boolean
  /** Whether to use regex patterns */
  useRegex?: boolean
  /** Maximum number of highlights per text */
  maxHighlights?: number
  /** Custom highlight wrapper component */
  HighlightComponent?: React.ComponentType<{ children: React.ReactNode; index: number }>
}

/**
 * Default highlight configuration
 */
const DEFAULT_HIGHLIGHT_CONFIG: Required<Omit<HighlightConfig, 'HighlightComponent'>> = {
  highlightClass: "bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5 font-medium",
  caseSensitive: false,
  wholeWords: false,
  useRegex: false,
  maxHighlights: 50
}

/**
 * Default highlight component
 */
const DefaultHighlight: React.FC<{ children: React.ReactNode; index: number }> = ({
  children,
  index
}) => (
  <mark
    key={index}
    className={DEFAULT_HIGHLIGHT_CONFIG.highlightClass}
    data-highlight-index={index}
  >
    {children}
  </mark>
)

/**
 * Escape special regex characters
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create search regex from query and config
 */
const createHighlightRegex = (query: string, config: HighlightConfig): RegExp => {
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
 * Highlight search matches in text
 */
export function highlightSearchMatches(
  text: string,
  query: string,
  config: HighlightConfig = {}
): React.ReactNode {
  if (!query.trim()) return text

  const mergedConfig = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config }
  const HighlightComponent = config.HighlightComponent || DefaultHighlight

  try {
    const regex = createHighlightRegex(query, mergedConfig)
    const parts = text.split(regex)

    // If no matches found, return original text
    if (parts.length === 1) {
      return text
    }

    let highlightCount = 0
    return parts.map((part, index) => {
      // Test if this part matches the search query
      regex.lastIndex = 0 // Reset for test
      if (regex.test(part) && highlightCount < mergedConfig.maxHighlights) {
        highlightCount++
        return (
          <HighlightComponent key={index} index={highlightCount - 1}>
            {part}
          </HighlightComponent>
        )
      }
      return part
    })
  } catch {
    // Return original text if highlighting fails
    return text
  }
}

/**
 * Search result highlight component with enhanced styling
 */
export const SearchResultHighlight: React.FC<{
  children: React.ReactNode
  index: number
  isCurrentResult?: boolean
  isPrimaryMatch?: boolean
}> = ({
  children,
  index,
  isCurrentResult = false,
  isPrimaryMatch = false
}) => {
    const baseClasses = "rounded px-1 py-0.5 font-medium transition-colors"
    const highlightClasses = isCurrentResult
      ? "bg-orange-200 dark:bg-orange-800 text-orange-900 dark:text-orange-100 ring-2 ring-orange-400 dark:ring-orange-600"
      : isPrimaryMatch
        ? "bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100"
        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"

    return (
      <mark
        className={`${baseClasses} ${highlightClasses}`}
        data-highlight-index={index}
        data-current-result={isCurrentResult}
        data-primary-match={isPrimaryMatch}
      >
        {children}
      </mark>
    )
  }

/**
 * Hook for managing search highlighting state
 */
export function useSearchHighlighting(
  text: string,
  query: string,
  config: HighlightConfig = {}
) {
  const [highlightedText, setHighlightedText] = React.useState<React.ReactNode>(text)
  const [matchCount, setMatchCount] = React.useState(0)

  React.useEffect(() => {
    if (!query.trim()) {
      setHighlightedText(text)
      setMatchCount(0)
      return
    }

    try {
      const mergedConfig = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config }
      const regex = createHighlightRegex(query, mergedConfig)
      const matches = text.match(regex)
      const count = matches ? Math.min(matches.length, mergedConfig.maxHighlights) : 0

      setMatchCount(count)
      setHighlightedText(highlightSearchMatches(text, query, config))
    } catch {
      setHighlightedText(text)
      setMatchCount(0)
    }
  }, [text, query, config])

  return {
    highlightedText,
    matchCount,
    hasMatches: matchCount > 0
  }
}

/**
 * Hook for search result navigation with highlighting
 */
export function useSearchResultHighlighting(
  segments: Array<{ id: string; text: string }>,
  query: string,
  currentResultIndex: number = -1,
  config: HighlightConfig = {}
) {
  const [highlightedSegments, setHighlightedSegments] = React.useState<
    Array<{ id: string; highlightedText: React.ReactNode; matchCount: number }>
  >([])

  React.useEffect(() => {
    if (!query.trim()) {
      setHighlightedSegments(
        segments.map(segment => ({
          id: segment.id,
          highlightedText: segment.text,
          matchCount: 0
        }))
      )
      return
    }

    const highlighted = segments.map((segment, segmentIndex) => {
      const mergedConfig = {
        ...DEFAULT_HIGHLIGHT_CONFIG,
        ...config,
        HighlightComponent: ({ children, index }) => (
          <SearchResultHighlight
            index={index}
            isCurrentResult={segmentIndex === currentResultIndex}
            isPrimaryMatch={true}
          >
            {children}
          </SearchResultHighlight>
        )
      }

      try {
        const regex = createHighlightRegex(query, mergedConfig)
        const matches = segment.text.match(regex)
        const matchCount = matches ? matches.length : 0

        return {
          id: segment.id,
          highlightedText: highlightSearchMatches(segment.text, query, mergedConfig),
          matchCount
        }
      } catch {
        return {
          id: segment.id,
          highlightedText: segment.text,
          matchCount: 0
        }
      }
    })

    setHighlightedSegments(highlighted)
  }, [segments, query, currentResultIndex, config])

  const totalMatches = highlightedSegments.reduce((sum, segment) => sum + segment.matchCount, 0)

  return {
    highlightedSegments,
    totalMatches,
    hasMatches: totalMatches > 0
  }
}

/**
 * Utility to get search match positions in text
 */
export function getSearchMatchPositions(
  text: string,
  query: string,
  config: HighlightConfig = {}
): Array<{ start: number; end: number; text: string }> {
  if (!query.trim()) return []

  const mergedConfig = { ...DEFAULT_HIGHLIGHT_CONFIG, ...config }
  const matches: Array<{ start: number; end: number; text: string }> = []

  try {
    const regex = createHighlightRegex(query, mergedConfig)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null && matches.length < mergedConfig.maxHighlights) {
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
  } catch {
    // Return empty array if regex fails
  }

  return matches
}

/**
 * Convert SearchConfig to HighlightConfig
 */
export function searchConfigToHighlightConfig(searchConfig: SearchConfig): HighlightConfig {
  return {
    caseSensitive: searchConfig.caseSensitive,
    wholeWords: searchConfig.wholeWords,
    useRegex: searchConfig.useRegex,
    maxHighlights: searchConfig.maxResults
  }
}