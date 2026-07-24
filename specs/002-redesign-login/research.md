# Phase 0: Research

## Technology Choices & Unknowns

### Testing Framework
- **Decision**: Vitest with `@testing-library/react`
- **Rationale**: Based on existing `package.json` scripts (`test.unit: "vitest"`), Vitest is the configured unit testing framework for this Vite-based project. We will use it for component testing.
- **Alternatives considered**: Jest (requires more complex config with Vite), Cypress (used for E2E testing in this project, but overkill for component unit tests).

### UI Framework Components
- **Decision**: Use `AppTextField` for inputs, `AppButton` for buttons, and Konsta UI layout components (`Page`, `Navbar`, `Block`) if needed, wrapped appropriately.
- **Rationale**: The new design system foundation relies on Konsta UI primitives and provides standardized components like `AppTextField` and `AppButton`. These must be used to ensure UI consistency and adhere to the newly built design system.
- **Alternatives considered**: Raw Konsta UI components (violates the design system wrapper pattern), Ionic components (violates the migration goal).
