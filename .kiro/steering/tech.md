# Technology Stack

## Framework & Runtime

- **Next.js 15.5.4**: React framework with App Router, Turbopack enabled for development and builds
- **React 19.1.0**: Latest React with concurrent features and improved TypeScript support
- **TypeScript 5.9.2**: Strict mode enabled, ES2017 target for broad compatibility
- **Node.js**: Runtime environment (version managed via package.json engines)

## Package Management

- **pnpm 10.15.0**: Fast, disk space efficient package manager (specified in packageManager field)
- Use `pnpm` for all dependency management, not npm or yarn

## Styling & UI

- **Tailwind CSS 4.1.13**: Utility-first CSS framework with CSS variables enabled
- **shadcn/ui**: Component library following "new-york" style variant
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Type-safe component variants
- **clsx + tailwind-merge**: Conditional classes and conflict resolution

## Testing Framework

- **Vitest 1.6.1**: Modern testing framework chosen over Jest for:
  - Native ESM support and better module compatibility
  - Vite integration for faster test execution
  - Superior TypeScript support out of the box
  - Modern API with improved developer experience
- **@testing-library/react**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers for DOM testing
- **jsdom**: DOM environment for testing

## Development Tools

- **ESLint 9.36.0**: Code linting with Next.js configuration
- **Turbopack**: Fast bundler for development and production builds

## Common Commands

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Production build with Turbopack
pnpm start            # Start production server

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:ui          # Run tests with UI interface

# Code Quality
pnpm lint             # Run ESLint

# Package Management
pnpm install          # Install dependencies
pnpm add <package>    # Add dependency
pnpm add -D <package> # Add dev dependency
```

## Path Aliases

- `@/*`: Maps to workspace root for clean imports
- `@/components`: UI components directory
- `@/lib`: Utility functions and core logic
- `@/hooks`: Custom React hooks (when created)

## Build Configuration

- **Turbopack**: Enabled for both development and production builds
- **Incremental compilation**: TypeScript incremental builds enabled
- **Strict mode**: TypeScript strict mode enforced
- **ES2017 target**: Ensures broad browser compatibility while maintaining modern features