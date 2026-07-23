# Implementation Plan: Nền tảng Design System dùng chung

**Branch**: `001-build-design-system-foundation` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-build-design-system-foundation/spec.md`

## Summary

Xây dựng Internal Design System tách biệt Legacy gồm semantic foundations, 10 base components, UI Catalog nội bộ, screen-level feature-control contract và quality gates cho PWA. Ionic tiếp tục sở hữu shell, router, page lifecycle, scroll, overlay, safe area, keyboard và Capacitor.

Konsta giữ vai trò primitive engine ưu tiên theo tài liệu requirement chính, nhưng chỉ được chấp nhận qua spike với exact pin `konsta@4.0.1`. Konsta v5 yêu cầu Tailwind 4 và React 19 nên bị loại khỏi feature này. Nếu spike v4 không vượt qua compatibility, CSS-isolation, bundle và performance gates, base components dùng CVA + Tailwind hiện có; public component contract không thay đổi. Không migration hoặc bật V2 cho màn hình production trong feature này.

## Technical Context

**Language/Version**: TypeScript 5.1.6 strict, React 18.2.0  
**Primary Dependencies**: Ionic React/Core 8.6.x cho application shell; Tailwind CSS 3.4.17; class-variance-authority 0.7.1; clsx 2.1.1; tailwind-merge 2.6.0; Lucide React 0.469.0; provisional exact pin `konsta@4.0.1` sau dependency gate  
**Storage**: N/A  
**Testing**: TypeScript compiler; ESLint 8 sau khi sửa ESM/TypeScript config; Vitest 0.34 + jsdom + React Testing Library; Cypress 13; dev-only axe-core; Vite production build; manual PWA/device matrix  
**Target Platform**: PWA standalone và browser hiện đại; iOS 13+; Android 8+ qua Capacitor 7  
**Project Type**: Một React/Vite/Capacitor application với web bundle và native shells  
**Performance Goals**: 95% interaction feedback ≤100 ms; 200-row reference list có ít nhất 19/20 scroll segments không xuất hiện Long Task >100 ms; PWA time-to-usable không regression quá 5%; normal production initial gzip và precache total không regression quá 5%  
**Constraints**: Giữ nguyên Ionic shell và PWA prompt-update behavior; light theme only; một primary scroll container/page; touch target ≥44×44 CSS px; WCAG 2.1 AA; không global selector mới; không direct visual literal ngoài token source; normal production build không chứa UI Catalog route/chunk; không đổi route nghiệp vụ, API, state management hoặc business logic  
**Scale/Scope**: 10 base components, 4 viewport baselines, 200-item benchmark; inventory bao phủ 123 page TSX và 30 shared component TSX hiện tại; 0 production screen migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` hiện là template chưa ratify, không có nguyên tắc dự án có thể thi hành. Các gate dưới đây được lấy từ feature spec, AGENTS.md và hai tài liệu migration.

| Gate | Pre-research | Post-design | Evidence |
|---|---|---|---|
| Không migration production screen trong foundation feature | Pass | Pass | Source tree chỉ thêm Design System, internal catalog, flags infrastructure và test tooling |
| Ionic giữ application shell/platform behavior | Pass | Pass | Không thay `IonApp`, router, tabs, page/content, overlay hoặc Capacitor ownership |
| Không đổi API, state management, permission hoặc business logic | Pass | Pass | Không có backend/data-service contract mới |
| Design System cô lập khỏi Legacy | Pass | Pass | `--ds-*`, `ds-*`, `.ds-root`; no global selector; barrel-only public imports |
| External UI dependency phải có gate | Pass | Pass | `konsta@4.0.1` chỉ provisional; CVA fallback được quyết định trước; v5 bị loại |
| Performance/accessibility có baseline và measurable gates | Pass | Pass | Bundle ratchet, interaction/list benchmark, axe, viewport và device matrix |
| Migration tương lai có Legacy default và independent rollback | Pass | Pass | Screen-level feature-control contract; registry ban đầu không bật V2 |
| Existing worktree và unrelated Legacy code được giữ nguyên | Pass | Pass | Inventory ghi debt; không cleanup/format/move diện rộng |

Không có gate violation cần Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-build-design-system-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── baselines/
│   ├── bundle.json
│   ├── performance.md
│   └── screenshots/
├── contracts/
│   ├── component-api.md
│   ├── ui-catalog-quality.md
│   └── ui-feature-control.md
└── tasks.md                    # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                    # Add accepted provider only after spike passes
├── routes/
│   └── index.tsx              # Opt-in internal catalog route; no tab
├── design-system/
│   ├── foundations/
│   │   ├── index.css
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   ├── motion.css
│   │   ├── elevation.css
│   │   └── ionic-theme.css
│   ├── primitives/
│   │   ├── AppText/
│   │   ├── AppIcon/
│   │   ├── AppButton/
│   │   ├── AppIconButton/
│   │   ├── AppCard/
│   │   ├── AppBadge/
│   │   ├── AppDivider/
│   │   └── AppSkeleton/
│   ├── components/
│   │   ├── AppTextField/
│   │   └── AppSearchField/
│   └── index.ts
├── dev/
│   ├── UIKitPage.tsx
│   ├── UIKitSections.tsx
│   └── UIKitBenchmark.tsx
├── ui-flags/
│   ├── flags.ts
│   ├── getUiVersion.ts
│   ├── useUiVersion.ts
│   └── ui-flags.test.ts
├── test/
│   └── setup.ts
└── lib/
    └── utils.ts                # Reuse existing cn(); no duplicate helper

scripts/
└── design-system/
    ├── audit-ui.mjs
    └── check-bundle-budget.mjs

cypress/
└── e2e/
    └── design-system.cy.ts

docs/
└── design-system/
    ├── inventory.md
    ├── dependency-report.md
    └── governance.md

tailwind.config.js              # Add namespaced semantic aliases only
vite.config.ts                  # Vitest/jsdom setup and catalog build guard
.eslintrc.cjs                   # ESM-safe scoped lint configuration
package.json
package-lock.json
```

**Structure Decision**: Design System nằm trong `src/design-system/`, tách khỏi `src/components/` Legacy. Mỗi public component có folder, implementation, contract test và barrel export. Existing `src/lib/utils.ts` tiếp tục cung cấp `cn`. UI Catalog nằm dưới `src/dev/`, được lazy-load và hard-disabled trong production. `src/ui-flags/` chỉ cung cấp screen-level infrastructure; registry ban đầu không bật V2.

## Implementation Strategy

### Stage 0 - Audit, baseline và tooling gate

1. Chụp UI/style/performance/bundle baseline trước thay đổi.
2. Sửa lint runner để thực sự parse TypeScript; thay starter Cypress test.
3. Cấu hình Vitest jsdom và test setup.
4. Chạy Konsta v4 dependency spike trong UI Catalog-only scope; ghi dependency report.
5. Chọn Konsta adapter hoặc CVA fallback theo pass/fail gate, không duy trì hai runtime engines.

### Stage 1 - Foundations

1. Thêm namespaced semantic tokens và Tailwind aliases.
2. Thêm typography, motion, elevation, safe-area helpers và scoped Ionic mapping dưới `.ds-root`.
3. Thêm visual-literal/global-selector audit chỉ áp dụng cho Design System/V2 paths.
4. Import foundation entry mà không thay computed style của Legacy.

### Stage 2 - Base components

1. Primitives: AppText, AppIcon, AppButton, AppIconButton, AppCard, AppBadge, AppDivider, AppSkeleton.
2. Components: AppTextField, AppSearchField.
3. Public props chỉ expose semantic variants; direct Konsta/CVA implementation detail không lọt ra barrel.
4. Unit/contract tests cho state, keyboard, refs, events, reduced motion và prop restrictions.

### Stage 3 - Internal catalog và migration control

1. UI Catalog hiển thị toàn bộ token/component/state/edge-content matrix.
2. Catalog route chỉ tồn tại khi explicit non-production build flag bật; normal production build phải không emit/precache catalog chunk.
3. Thêm 200-row benchmark và four-viewport Cypress matrix.
4. Thêm screen-level feature-control resolver với Legacy default; không wire vào production screen.

### Stage 4 - Quality gate và hand-off

1. Typecheck, targeted lint, unit, browser, axe, bundle, performance và manual device matrix.
2. So sánh Legacy screenshots/computed styles trước/sau.
3. Cập nhật UI inventory, component docs, dependency decision và governance.
4. Chỉ sau khi mọi gate pass mới tạo spec riêng cho vertical slice đầu tiên.
