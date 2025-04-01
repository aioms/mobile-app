# AIOS Mobile App Development Guide

## Tech Stack

- React (v18) with TypeScript
- Ionic Framework (v8) with Capacitor (v6)
- Vite for building and bundling
- TailwindCSS for styling
- Axios for API requests
- Capacitor plugins (Camera, Barcode scanning, Toast, etc.)
- Cypress and Vitest for testing

## Commands

- **Development**: `npm run dev`
- **Build**: `npm run build` (for web), `npm run build:ios` (iOS), `npm run build:android` (Android)
- **Testing**: `npm run test.unit` (unit tests), `npm run test.e2e` (Cypress E2E tests)
- **Linting**: `npm run lint`
- **Run on iOS**: `npm run start:ios`
- **Sync Capacitor**: `npm run sync`

## Code Patterns

- **Import Order**: External libraries first, then internal components, hooks, and helpers
- **Component Structure**: Functional components with TypeScript interfaces for props
- **Type Definitions**: Interfaces defined in `src/types/index.d.ts` with `I` prefix for common interfaces
- **Naming Conventions**:
  - PascalCase for components and interfaces
  - camelCase for variables and functions
  - Files named after component/feature they contain
- **Error Handling**: Try/catch blocks with Toast notifications for user feedback

## Project Organization

- Components in `src/components/`
- Pages in `src/pages/` (page-specific components in `components/` subfolders)
- Hooks in `src/hooks/` (API hooks in `apis/` subfolder)
- Helper functions in `src/helpers/`
- Types in `src/types/`
