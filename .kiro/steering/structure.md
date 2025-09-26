# Project Structure

## Directory Organization

```
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and Tailwind imports
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Home page component
│   └── favicon.ico        # App favicon
├── components/            # React components
│   └── ui/                # shadcn/ui components (auto-generated)
├── lib/                   # Core utilities and business logic
│   ├── constants/         # Application constants
│   ├── transcript/        # Transcript-specific logic
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── variants/          # Component variant definitions
│   ├── webvtt/            # WebVTT parsing utilities
│   └── utils.ts           # Main utility functions (cn, etc.)
├── public/                # Static assets
├── test/                  # Test configuration
│   └── setup.ts           # Vitest setup file
└── .kiro/                 # Kiro IDE configuration
    └── steering/          # AI assistant guidance documents
```

## File Naming Conventions

- **Components**: PascalCase for React components (`TranscriptViewer.tsx`)
- **Utilities**: camelCase for utility functions (`parseWebVTT.ts`)
- **Types**: camelCase with descriptive names (`transcript.ts`)
- **Tests**: Co-located with source files in `__tests__/` directories or `.test.ts` suffix
- **Constants**: camelCase files, SCREAMING_SNAKE_CASE exports

## Import Patterns

### Path Aliases
- Use `@/` prefix for all internal imports
- `@/components` for UI components
- `@/lib` for utilities and business logic
- `@/lib/types` for TypeScript definitions

### Import Order
1. External libraries (React, Next.js, etc.)
2. Internal utilities and types (`@/lib`)
3. Internal components (`@/components`)
4. Relative imports (`./`, `../`)

## Component Architecture

### shadcn/ui Integration
- UI components auto-generated in `components/ui/`
- Follow shadcn/ui patterns for component composition
- Use `cn()` utility for conditional classes
- Implement `asChild` pattern for flexible composition

### Component Structure
```typescript
// Standard component pattern
interface ComponentProps extends BaseComponentProps {
  // Component-specific props
}

export function Component({ className, ...props }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

## Library Organization

### `/lib` Directory Structure
- **`types/`**: TypeScript interfaces and type definitions
- **`utils/`**: Pure utility functions and helpers
- **`constants/`**: Application constants and configuration
- **`variants/`**: Component variant definitions using class-variance-authority
- **`webvtt/`**: WebVTT parsing and media integration logic
- **`transcript/`**: Core transcript functionality and state management

### Type Definitions
- Centralized in `lib/types/` directory
- Export commonly used types from main type files
- Use descriptive interface names with clear documentation
- Follow shadcn/ui patterns for component prop types

## Testing Strategy

### Test Organization
- Unit tests: Co-located with source files in `__tests__/` directories
- Component tests: Test user interactions and accessibility
- Integration tests: Test component integration with media elements
- Utility tests: Test pure functions and parsing logic

### Test File Patterns
- `*.test.ts` for utility functions
- `*.test.tsx` for React components
- Descriptive test names following "should do X when Y" pattern

## Configuration Files

### Root Level
- `components.json`: shadcn/ui configuration
- `tsconfig.json`: TypeScript configuration with strict mode
- `vitest.config.ts`: Test framework configuration
- `next.config.ts`: Next.js configuration with Turbopack
- `package.json`: Dependencies and scripts with pnpm specification

### Development
- `.gitignore`: Standard Next.js + Node.js ignore patterns
- `eslint.config.mjs`: ESLint configuration for Next.js
- `postcss.config.mjs`: PostCSS configuration for Tailwind

## Code Organization Principles

1. **Separation of Concerns**: Business logic in `/lib`, UI in `/components`
2. **Type Safety**: Comprehensive TypeScript coverage with strict mode
3. **Testability**: Pure functions and testable component patterns
4. **Accessibility**: WCAG compliance built into component architecture
5. **Performance**: Lazy loading and virtualization for large datasets
6. **Maintainability**: Clear file organization and consistent naming