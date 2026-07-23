# Data Model: Nền tảng Design System dùng chung

Feature không thêm database entity hoặc backend payload. “Data model” dưới đây mô tả compile-time configuration, documentation records và test artifacts.

## 1. SemanticToken

Đại diện một visual decision được đặt tên.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `name` | string | Yes | Unique; prefix `--ds-`; không gắn trực tiếp tên màu vật lý |
| `category` | enum | Yes | `color`, `typography`, `spacing`, `radius`, `elevation`, `motion`, `layout`, `safe-area` |
| `role` | string | Yes | Mô tả semantic purpose |
| `value` | CSS-compatible value | Yes | Raw value chỉ được tồn tại trong foundation token source |
| `fallback` | value | No | Chỉ dùng khi platform variable có thể thiếu |
| `usage` | string[] | Yes | Ít nhất một use case đúng |
| `forbiddenUsage` | string[] | No | Ghi các use case sai hoặc dễ nhầm |
| `accessibilityNotes` | string | Conditional | Required cho color, typography, motion và interactive layout token |
| `status` | enum | Yes | `draft`, `approved`, `deprecated` |

### Relationships

- Một SemanticToken được nhiều ComponentVariant tham chiếu.
- Token deprecated phải có replacement trước khi xóa.

### State transition

```text
draft → approved → deprecated → removed
                 ↘ approved (replacement)
```

`removed` chỉ hợp lệ khi không còn reference trong Design System hoặc V2 paths.

## 2. ComponentDefinition

Public contract của một base component.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `name` | string | Yes | Một trong 10 component scope |
| `layer` | enum | Yes | `primitive` hoặc `component` |
| `purpose` | string | Yes | Không chứa business-domain behavior |
| `publicProps` | PropDefinition[] | Yes | Không expose primitive-engine type |
| `variants` | ComponentVariant[] | Yes | Semantic names only |
| `sizes` | enum[] | Conditional | Interactive components phải map touch target ≥44×44 cho applicable size |
| `states` | enum[] | Yes | Applicable subset của default, pressed, focused, disabled, loading, selected, error |
| `accessibilityContract` | object | Yes | Role, accessible name, keyboard, focus và announcement behavior |
| `performanceBudget` | object | Yes | Interaction and list-use constraints |
| `engine` | enum | Internal | `konsta-v4` hoặc `cva`; không public |
| `status` | enum | Yes | `draft`, `review`, `stable`, `deprecated` |

### Relationships

- Một ComponentDefinition dùng nhiều SemanticToken.
- Một ComponentDefinition có nhiều CatalogScenario và ContractTest.
- Screens tương lai chỉ tham chiếu ComponentDefinition qua Design System barrel.

### State transition

```text
draft → review → stable → deprecated → removed
          ↓
       draft (changes requested)
```

`stable` yêu cầu component contract, unit test, catalog matrix, accessibility và bundle gate đều pass.

## 3. ComponentVariant

Named visual/behavior option của component.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `name` | string | Yes | Semantic; ví dụ `primary`, `neutral`, `danger`, `warning` |
| `component` | ComponentDefinition ref | Yes | Must exist |
| `tokenRefs` | SemanticToken ref[] | Yes | Không raw visual literal |
| `allowedStates` | enum[] | Yes | State matrix đầy đủ |
| `constraints` | string[] | No | Ví dụ không cho direct color/style |

## 4. CatalogScenario

Một example có thể review và test trong UI Catalog.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `id` | string | Yes | Stable and unique |
| `component` | ComponentDefinition ref | Yes | Stable reference |
| `variant` | ComponentVariant ref | Conditional | Required khi component có variants |
| `state` | enum | Yes | Một state được component support |
| `contentCase` | enum | Yes | `normal`, `long-text`, `vietnamese`, `large-money`, `long-badge`, `empty` |
| `viewport` | enum | Yes | `390x844`, `393x852`, `412x915`, `768x1024` |
| `theme` | enum | Yes | `light` trong feature này |
| `expectedA11y` | object | Yes | Role/name/focus/contrast expectation |
| `screenshotPath` | string | Conditional | Required khi baseline được approve |

## 5. ExperienceBaseline

Record dùng để so sánh trước/sau.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `capturedAt` | ISO datetime | Yes | UTC or timezone recorded |
| `commit` | string | Yes | Exact source snapshot |
| `environment` | string | Yes | Device, OS, browser, viewport, network profile |
| `metric` | enum | Yes | `initial-gzip`, `precache-total`, `time-to-usable`, `interaction-next-paint`, `long-task`, `dom-count`, `heap` |
| `sampleCount` | integer | Yes | ≥5 for cold PWA; ≥20 for interactions |
| `value` | number | Yes | Unit recorded separately |
| `unit` | enum | Yes | `bytes`, `ms`, `count`, `percent` |
| `threshold` | number | Yes | Derived from spec, not Workbox hard ceiling |
| `artifactPath` | string | Yes | Reproducible evidence |

## 6. UiSliceDefinition

Typed definition cho một future screen migration.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `key` | kebab-case string | Yes | Unique, screen/pattern level; không primitive level |
| `environmentKey` | string | Yes | `VITE_UI_<SLICE>_V2` naming |
| `defaultVersion` | enum | Yes | MUST be `legacy` |
| `owner` | string | Yes | Feature owner |
| `rollbackTarget` | enum | Yes | MUST be `legacy` |
| `productionEnabled` | boolean | Yes | MUST be false in foundation feature |

### State transition

```text
legacy ──explicit release config──> v2
v2 ──flag off / rollback──> legacy
```

No data migration is allowed between states.

## 7. MigrationReadinessRecord

Definition of Ready cho future vertical slice.

| Field | Type | Required | Validation |
|---|---|---:|---|
| `sliceKey` | UiSliceDefinition ref | Yes | Existing registry key |
| `filesInScope` | path[] | Yes | Explicit allowlist |
| `filesOutOfScope` | path[] | Yes | Explicit exclusions |
| `behaviorToPreserve` | string[] | Yes | Navigation, search/filter, permissions, errors |
| `visualBaseline` | artifact ref[] | Yes | Required |
| `performanceBaseline` | ExperienceBaseline ref[] | Yes | Required |
| `acceptanceCriteria` | string[] | Yes | Testable |
| `testCommands` | string[] | Yes | Reproducible |
| `manualQa` | string[] | Yes | Viewport/device/PWA cases |
| `rollbackPlan` | RollbackRecord | Yes | Verified before implementation |
| `status` | enum | Yes | `draft`, `ready`, `implementation`, `qa`, `released`, `cleanup-eligible` |

### State transition

```text
draft → ready → implementation → qa → released → cleanup-eligible
  ↑        ↓            ↓         ↓
  └────────changes requested──────┘
```

Transition sang `ready` bị chặn nếu thiếu bất kỳ required field.

## 8. RollbackRecord

| Field | Type | Required | Validation |
|---|---|---:|---|
| `sliceKey` | UiSliceDefinition ref | Yes | One screen/pattern |
| `triggerConditions` | string[] | Yes | Observable failure conditions |
| `action` | string | Yes | Disable only this V2 flag |
| `targetVersion` | enum | Yes | `legacy` |
| `dataImpact` | enum | Yes | MUST be `none` |
| `owner` | string | Yes | Named role/person |
| `timeBudgetMinutes` | number | Yes | ≤5 |
| `verifiedAt` | ISO datetime | Conditional | Required before production enable |

## Invariants

1. Design System public contracts không tham chiếu Konsta types.
2. Raw visual values chỉ có trong foundation token source hoặc documented third-party adapter exception.
3. Normal production registry không bật V2 trong foundation feature.
4. UI Catalog không gọi API hoặc sở hữu business state.
5. Legacy cleanup không thể bắt đầu trước `cleanup-eligible`.
6. Feature flag không thay permission hoặc business authorization.
