# UI Contract: Internal Catalog and Quality Gates

## Route and build exposure

- Route: `/internal/ui-kit`.
- Enabled only when `VITE_ENABLE_UI_CATALOG=true` and runtime environment is not production.
- Not added to tabs, menus or normal business navigation.
- Dynamic import required.
- Normal production build MUST:
  - return NotFound for the route;
  - omit catalog source marker and catalog chunk from `dist`;
  - omit catalog assets from Workbox precache.
- Catalog must not call business APIs or depend on production data.

## Shell contract

- UI Kit root uses `IonPage` + one `IonContent`.
- Design System examples live inside `.ds-root`.
- Ionic owns safe area, primary scroll and overlay.
- No nested `overflow-y` container in the 200-row benchmark.

## Required catalog sections

1. Semantic colors and contrast pairs.
2. Typography scale.
3. Spacing, radius, elevation and motion.
4. Icon sizes and meaningful/decorative usage.
5. AppText.
6. AppIcon.
7. AppButton.
8. AppIconButton.
9. AppCard.
10. AppBadge.
11. AppDivider.
12. AppSkeleton.
13. AppTextField.
14. AppSearchField.
15. Edge-content matrix.
16. 200-row performance benchmark.
17. Legacy style-isolation control sample.

Every component section displays all supported variants, sizes and states.

## Viewport matrix

| Viewport | Required |
|---|---:|
| 390 × 844 | Yes |
| 393 × 852 | Yes |
| 412 × 915 | Yes |
| 768 × 1024 | Yes |

For each viewport:

- No horizontal document overflow.
- Interactive rectangles ≥44×44 CSS px.
- Long Vietnamese text, large money and long badge remain understandable.
- Loading, disabled and error states remain usable.
- Screenshot evidence recorded.

## Accessibility gate

- Direct axe-core run on catalog: zero critical/serious issues and zero WCAG 2.1 A/AA violation.
- All interactive examples reachable and operable by keyboard.
- Focus visible.
- Meaningful icons have names; decorative icons hidden.
- Color is not sole carrier of status.
- Reduced-motion mode removes nonessential animation.
- Manual screen-reader review recorded because automated checks are incomplete.

## Performance gate

### Interaction

- Warm-up before collection.
- At least 20 samples per critical action.
- At least 95% show next-paint feedback within 100 ms.

### Reference list

- Stable fixture: 200 deterministic rows.
- 20 scripted scroll segments.
- At least 19 segments contain no Long Task >100 ms.
- Exactly one primary scroll container.
- Record DOM count and heap snapshot.

### PWA usable time

- Fixed device/network profile.
- Five cold installed-standalone runs before and after.
- Compare median.
- Candidate median ≤ baseline × 1.05.

## Bundle gate

- Clean baseline generated immediately before source changes.
- Normal production initial modern JS+CSS gzip ≤ baseline × 1.05.
- Legacy initial assets and Workbox precache total separately reported.
- UI Catalog build delta separately reported.
- Every new runtime UI dependency has raw/gzip, CSS footprint and tree-shaking evidence.
- Workbox 3 MiB/file limit is a hard cache ceiling, not the performance budget.

## Legacy isolation gate

- Capture representative Legacy screenshots/computed-style values before and after foundation import/provider.
- Zero unintended difference allowed.
- New CSS may only target `--ds-*`, `ds-*`, `.ds-*` or `.ds-root`-scoped mappings.
- No new global `*`, `body`, `button`, `input` or `ion-*` selector.

## Manual device-only checks

- Installed PWA `display-mode: standalone`.
- iOS and Android safe areas.
- Virtual keyboard does not cover input/actions.
- Native/back gesture behavior.
- Screen reader.
- Reduced motion.
- Existing explicit Update/Later PWA workflow.
