# Quickstart: Triển khai và xác minh Design System foundation

Quickstart dùng sau `/speckit.tasks`. Không chạy screen migration trong feature này.

## 1. Xác nhận feature context

```bash
git branch --show-current
```

Expected:

```text
001-build-design-system-foundation
```

Đọc theo thứ tự:

1. `specs/001-build-design-system-foundation/spec.md`
2. `specs/001-build-design-system-foundation/plan.md`
3. `specs/001-build-design-system-foundation/research.md`
4. `specs/001-build-design-system-foundation/contracts/`

## 2. Ghi clean baseline trước source changes

Current diagnostics:

- `npx tsc --noEmit --pretty false`: pass ngày 2026-07-23.
- `npm run lint`: exit 0 nhưng không lint file.
- `npx eslint src/lib/utils.ts`: fail vì `.eslintrc.js` dùng CommonJS trong ESM package.
- Vitest chưa có test files/setup.
- Cypress spec hiện là Ionic starter và lỗi thời.

Implementation phải sửa test/lint harness trước khi coi các command là quality gate.

Sau khi baseline scripts được tạo:

```bash
npm run vite:build
node scripts/design-system/check-bundle-budget.mjs --write-baseline specs/001-build-design-system-foundation/baselines/bundle.json
node scripts/design-system/audit-ui.mjs --write docs/design-system/inventory.md
```

Không đọc hoặc export project `.env`. Dùng existing local environment setup và safe inline flags.

## 3. Chạy Konsta dependency spike

Exact provisional install:

```bash
npm install --save-exact konsta@4.0.1
```

Không chạy `npm install konsta` không version; lệnh đó lấy v5 và kéo assumption Tailwind 4/React 19.

Spike chỉ gồm provider và representative UI Catalog examples. Ghi:

- React/Tailwind/Vite/TypeScript compatibility.
- Raw/gzip JS/CSS delta.
- Tree-shaking.
- Selector footprint.
- Legacy screenshot/computed-style delta.
- Ionic navigation/overlay/scroll/keyboard/safe-area results.
- 200-row list result.

Nếu bất kỳ mandatory gate fail:

1. Remove Konsta dependency changes khỏi candidate implementation.
2. Ghi rejection trong `docs/design-system/dependency-report.md`.
3. Implement cùng public contracts bằng existing CVA/Tailwind stack.
4. Không thay component API hoặc screen scope.

## 4. Development UI Catalog

Sau khi route guard được implement:

```bash
VITE_ENV=development VITE_ENABLE_UI_CATALOG=true npm run vite:build -- --mode development
npm run preview -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173/internal/ui-kit
```

Normal production verification:

```bash
npm run vite:build
```

Expected:

- `/internal/ui-kit` resolves NotFound.
- No UI Catalog chunk/source marker in `dist`.
- No UI Catalog asset in Workbox precache.
- Existing `version.json`, service worker và prompt update flow giữ nguyên.

## 5. Automated validation

```bash
npx tsc --noEmit --pretty false
npm run lint:design-system
npm run test.unit -- --run
npm run vite:build
node scripts/design-system/check-bundle-budget.mjs
git diff --check
```

Browser QA:

Terminal 1:

```bash
VITE_ENV=development VITE_ENABLE_UI_CATALOG=true npm run vite:build -- --mode development
npm run preview -- --host 127.0.0.1 --port 5173
```

Terminal 2:

```bash
npm run test.e2e -- --browser chrome --spec cypress/e2e/design-system.cy.ts
```

Expected:

- Four viewport matrix pass.
- No horizontal overflow.
- Touch targets ≥44×44.
- axe critical/serious and WCAG 2.1 A/AA violations = 0.
- 200-row benchmark meets 19/20 no-Long-Task threshold.
- One primary scroll container.

## 6. Manual PWA/device QA

Record reviewer, device, OS, browser/app version, commit and timestamp.

1. Install PWA and launch standalone.
2. Run five cold starts with fixed network profile.
3. Verify median time-to-usable ≤ baseline +5%.
4. Verify safe area on iPhone and Android target viewports.
5. Open virtual keyboard on text/search fields; input and primary action remain visible.
6. Verify back gesture/navigation lifecycle.
7. Enable reduced motion; nonessential shimmer/transition stops.
8. Run screen reader over button, icon button, input, search, badge and loading examples.
9. Trigger an app update; explicit Update/Later flow remains, no automatic active-session reload.

## 7. Scope guard before completion

Reject diff nếu có:

- Production screen V2 or visual migration.
- Direct `konsta/react` import outside Design System implementation.
- New Framework7/router/app shell.
- Global CSS selector.
- Raw visual literal outside token source.
- API/state/business-logic change.
- Legacy delete/rename.
- Route lazy-loading refactor for production screens.
- Dark mode or complex animation.

## 8. Ready for first screen specification

Foundation phase hoàn tất khi:

- 10 component contracts stable.
- UI Catalog matrix complete.
- Konsta accepted with evidence or rejected with CVA fallback documented.
- All automated and manual gates pass.
- Normal production bundle omits catalog.
- Zero Legacy regression.
- Screen-level flag infrastructure defaults to Legacy.

Sau đó tạo feature/spec riêng cho first vertical slice; không thêm screen migration vào branch foundation.
