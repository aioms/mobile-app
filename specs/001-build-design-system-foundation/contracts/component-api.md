# UI Contract: Design System Component API

**Version**: 1.0-draft  
**Consumers**: Future V2 screens, UI Catalog, tests  
**Import boundary**: `@/design-system` only

## Shared rules

1. Direct `konsta/react` import chỉ được phép trong Design System implementation files.
2. Public props không expose primitive-engine type, raw color, raw background, raw radius, raw shadow hoặc unrestricted `style`.
3. `className` chỉ dành cho layout/composition; visual override bị visual-lint/review gate chặn.
4. Interactive components forward `ref`, native events và relevant `aria-*`/`data-*`.
5. Disabled/loading state không phát action nhiều lần.
6. Motion tôn trọng `prefers-reduced-motion`.
7. AppSearchField/AppTextField không fetch API, không own debounce policy và không chứa business validation.

## Shared types

```ts
export type DsSize = "sm" | "md" | "lg";
export type DsTone =
  | "neutral"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type DsControlState =
  | "default"
  | "focused"
  | "disabled"
  | "loading"
  | "error";
```

## AppText

```ts
export type AppTextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "label"
  | "caption";

export type AppTextTone =
  | "primary"
  | "secondary"
  | "disabled"
  | "inverse"
  | "danger"
  | "success";

export interface AppTextProps {
  as?: "span" | "p" | "div" | "label" | "h1" | "h2" | "h3" | "h4";
  variant?: AppTextVariant;
  tone?: AppTextTone;
  truncate?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

Contract:

- Default: `as="span"`, `variant="body"`, `tone="primary"`.
- Heading semantics do not derive automatically from visual variant; caller chooses correct `as`.
- `truncate` phải giữ full content qua accessible name/title strategy khi text critical.

## AppIcon

```ts
type DecorativeIcon = {
  decorative?: true;
  label?: never;
};

type MeaningfulIcon = {
  decorative: false;
  label: string;
};

export type AppIconProps = {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  tone?: "primary" | "secondary" | "inverse" | "danger" | "success";
  className?: string;
} & (DecorativeIcon | MeaningfulIcon);
```

Contract:

- Decorative default uses `aria-hidden`.
- Meaningful icon requires non-empty `label`.
- Icon color comes from current semantic token; no direct HEX.

## AppButton

```ts
export interface AppButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "color" | "style"
  > {
  tone?: "primary" | "neutral" | "danger";
  variant?: "solid" | "outline" | "ghost";
  size?: DsSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}
```

Contract:

- Default: primary/solid/md.
- Accessible name comes from children.
- Loading sets `aria-busy`, prevents repeated action and retains stable width.
- Applicable control height never below 44 CSS px.

## AppIconButton

```ts
export interface AppIconButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "color" | "style"
  > {
  icon: LucideIcon;
  label: string;
  tone?: "primary" | "neutral" | "danger";
  variant?: "solid" | "outline" | "ghost";
  size?: DsSize;
  loading?: boolean;
}
```

Contract:

- Non-empty `label` required and becomes accessible name.
- Hit area ≥44×44 CSS px for every public size.
- Loading/disabled never invokes click.

## AppCard

```ts
export interface AppCardProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "color" | "style"
  > {
  surface?: "default" | "subtle";
  elevation?: "none" | "raised";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}
```

Contract:

- `interactive=true` requires keyboard semantics and accessible label supplied by consumer.
- No heavy shadow for repeated list rows.
- Cards do not create nested scroll containers.

## AppBadge

```ts
export interface AppBadgeProps {
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}
```

Contract:

- Tone is semantic; raw color/background props do not exist.
- Long text wraps or truncates only according to documented catalog scenario.
- Status meaning cannot rely on color alone.

## AppDivider

```ts
export interface AppDividerProps {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "strong";
  decorative?: boolean;
  className?: string;
}
```

Contract:

- Decorative divider hidden from assistive technology.
- Vertical divider requires parent-defined height; component does not force layout.

## AppSkeleton

```ts
export interface AppSkeletonProps {
  shape?: "text" | "rectangle" | "circle";
  size?: "sm" | "md" | "lg";
  lines?: number;
  className?: string;
}
```

Contract:

- Skeleton itself is `aria-hidden`; containing region owns `aria-busy`.
- Deterministic dimensions; no random width.
- Reduced motion disables shimmer animation.

## AppTextField

```ts
export interface AppTextFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "color" | "size" | "style" | "onChange"
  > {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: "md" | "lg";
  state?: "default" | "error";
  helperText?: string;
  errorText?: string;
  leadingIcon?: LucideIcon;
  trailingAction?: React.ReactNode;
}
```

Contract:

- Visible label required; placeholder không thay label.
- Error state links message via `aria-describedby` and exposes `aria-invalid`.
- Input font size prevents mobile focus zoom without changing global input selectors.
- Keyboard and autofill native props pass through.

## AppSearchField

```ts
export interface AppSearchFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "color" | "size" | "style" | "onChange"
  > {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
  size?: "md" | "lg";
}
```

Contract:

- Default label: `Tìm kiếm`; may be visually hidden but remains accessible.
- Clear action appears only when value non-empty, has accessible name, and returns focus to input.
- No internal debounce, request sequencing or result fetching.
- Loading state announces progress without blocking typing.

## Contract tests required for every component

- Default render.
- Every variant/size/state.
- Accessible role/name and keyboard interaction.
- Ref and event forwarding.
- Disabled/loading single-action behavior.
- Long Vietnamese text and large numeric content.
- Reduced-motion branch where applicable.
- Rejection/absence of raw visual props in public TypeScript API.
