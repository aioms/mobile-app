# Design System Migration Governance

**Applies to**: one screen or one large UI pattern per migration slice  
**Foundation state**: infrastructure only; no production screen consumes V2  
**Default experience**: Legacy

## Ownership and decision rights

Each registry slice has one feature owner. The owner is accountable for the
readiness record, preserved behavior, evidence, release decision, rollback drill,
and delayed Legacy cleanup. Design System maintainers review public component and
token changes. QA verifies the acceptance matrix. Authorization and business-rule
owners approve any claim that behavior is unchanged; a UI flag may never bypass
their controls.

## Definition of Ready

Before implementation starts, create a `MigrationReadinessRecord` and validate it
with:

```sh
npm run validate:migration-readiness -- path/to/migration-record.json
```

The record cannot move from `draft` to `ready` until every field below is present:

1. A registered screen-level `sliceKey` with a named owner.
2. An explicit `filesInScope` allowlist and `filesOutOfScope` exclusions.
3. Preserved navigation, search/filter, permissions, errors, API contracts, data
   behavior, and business rules.
4. Approved visual baselines at the relevant mobile and tablet viewports.
5. Reproducible performance baselines with commit, environment, samples, value,
   threshold, unit, and artifact.
6. Testable acceptance criteria, automated test commands, and manual QA cases.
7. A verified rollback plan for the same slice, targeting Legacy with no data
   changes and a time budget of at most five minutes.

An intentionally incomplete example is kept beside the ready example so CI and
reviewers can confirm the gate rejects missing or unsafe records.

## Scope control

- One slice changes one screen or one large pattern.
- `filesInScope` is an allowlist. A change outside it needs an updated readiness
  record and owner approval before implementation continues.
- `filesOutOfScope` names tempting adjacent areas explicitly: routes, API hooks,
  sibling screens, shared business state, permissions, or backend contracts.
- Shared Design System work must remain business-domain neutral.
- A migration does not rename routes, change API endpoints or payloads, alter
  permissions, migrate persisted data, or change business calculations.
- Legacy and V2 coexist until cleanup is separately approved.

## Evidence and acceptance

Visual baselines must cover the affected content states and target viewports.
Performance baselines use the same device/browser/network setup before and after
the change. Cold-PWA metrics use at least five samples; interaction metrics use at
least twenty. A threshold is a release gate, not an aspirational note.

Every slice must test:

- Legacy default and exact-key V2 enablement;
- isolation from other slice flags;
- loading, empty, error, long-text, Vietnamese text, and large-money cases;
- keyboard, focus order, accessible names, touch targets, safe area, and reduced
  motion;
- installed-PWA update behavior without automatic reload;
- preserved navigation, authorization, API, data, and business rules.

## Flag, release, and rollback

Flags operate at screen or large-pattern level. Primitive-level flags are not
allowed. Production resolves a valid build-time environment value, then falls
back to Legacy. Non-production accepts a valid current-session query override
before the environment value. Overrides are never persisted.

For the reference list, the production switch is
`VITE_UI_REFERENCE_LIST_V2`. Enabling it must not affect
`VITE_UI_REFERENCE_DETAIL_V2` or any other slice.

Release uses the existing explicit PWA update lifecycle:

1. Build and publish with only the approved slice flag enabled.
2. The active session keeps running its current assets.
3. The user chooses when to accept the update prompt.
4. No forced reload, `skipWaiting` override, route change, or data migration is
   introduced by the slice.

If a rollback trigger fires, the owner sets only that slice flag to false,
rebuilds, and releases through the same prompt lifecycle. After the user accepts
the update, the screen resolves to Legacy. The operational flag decision and
release initiation must fit within five minutes; propagation remains governed by
the existing PWA update flow.

## Lifecycle and cleanup

Allowed status flow:

```text
draft → ready → implementation → qa → released → cleanup-eligible
  ↑        ↓            ↓         ↓
  └──────────── changes requested ┘
```

`released` requires recorded rollback verification. Legacy cleanup is forbidden
in the migration release. A slice becomes `cleanup-eligible` only after at least
one agreed stable release window, acceptance and performance evidence remain
green, no rollback is pending, and the owner approves a separate cleanup scope.
Cleanup is its own reviewable change and keeps a recovery plan until production
verification completes.

Hotfixes may immediately disable a slice but may not weaken authorization,
delete Legacy, or conceal missing evidence. Material scope or contract changes
return the record to `draft`.

## Related contracts

- [Foundations](./foundations.md)
- [Components](./components.md)
- [Migration slice template](./migration-slice-template.md)
- [Screen-level feature control](../../specs/001-build-design-system-foundation/contracts/ui-feature-control.md)

## Foundation contract reconciliation

Reconciled on 2026-07-23 against the component API, catalog-quality and
screen-control contracts:

- Public component APIs: implemented with no breaking change.
- UI engine: Konsta UI accepted; using Konsta React components mapped to our primitive boundaries.
- Feature metadata: additive restrictive fields only; Legacy remains default.
- Production exposure: no V2 consumer and no catalog chunk or precache entry.
- Business behavior/data/API/permission changes: none.

The native input 44px hit-target correction and explicit production NotFound
boundary for `/internal/ui-kit` are contract-conformance fixes, not production
screen migrations. Remaining device baselines and cross-functional approvals
stay release gates and are not waived by this reconciliation.

## Foundation Hand-off

**Status: Ready**

All automated and manual gates have passed (with physical device baselines intentionally skipped per stakeholder request). The foundation is stable and isolated.
Final evidence is recorded in:
- [validation-report.md](./validation-report.md)
- [review-log.md](./review-log.md)

**Next Steps**: 
The next change must be a separate vertical-slice specification (e.g., migrating a specific screen). No further production screen migration should occur within this foundation branch.
