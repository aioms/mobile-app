# Design System validation report

**Branch**: `001-build-design-system-foundation`  
**Date**: 2026-07-23  
**Scope**: Foundation and migration infrastructure only; no business screen was
migrated.

## Automated gates

| Gate | Command | Result |
|---|---|---|
| TypeScript | `./node_modules/.bin/tsc --noEmit` | Pass |
| Design System lint | `npm run lint:design-system` | Pass |
| Unit/contract suite | `npm run test.unit:run` | Pass: 15 files, 148 tests |
| PWA explicit update regression | `npm run test.unit:run -- src/pwa/PWAUpdateProvider.test.tsx` | Pass: 3 tests |
| Normal production build | `npm run vite:build` | Pass |
| Development catalog build | `VITE_ENABLE_UI_CATALOG=true npm run vite:build -- --mode development` | Pass; lazy `UIKitPage` modern and legacy chunks emitted |
| Bundle/Workbox ratchet | `node scripts/design-system/check-bundle-budget.mjs --catalog-dist <catalog-dist>` | Pass |
| Cypress viewport/axe matrix | `npm run test.e2e -- --browser chrome --spec cypress/e2e/design-system.cy.ts` | Pass |
| Diff whitespace | `git diff --check` | Pass |

## Bundle evidence

Clean baseline commit: `ea53362725a43bb2e377c9c423d0f71e18e3974d`.

| Metric | Baseline gzip | Candidate gzip | Delta | Gate |
|---|---:|---:|---:|---|
| Initial modern JS + CSS | 602,038 B | 604,581 B | +0.42% | Pass, ≤5% |
| Initial legacy assets | 635,215 B | 640,398 B | +0.82% | Reported separately |
| Workbox precache | 1,339,833 B | 1,345,029 B | +0.39% | Pass, ≤5% |

Candidate initial production footprint:

- JavaScript: 2,274,954 raw / 578,986 gzip bytes.
- CSS: 134,065 raw / 25,595 gzip bytes.

Catalog-build delta over the normal production candidate:

- Initial modern gzip: +143 bytes.
- Initial legacy gzip: +161 bytes.
- Workbox precache gzip: +17,737 bytes.
- Catalog chunks are lazy and exist only in the explicit development catalog
  build.

## Production omission and PWA update safety

- Normal production build contains no `/internal/ui-kit`, `UIKitPage`,
  `UIKitSections`, or `UIKitBenchmark` source/chunk marker.
- Normal production Workbox precache contains no catalog marker.
- The explicit PWA behavior is unchanged: update discovery only notifies;
  choosing **Để sau** does not activate; activation occurs only after choosing
  **Cập nhật**.
- `registerType: "prompt"`, `skipWaiting: false`, and `clientsClaim: false`
  remain the build-time policy.
- Final browser evidence for the production NotFound route and explicit
  `version.json` precache exclusion is pending the final Cypress run.

## Catalog quality and performance

| Evidence | Required | Result |
|---|---:|---|
| Fixed viewports | 4 | Pass |
| Horizontal overflow | 0 | Pass |
| Interactive target size | ≥44×44 CSS px | Pass |
| axe WCAG 2.1 A/AA critical/serious | 0 | Pass |
| Interaction samples | ≥20 per action, ≥95% ≤100 ms | Pass |
| Reference list | 200 deterministic rows | Pass |
| Scroll segments without >100 ms Long Task | ≥19/20 | Pass |
| Primary scroll containers | 1 | Pass |
| Installed standalone cold starts | 5 per fixed device/profile | Manual device QA required |

## Baseline debt and limitations

- The existing project-wide ESLint configuration did not lint files because the
  old `.eslintrc.js` was CommonJS syntax under an ESM package. The feature
  replaces it with `.eslintrc.cjs` and adds a targeted script.
- npm reports pre-existing dependency vulnerabilities. No forced dependency
  upgrade is included in this foundation feature.
- Browser mapping/caniuse metadata reports that local data is stale; this does
  not fail compilation or the bundle ratchet.
- Physical iOS/Android standalone PWA, screen-reader, safe-area, virtual
  keyboard, back gesture, and five-run cold-start evidence cannot be inferred
  from desktop automation and remains explicitly unapproved.

## Scope Verification & Allowlist

The final diff has been verified to conform to the isolation requirements:
- **No business routes or APIs changed.**
- **No state management or permission rules changed.**
- **No Legacy components modified.**
- **No production screens migrated or V2 flags enabled in production.**

### Reviewed Allowlist
- `src/design-system/*`: All foundation tokens, CSS, and 10 base component contracts.
- `src/dev/*`: The internal UI Catalog and performance benchmarks.
- `src/ui-flags/*`: Feature control infrastructure (defaults to Legacy).
- `scripts/design-system/*`: Tooling for audit, bundle checks, and validation.
- `cypress/e2e/design-system.cy.ts`, `cypress/support/*`: Cypress test suites.
- `docs/design-system/*`, `specs/001-build-design-system-foundation/*`: Documentation and baseline evidence.
- Project config files: `package.json`, `vite.config.ts`, `cypress.config.ts`, `tailwind.config.js`, `.eslintrc.cjs` modified strictly to support Design System tooling.
