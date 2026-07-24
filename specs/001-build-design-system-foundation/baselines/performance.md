# Legacy UI and PWA Performance Baseline

**Status**: Partial — environment and source anchor recorded; visual, computed-style, installed-standalone, interaction, and physical-device evidence pending  
**Recorded at**: 2026-07-23T09:43:50Z (2026-07-23 16:43:50 Asia/Ho_Chi_Minh)  
**Feature branch**: `001-build-design-system-foundation`  
**Source commit**: `ea53362725a43bb2e377c9c423d0f71e18e3974d`  
**Package version**: `1.0.0`

## Evidence integrity

- `git status --short` was empty when T003 started, before concurrent Phase 1 changes appeared in the shared worktree.
- The commit above is the clean Legacy source anchor for all later before/after comparisons.
- The existing `dist/version.json` inspected at task start identified commit `ad0ca5c4a7f9`, not the source anchor. That artifact was rejected for screenshots, computed styles, and timing.
- No project `.env` file was read.
- No screenshot, computed-style, or timing value is inferred from source CSS or an old build.
- The shared worktree became dirty while other Phase 1 tasks were running. Future captures must use a build proven to originate from the source commit above or record a new approved clean anchor.

## Local automation host

| Field | Verified value |
|---|---|
| Host class | MacBook Pro |
| Model identifier | Mac16,8 |
| CPU | Apple M4 Pro, 12 cores |
| Memory | 24 GB |
| Architecture | arm64 |
| OS | macOS 15.7 (24G222) |
| Node.js | v22.22.3 |
| npm | 10.9.8 |
| Google Chrome | 150.0.7871.130 |
| Safari | 26.3 |
| Cypress package/binary | 13.17.0 / 13.17.0 |
| Cypress Electron | 27.3.10 |

Unique device identifiers are intentionally excluded from this record.

## Required screenshot matrix

Target route: unauthenticated Legacy `/login`, using the light-theme baseline.

| Viewport | Expected artifact | Status | Blocking evidence |
|---|---|---|---|
| 390 × 844 | `screenshots/legacy-login-390x844.png` | Pending | No current-commit browser build/session captured |
| 393 × 852 | `screenshots/legacy-login-393x852.png` | Pending | No current-commit browser build/session captured |
| 412 × 915 | `screenshots/legacy-login-412x915.png` | Pending | No current-commit browser build/session captured |
| 768 × 1024 | `screenshots/legacy-login-768x1024.png` | Pending | No current-commit browser build/session captured |

No screenshot file is present yet. T003 must remain incomplete until all four artifacts exist and include capture timestamp, browser, commit, route, viewport, and theme metadata in this document.

## Representative Legacy computed styles

Capture from the same current-commit browser session as the screenshots. Record resolved values, not source declarations.

| Surface | Representative target | Required properties | Baseline | Status |
|---|---|---|---|---|
| Page shell | `ion-page` | display, position, background-color, color, font-family | — | Pending |
| Scroll owner | `ion-content` | display, overflow, background-color, padding | — | Pending |
| Page title | `h1` containing `Đăng nhập` | font-family, font-size, font-weight, line-height, color, margin | — | Pending |
| Username field | first `ion-input` and rendered native input | height, padding, background-color, border, border-radius, font-size, color | — | Pending |
| Primary action | `ion-button` containing `Đăng nhập` and rendered native button | width, height, background-color, color, border-radius, font-size, font-weight | — | Pending |
| Remember control | `ion-checkbox` | width, height, color, focus outline | — | Pending |

Acceptance for the later foundation/provider comparison: zero unintended differences for these resolved values and the four screenshots.

## Installed standalone cold starts

Required setup: fixed physical device, installed PWA, confirmed `display-mode: standalone`, fixed network profile, cache/start protocol documented, and one reviewer.

| Run | Device | OS/app version | Network profile | Start-to-usable | Status |
|---|---|---|---|---:|---|
| 1 | — | — | — | — | Pending |
| 2 | — | — | — | — | Pending |
| 3 | — | — | — | — | Pending |
| 4 | — | — | — | — | Pending |
| 5 | — | — | — | — | Pending |
| Median | — | — | — | — | Pending |

No standalone or physical-device session was available in this task. Browser preview timing cannot substitute for these five runs.

## Interaction samples

Required baseline: warm-up followed by at least 20 samples per action; at least 95% must show visible next-paint feedback within 100 ms.

| Interaction | Sample count | p95 visible-feedback time | Status |
|---|---:|---:|---|
| Focus username input | 0 | — | Pending |
| Toggle password visibility | 0 | — | Pending |
| Toggle remember-login checkbox | 0 | — | Pending |
| Press login button without valid credentials | 0 | — | Pending |

## Physical-device and installed-PWA checks

| Check | Required profiles | Status |
|---|---|---|
| Standalone display mode | Installed iOS and Android PWA | Pending |
| Safe area | iPhone notch/home-indicator and Android system bars | Pending |
| Virtual keyboard | Username/password fields and primary action remain usable | Pending |
| Back gesture/navigation lifecycle | iOS back gesture and Android system back | Pending |
| Screen reader | VoiceOver and TalkBack labels/order | Pending |
| Reduced motion | iOS and Android reduced-motion settings | Pending |
| Update workflow | Explicit Update/Later; no automatic active-session reload | Pending |

## Completion criteria

T003 remains partial. Mark complete only after:

1. Four screenshot files are committed under `baselines/screenshots/`.
2. Representative resolved computed styles are recorded from the same source commit/build.
3. Five installed-standalone cold starts and their median are recorded on each approved fixed device/network profile.
4. Interaction samples meet the defined sample count and include raw or exported evidence.
5. Physical-device checks list reviewer, timestamp, device class, OS/app version, and result.
