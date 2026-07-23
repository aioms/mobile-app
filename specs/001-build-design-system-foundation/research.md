# Research: Nền tảng Design System dùng chung

**Feature**: `001-build-design-system-foundation`  
**Date**: 2026-07-23  
**Status**: Complete — mọi technical unknown đã được giải quyết

## Decision 1 - Giữ Ionic làm application shell

**Decision**: Giữ `IonApp`, `IonReactRouter`, `IonRouterOutlet`, `IonTabs`, `IonPage`, `IonContent`, Ionic overlays, navigation lifecycle, scroll ownership, safe area, keyboard behavior và Capacitor. Design System mới chỉ sở hữu visual foundations và leaf components.

**Rationale**:

- Shell hiện tại nằm tại `src/App.tsx`, `src/routes/index.tsx` và `src/components/TabBar/TabBar.tsx`.
- Ionic router outlet giữ page state/transition; routed views cần `IonPage` để layout và lifecycle đúng.
- Thay shell tạo rủi ro route, back stack, modal, keyboard và native plugin ngoài mục tiêu feature.
- Official reference: [Ionic React Navigation](https://ionicframework.com/docs/react/navigation).

**Alternatives considered**:

- Thay Ionic bằng Framework7: loại vì tạo router/lifecycle thứ hai.
- Dùng Konsta Page/Router/Tabbar/overlays: loại; chỉ leaf primitives được phép.

## Decision 2 - Konsta là provisional default, không phải dependency mặc định chưa kiểm chứng

**Decision**: Spike exact pin `konsta@4.0.1`. Chỉ merge dependency khi vượt qua compatibility, CSS-isolation, bundle, lifecycle, overlay, scroll và PWA performance gates. Nếu fail, dùng CVA + Tailwind hiện có. Public Design System contract không đổi.

**Rationale**:

- Tài liệu requirement chính chọn Konsta làm primitive engine; giữ lựa chọn này làm ưu tiên.
- Current latest Konsta v5 chuyển sang Tailwind 4 và React 19 APIs, trong khi repo dùng Tailwind 3.4.17 và React 18.2.0. Upgrade major framework nằm ngoài scope.
- Konsta v4 là pre-v5 line cuối, nhưng compatibility với Vite 5/TypeScript 5.1 và footprint trong Ionic app vẫn là hypothesis phải đo.
- Official references: [Konsta release notes](https://konstaui.com/release-notes), [Konsta with Ionic](https://konstaui.com/react/ionic), [KonstaProvider](https://konstaui.com/react/konsta-provider).

**Acceptance gate**:

1. Minimal provider + button + input/search + card + badge + 200-row list build thành công.
2. React 18, Tailwind 3.4, Vite 5 và TypeScript strict không có peer/type conflict.
3. No Legacy computed-style/screenshot change.
4. No navigation, transition, modal, scroll, keyboard hoặc safe-area regression.
5. Normal production ready-to-interact, initial gzip và precache total không tăng quá 5%.
6. Dependency report ghi raw/gzip CSS/JS, tree-shaking, selector footprint và comparison với CVA.

**Alternatives considered**:

- Latest Konsta v5: loại vì kéo Tailwind 4/React 19 migration.
- Pin Konsta v4 không gate: loại vì version cũ và chưa có footprint evidence.
- CVA + Tailwind: approved fallback; ít dependency risk hơn nhưng tăng chi phí tự xây component/accessibility.
- Dùng toàn bộ Ionic visual components: loại làm target mặc định; Ionic vẫn giữ shell/overlay.

## Decision 3 - Dùng KonstaProvider, không dùng Konsta App

**Decision**: Nếu spike pass, đặt một `KonstaProvider theme="parent"` quanh existing `IonApp`. Không dùng Konsta `App`, safe-area layer, page, router hoặc overlay.

**Rationale**:

- Official Konsta App docs yêu cầu dùng `KonstaProvider` khi tích hợp với Ionic.
- `theme="parent"` đọc platform class `ios`/`md` từ Ionic; tránh theme detector thứ hai.
- Provider chỉ được thêm sau khi Legacy isolation test pass.
- Official reference: [Konsta App](https://konstaui.com/react/app).

**Alternatives considered**:

- Konsta App ở root: loại vì duplicate application wrapper/safe-area ownership.
- Provider riêng từng component: loại vì context duplication và contract không ổn định.

## Decision 4 - Semantic token architecture có namespace

**Decision**: Runtime values định nghĩa một lần bằng `--ds-*` trong `tokens.css`; `tailwind.config.js` là registry cho named `ds-*` utilities tham chiếu các variables này. Component CSS dùng `.ds-*`; Ionic mappings chỉ có hiệu lực dưới `.ds-root`.

**Rationale**:

- CSS variables cần cho runtime bridge giữa internal components, Ionic scoped mappings và Konsta adapter.
- Namespace tránh ghi đè các legacy keys `primary`, `background`, `card`, `radius`.
- Raw values chỉ xuất hiện trong token source; feature/component code chỉ dùng semantic aliases.
- Global CSS hiện có nhiều selector rộng; new Design System không được mở rộng vùng ảnh hưởng.

**Alternatives considered**:

- Raw values lặp ở Tailwind config và CSS: loại vì drift.
- Ghi đè legacy token names: loại vì vi phạm no-production-change.
- Global `button`, `input`, `ion-*`, `*` selectors: loại vì leakage.

## Decision 5 - Public component contract không lộ primitive engine

**Decision**: Feature code chỉ import từ `@/design-system`. Direct `konsta/react` import, nếu được chấp nhận, chỉ xuất hiện trong implementation files của 10 base components. CVA fallback dùng cùng public props.

**Rationale**:

- Wrapper cho phép thay primitive engine không rewrite screens.
- Semantic variants chặn raw color/background/radius/shadow props.
- Existing `src/lib/utils.ts` cung cấp `cn`; không tạo duplicate.
- `class-variance-authority`, `clsx`, `tailwind-merge` đã có sẵn.

**Alternatives considered**:

- Export Konsta components/types trực tiếp: loại vì lock-in.
- Xây runtime adapter switch giữa Konsta/CVA: loại vì ship hai engines và tăng complexity.

## Decision 6 - Core component scope

**Decision**: Foundation feature tạo đúng 10 base components:

1. AppText
2. AppIcon
3. AppButton
4. AppIconButton
5. AppCard
6. AppBadge
7. AppDivider
8. AppSkeleton
9. AppTextField
10. AppSearchField

**Rationale**:

- Bao phủ primitive set từ tài liệu chính và bổ sung text/icon/divider/skeleton cần cho consistency/accessibility.
- Không có business-domain knowledge hoặc API calls.
- AppSearchField không tự debounce/fetch; behavior đó thuộc controller của từng screen.

**Alternatives considered**:

- Thêm status/empty/error/domain patterns ngay: defer sang component/pattern phase.
- Reuse existing Counter/DatePicker/Loading/Modal components làm base: loại vì raw styles, nhỏ hơn touch target, random skeleton hoặc business/shell coupling.

## Decision 7 - UI Catalog là opt-in non-production artifact

**Decision**: Lazy route `/internal/ui-kit`, chỉ đăng ký khi `VITE_ENABLE_UI_CATALOG=true` và environment không phải production. Không thêm tab. Normal production build phải không emit hoặc precache catalog chunk.

**Rationale**:

- Spec yêu cầu catalog nội bộ nhưng không được trở thành production workflow.
- Current Workbox config precache mọi generated asset trừ `version.json`; lazy chunk vẫn tăng install cache nếu được emit.
- Catalog dùng `IonPage`/`IonContent`, một scroll container và `.ds-root`.

**Alternatives considered**:

- Storybook: loại trong phase đầu vì dependency/toolchain mới.
- Route luôn có nhưng ẩn khỏi menu: loại vì vẫn ship và precache.
- Catalog bên ngoài repo: loại vì dễ drift khỏi component source.

## Decision 8 - Screen-level feature control, Legacy default

**Decision**: `src/ui-flags/` cung cấp typed registry/resolver/hook. Production chỉ nhận build-time config. QA override chỉ hoạt động ở non-production, không persist và không thay quyền business. Registry foundation không bật screen V2 nào.

**Rationale**:

- Screen-level flag hỗ trợ strangler pattern và rollback độc lập.
- Component-level flag tạo mixed UI và khó rollback.
- No remote flag service hoặc database cần thiết ở phase này.

**Alternatives considered**:

- LocalStorage override ở production: loại vì dễ để trạng thái V2 sót lại.
- Flag từng primitive: loại vì phá vertical-slice boundary.
- Remote flag service: defer; quá scope và thêm operational dependency.

## Decision 9 - Quality toolchain phải được sửa trước khi làm gate

**Decision**:

- Typecheck: giữ `tsc --noEmit`; baseline hiện pass.
- Lint: đổi `.eslintrc.js` CommonJS thành ESM-safe `.eslintrc.cjs`, thêm TypeScript parser/plugins và targeted script. `npm run lint` hiện không truyền path nên exit 0 giả; targeted ESLint fail trước linting.
- Unit: cấu hình Vitest jsdom + Testing Library; colocate contract tests.
- Browser: thay Cypress starter spec bằng UI Catalog matrix.
- Accessibility: dev-only direct `axe-core`; không thêm wrapper plugin.
- Visual: committed screenshots + manual approval trong phase đầu; chưa thêm pixel-diff SaaS/plugin.

**Rationale**:

- Baseline repo chưa có unit/component test, Vitest setup hoặc usable Cypress spec.
- JSDOM không chứng minh layout/contrast; browser và real-device gates vẫn cần.
- Test-only dependencies không vào runtime bundle nhưng vẫn phải lock và document.

**Alternatives considered**:

- Chỉ manual QA: loại vì base regression lan rộng.
- Thêm Storybook/Lighthouse/Playwright/pixel-diff suite cùng lúc: loại vì quá nhiều tooling trước khi có base.

## Decision 10 - Performance/bundle gates dùng baseline ratchet

**Decision**:

- Script Node/zlib nội bộ đọc Vite build output, không thêm bundle-analyzer dependency.
- Regenerate clean baseline ngay trước implementation.
- Normal production modern initial gzip và precache total: candidate ≤ baseline +5%.
- Interaction: warm-up, ≥20 samples/action, ≥95% phản hồi ở next paint trong 100 ms.
- 200-row list: 20 scripted segments, ≥19 không có Long Task >100 ms, một scroll container.
- PWA time-to-usable: median 5 cold runs trên fixed device/network, candidate ≤ baseline +5%.

**Rationale**:

- Snapshot khảo sát ngày 2026-07-23: modern entry + CSS khoảng 602,044 gzip bytes; phải đo lại trên clean implementation base.
- Current eager screen imports là baseline debt, không được trộn route-lazy refactor vào foundation.
- Optimize only measured bottlenecks.

**Alternatives considered**:

- Workbox 3 MiB/file limit làm performance target: loại; đây chỉ là cache hard ceiling.
- CI timing duy nhất: loại vì noisy; fixed-device median vẫn cần cho PWA standalone.

## Decision 11 - PWA update semantics giữ nguyên

**Decision**: Không thay `registerType: "prompt"`, `skipWaiting: false`, `clientsClaim: false`, update prompt hoặc reload flow.

**Rationale**:

- Design System foundation không được gián đoạn active session.
- Bundle/catalog changes phải đi qua existing prompt-based update lifecycle.

**Alternatives considered**:

- Auto activate/reload để test nhanh: loại vì regression UX và ngoài scope.
