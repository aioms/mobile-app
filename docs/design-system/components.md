# Design System Components

**Contract version**: 1.0-draft  
**Public import**: `@/design-system`  
**Component engine**: Konsta UI + Tailwind  
**Scope**: Đúng 10 base components, wrap Konsta UI nhưng giữ nguyên API contract

## Public boundary

Feature code và UI Catalog chỉ import từ public barrel:

```tsx
import {
  AppBadge,
  AppButton,
  AppCard,
  AppDivider,
  AppIcon,
  AppIconButton,
  AppSearchField,
  AppSkeleton,
  AppText,
  AppTextField,
} from "@/design-system";
```

Không được:

```tsx
// Deep import khóa consumer vào cấu trúc nội bộ
import { AppButton } from "@/design-system/primitives/AppButton";

// Engine import trong feature code
import { cva } from "class-variance-authority";

// Dependency nội bộ (chỉ wrapper được phép import)
import { Button } from "konsta/react";
```

Public props không expose CVA type, raw color, background, radius, shadow hoặc
unrestricted `style`. `className` chỉ dành cho layout/composition; review và
visual lint chặn visual override.

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

Chỉ shared types và 10 component contracts được export. Internal variant maps,
CVA recipes và helper types không thuộc public API.

## Quy tắc chung

- Interactive component forward ref tới native element công bố.
- Native event, relevant `aria-*` và `data-*` được forward.
- Disabled/loading chặn action lặp.
- Touch target phù hợp không nhỏ hơn 44 × 44 CSS px.
- Focus indicator nhìn thấy được.
- Motion tôn trọng `prefers-reduced-motion`.
- `AppTextField` và `AppSearchField` là controlled components.
- Field không fetch API, debounce, sequence request hoặc chứa business
  validation.
- Component không sở hữu page scroll, router, overlay, safe area hoặc keyboard
  lifecycle.

## State matrix

`—` nghĩa là state không thuộc component contract, không phải state bị ẩn bằng
CSS.

| Component | Default | Pressed | Focused | Disabled | Loading | Error |
|---|---:|---:|---:|---:|---:|---:|
| AppText | ✓ | — | — | tone | — | danger tone |
| AppIcon | ✓ | — | — | — | — | danger tone |
| AppButton | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| AppIconButton | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| AppCard | ✓ | interactive | interactive | — | — | — |
| AppBadge | ✓ | — | — | — | — | danger tone |
| AppDivider | ✓ | — | — | — | — | — |
| AppSkeleton | ✓ | — | — | — | parent busy | — |
| AppTextField | ✓ | — | ✓ | native | — | ✓ |
| AppSearchField | ✓ | — | ✓ | native | ✓ | — |

Selected state không được mô phỏng bằng component không có selected contract.
Screen/pattern tương lai phải dùng public API được bổ sung và review riêng.

## AppText

### Mục đích

Typography semantic, tách visual variant khỏi HTML semantics.

### API

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

Defaults: `as="span"`, `variant="body"`, `tone="primary"`.

### Usage

```tsx
<AppText as="h2" variant="heading">
  Chi tiết đơn hàng
</AppText>
```

### Accessibility và giới hạn

- Caller chọn heading level đúng; visual variant không tự đổi element.
- `truncate` phải giữ full critical content qua accessible name hoặc `title`.
- `disabled`, `danger` và `success` là text tone, không thay native state.
- Không nhận `style`, raw `color` hoặc variant ngoài union.

## AppIcon

### Mục đích

Lucide icon có size/tone semantic và contract rõ giữa decorative với meaningful.

### API

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

### Usage

```tsx
<AppIcon icon={Search} />
<AppIcon
  icon={AlertTriangle}
  decorative={false}
  label="Đơn hàng cần xử lý"
  tone="danger"
/>
```

### Accessibility và giới hạn

- Decorative là default và dùng `aria-hidden`.
- Meaningful icon dùng role `img` và non-empty accessible `label`.
- Empty meaningful label bị từ chối.
- Ref forward trực tiếp tới `SVGSVGElement`; không thêm wrapper.
- Không nhận raw color hoặc inline style.

## AppButton

### Mục đích

Primary text action có semantic visual, native button behavior và single-action
guard.

### API

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

Defaults: `tone="primary"`, `variant="solid"`, `size="md"`.

### Usage

```tsx
<AppButton
  type="submit"
  leadingIcon={Save}
  loading={isSaving}
  onClick={save}
>
  Lưu đơn
</AppButton>
```

### States và accessibility

- Native pressed/focus/disabled behavior được giữ.
- Loading đặt `aria-busy="true"`, disable action và giữ accessible name/content
  ổn định.
- Disabled và loading không gọi handler dù người dùng tap nhiều lần.
- Mọi applicable size có control height tối thiểu 44 CSS px.
- Accessible name đến từ `children`; icon slots là decorative.
- Ref forward tới `HTMLButtonElement`; native attributes/events được giữ.

### Giới hạn

- Không nhận raw `color`, `style` hoặc custom visual variant.
- `fullWidth` chỉ điều khiển composition width, không đổi tone/state.

## AppIconButton

### Mục đích

Icon-only action với accessible name bắt buộc.

### API

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

### Usage

```tsx
<AppIconButton
  icon={Search}
  label="Mở tìm kiếm sản phẩm"
  variant="ghost"
/>
```

### States và accessibility

- Non-empty `label` bắt buộc và trở thành accessible name.
- Không nhận `children`.
- Mọi public size giữ hit area tối thiểu 44 × 44 CSS px.
- Loading đặt `aria-busy`, giữ label và disable action.
- Disabled/loading không gọi handler.
- Ref forward tới `HTMLButtonElement`.

## AppCard

### Mục đích

Surface container có padding/elevation semantic; không sở hữu scroll.

### API

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

### Usage

```tsx
<AppCard surface="subtle" padding="md">
  Nội dung tổng quan
</AppCard>

<AppCard
  interactive
  aria-label="Mở chi tiết khách hàng"
  onClick={openCustomer}
>
  Nguyễn Văn An
</AppCard>
```

### States và accessibility

- Default render là non-interactive `div`, không có button role/tab index.
- `interactive=true` thêm button semantics, `tabIndex=0`, Enter/Space
  activation và visible focus.
- Consumer phải cung cấp accessible label cho interactive card.
- Pointer và keyboard activation gọi action đúng một lần.
- Card không thêm `overflow-y` container.

### Giới hạn

- Không dùng heavy shadow cho repeated list row.
- Không nhận raw color/style/elevation.
- Không dùng interactive card thay cho native button khi action phù hợp
  `AppButton`.

## AppBadge

### Mục đích

Nhãn trạng thái/numeric metadata có semantic tone.

### API

```ts
export interface AppBadgeProps {
  tone: "neutral" | "info" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}
```

### Usage

```tsx
<AppBadge tone="warning">Chờ thanh toán</AppBadge>
```

### Accessibility và content

- `children` phải nói rõ trạng thái; không dựa vào màu.
- Long Vietnamese text và large money giữ nội dung có nghĩa.
- Tone bắt buộc; không có raw color/background prop.
- Badge không tự thêm live-region behavior. Caller/pattern sở hữu announcement
  nếu status thay đổi động.

## AppDivider

### Mục đích

Phân tách visual hoặc semantic theo hai orientation.

### API

```ts
export interface AppDividerProps {
  orientation?: "horizontal" | "vertical";
  tone?: "default" | "strong";
  decorative?: boolean;
  className?: string;
}
```

### Usage

```tsx
<AppDivider decorative />
<AppDivider decorative={false} orientation="vertical" />
```

### Accessibility và layout

- Decorative divider dùng `aria-hidden` và không expose separator role.
- Meaningful divider dùng role `separator` với `aria-orientation`.
- Caller phải chọn decorative/meaningful theo nội dung.
- Parent sở hữu chiều cao của vertical divider; component không ép layout hoặc
  inline style.

## AppSkeleton

### Mục đích

Loading placeholder deterministic, không truyền thông tin riêng.

### API

```ts
export interface AppSkeletonProps {
  shape?: "text" | "rectangle" | "circle";
  size?: "sm" | "md" | "lg";
  lines?: number;
  className?: string;
}
```

### Usage

```tsx
<section aria-busy="true" aria-label="Đang tải đơn hàng">
  <AppSkeleton shape="text" size="md" lines={4} />
</section>
```

### Accessibility và motion

- Skeleton luôn `aria-hidden`.
- Parent region sở hữu `aria-busy` và accessible loading context.
- `lines` tạo số dòng deterministic; không random width.
- Reduced motion loại shimmer animation.
- Skeleton không thay content bằng screen-reader announcement riêng.

## AppTextField

### Mục đích

Controlled text input có visible label, helper/error linkage và native mobile
keyboard/autofill support.

### API

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

### Usage

```tsx
<AppTextField
  label="Mã số thuế"
  value={taxCode}
  onValueChange={setTaxCode}
  autoComplete="off"
  inputMode="numeric"
  state={taxCodeError ? "error" : "default"}
  errorText={taxCodeError}
/>
```

### States và accessibility

- Visible `label` bắt buộc; placeholder không thay label.
- Controlled value được emit ngay qua `onValueChange`.
- Helper/error được nối bằng `aria-describedby`.
- Error đặt `aria-invalid="true"` và ưu tiên error copy.
- Native `disabled`, `required`, `name`, `autoComplete`, `inputMode`,
  `enterKeyHint` và keyboard events được forward.
- Ref forward tới `HTMLInputElement`.
- Input font size tránh mobile focus zoom trong phạm vi component; không sửa
  global input selector.
- `trailingAction` do composition sở hữu và phải có semantics riêng.

### Giới hạn

- Không nhận raw color/size/style hoặc native `onChange`.
- Không chạy business validation, format domain hoặc API side effect.

## AppSearchField

### Mục đích

Controlled search input có clear action, loading announcement và không sở hữu
search policy.

### API

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

Default accessible label: `Tìm kiếm`.

### Usage

```tsx
<AppSearchField
  label="Tìm sản phẩm"
  value={keyword}
  onValueChange={setKeyword}
  onClear={resetSearch}
  loading={isSearching}
/>
```

### States và accessibility

- Native input dùng searchbox role và accessible label.
- Clear action chỉ xuất hiện khi value khác rỗng, có accessible name, emit
  empty value, gọi optional `onClear` và trả focus về input.
- Loading dùng polite status announcement nhưng không disable typing.
- Native ref, focus/keyboard events và relevant input props được forward.

### Giới hạn

- Không debounce.
- Không fetch, sequence/cancel request hoặc lưu result.
- Không chứa empty/error/result UI.
- Controller của từng screen sở hữu search behavior.

## Contract test matrix

Mỗi component phải có:

- default render;
- mọi variant, size và state được công bố;
- accessible role/name;
- keyboard interaction khi interactive;
- ref và native event forwarding;
- disabled/loading single-action behavior khi áp dụng;
- long Vietnamese text và large numeric content khi áp dụng;
- reduced-motion branch khi có animation;
- compile-time rejection hoặc absence của raw visual props.

JSDOM không chứng minh layout, contrast, touch target hoặc safe area. UI Catalog,
Cypress/axe và real-device matrix vẫn là gate bắt buộc trước trạng thái
`stable`.

## Breaking-change policy

Breaking change gồm:

- remove/rename prop, variant, tone, size hoặc shared type;
- đổi default làm thay behavior/meaning;
- đổi DOM element, ARIA role/name hoặc ref target đã công bố;
- ngừng forward native event/attribute;
- đổi controlled component thành uncontrolled hoặc ngược lại;
- thêm business behavior như debounce/fetch vào field;
- cho phép raw visual override hoặc expose engine type;
- đổi public import khỏi `@/design-system`.

Quy trình bắt buộc:

1. Cập nhật source contract, contract tests, docs và UI Catalog cùng change.
2. Ghi rõ breaking status, consumer list và migration path.
3. Giữ compatibility/deprecation window khi component đã có consumer.
4. Không migrate hoặc sửa nhiều production screen trong component change.
5. Xóa API cũ trong cleanup task riêng sau ít nhất một release ổn định.

Thêm optional semantic variant có thể là non-breaking khi không đổi default,
accessibility, DOM/ref contract hoặc engine boundary. Bug fix về duplicate action,
focus hoặc accessible name được ưu tiên nhưng vẫn phải ghi migration note nếu
observable behavior thay đổi.
