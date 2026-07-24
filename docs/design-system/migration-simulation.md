# Reference Slice Migration Simulation

**Run date**: 2026-07-23  
**Source commit**: `ea53362725a43bb2e377c9c423d0f71e18e3974d`  
**Slice under test**: `reference-list`  
**Environment flag**: `VITE_UI_REFERENCE_LIST_V2`  
**Type**: local contract/tabletop simulation; no production screen or deployment
was changed

## Readiness gate evidence

The ready reference record was validated with:

```sh
npm run validate:migration-readiness -- specs/001-build-design-system-foundation/examples/reference-migration-ready.json
```

Observed result:

```text
PASS specs/001-build-design-system-foundation/examples/reference-migration-ready.json (reference-list, status: ready)
exit code: 0
```

The intentionally incomplete record was validated with:

```sh
npm run validate:migration-readiness -- specs/001-build-design-system-foundation/examples/reference-migration-incomplete.json
```

Observed result:

```text
FAIL specs/001-build-design-system-foundation/examples/reference-migration-incomplete.json
  - filesOutOfScope: filesOutOfScope must be a non-empty string array
  - behaviorToPreserve: behaviorToPreserve must be a non-empty string array
  - visualBaseline: visualBaseline must be a non-empty string array
  - acceptanceCriteria: acceptanceCriteria must be a non-empty string array
  - testCommands: testCommands must be a non-empty string array
  - manualQa: manualQa must be a non-empty string array
  - performanceBaseline.0.commit: commit is required
  - performanceBaseline.0.environment: environment is required
  - performanceBaseline.0.artifactPath: artifactPath is required
  - performanceBaseline.0.capturedAt: capturedAt must be an ISO date
  - performanceBaseline.0.metric: metric is invalid
  - performanceBaseline.0.unit: unit is invalid
  - performanceBaseline.0.value: value must be finite
  - performanceBaseline.0.threshold: threshold must be finite
  - rollbackPlan.sliceKey: rollback must target the same slice
  - rollbackPlan.triggerConditions: rollback trigger conditions are required
  - rollbackPlan.action: action is required
  - rollbackPlan.owner: owner is required
  - rollbackPlan.targetVersion: rollback target must be legacy
  - rollbackPlan.dataImpact: rollback must not require data changes
  - rollbackPlan.timeBudgetMinutes: rollback time budget must be between 0 and 5 minutes
exit code: 1
```

This demonstrates that a complete record can enter implementation review while
an incomplete scope, evidence set, or rollback plan is blocked.

## Enable simulation

Initial state:

```text
VITE_UI_REFERENCE_LIST_V2 absent/false   → reference-list = legacy
VITE_UI_REFERENCE_DETAIL_V2 absent/false → reference-detail = legacy
```

Simulated candidate release:

```text
VITE_UI_REFERENCE_LIST_V2=true
VITE_UI_REFERENCE_DETAIL_V2=false
```

Observed automated contract:

- `reference-list` resolves to `v2` from the environment.
- `reference-detail` remains `legacy`.
- The resolver performs no storage write/removal/clear, fetch, history change,
  URL change, or business-data mutation.
- Production ignores query-string QA overrides.

The candidate would then be built and published through the existing PWA update
path. Its configuration remains `registerType: "prompt"`,
`clientsClaim: false`, and `skipWaiting: false`. A waiting update only announces
availability. Choosing **Later** keeps the active session unchanged; activation
occurs only after the user explicitly chooses **Update**.

No real release was made during this foundation simulation, because no
production screen is allowed to consume the registry yet.

## Rollback simulation

Trigger used for the tabletop drill: a preserved workflow or measured gate fails
after the reference-list candidate is published.

1. The Reference feature owner changes only
   `VITE_UI_REFERENCE_LIST_V2=false`.
2. The owner starts the rebuild and release within the five-minute operational
   budget.
3. `VITE_UI_REFERENCE_DETAIL_V2` and all other slice values remain unchanged.
4. The active PWA session is not reloaded automatically.
5. The user receives the existing explicit update prompt.
6. Choosing **Later** keeps the current active assets; choosing **Update**
   activates the rollback release.
7. After activation, `reference-list` resolves to `legacy`.

Rollback target is Legacy and data impact is `none`. The drill requires no route
edit, permission or authorization change, API change, persisted-data migration,
business-rule change, cache-clearing instruction, or Legacy deletion.

## Automated simulation evidence

Command:

```sh
npm run test.unit:run -- src/ui-flags/ui-flags.test.ts src/ui-flags/migrationReadiness.test.ts src/pwa/PWAUpdateProvider.test.tsx
```

Observed result:

```text
✓ src/ui-flags/migrationReadiness.test.ts (41 tests)
✓ src/ui-flags/ui-flags.test.ts (18 tests)
✓ src/pwa/PWAUpdateProvider.test.tsx (3 tests)
Test Files 3 passed (3)
Tests 62 passed (62)
exit code: 0
```

The test run verifies exact-key isolation, Legacy defaults, readiness and
rollback invariants, zero resolver mutation, waiting-update notification,
**Later**, and explicit **Update** activation.
