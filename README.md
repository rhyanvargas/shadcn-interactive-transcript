# Interactive Transcript Module

A Next.js project featuring a comprehensive interactive transcript component built with shadcn/ui patterns. This module provides WebVTT parsing, media synchronization, search functionality, and accessibility features for video/audio transcripts.

## Features

- **WebVTT Parser**: Comprehensive WebVTT format parsing with error handling
- **Media Synchronization**: Real-time sync with HTML5 video/audio elements
- **Search & Navigation**: Full-text search with highlighting and navigation
- **Accessibility**: WCAG compliant with keyboard navigation and screen reader support
- **Responsive Design**: Mobile-first design with shadcn/ui components
- **TypeScript**: Full type safety with comprehensive interfaces

## Getting Started

### Development

First, install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Testing

We use **Vitest** as our testing framework. Here's why we chose Vitest over Jest:

- **Native ESM Support**: Better compatibility with modern JavaScript modules
- **Vite Integration**: Leverages Vite's fast build system for quicker test execution
- **TypeScript First**: Excellent TypeScript support out of the box
- **Modern API**: Clean, intuitive API similar to Jest but with modern improvements
- **Performance**: Significantly faster test execution and hot module replacement

Run tests with:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI
pnpm test:ui
```

### Testing Strategy

Our testing approach focuses on:

1. **Unit Tests**: Individual functions and utilities (WebVTT parser, transcript utilities)
2. **Component Tests**: React components with user interaction testing
3. **Integration Tests**: Component integration with media elements and state management
4. **Accessibility Tests**: Ensuring WCAG compliance and keyboard navigation

Test files are located alongside source files in `__tests__` directories or with `.test.ts` suffixes.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
