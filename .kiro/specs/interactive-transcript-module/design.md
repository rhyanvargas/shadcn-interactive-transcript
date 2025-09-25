# Design Document

## Overview

The Interactive Transcript Module is a React component system built on shadcn/ui and Next.js 15 that provides interactive transcript functionality using web standard APIs. The design leverages the WebVTT API for media synchronization and provides transformation utilities for various transcript formats.

### Key Design Principles

- **Web Standards First**: Built around WebVTT API for maximum compatibility
- **Composable Architecture**: Modular components that can be used independently
- **Performance Optimized**: Efficient rendering with virtualization for large transcripts
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Accessible**: WCAG compliant with proper ARIA attributes and keyboard navigation

## Architecture

### Component Hierarchy

```
InteractiveTranscript (Main Container)
├── TranscriptProvider (Context Provider)
├── TranscriptSearch (Optional Search Component)
├── TranscriptContent (Main Content Area)
│   ├── TranscriptSegment (Individual Cue/Segment)
│   └── VirtualizedList (Performance Layer)
└── TranscriptControls (Optional Navigation Controls)
```

### Core Modules

1. **WebVTT Integration Layer**
   - `webvtt-parser.ts`: Parse WebVTT files and create TextTrack objects
   - `text-transformer.ts`: Transform raw text to WebVTT format
   - `media-sync.ts`: Synchronize with media elements via TextTrack API

2. **Component Layer**
   - `InteractiveTranscript.tsx`: Main component wrapper
   - `TranscriptProvider.tsx`: Context provider for state management
   - `TranscriptContent.tsx`: Virtualized content renderer
   - `TranscriptSegment.tsx`: Individual cue component

3. **Utility Layer**
   - `types.ts`: TypeScript definitions
   - `hooks.ts`: Custom React hooks
   - `utils.ts`: Helper functions

## Components and Interfaces

### Core Types

```typescript
interface TranscriptCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

interface TranscriptData {
  cues: TranscriptCue[];
  metadata?: {
    title?: string;
    language?: string;
    duration?: number;
  };
}

interface InteractiveTranscriptProps {
  data: TranscriptData | string; // WebVTT string or parsed data
  mediaElement?: HTMLMediaElement;
  onCueClick?: (cue: TranscriptCue) => void;
  onTimeUpdate?: (currentTime: number) => void;
  searchable?: boolean;
  virtualizeThreshold?: number;
  className?: string;
  theme?: 'light' | 'dark' | 'system';
}
```

### Main Component Interface

```typescript
export const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({
  data,
  mediaElement,
  onCueClick,
  onTimeUpdate,
  searchable = false,
  virtualizeThreshold = 100,
  className,
  theme = 'system'
}) => {
  // Component implementation
};
```

### WebVTT Transformation Utilities

```typescript
interface TextTransformOptions {
  segmentDuration?: number; // Default segment length in seconds
  speakerDetection?: boolean;
  timestampFormat?: 'seconds' | 'timecode';
}

export function transformTextToWebVTT(
  text: string, 
  options?: TextTransformOptions
): string;

export function parseWebVTT(vttString: string): TranscriptData;

export function createTextTrack(
  data: TranscriptData, 
  mediaElement: HTMLMediaElement
): TextTrack;
```

## Data Models

### WebVTT Integration Model

The component will work with the browser's native TextTrack API:

```typescript
// Native WebVTT integration
interface MediaIntegration {
  textTrack: TextTrack;
  mediaElement: HTMLMediaElement;
  activeCue: TextTrackCue | null;
  cueChangeHandler: (event: Event) => void;
}

// Internal state management
interface TranscriptState {
  cues: TranscriptCue[];
  activeCueId: string | null;
  searchQuery: string;
  searchResults: number[];
  currentSearchIndex: number;
  isSearching: boolean;
}
```

### Context Provider Model

```typescript
interface TranscriptContextValue {
  state: TranscriptState;
  actions: {
    setActiveCue: (cueId: string) => void;
    search: (query: string) => void;
    navigateSearch: (direction: 'next' | 'prev') => void;
    clearSearch: () => void;
    seekToTime: (time: number) => void;
  };
  config: {
    searchable: boolean;
    virtualizeThreshold: number;
    theme: string;
  };
}
```

## Error Handling

### WebVTT Parsing Errors

```typescript
class WebVTTParseError extends Error {
  constructor(message: string, public line?: number) {
    super(message);
    this.name = 'WebVTTParseError';
  }
}

// Error boundaries for graceful degradation
const TranscriptErrorBoundary: React.FC<{children: React.ReactNode}> = ({
  children
}) => {
  // Error boundary implementation with fallback UI
};
```

### Media Integration Error Handling

- Graceful fallback when media element is unavailable
- Error recovery for TextTrack API failures
- Validation for malformed WebVTT data
- User-friendly error messages with actionable guidance

## Testing Strategy

### Unit Testing

1. **WebVTT Utilities Testing**
   - Parse various WebVTT formats correctly
   - Transform raw text with different options
   - Handle malformed input gracefully

2. **Component Testing**
   - Render transcript segments correctly
   - Handle user interactions (clicks, keyboard navigation)
   - Search functionality works as expected
   - Virtualization performs correctly with large datasets

3. **Integration Testing**
   - Media element synchronization
   - TextTrack API integration
   - Context provider state management
   - Theme switching and styling

### Performance Testing

1. **Large Dataset Handling**
   - Test with transcripts containing 1000+ segments
   - Measure rendering performance with virtualization
   - Memory usage optimization validation

2. **Search Performance**
   - Search response time with large transcripts
   - Highlight rendering performance
   - Debounced search input handling

### Accessibility Testing

1. **Keyboard Navigation**
   - Tab through transcript segments
   - Arrow key navigation within transcript
   - Search shortcuts and navigation

2. **Screen Reader Compatibility**
   - Proper ARIA labels and descriptions
   - Live region updates for active cues
   - Semantic HTML structure

## Implementation Architecture

### File Structure (shadcn/ui Registry Compatible)

```
components/ui/
├── interactive-transcript.tsx       # Main component (registry entry point)
├── transcript-search.tsx           # Search subcomponent
└── transcript-segment.tsx          # Segment subcomponent

lib/
├── webvtt/
│   ├── parser.ts                   # WebVTT parsing utilities
│   ├── transformer.ts              # Text to WebVTT transformation
│   └── media-sync.ts               # Media element synchronization
├── hooks/
│   ├── use-transcript.ts           # Main transcript hook
│   ├── use-media-sync.ts           # Media synchronization hook
│   └── use-virtualization.ts       # Performance optimization hook
└── utils.ts                        # Shared utilities (following shadcn pattern)

registry/
└── interactive-transcript.json     # Registry configuration file
```

### Registry Configuration

Following latest shadcn/ui registry patterns, the component will be distributed via:

```json
{
  "name": "interactive-transcript",
  "type": "registry:ui",
  "dependencies": [
    "@radix-ui/react-scroll-area",
    "@radix-ui/react-dialog",
    "@radix-ui/react-slot",
    "class-variance-authority",
    "clsx",
    "tailwind-merge"
  ],
  "devDependencies": [],
  "registryDependencies": [
    "button",
    "input",
    "scroll-area",
    "dialog"
  ],
  "files": [
    {
      "path": "ui/interactive-transcript.tsx",
      "content": "...",
      "type": "registry:ui"
    },
    {
      "path": "ui/transcript-search.tsx", 
      "content": "...",
      "type": "registry:ui"
    },
    {
      "path": "ui/transcript-segment.tsx",
      "content": "...",
      "type": "registry:ui"
    }
  ],
  "tailwind": {
    "config": {
      "theme": {
        "extend": {
          "keyframes": {
            "transcript-highlight": {
              "0%": { "background-color": "oklch(var(--muted))" },
              "50%": { "background-color": "oklch(var(--accent))" },
              "100%": { "background-color": "oklch(var(--muted))" }
            }
          },
          "animation": {
            "transcript-highlight": "transcript-highlight 0.5s ease-in-out"
          }
        }
      }
    }
  }
}
```

### Styling Strategy (Latest shadcn/ui + Tailwind CSS v4)

Following latest shadcn/ui conventions with Tailwind CSS v4 and modern CSS:

```typescript
// Using class-variance-authority for component variants
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const transcriptVariants = cva(
  "relative w-full rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      size: {
        sm: "text-sm p-3",
        default: "text-sm p-4", 
        lg: "text-base p-6"
      },
      variant: {
        default: "border-border",
        ghost: "border-transparent shadow-none",
        outline: "border-input bg-background"
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default"
    }
  }
)

const segmentVariants = cva(
  "group relative flex cursor-pointer select-none items-start gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors",
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false: "hover:bg-accent/50 focus:bg-accent/50"
      },
      highlighted: {
        true: "bg-yellow-50 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-50",
        false: ""
      }
    },
    defaultVariants: {
      active: false,
      highlighted: false
    }
  }
)

// Tailwind CSS v4 compatible custom properties
const transcriptStyles = {
  "--transcript-segment-padding": "0.75rem",
  "--transcript-highlight-duration": "0.5s",
  "--transcript-search-highlight": "oklch(0.95 0.1 60)",
} as React.CSSProperties
```

### Component Composition (Latest shadcn/ui Pattern)

```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Main component following latest shadcn/ui patterns
interface InteractiveTranscriptProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof transcriptVariants> {
  data: TranscriptData | string;
  mediaElement?: HTMLMediaElement;
  onCueClick?: (cue: TranscriptCue) => void;
  searchable?: boolean;
  virtualizeThreshold?: number;
  asChild?: boolean;
}

const InteractiveTranscript = React.forwardRef<
  HTMLDivElement,
  InteractiveTranscriptProps
>(({ 
  className, 
  size, 
  variant, 
  data, 
  mediaElement, 
  asChild = false,
  ...props 
}, ref) => {
  const Comp = asChild ? Slot : "div"
  
  return (
    <Comp
      ref={ref}
      className={cn(transcriptVariants({ size, variant }), className)}
      style={transcriptStyles}
      {...props}
    >
      {/* Component implementation */}
    </Comp>
  )
})
InteractiveTranscript.displayName = "InteractiveTranscript"

// Export pattern following latest shadcn/ui conventions
export { InteractiveTranscript, transcriptVariants }
export type { InteractiveTranscriptProps }
```

### Performance Optimizations

1. **Virtualization**: Use react-window for large transcript rendering
2. **Memoization**: React.memo for segment components
3. **Debounced Search**: Optimize search input handling
4. **Lazy Loading**: Load WebVTT parsing utilities on demand
5. **Bundle Splitting**: Separate search functionality for optional loading

### shadcn/ui Registry Integration

The component will be distributed through the latest shadcn/ui registry system, allowing users to install it via:

```bash
npx shadcn@latest add interactive-transcript
```

This will:
- Install the component files in `components/ui/` with proper TypeScript support
- Add necessary dependencies to `package.json` including Radix UI primitives
- Include required shadcn/ui registry dependencies (button, input, scroll-area, dialog)
- Configure Tailwind CSS v4 with custom animations and OKLCH color space support
- Provide comprehensive TypeScript definitions with proper exports and variants
- Support `asChild` prop pattern for maximum composability

### Component Dependencies

The component will leverage existing shadcn/ui components:
- **Button**: For search navigation and controls
- **Input**: For search functionality
- **ScrollArea**: For transcript content scrolling
- **Dialog**: For advanced search or settings (optional)

This ensures consistency with the shadcn/ui ecosystem and reduces bundle size by reusing existing components.