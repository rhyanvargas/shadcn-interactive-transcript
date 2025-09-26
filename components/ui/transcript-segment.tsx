/**
 * TranscriptSegment Component
 * Individual transcript segment/cue component with shadcn/ui patterns
 * Supports accessibility, keyboard navigation, and component variants
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { type TranscriptCue } from "@/lib/types/transcript"

/**
 * Component variants using class-variance-authority
 */
const transcriptSegmentVariants = cva(
  // Base styles with proper accessibility and interaction states
  "group relative flex cursor-pointer select-none items-start gap-3 rounded-md px-3 py-2 text-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      state: {
        default: "hover:bg-accent/50 focus:bg-accent/50 text-foreground",
        active: "bg-accent text-accent-foreground shadow-sm",
        highlighted: "bg-muted text-foreground border border-border",
        searchMatch: "bg-yellow-100 dark:bg-yellow-900/30 text-foreground font-medium border border-yellow-200 dark:border-yellow-800"
      },
      size: {
        sm: "px-2 py-1 text-xs gap-2",
        default: "px-3 py-2 text-sm gap-3",
        lg: "px-4 py-3 text-base gap-4"
      },
      variant: {
        default: "",
        ghost: "hover:bg-accent/30 focus:bg-accent/30",
        outline: "border border-input hover:bg-accent/50 focus:bg-accent/50"
      }
    },
    compoundVariants: [
      {
        state: "active",
        variant: "ghost",
        className: "bg-accent/80 text-accent-foreground"
      },
      {
        state: "searchMatch",
        variant: "outline",
        className: "border-yellow-300 dark:border-yellow-700"
      }
    ],
    defaultVariants: {
      state: "default",
      size: "default",
      variant: "default"
    }
  }
)

/**
 * Timestamp display variants
 */
const timestampVariants = cva(
  "flex-shrink-0 font-mono text-xs tabular-nums transition-colors",
  {
    variants: {
      position: {
        left: "mr-1",
        right: "ml-1",
        top: "mb-1",
        hidden: "sr-only"
      },
      style: {
        default: "text-muted-foreground group-hover:text-foreground",
        prominent: "text-foreground font-medium",
        subtle: "text-muted-foreground/70"
      }
    },
    defaultVariants: {
      position: "left",
      style: "default"
    }
  }
)

/**
 * Speaker label variants
 */
const speakerVariants = cva(
  "flex-shrink-0 font-medium transition-colors",
  {
    variants: {
      style: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground"
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base"
      }
    },
    defaultVariants: {
      style: "default",
      size: "default"
    }
  }
)

/**
 * TranscriptSegment component props
 */
export interface TranscriptSegmentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof transcriptSegmentVariants> {
  /** Transcript cue data */
  cue: TranscriptCue
  /** Whether this segment is currently active/playing */
  active?: boolean
  /** Whether this segment is highlighted (e.g., search result) */
  highlighted?: boolean
  /** Whether this segment matches current search query */
  searchMatch?: boolean
  /** Click handler with cue data */
  onCueClick?: (cue: TranscriptCue) => void
  /** Timestamp display configuration */
  timestampConfig?: {
    show?: boolean
    position?: "left" | "right" | "top" | "hidden"
    style?: "default" | "prominent" | "subtle"
    format?: (time: number) => string
  }
  /** Speaker display configuration */
  speakerConfig?: {
    show?: boolean
    style?: "default" | "muted" | "accent"
    format?: (speaker: string) => string
  }
  /** Search query for highlighting matches */
  searchQuery?: string
  /** Render as child component */
  asChild?: boolean
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
 * Highlight search matches in text
 */
const highlightSearchMatches = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5"
        >
          {part}
        </mark>
      )
    }
    return part
  })
}

/**
 * Escape special regex characters
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * TranscriptSegment component
 */
const TranscriptSegment = React.forwardRef<HTMLDivElement, TranscriptSegmentProps>(
  ({
    className,
    cue,
    active = false,
    highlighted = false,
    searchMatch = false,
    onCueClick,
    timestampConfig = {},
    speakerConfig = {},
    searchQuery,
    state,
    size,
    variant,
    asChild = false,
    onClick,
    onKeyDown,
    ...props
  }, ref) => {
    // Determine component state based on props
    const componentState = active ? "active" : searchMatch ? "searchMatch" : highlighted ? "highlighted" : state || "default"

    // Default configurations
    const {
      show: showTimestamp = true,
      position: timestampPosition = "left",
      style: timestampStyle = "default",
      format: formatTimestamp = defaultTimestampFormatter
    } = timestampConfig

    const {
      show: showSpeaker = true,
      style: speakerStyle = "default",
      format: formatSpeaker = defaultSpeakerFormatter
    } = speakerConfig

    // Event handlers
    const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(event)
      onCueClick?.(cue)
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onCueClick?.(cue)
      }
    }

    // Render timestamp
    const renderTimestamp = () => {
      if (!showTimestamp || timestampPosition === "hidden") return null

      return (
        <time
          className={cn(timestampVariants({ position: timestampPosition, style: timestampStyle }))}
          dateTime={`${cue.startTime}s`}
          title={`${formatTimestamp(cue.startTime)} - ${formatTimestamp(cue.endTime)}`}
        >
          {formatTimestamp(cue.startTime)}
        </time>
      )
    }

    // Render speaker
    const renderSpeaker = () => {
      if (!showSpeaker || !cue.speaker) return null

      return (
        <span
          className={cn(speakerVariants({ style: speakerStyle, size }))}
          aria-label={`Speaker: ${cue.speaker}`}
        >
          {formatSpeaker(cue.speaker)}
        </span>
      )
    }

    // Render text content with search highlighting
    const renderTextContent = () => {
      const textContent = searchQuery ? highlightSearchMatches(cue.text, searchQuery) : cue.text

      return (
        <div className="flex-1 leading-relaxed">
          {textContent}
        </div>
      )
    }

    const Comp = asChild ? Slot : "div"

    return (
      <Comp
        ref={ref}
        className={cn(transcriptSegmentVariants({ state: componentState, size, variant }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Transcript segment: ${cue.text}${cue.speaker ? ` by ${cue.speaker}` : ''} at ${formatTimestamp(cue.startTime)}`}
        aria-pressed={active}
        data-cue-id={cue.id}
        data-start-time={cue.startTime}
        data-end-time={cue.endTime}
        {...props}
      >
        {timestampPosition === "top" && (
          <div className="w-full">
            {renderTimestamp()}
          </div>
        )}
        
        <div className="flex w-full items-start gap-2">
          {timestampPosition === "left" && renderTimestamp()}
          
          <div className="flex-1 space-y-1">
            {renderSpeaker()}
            {renderTextContent()}
          </div>
          
          {timestampPosition === "right" && renderTimestamp()}
        </div>
      </Comp>
    )
  }
)

TranscriptSegment.displayName = "TranscriptSegment"

export { TranscriptSegment, transcriptSegmentVariants, timestampVariants, speakerVariants }
export type { TranscriptSegmentProps }