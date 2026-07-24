# Design System Foundations

**Contract version**: 1.0-draft  
**Theme scope**: Light theme  
**Runtime scope**: UI Catalog và các màn hình V2 tương lai  
**Production scope hiện tại**: Không migration màn hình production

## Mục tiêu

Foundation cung cấp một ngôn ngữ hình ảnh có semantic rõ ràng cho toàn bộ
Design System. Component và màn hình V2 chọn vai trò như `text-secondary` hoặc
`surface-subtle`; không tự chọn mã màu, kích thước, shadow hoặc duration.

Foundation phải đồng thời:

- giữ nguyên giao diện Legacy chưa migration;
- dùng namespace riêng, không ghi đè token hiện tại;
- hỗ trợ PWA, safe area, bàn phím và reduced motion;
- tạo một nguồn runtime duy nhất cho CSS component và Tailwind aliases;
- cho phép kiểm tra tự động mọi reference và visual literal.

## Ranh giới kiến trúc

### Ionic sở hữu application shell

Ionic tiếp tục sở hữu:

- `IonApp`, router, router outlet và tabs;
- `IonPage`, `IonContent` và vùng cuộn chính;
- navigation lifecycle, back stack và page transition;
- modal, popover và overlay;
- safe area, virtual keyboard và Capacitor integration.

Design System chỉ sở hữu visual foundations và leaf components. Không tạo page,
router, tab, overlay hoặc safe-area layer thứ hai.

### CVA là component engine

Engine được chọn là stack sẵn có:

- `class-variance-authority`;
- Tailwind CSS;
- `clsx` và `tailwind-merge` qua shared `cn()`.

`konsta@4.0.1` đã bị loại vì Tailwind plugin thêm selector toàn cục như
`:root`, `*`, `body`, `.ios` và `.md`, làm mất style isolation. Quyết định và
số đo nằm trong [dependency-report.md](./dependency-report.md).

Engine là implementation detail. Consumer không import CVA, Tailwind helper hoặc
primitive engine từ public API.

## Namespace và activation boundary

| Layer | Quy ước | Trách nhiệm |
|---|---|---|
| Runtime token | `--ds-*` | Giá trị semantic duy nhất |
| Tailwind alias | `ds-*` | Tham chiếu `var(--ds-*)`; không lặp raw value |
| Component class | `.ds-*` | Style nội bộ của Design System |
| Activation root | `.ds-root` | Giới hạn Ionic mapping và composition mới |
| Public import | `@/design-system` | Entry point duy nhất cho feature code |

Foundation không được khai báo selector global mới:

```css
/* Cấm */
:root {}
html {}
body {}
* {}
button {}
input {}
ion-item {}
```

Mapping cần tương tác với Ionic phải bắt đầu từ `.ds-root`:

```css
/* Đúng */
.ds-root {
  --ion-background-color: var(--ds-color-background-default);
}
```

## Nguồn foundation

| File | Nội dung được phép |
|---|---|
| `tokens.css` | Brand, background, surface, text, border, status, spacing, radius, layout và safe area |
| `typography.css` | Font family, weight, size, line height và letter spacing |
| `motion.css` | Duration, easing và reduced-motion override |
| `elevation.css` | Border/elevation/shadow semantic |
| `ionic-theme.css` | Mapping từ Ionic variables sang `--ds-*`, chỉ dưới `.ds-root` |
| `index.css` | Compose các file foundation; không khai báo thêm Tailwind root |

Raw visual values chỉ được khai báo trong `tokens.css`, `typography.css`,
`motion.css` và `elevation.css`. `ionic-theme.css`, component CSS, catalog và
feature code chỉ được reference token.

## Semantic token catalog

Tên cụ thể trong mỗi nhóm phải mô tả vai trò, không mô tả raw value. Thay đổi
raw value của một vai trò không buộc consumer đổi code.

| Nhóm | Mục đích | Được dùng cho | Không được dùng cho |
|---|---|---|---|
| `--ds-color-brand-*` | Nhận diện thương hiệu và primary action | Primary controls, selected emphasis, brand affordance | Status danger/success hoặc decoration tùy ý |
| `--ds-color-background-*` | Nền cấp ứng dụng/page | Page background trong `.ds-root` | Card, modal hoặc list row nếu đã có surface role |
| `--ds-color-surface-*` | Các lớp nội dung nổi trên background | Card, field, panel, subtle grouping | Page background hoặc status meaning |
| `--ds-color-text-*` | Thứ bậc nội dung | Primary, secondary, disabled, inverse text | Fill/background hoặc border |
| `--ds-color-border-*` | Phân tách và focus boundary | Divider, field border, strong border, focus ring mapping | Text hoặc surface fill |
| `--ds-color-status-*` | Trạng thái semantic | Info, success, warning, danger feedback | Brand decoration hoặc trạng thái chỉ truyền bằng màu |
| `--ds-font-*` | Typography semantic | Display, title, heading, body, label, caption | Hard-coded font size/line height trong component |
| `--ds-space-*` | Rhythm và khoảng cách | Gap, padding, margin trong component contract | Giá trị spacing tùy ý |
| `--ds-radius-*` | Shape semantic | Control, card, pill/circle theo contract | Raw radius hoặc shape riêng theo màn hình |
| `--ds-shadow-*` | Elevation semantic | Raised card, modal/FAB boundary khi được phép | Shadow lớn trên mỗi list row |
| `--ds-motion-*` | Feedback duration/easing | Opacity, transform và color feedback | `transition: all` hoặc layout animation nặng |
| `--ds-layout-*` | Kích thước và composition chuẩn | Content width, control size, touch target | Override vùng cuộn hoặc Ionic page lifecycle |
| `--ds-safe-area-*` | Bridge tới inset hiện có | Padding/inset trong `.ds-root` khi shell yêu cầu | Tạo safe-area owner thứ hai |

### Color

Allowed:

- Chọn token theo ý nghĩa nội dung.
- Kết hợp status color với text/icon mô tả trạng thái.
- Dùng contrast pair đã được duyệt.

Forbidden:

- HEX, RGB, HSL hoặc named color trong component/feature code.
- Dùng opacity để tạo tone mới ngoài contract.
- Dùng brand color thay cho warning/danger.
- Dựa vào màu làm tín hiệu trạng thái duy nhất.

### Typography

Scale semantic:

- `display`: số liệu hoặc headline nổi bật hiếm dùng;
- `title`: tiêu đề page/section chính;
- `heading`: tiêu đề group/card;
- `body`: nội dung mặc định;
- `label`: label control và action;
- `caption`: metadata phụ.

Allowed:

- Caller chọn element HTML đúng semantic độc lập với visual variant.
- Line height giữ được tiếng Việt có dấu và font scaling.
- Input mobile dùng cỡ chữ tránh focus zoom nhưng không sửa global `input`.

Forbidden:

- Suy ra tự động `h1` chỉ vì variant là `display`.
- Raw `font-size`, `line-height`, `font-weight` trong component.
- Ép một font global lên `.ios`, `.md`, `body` hoặc Ionic shell.

### Spacing và layout

Allowed:

- Chọn spacing token phù hợp density và hierarchy.
- Một page có đúng một vùng cuộn chính do Ionic shell sở hữu.
- Parent sở hữu kích thước composition như chiều cao của vertical divider.

Forbidden:

- Spacing tùy ý để sửa một màn hình.
- Nested `overflow-y-auto` hoặc `overflow-y-scroll` trong card/list component.
- Virtualization mặc định cho list nhỏ.
- Component leaf tự đặt page width, viewport height hoặc scroll ownership.

### Radius và elevation

Allowed:

- Radius theo shape contract.
- Border thay cho shadow trên repeated list row.
- Elevation thấp cho card chính; elevation cao hơn chỉ cho overlay/FAB do shell
  hoặc pattern tương ứng sở hữu.

Forbidden:

- Raw `border-radius`.
- Shadow blur lớn trên hàng trăm item.
- Truyền `shadow`, `elevation` hoặc `background` tùy ý ngoài public union.

### Motion

Allowed:

- Chỉ animate `transform`, `opacity` và color feedback khi phù hợp.
- Primary action phản hồi ngay; animation không chặn action.
- Mọi nonessential duration về `0ms` trong
  `prefers-reduced-motion: reduce`.

Forbidden:

- `transition: all`.
- Animate liên tục `width`, `height`, `top`, `left`, margin, padding hoặc
  box-shadow.
- Dùng chuyển động làm cách duy nhất truyền tải thông tin.
- Shimmer tiếp tục chạy khi người dùng bật reduced motion.

### Safe area

Allowed:

- Map Ionic variables sang `--ds-safe-area-*` dưới `.ds-root`.
- Leaf component dùng safe-area token khi component contract yêu cầu.
- Xác minh trên PWA standalone và thiết bị thật.

Forbidden:

- Ghi đè safe-area variable global.
- Bọc app bằng provider/page layer tạo safe-area thứ hai.
- Hard-code inset cho một model thiết bị.

## Cách sử dụng

### Trong Design System component

```css
.ds-button {
  min-block-size: var(--ds-layout-control-min-height);
  border-radius: var(--ds-radius-control);
  transition:
    transform var(--ds-motion-fast) var(--ds-motion-easing-standard),
    background-color var(--ds-motion-normal)
      var(--ds-motion-easing-standard);
}
```

### Trong feature code

```tsx
import { AppButton, AppText } from "@/design-system";

export function SummaryAction() {
  return (
    <div className="grid gap-3">
      <AppText as="h2" variant="heading">
        Tổng quan
      </AppText>
      <AppButton>Lưu thay đổi</AppButton>
    </div>
  );
}
```

`className` chỉ dùng cho layout/composition như `grid`, `gap-*`, `col-span-*`,
`shrink-0`. Không dùng để đổi màu, typography, radius, shadow hoặc state style.

### Ví dụ bị cấm

```tsx
// Raw visual override
<AppButton className="bg-[#317EFB] rounded-[14px] shadow-xl">
  Lưu
</AppButton>

// Bypass public boundary
import { AppButton } from "@/design-system/primitives/AppButton";

// Primitive engine trong feature code
import { cva } from "class-variance-authority";
```

## Accessibility foundation

- Text và control contrast đạt WCAG 2.1 AA.
- Interactive target tối thiểu 44 × 44 CSS px.
- Focus indicator luôn nhìn thấy; không xóa outline nếu chưa có semantic
  replacement.
- Content dài, tiếng Việt có dấu, số tiền lớn và font scaling không mất nghĩa.
- Disabled state không chỉ thay đổi opacity; semantic disabled phải tồn tại.
- Reduced motion được áp dụng ở token layer.
- Safe area, virtual keyboard, back gesture và screen reader cần real-device
  verification trước khi component chuyển sang `stable`.

## Kiểm tra bắt buộc

Foundation contract phải chặn:

- thiếu một semantic category;
- custom property không bắt đầu bằng `--ds-`;
- reference tới token chưa khai báo;
- raw visual literal ngoài approved token sources;
- selector global hoặc unscoped Ionic selector;
- Ionic mapping không trỏ tới `--ds-*`;
- thiếu reduced-motion override;
- duplicate Tailwind root trong `index.css`.

## Breaking-change policy

Breaking change gồm:

- rename, remove hoặc thay đổi semantic meaning của token;
- đổi default role khiến cùng consumer hiển thị ý nghĩa khác;
- chuyển token sang namespace khác;
- mở rộng selector scope ra ngoài `.ds-root`;
- thay đổi ownership của scroll, safe area, keyboard hoặc Ionic shell;
- đổi public import boundary.

Mọi breaking change phải:

1. Cập nhật contract test, tài liệu và UI Catalog trong cùng change.
2. Ghi rõ consumer bị ảnh hưởng và migration path.
3. Không đổi âm thầm màn hình Legacy hoặc màn hình V2 ngoài scope.
4. Giữ alias/deprecation window khi consumer đã tồn tại, trừ lỗi bảo mật hoặc
   accessibility nghiêm trọng.
5. Chỉ xóa token cũ trong cleanup task riêng sau khi mọi consumer đã migration
   và ít nhất một release ổn định.

Thêm token semantic mới có thể là non-breaking khi không đổi default, selector
scope hoặc meaning của token hiện có. Raw-value refinement chỉ non-breaking khi
contrast, behavior và approved visual review vẫn đạt.
