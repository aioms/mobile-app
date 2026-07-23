# UI Contract: Screen-level Feature Control

**Purpose**: Bật/tắt từng future V2 screen độc lập, Legacy default, rollback ≤5 phút.  
**Scope now**: Infrastructure only; không production screen nào consume registry trong foundation feature.

## Public types

```ts
export type UiVersion = "legacy" | "v2";

export interface UiSliceDefinition {
  key: string;
  environmentKey: `VITE_UI_${string}_V2`;
  defaultVersion: "legacy";
  owner: string;
}

export interface UiVersionResolution {
  key: string;
  version: UiVersion;
  source: "default" | "environment" | "qa-override";
}
```

## Registry rules

1. Key ở screen hoặc large-pattern level; không key cho individual button/card/input.
2. `defaultVersion` luôn là `legacy`.
3. Foundation registry không bật `v2`.
4. Mỗi key phải có owner và rollback record trước khi được production-enable.
5. Flag không thay permission, API authorization hoặc business rule.

## Resolution precedence

### Production

```text
explicit build-time environment value
    ↓ absent/invalid
legacy default
```

### Non-production

```text
valid explicit QA override
    ↓ absent/invalid
build-time environment value
    ↓ absent/invalid
legacy default
```

QA override:

- Chỉ accepted khi environment không phải production.
- Dùng URL query cho current session; không persist vào LocalStorage.
- Unknown key/value bị ignore và log ở debug level.
- Không được phép enable route/feature vượt existing authentication/authorization.

## Hook contract

```ts
export function getUiVersion(key: UiSliceKey): UiVersionResolution;

export function useUiVersion(key: UiSliceKey): UiVersionResolution;
```

- Resolver pure và testable.
- Hook chỉ phản ánh resolver; không fetch remote config.
- Future route wrapper chọn Legacy hoặc V2 once per screen composition.

## Required tests

1. Missing config → Legacy.
2. Environment false/invalid → Legacy.
3. Environment true → V2 only for exact key.
4. Non-production valid override takes precedence.
5. Production ignores QA override.
6. Unknown key rejected by TypeScript/registry.
7. One slice toggle does not affect another.
8. Flag resolution does not mutate storage or data.

## Rollback contract

```text
Detect failure
  → set one slice environment flag false
  → rebuild/release through existing PWA prompt workflow
  → active session receives explicit update prompt
  → user returns to Legacy after accepted update
```

No auto reload, no `skipWaiting` override, no data migration, no Legacy deletion in same release.
