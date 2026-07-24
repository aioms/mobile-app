# UI dependency gate

## Decision

**Rejected for production foundation:** `konsta@4.0.1`.

The package compiled with the current React/Tailwind/Vite/TypeScript stack and
stayed inside the aggregate 5% bundle ratchet, but it failed the mandatory
Legacy style-isolation gate. The Design System therefore uses the existing
`class-variance-authority` + Tailwind stack. Public component contracts do not
change and no runtime engine switch is shipped.

## Reproducible inputs

- Source anchor: `ea53362725a43bb2e377c9c423d0f71e18e3974d`
- React: `18.2.0`
- Tailwind CSS: `3.4.17`
- Vite: `5.2.14`
- TypeScript: `5.1.6`, strict
- Provisional dependency: exact `konsta@4.0.1`
- Spike: provider, button, input, search, card, badge and 200 deterministic rows
- Normal build: `npm run vite:build`
- Catalog build:
  `VITE_ENABLE_UI_CATALOG=true npm run vite:build -- --mode development`

No project `.env` file was read.

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| React 18 / TypeScript compatibility | PASS | `npx tsc --noEmit --pretty false` exited 0 |
| Vite 5 production build | PASS | 2,552 modules transformed; build completed |
| Tailwind 3 compilation | PASS | Konsta v4 config compiled; one existing-style ambiguous utility warning |
| Exact version | PASS | `package.json` temporarily pinned `4.0.1` |
| Normal production catalog omission | PASS | No `KonstaSpikePage` marker/chunk in normal production output |
| Catalog-only dynamic chunk | PASS | Modern JS 129,560 raw / 30,970 gzip; CSS 320 raw / 190 gzip |
| Initial modern bundle budget | PASS | 602,038 → 608,608 gzip, +6,570 / +1.09% |
| Initial legacy bundle budget | PASS | 635,215 → 648,452 gzip, +13,237 / +2.08% |
| Workbox precache budget | PASS | 1,339,833 → 1,353,082 gzip, +13,249 / +0.99% |
| Tree-shaking/footprint | PARTIAL | Named imports split to the catalog chunk, but Konsta Tailwind scanning still adds 46,160 raw CSS bytes to the normal build |
| Selector/style isolation | **FAIL** | Konsta `plugin-base.js` injects global `:root`, `*`, `body`, `[dir="rtl"]`, `.ios`, `.md` and global dark-mode rules |
| Legacy computed-style equality | BLOCKED/FAIL-SAFE | Global selectors make zero-difference unprovable; dependency is rejected before provider rollout |
| Ionic shell ownership | PASS by static boundary | Spike stays inside `IonPage`/`IonContent`; no Konsta App/Page/router/tabs/overlays |
| Scroll ownership | PASS by implementation | The 200-row fixture has no nested `overflow-y` container |
| Keyboard/safe-area/native back/device matrix | NOT RUN | Gate execution short-circuited after mandatory style-isolation failure |
| Installed-PWA usable time | NOT RUN | Gate execution short-circuited after mandatory style-isolation failure |

## Selector failure

Konsta v4's required Tailwind configuration calls `addBase` with selectors that
are intentionally application-global:

- `:root` adds `--k-*` variables.
- `*` changes tap highlight and text-size adjustment.
- `body` changes font smoothing.
- `.ios` and `.md` change font families.
- `.dark` changes background and text colors.

Scoping only the spike page CSS cannot scope these generated base rules. Keeping
the dependency would violate the feature requirements forbidding new global
selectors and unintended Legacy computed-style changes.

## CVA comparison

The fallback already exists in the repository:

- `class-variance-authority@0.7.1`
- `clsx@2.1.1`
- `tailwind-merge@2.6.0`
- shared `cn()` in `src/lib/utils.ts`

It adds no new runtime dependency, does not require scanning a third-party
component package and allows all new selectors/variables to remain under the
`ds-*`, `.ds-*` and `--ds-*` namespaces.

## Applied outcome

1. Remove provisional Konsta dependency and its Tailwind wrapper.
2. Remove the temporary spike after its evidence is recorded.
3. Implement the same published Design System API with CVA/Tailwind.
4. Keep Ionic as sole owner of app shell, navigation, page lifecycle, overlays,
   scroll, safe area, keyboard and Capacitor integration.
5. Preserve prompt-based PWA updates; no automatic active-session activation or
   reload.

## Post-rejection verification

- `konsta`, `KonstaProvider` and spike markers are absent from `package.json`,
  both lockfiles, `src/` and the normal `dist/`.
- `npx tsc --noEmit --pretty false`: pass.
- `npm run vite:build`: pass.
- Normal modern initial gzip: 602,039 bytes, +1 byte / +0.00% from baseline.
- Normal legacy initial gzip: 635,212 bytes, -3 bytes / -0.00% from baseline.
- Workbox precache gzip: 1,339,838 bytes, +5 bytes / +0.00% from baseline.
- `registerType: "prompt"`, `clientsClaim: false` and `skipWaiting: false`
  remain unchanged.
