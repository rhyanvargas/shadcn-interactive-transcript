/**
 * Component variants using class-variance-authority
 * Following shadcn/ui design patterns and Tailwind CSS v4 compatibility
 */

import { cva } from "class-variance-authority"

// Main transcript container variants
export const transcriptVariants = cva(
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

// Individual transcript segment variants
export const segmentVariants = cva(
  "group relative flex cursor-pointer select-none items-start gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      active: {
        true: "bg-accent text-accent-foreground",
        false: "hover:bg-accent/50 focus:bg-accent/50"
      },
      highlighted: {
        true: "bg-yellow-50 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-50",
        false: ""
      },
      size: {
        sm: "px-2 py-1 text-xs",
        default: "px-3 py-2 text-sm",
        lg: "px-4 py-3 text-base"
      }
    },
    defaultVariants: {
      active: false,
      highlighted: false,
      size: "default"
    }
  }
)

// Search input variants
export const searchVariants = cva(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        default: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base"
      }
    },
    defaultVariants: {
      size: "default"
    }
  }
)

// Timestamp display variants
export const timestampVariants = cva(
  "shrink-0 font-mono text-xs text-muted-foreground",
  {
    variants: {
      position: {
        left: "mr-2",
        right: "ml-2",
        above: "mb-1 block",
        below: "mt-1 block"
      },
      format: {
        short: "min-w-[3rem]",
        long: "min-w-[5rem]"
      }
    },
    defaultVariants: {
      position: "left",
      format: "short"
    }
  }
)

// Speaker label variants
export const speakerVariants = cva(
  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        outline: "border border-input bg-background",
        ghost: "text-muted-foreground"
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        default: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

// Search result navigation variants
export const searchNavigationVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "h-8 w-8",
        default: "h-9 w-9",
        lg: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "outline",
      size: "default"
    }
  }
)