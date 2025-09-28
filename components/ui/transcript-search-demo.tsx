/**
 * TranscriptSearchDemo Component
 * Demonstrates the search functionality with highlighting and navigation
 */

import * as React from "react"
import { TranscriptSearch } from "./transcript-search"
import { TranscriptSegment } from "./transcript-segment"
import { useTranscriptSearch } from "@/lib/hooks/use-transcript-search"
import { useSearchResultHighlighting } from "@/lib/utils/search-highlighting"
import { type TranscriptCue } from "@/lib/types/transcript"

/**
 * Demo props
 */
export interface TranscriptSearchDemoProps {
  /** Transcript cues to search through */
  cues: TranscriptCue[]
  /** Demo title */
  title?: string
  /** Whether to show search statistics */
  showStats?: boolean
  /** Custom CSS class */
  className?: string
}

/**
 * TranscriptSearchDemo component
 */
export const TranscriptSearchDemo: React.FC<TranscriptSearchDemoProps> = ({
  cues,
  title = "Interactive Transcript Search Demo",
  showStats = true,
  className
}) => {
  const [selectedCueId, setSelectedCueId] = React.useState<string | null>(null)

  // Use the search hook
  const { state, actions, currentResult } = useTranscriptSearch(
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
      onCurrentResultChange: (result) => {
        if (result) {
          setSelectedCueId(result.cue.id)
        }
      }
    }
  )

  // Use search result highlighting
  const { highlightedSegments, totalMatches } = useSearchResultHighlighting(
    cues.map(cue => ({ id: cue.id, text: cue.text })),
    state.query,
    currentResult ? currentResult.cueIndex : -1
  )

  // Handle cue click
  const handleCueClick = (cue: TranscriptCue) => {
    setSelectedCueId(cue.id)
  }

  // Handle search navigation
  const handleNavigateResult = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      actions.nextResult()
    } else {
      actions.prevResult()
    }
  }

  // Handle result selection
  const handleSelectResult = (result: any, index: number) => {
    actions.goToResult(index)
    setSelectedCueId(result.cue.id)
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Demo Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">
          Search through transcript content with real-time highlighting and navigation
        </p>
      </div>

      {/* Search Component */}
      <div className="max-w-2xl mx-auto">
        <TranscriptSearch
          cues={cues}
          query={state.query}
          results={state.results}
          currentResultIndex={state.currentResultIndex}
          isSearching={state.isSearching}
          onQueryChange={actions.setQuery}
          onSearch={(query, results) => {
            console.log(`Search for "${query}" found ${results.length} results`)
          }}
          onNavigateResult={handleNavigateResult}
          onSelectResult={handleSelectResult}
          onClearSearch={actions.clearSearch}
          placeholder="Search transcript content..."
          showNavigation={true}
          showClearButton={true}
          autoFocus={false}
        />
      </div>

      {/* Search Statistics */}
      {showStats && (
        <div className="text-center text-sm text-muted-foreground">
          {state.query && (
            <div className="space-y-1">
              <p>
                {state.results.length > 0
                  ? `Found ${state.results.length} segment${state.results.length === 1 ? '' : 's'} with ${totalMatches} match${totalMatches === 1 ? '' : 'es'}`
                  : state.query.length >= 1
                    ? 'No results found'
                    : ''
                }
              </p>
              {currentResult && (
                <p>
                  Currently viewing result {state.currentResultIndex + 1} of {state.results.length}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transcript Segments */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4 bg-card">
          {cues.map((cue, index) => {
            const highlightedSegment = highlightedSegments.find(seg => seg.id === cue.id)
            const isActive = selectedCueId === cue.id
            const isSearchMatch = state.results.some(result => result.cue.id === cue.id)
            const isCurrentResult = currentResult?.cue.id === cue.id

            return (
              <TranscriptSegment
                key={cue.id}
                cue={cue}
                active={isActive}
                searchMatch={isSearchMatch}
                highlighted={isCurrentResult}
                onCueClick={handleCueClick}
                searchQuery={state.query}
                timestampConfig={{
                  show: true,
                  position: "left",
                  style: "default"
                }}
                speakerConfig={{
                  show: true,
                  style: "default"
                }}
                className={`
                  transition-all duration-200
                  ${isCurrentResult ? 'ring-2 ring-orange-400 dark:ring-orange-600' : ''}
                  ${isSearchMatch && !isCurrentResult ? 'ring-1 ring-yellow-400 dark:ring-yellow-600' : ''}
                `}
              />
            )
          })}

          {cues.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No transcript segments available
            </div>
          )}
        </div>
      </div>

      {/* Search Instructions */}
      <div className="max-w-2xl mx-auto text-sm text-muted-foreground">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="font-medium mb-2">Search Instructions:</h3>
          <ul className="space-y-1 text-xs">
            <li>• Type in the search box to find matching text</li>
            <li>• Use Enter or ↓ to navigate to next result</li>
            <li>• Use Shift+Enter or ↑ to navigate to previous result</li>
            <li>• Press Escape to clear the search</li>
            <li>• Click on any segment to select it</li>
            <li>• Current search result is highlighted in orange</li>
            <li>• Other matches are highlighted in yellow</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TranscriptSearchDemo