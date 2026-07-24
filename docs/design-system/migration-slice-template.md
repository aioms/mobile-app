# Migration Slice Template

Copy this template for one screen or one large pattern. Replace every placeholder;
an empty list is not ready.

## Identity and scope

- Slice key: `<registered-kebab-case-key>`
- Owner: `<person-or-role>`
- Legacy entry: `<current-component>`
- V2 entry: `<new-component>`
- Environment flag: `VITE_UI_<SLICE>_V2`
- Current status: `draft`

Files in scope:

- `<explicit-path>`

Files out of scope:

- `<routes, sibling screens, API hooks, business state, or backend paths>`

## Behavior to preserve

- Navigation and back-stack: `<expectation>`
- Authentication and permissions: `<expectation>`
- Search, filter, sort, pagination: `<expectation>`
- Loading, empty, error, and retry states: `<expectation>`
- API endpoint, payload, and response handling: `<expectation>`
- Persisted data and offline behavior: `<expectation>`
- Business calculations and side effects: `<expectation>`

## Evidence

Visual baselines:

- `<artifact path, viewport, state, source commit>`

Performance baselines:

| Metric | Environment | Samples | Value | Threshold | Unit | Artifact |
|---|---|---:|---:|---:|---|---|
| `<metric>` | `<device/browser/network>` | `<n>` | `<value>` | `<gate>` | `<unit>` | `<path>` |

Acceptance criteria:

- `<observable, testable outcome>`

Automated commands:

```sh
npm run lint:design-system
npx tsc --noEmit
npm run test.unit:run
npm run validate:migration-readiness -- <record.json>
```

Manual QA:

- Compare Legacy and V2 at `390x844`, `393x852`, `412x915`, and `768x1024`.
- Verify keyboard, focus, accessible names, touch targets, safe area, long text,
  Vietnamese text, large money, loading, empty, and error states.
- Verify only this slice changes when its exact flag is enabled.
- Verify the installed PWA keeps the active version until the user accepts the
  explicit update prompt.

## Release

- Production flag value: `<true only after approval>`
- Other slice flags remain: `false`
- Release owner: `<person-or-role>`
- Monitoring signals: `<errors, performance, accessibility, support>`
- Approval evidence: `<link-or-path>`

No route, permission, API, data, or business-rule change is permitted in this
slice.

## Rollback

- Trigger conditions: `<observable failures>`
- Action: set only `VITE_UI_<SLICE>_V2=false`, rebuild, and publish
- Target: `legacy`
- Data impact: `none`
- Owner: `<person-or-role>`
- Operational time budget: `≤5 minutes`
- Verified at: `<ISO datetime before production enable>`

The existing explicit PWA prompt remains in control. Do not force reload, enable
`skipWaiting`, migrate data, or remove Legacy.

## Cleanup

- Stable release window satisfied: `<yes/no + evidence>`
- Acceptance and performance gates still green: `<evidence>`
- No active rollback need: `<yes/no>`
- Owner approval: `<evidence>`
- Separate cleanup scope/review: `<link-or-path>`

Do not remove Legacy before status is `cleanup-eligible`.

## Machine-readable record

Start from
[`reference-migration-ready.json`](../../specs/001-build-design-system-foundation/examples/reference-migration-ready.json),
replace the reference values, then run the readiness validator. Keep
`rollbackPlan.sliceKey` equal to `sliceKey`, `targetVersion` equal to `legacy`,
`dataImpact` equal to `none`, and `timeBudgetMinutes` between zero and five.
