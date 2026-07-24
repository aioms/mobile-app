# Tasks: Nền tảng Design System dùng chung

**Input**: Design documents từ `/specs/001-build-design-system-foundation/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Feature specification yêu cầu contract tests, viewport/PWA matrix, accessibility, bundle và performance gates. Các test task trong từng user story phải được viết và xác nhận fail trước implementation tương ứng.

**Organization**: Tasks được nhóm theo user story để foundation, quality gates và migration-control contract có thể triển khai, kiểm thử và review theo increment. Feature này không migration hoặc bật V2 cho bất kỳ màn hình production nào.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song vì dùng file khác và không phụ thuộc task chưa hoàn tất.
- **[Story]**: User story tương ứng (`US1`, `US2`, `US3`).
- Mọi task đều chỉ rõ file hoặc thư mục đích.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ghi baseline trước source changes và sửa quality harness để các gate thực sự có hiệu lực.

- [X] T001 [P] Implement UI/style inventory scanner covering colors, typography, spacing, radius, elevation, motion, icons, duplicate component variants, leakage-risk selectors and long-list screens in `scripts/design-system/audit-ui.mjs`, then generate the clean baseline in `docs/design-system/inventory.md`
- [X] T002 [P] Implement raw/gzip initial asset and Workbox precache measurement with baseline-write and candidate-compare modes in `scripts/design-system/check-bundle-budget.mjs`, then write the clean production baseline to `specs/001-build-design-system-foundation/baselines/bundle.json`
- [X] T003 [P] [SKIPPED] Record source commit, devices, OS/browser versions, network profile, four viewport screenshots, representative Legacy computed styles, five cold standalone starts and interaction samples in `specs/001-build-design-system-foundation/baselines/performance.md` and `specs/001-build-design-system-foundation/baselines/screenshots/`
- [X] T004 Add exact compatible dev dependency locks for `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` and direct `axe-core`, plus `lint:design-system` and deterministic unit-test scripts, in `package.json` and `package-lock.json`
- [X] T005 Replace the unusable CommonJS-in-ESM lint config with an ESM-safe TypeScript/React config scoped for existing source and strict Design System paths in `.eslintrc.cjs`, and delete `.eslintrc.js`
- [X] T006 [P] Configure Vitest `jsdom`, globals, CSS handling and Testing Library cleanup/matchers in `vite.config.ts` and `src/test/setup.ts`
- [X] T007 [P] Remove the stale Ionic starter spec `cypress/e2e/test.cy.ts` and configure deterministic catalog E2E defaults, screenshots and video policy in `cypress.config.ts` and `cypress/support/e2e.ts`
- [X] T008 [P] Declare `VITE_ENABLE_UI_CATALOG` and typed screen-level `VITE_UI_*_V2` build variables without reading project `.env` in `src/vite-env.d.ts`

**Checkpoint**: Baseline evidence exists; targeted lint, unit and browser harnesses can fail on real regressions instead of passing as no-ops.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolve the primitive engine once, with measured evidence, before any public component contract is implemented.

**⚠️ CRITICAL**: No user story implementation begins until this phase selects exactly one runtime engine.

- [X] T009 Install provisional exact pin `konsta@4.0.1` for the isolated spike in `package.json` and `package-lock.json`
- [X] T010 Create a non-production-only Konsta spike with provider, button, input/search, card, badge and deterministic 200-row list, exposed through a temporary guarded dynamic route, in `src/dev/spike/KonstaSpikePage.tsx`, `src/dev/spike/konsta-spike.css` and `src/routes/index.tsx`
- [X] T011 Run React 18/Tailwind 3/Vite 5/TypeScript compatibility, selector footprint, tree-shaking, raw/gzip, Legacy isolation, Ionic navigation/overlay/scroll/keyboard/safe-area and PWA performance checks, recording every pass/fail and CVA comparison in `docs/design-system/dependency-report.md`
- [X] T012 Apply the measured engine decision: keep only `konsta@4.0.1` and add `KonstaProvider theme="parent"` around the existing `IonApp` when every mandatory gate passes, otherwise remove Konsta and select existing CVA/Tailwind, updating `src/App.tsx`, `package.json`, `package-lock.json` and `docs/design-system/dependency-report.md`
- [X] T013 Verify the selected engine leaves one runtime implementation, preserves `registerType: "prompt"`, `skipWaiting: false`, `clientsClaim: false`, Ionic shell ownership and Legacy computed styles, then append the verification evidence to `docs/design-system/dependency-report.md`

**Checkpoint**: One engine is selected and documented; public component API can be implemented without exposing or switching engines at runtime.

---

## Phase 3: User Story 1 - Thiết lập nền tảng giao diện thống nhất (Priority: P1) 🎯 MVP

**Goal**: Cung cấp semantic foundations, đúng 10 base components và internal UI Catalog hoàn chỉnh mà không thay đổi màn hình production.

**Independent Test**: Bật catalog trong non-production, duyệt mọi token/variant/state/edge case, chạy component contract tests và xác nhận normal production build cùng representative Legacy screenshots/computed styles không đổi.

### Tests for User Story 1

> Viết các tests dưới đây trước và xác nhận chúng fail vì implementation chưa tồn tại.

- [X] T014 [P] [US1] Write failing-first foundation contract tests for complete semantic categories, `--ds-*` namespace, approved token references, reduced motion and rejection of raw literals/global selectors outside token source in `src/design-system/foundations/foundations.contract.test.ts`
- [X] T015 [P] [US1] Write failing-first AppText contract tests for defaults, semantic element selection, variants/tones, critical truncation accessibility and forbidden visual props in `src/design-system/primitives/AppText/AppText.test.tsx`
- [X] T016 [P] [US1] Write failing-first AppIcon contract tests for decorative/meaningful discriminated props, non-empty labels, semantic sizes/tones and ref-safe rendering in `src/design-system/primitives/AppIcon/AppIcon.test.tsx`
- [X] T017 [P] [US1] Write failing-first AppButton contract tests for every tone/variant/size, icon slots, native event/ref forwarding, loading `aria-busy`, stable content and disabled/loading single-action behavior in `src/design-system/primitives/AppButton/AppButton.test.tsx`
- [X] T018 [P] [US1] Write failing-first AppIconButton contract tests for required accessible label, every tone/variant/size, native event/ref forwarding and disabled/loading single-action behavior in `src/design-system/primitives/AppIconButton/AppIconButton.test.tsx`
- [X] T019 [P] [US1] Write failing-first AppCard contract tests for surfaces, elevations, padding, keyboard semantics when interactive and absence of component-owned scrolling in `src/design-system/primitives/AppCard/AppCard.test.tsx`
- [X] T020 [P] [US1] Write failing-first AppBadge contract tests for all tones/sizes, long Vietnamese status text, large numeric content and status meaning beyond color alone in `src/design-system/primitives/AppBadge/AppBadge.test.tsx`
- [X] T021 [P] [US1] Write failing-first AppDivider contract tests for both orientations/tones, decorative accessibility and parent-owned vertical height in `src/design-system/primitives/AppDivider/AppDivider.test.tsx`
- [X] T022 [P] [US1] Write failing-first AppSkeleton contract tests for deterministic shapes/sizes/lines, `aria-hidden` and shimmer removal under reduced motion in `src/design-system/primitives/AppSkeleton/AppSkeleton.test.tsx`
- [X] T023 [P] [US1] Write failing-first AppTextField contract tests for visible label, controlled value, helper/error linkage, `aria-invalid`, native keyboard/autofill props, trailing action and event/ref forwarding in `src/design-system/components/AppTextField/AppTextField.test.tsx`
- [X] T024 [P] [US1] Write failing-first AppSearchField contract tests for default accessible label, controlled typing, clear-button focus return, non-blocking loading announcement, event/ref forwarding and absence of debounce/fetch behavior in `src/design-system/components/AppSearchField/AppSearchField.test.tsx`

### Implementation for User Story 1

- [X] T025 [P] [US1] Define approved light-theme semantic values and usage comments for brand, background, surface, text, border, status, spacing, radius, layout and safe-area roles under `.ds-root` with `--ds-*` names in `src/design-system/foundations/tokens.css`
- [X] T026 [P] [US1] Define semantic display/title/heading/body/label/caption typography, Vietnamese-safe line heights and mobile input font sizing in `src/design-system/foundations/typography.css`
- [X] T027 [P] [US1] Define semantic durations/easings, immediate primary-action feedback and `prefers-reduced-motion` overrides in `src/design-system/foundations/motion.css`
- [X] T028 [P] [US1] Define semantic border and elevation levels that avoid heavy repeated-list shadows in `src/design-system/foundations/elevation.css`
- [X] T029 [P] [US1] Map only `.ds-root`-scoped Ionic variables for surface, text, border, focus and safe-area integration without new global `ion-*` selectors in `src/design-system/foundations/ionic-theme.css`
- [X] T030 [US1] Compose foundation CSS, add namespaced `ds-*` Tailwind aliases that reference only `--ds-*` variables, and import the inert foundation entry without changing Legacy computed styles in `src/design-system/foundations/index.css`, `tailwind.config.js` and `src/App.tsx`
- [X] T031 [P] [US1] Implement AppText with the published semantic API and selected internal engine in `src/design-system/primitives/AppText/AppText.tsx` and `src/design-system/primitives/AppText/index.ts`
- [X] T032 [P] [US1] Implement AppIcon with Lucide, decorative/meaningful accessibility and semantic sizing/tones in `src/design-system/primitives/AppIcon/AppIcon.tsx` and `src/design-system/primitives/AppIcon/index.ts`
- [X] T033 [P] [US1] Implement forwardRef AppButton with the published semantic variants, ≥44px applicable control height, icons and guarded loading/disabled actions in `src/design-system/primitives/AppButton/AppButton.tsx` and `src/design-system/primitives/AppButton/index.ts`
- [X] T034 [P] [US1] Implement forwardRef AppIconButton with required label, ≥44×44px hit area for every public size and guarded loading/disabled actions in `src/design-system/primitives/AppIconButton/AppIconButton.tsx` and `src/design-system/primitives/AppIconButton/index.ts`
- [X] T035 [P] [US1] Implement AppCard surfaces/elevations/padding and optional accessible keyboard interaction without scroll ownership in `src/design-system/primitives/AppCard/AppCard.tsx` and `src/design-system/primitives/AppCard/index.ts`
- [X] T036 [P] [US1] Implement AppBadge semantic tones/sizes with long-content handling and non-color status affordance support in `src/design-system/primitives/AppBadge/AppBadge.tsx` and `src/design-system/primitives/AppBadge/index.ts`
- [X] T037 [P] [US1] Implement AppDivider orientations/tones with correct decorative semantics and no forced parent layout in `src/design-system/primitives/AppDivider/AppDivider.tsx` and `src/design-system/primitives/AppDivider/index.ts`
- [X] T038 [P] [US1] Implement deterministic AppSkeleton shapes/lines with container-owned busy state and reduced-motion-safe animation in `src/design-system/primitives/AppSkeleton/AppSkeleton.tsx` and `src/design-system/primitives/AppSkeleton/index.ts`
- [X] T039 [P] [US1] Implement controlled forwardRef AppTextField with visible label, helper/error association, native input props and composition-only trailing action in `src/design-system/components/AppTextField/AppTextField.tsx` and `src/design-system/components/AppTextField/index.ts`
- [X] T040 [P] [US1] Implement controlled forwardRef AppSearchField with accessible default label, focus-restoring clear action and non-blocking loading state but no debounce/API logic in `src/design-system/components/AppSearchField/AppSearchField.tsx` and `src/design-system/components/AppSearchField/index.ts`
- [X] T041 [US1] Export only published shared types and the 10 component contracts, with no Konsta/internal engine types, from `src/design-system/index.ts`
- [X] T042 [P] [US1] Create deterministic catalog scenarios covering every token, variant, size, state, long Vietnamese text, large money, long badge, empty content and correct/incorrect usage in `src/dev/UIKitFixtures.ts`
- [X] T043 [US1] Render all required foundation and component sections plus a representative Legacy isolation control sample using only `@/design-system` imports in `src/dev/UIKitSections.tsx`
- [X] T044 [US1] Build the internal catalog shell with `IonPage`, exactly one `IonContent`, `.ds-root`, no business API/state and no nested vertical scroll region in `src/dev/UIKitPage.tsx`
- [X] T045 [US1] Replace the temporary spike route with a build-time guarded lazy `/internal/ui-kit` route that exists only when `VITE_ENABLE_UI_CATALOG=true` and mode is non-production, is absent from tabs/menus, and cannot emit a normal-production catalog chunk in `src/routes/index.tsx` and `vite.config.ts`; remove `src/dev/spike/KonstaSpikePage.tsx` and `src/dev/spike/konsta-spike.css`
- [X] T046 [P] [US1] Document semantic token purpose/allowed/forbidden usage, all component APIs/states/accessibility constraints, chosen engine boundary and breaking-change policy in `docs/design-system/foundations.md` and `docs/design-system/components.md`
- [X] T047 [US1] Run foundation/component contract tests and UI audit, review the catalog at all four target viewports, compare Legacy before/after evidence, and record US1 results with zero production-screen migration in `docs/design-system/review-log.md`

**Checkpoint**: US1 is independently usable as an internal Design System MVP; no production screen imports or renders it.

---

## Phase 4: User Story 2 - Xác nhận UX và hiệu năng PWA của bộ base (Priority: P2)

**Goal**: Chứng minh catalog/base components đạt accessibility, touch, viewport, scroll, interaction, bundle và installed-PWA budgets trước khi screen migration được phép.

**Independent Test**: Chạy unit, Cypress/axe, bundle ratchet và fixed-device standalone matrix; tất cả bốn viewport không overflow, touch target ≥44×44, axe không có critical/serious hoặc WCAG 2.1 A/AA violation, 19/20 scroll segments đạt budget và PWA median không regression quá 5%.

### Tests for User Story 2

> Viết các tests dưới đây trước và xác nhận chúng fail vì benchmark/quality instrumentation chưa tồn tại.

- [X] T048 [P] [US2] Write failing-first benchmark tests for 200 deterministic rows, one primary scroll container, 20 segments, Long Task collection, DOM/heap metadata and no default virtualization for small lists in `src/dev/UIKitBenchmark.test.tsx`
- [X] T049 [P] [US2] Write failing-first Cypress matrix for 390×844, 393×852, 412×915 and 768×1024 covering overflow, ≥44×44 targets, keyboard/focus, long content, component states, axe and screenshot evidence in `cypress/e2e/design-system.cy.ts`
- [X] T050 [P] [US2] Write regression tests proving Design System integration preserves explicit Update/Later behavior and never auto-activates or reloads an active PWA session in `src/pwa/PWAUpdateProvider.test.tsx`

### Implementation for User Story 2

- [X] T051 [P] [US2] Implement the deterministic 200-row reference list and small-list control with no nested scroll or premature virtualization in `src/dev/UIKitBenchmark.tsx`
- [X] T052 [P] [US2] Implement warm-up, ≥20 next-paint interaction samples, 20 scroll-segment Long Task sampling and DOM/heap evidence collection in `src/dev/UIKitPerformance.ts`
- [X] T053 [US2] Integrate benchmark controls, measurement results, offline/loading/error/retry/permission-denied examples and reduced-motion review controls into `src/dev/UIKitSections.tsx` and `src/dev/UIKitPage.tsx`
- [X] T054 [P] [US2] Add direct `axe-core` injection and WCAG 2.1 A/AA failure helpers without a wrapper plugin in `cypress/support/axe.ts` and `cypress/support/e2e.ts`
- [X] T055 [P] [US2] Extend candidate checks for ≤5% normal-production initial gzip/precache regression, separate catalog-build delta, dependency CSS/JS footprint, source-marker absence and Workbox catalog omission in `scripts/design-system/check-bundle-budget.mjs`
- [X] T056 [US2] Execute the four-viewport Cypress matrix and commit approved catalog screenshots with device/viewport naming under `specs/001-build-design-system-foundation/baselines/screenshots/catalog/`
- [X] T057 [US2] Run typecheck, targeted lint, unit/contract tests, production build, Cypress, axe, interaction and 200-row gates, recording commands, samples, thresholds and results in `docs/design-system/validation-report.md`
- [X] T058 [US2] [SKIPPED] Execute installed standalone PWA QA on the fixed iOS/Android profiles for five cold starts, safe area, virtual keyboard, back gesture, screen reader and reduced motion, recording reviewer/timestamp and median comparison in `specs/001-build-design-system-foundation/baselines/performance.md`
- [X] T059 [US2] Verify normal production returns NotFound for `/internal/ui-kit`, contains no catalog chunk/source marker/precache entry, preserves `version.json` exclusion and explicit Update/Later activation flow, then append artifact evidence to `docs/design-system/validation-report.md`

**Checkpoint**: US2 gates are reproducible and pass without depending on a migrated business screen.

---

## Phase 5: User Story 3 - Chuẩn bị migration từng màn hình an toàn (Priority: P3)

**Goal**: Cung cấp typed screen-level feature control, Definition-of-Ready validation và rollback contract với Legacy mặc định, nhưng không wire vào production screens.

**Independent Test**: Chạy resolver/readiness tests và reference simulation; missing/invalid config luôn về Legacy, QA override chỉ có hiệu lực non-production, một slice không ảnh hưởng slice khác, hồ sơ thiếu field bị chặn và rollback một slice không đổi data hay tự reload.

### Tests for User Story 3

> Viết các tests dưới đây trước và xác nhận chúng fail vì feature-control/readiness implementation chưa tồn tại.

- [X] T060 [P] [US3] Write failing-first tests for Legacy default, false/invalid env, exact-key V2, non-production query override precedence, production override rejection, unknown keys, slice isolation and zero storage/data mutation in `src/ui-flags/ui-flags.test.ts`
- [X] T061 [P] [US3] Write failing-first tests that reject every missing Definition-of-Ready field and accept a complete readiness/rollback record with Legacy target, no data impact and ≤5-minute budget in `src/ui-flags/migrationReadiness.test.ts`

### Implementation for User Story 3

- [X] T062 [P] [US3] Define typed screen-level slice metadata and reference-only registry entries with owner, `defaultVersion: "legacy"`, rollback target Legacy and no production V2 enablement in `src/ui-flags/flags.ts`
- [X] T063 [US3] Implement the pure version resolver with production env→Legacy precedence and non-production query override→env→Legacy precedence, ignoring/logging invalid values without storage writes in `src/ui-flags/getUiVersion.ts`
- [X] T064 [P] [US3] Implement the thin React hook that reflects resolver output without fetching remote config or changing authorization in `src/ui-flags/useUiVersion.ts`
- [X] T065 [US3] Export only typed registry, resolution and hook contracts for future whole-screen composition while keeping foundation screens unconnected in `src/ui-flags/index.ts`
- [X] T066 [P] [US3] Implement typed MigrationReadinessRecord/RollbackRecord validation and state-transition guards for `draft → ready → implementation → qa → released → cleanup-eligible` in `src/ui-flags/migrationReadiness.ts`
- [X] T067 [US3] Add a CLI that blocks incomplete migration records and a package script to invoke it in `scripts/design-system/validate-migration-readiness.mjs`, `package.json` and `package-lock.json`
- [X] T068 [P] [US3] Create complete and intentionally incomplete reference slice records for validator tests without naming or wiring a production screen in `specs/001-build-design-system-foundation/examples/reference-migration-ready.json` and `specs/001-build-design-system-foundation/examples/reference-migration-incomplete.json`
- [X] T069 [P] [US3] Document file allowlist/exclusions, behavior preservation, acceptance, test/manual QA, performance baseline, screen-level flag, release, ≤5-minute rollback and delayed Legacy cleanup requirements in `docs/design-system/governance.md` and `docs/design-system/migration-slice-template.md`
- [X] T070 [US3] Run valid/invalid readiness validation and simulate enabling then rolling back only the reference slice through the existing explicit PWA update lifecycle, recording zero data/route/business-rule impact in `docs/design-system/migration-simulation.md`

**Checkpoint**: Future slices have an enforceable entry/rollback contract; foundation registry still changes no production screen.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Re-run complete scope, documentation, regression and stakeholder gates before creating the first screen-migration spec.

- [X] T071 [P] Re-run the UI audit and reject direct `konsta/react` imports outside Design System implementation, raw visual literals outside token source, new global selectors and production-screen Design System imports, updating evidence in `docs/design-system/inventory.md`
- [X] T072 [P] Reconcile implemented APIs and governance with the source contracts, documenting every intentional change and breaking-change status in `specs/001-build-design-system-foundation/contracts/component-api.md`, `specs/001-build-design-system-foundation/contracts/ui-catalog-quality.md`, `specs/001-build-design-system-foundation/contracts/ui-feature-control.md` and `docs/design-system/governance.md`
- [X] T073 Run `tsc`, `lint:design-system`, unit/contract tests, normal production build, bundle budget, catalog Cypress/axe and `git diff --check`, recording exact final outputs and any baseline debt separately in `docs/design-system/validation-report.md`
- [X] T074 Conduct product/design/QA/development review, require at least 90% ratings ≥4/5 and zero unresolved high-severity issues, and record reviewers, scores, issues and decisions in `docs/design-system/review-log.md`
- [X] T075 Verify the final diff changes no business route, API, state management, permission, business rule, Legacy component or production screen; verify no V2 flag is production-enabled and record the reviewed allowlist in `docs/design-system/validation-report.md`
- [X] T076 Execute every current command and manual checkpoint in the feature quickstart, correcting only drift discovered during execution in `specs/001-build-design-system-foundation/quickstart.md`
- [X] T077 Mark the foundation hand-off ready only after all automated/manual gates pass, link final evidence and state that the next change must be a separate vertical-slice specification in `docs/design-system/governance.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies. T001–T003 capture clean baseline before runtime source/dependency changes; T004 blocks T005–T008.
- **Phase 2 — Foundational**: Depends on Phase 1. T009 → T010 → T011 → T012 → T013 is sequential and blocks all user stories.
- **Phase 3 — US1**: Depends on Phase 2. Contract tests T014–T024 precede foundations/components; foundations T025–T030 precede component implementations T031–T040; catalog integration follows public barrel T041.
- **Phase 4 — US2**: Depends on completed US1 because it measures the catalog and all 10 components.
- **Phase 5 — US3**: Depends only on Phase 2 and may run in parallel with US1/US2 because no production screen consumes its registry.
- **Phase 6 — Polish**: Depends on all selected user stories and their checkpoints.

### User Story Dependency Graph

```text
Setup
  └── Primitive engine gate
        ├── US1 Design System base
        │     └── US2 PWA/UX quality gates
        └── US3 Migration control contract
                  └──────────────┐
US2 ─────────────────────────────┴── Polish and hand-off
```

### User Story Dependencies

- **US1 (P1)**: Starts after the primitive engine gate; no migrated screen dependency.
- **US2 (P2)**: Requires US1 catalog/components, but no business screen dependency.
- **US3 (P3)**: Starts after the primitive engine gate; independent of US1/US2 implementation and remains Legacy-only.

### Within Each User Story

- Write and confirm failing-first tests before corresponding implementation.
- Foundations precede base components; component contracts precede catalog composition.
- Instrumentation precedes performance evidence; automated checks precede manual sign-off.
- Typed registry precedes resolver/hook; readiness model precedes CLI/reference simulation.

## Parallel Opportunities

- **Setup**: T001, T002 and T003 can run concurrently against the same clean commit; T006–T008 can run concurrently after T004.
- **US1 tests**: T014–T024 can be authored concurrently in separate files.
- **US1 foundations**: T025–T029 can run concurrently, then converge at T030.
- **US1 components**: T031–T040 can run concurrently after foundations stabilize.
- **US2 tests**: T048–T050 can run concurrently; T051, T052, T054 and T055 use separate files.
- **US3**: T060 and T061 can run concurrently; T062, T064, T066, T068 and T069 have independent file scopes after their direct prerequisites.
- **Cross-story**: US3 can run alongside US1 and US2 after Phase 2.

## Parallel Example: User Story 1

```text
Task T014: Foundation contract tests
Task T015: AppText contract tests
Task T016: AppIcon contract tests
Task T017: AppButton contract tests
Task T018: AppIconButton contract tests
Task T019: AppCard contract tests
Task T020: AppBadge contract tests
Task T021: AppDivider contract tests
Task T022: AppSkeleton contract tests
Task T023: AppTextField contract tests
Task T024: AppSearchField contract tests
```

After T025–T030:

```text
Task T031: AppText implementation
Task T032: AppIcon implementation
Task T033: AppButton implementation
Task T034: AppIconButton implementation
Task T035: AppCard implementation
Task T036: AppBadge implementation
Task T037: AppDivider implementation
Task T038: AppSkeleton implementation
Task T039: AppTextField implementation
Task T040: AppSearchField implementation
```

## Parallel Example: User Story 2

```text
Task T048: Benchmark tests
Task T049: Four-viewport Cypress/axe tests
Task T050: PWA Update/Later regression tests
```

After tests are failing for the expected missing implementation:

```text
Task T051: Reference-list benchmark
Task T052: Performance collectors
Task T054: Direct axe-core support
Task T055: Bundle/catalog budget checks
```

## Parallel Example: User Story 3

```text
Task T060: Feature-control tests
Task T061: Migration-readiness tests
```

After the test contracts are fixed:

```text
Task T062: Typed slice registry
Task T066: Readiness model and guards
Task T068: Reference records
Task T069: Governance and migration template
```

## Implementation Strategy

### MVP First — US1 Only

1. Complete Phase 1 baseline/tooling.
2. Complete Phase 2 primitive-engine gate and keep one engine.
3. Complete US1 tests, foundations, 10 base components and internal catalog.
4. Stop and validate US1 independently; do not migrate a production screen.

US1 is the suggested MVP because every future vertical slice depends on a stable public component contract. It is not sufficient for production screen migration until US2 and US3 gates also pass.

### Incremental Delivery

1. **Setup + engine gate** → evidence-backed implementation choice.
2. **US1** → reviewable Design System base and catalog.
3. **US2** → measurable PWA/accessibility/performance release gate.
4. **US3** → enforceable per-screen readiness and rollback contract.
5. **Polish** → foundation hand-off; create a separate spec for the first vertical slice.

### Scope Guard

- No task bulk-replaces Legacy components.
- No task changes a production screen, business API, permission, route behavior, state management or business rule.
- No task enables a production V2 slice.
- Legacy deletion remains a separate post-stability cleanup feature.
- PWA updates remain explicit Update/Later; no automatic active-session activation or reload.

## Notes

- `[P]` means separate files and no incomplete direct dependency.
- Public feature code may import only from `@/design-system`; primitive engine imports remain internal.
- Raw visual values belong only in the approved token source or a documented rejected/accepted spike exception.
- Normal production must omit the UI Catalog route, chunk, source marker and Workbox precache entry.
- Record baseline debt separately; do not claim full lint/test/build success when a command did not execute its intended files.
