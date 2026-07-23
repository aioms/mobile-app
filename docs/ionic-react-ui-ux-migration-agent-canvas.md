# Canvas: Kế hoạch migration UI/UX cho AI Agent

> Tài liệu này dùng làm nguồn sự thật duy nhất cho Codex, Cursor hoặc AI Agent khác khi migration giao diện ứng dụng Ionic React/TypeScript sang Design System mới mà không làm gián đoạn việc phát triển, sửa lỗi và hotfix.

---

## 1. Thông tin dự án

### Stack hiện tại

- Ionic React 8
- React 18
- TypeScript
- React Router 5
- Capacitor 7
- Tailwind CSS
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- Ionicons và Lucide React
- Ứng dụng chạy trên PWA, Android và iOS

### Bối cảnh

Ứng dụng hiện đang trộn:

- Ionic UI Components
- Tailwind utility classes
- CSS riêng theo màn hình
- Nhiều cách khai báo màu, radius, spacing, shadow và typography
- Nhiều biến thể search bar, card, badge, filter, header và FAB
- Một số màn hình có danh sách dài và nguy cơ giật lag trên PWA

### Mục tiêu

1. Xây dựng Design System nội bộ, ổn định và có thể mở rộng.
2. Migrate từng phần mà không rewrite toàn bộ ứng dụng.
3. Không làm ảnh hưởng đến business logic hiện tại.
4. Vẫn sửa bug, release feature và hotfix bình thường.
5. Giảm conflict Git và tránh branch migration tồn tại lâu.
6. Có feature flag và rollback nhanh cho từng màn hình.
7. Giữ Ionic làm app shell và platform behavior.
8. Cải thiện tính nhất quán, khả năng bảo trì và hiệu năng PWA.

---

## 2. Quyết định kiến trúc bắt buộc

### ADR-001: Giữ Ionic làm application shell

Các thành phần sau không được thay trong migration UI:

- `IonApp`
- `IonReactRouter`
- `IonRouterOutlet`
- `IonPage`
- `IonContent`
- `IonTabs`
- `IonModal`
- `IonPopover`
- `IonActionSheet`
- Capacitor plugins
- Navigation lifecycle và platform behavior

AI Agent không được thay Ionic Router bằng Framework7 Router hoặc một router khác.

### ADR-002: Không tích hợp Framework7 vào codebase hiện tại

Framework7 là một application framework đầy đủ, có router, page lifecycle và navigation stack riêng. Việc nhúng Framework7 vào Ionic làm tăng rủi ro xung đột.

**Không được:**

```text
Ionic App Shell
└── Framework7 App / View / Page / Router
```

### ADR-003: Konsta UI chỉ được dùng dưới dạng thử nghiệm có kiểm soát

Konsta UI không phải dependency mặc định của Design System.

Chỉ được thêm sau một spike riêng và phải chứng minh:

- Không xung đột CSS với Ionic
- Tương thích với React và Tailwind hiện tại
- Không tăng bundle vượt ngân sách
- Không ảnh hưởng page transition, scroll hoặc modal
- Có lợi rõ ràng hơn component nội bộ

### ADR-004: Design System nội bộ là nguồn visual chính

Kiến trúc mục tiêu:

```text
Ionic platform layer
├── Router
├── Page lifecycle
├── Scroll
├── Overlay
├── Safe area
├── Keyboard
└── Capacitor

Internal Design System
├── Foundations
├── Primitives
├── Components
├── Patterns
└── Screen composition
```

### ADR-005: Tailwind chỉ là công cụ triển khai

Tailwind không phải Design System.

Không được tạo UI mới bằng các giá trị tùy ý như:

```tsx
className="rounded-[19px] text-[#667182] shadow-[0_4px_18px_rgba(...)]"
```

Mọi màu, spacing, radius, shadow và typography phải đi qua token hoặc variant có tên.

---

## 3. Phạm vi và non-goals

### Trong phạm vi

- Design tokens
- Typography scale
- Spacing scale
- Radius
- Elevation
- Motion
- Icon rules
- UI primitives
- Reusable components
- Screen patterns
- Route-level feature flags
- Visual regression
- Performance profiling
- Migration từng màn hình

### Ngoài phạm vi

- Rewrite toàn bộ app
- Đổi state management
- Đổi backend/API
- Đổi router
- Nâng major framework trong cùng PR migration
- Refactor business logic không liên quan
- Đổi toàn bộ cấu trúc thư mục hiện tại ngay lập tức
- Thêm dark mode trong phase đầu
- Thêm animation phức tạp trước khi UI ổn định

---

## 4. Nguyên tắc migration

### 4.1 Strangler Pattern

Legacy UI và UI mới cùng tồn tại trong một thời gian:

```text
Legacy UI
   │
   ├── vẫn nhận bug fix
   ├── vẫn chạy production
   └── được thay dần bởi UI V2

UI V2
   │
   ├── dùng Design System mới
   ├── bật qua feature flag
   └── rollback độc lập
```

### 4.2 Branch by Abstraction

Business logic được tách khỏi view và được dùng chung:

```text
Legacy View ─┐
             ├── Shared Controller / Hook / Service
V2 View ─────┘
```

### 4.3 Vertical Slice

Migrate theo từng màn hình hoàn chỉnh, không thay tất cả button/card/input trên toàn app cùng lúc.

Tốt:

```text
Customer List V2
├── Header
├── Search
├── Filters
├── List item
├── FAB
├── Loading
├── Empty
└── Error
```

Không tốt:

```text
Thay tất cả button trong app
Thay tất cả card trong app
Thay tất cả input trong app
```

### 4.4 Small Pull Requests

Mỗi PR phải:

- Có một mục tiêu chính
- Có diff nhỏ và dễ review
- Không format file không liên quan
- Không rename diện rộng
- Không trộn business refactor với redesign
- Có rollback rõ ràng

---

## 5. Cấu trúc thư mục mục tiêu

```text
src/
├── components/
│   └── legacy/
│
├── design-system/
│   ├── foundations/
│   │   ├── tokens.css
│   │   ├── typography.css
│   │   ├── motion.css
│   │   ├── elevation.css
│   │   └── ionic-theme.css
│   │
│   ├── primitives/
│   │   ├── AppText/
│   │   ├── AppIcon/
│   │   ├── AppButton/
│   │   ├── AppIconButton/
│   │   ├── AppCard/
│   │   ├── AppBadge/
│   │   ├── AppDivider/
│   │   └── AppSkeleton/
│   │
│   ├── components/
│   │   ├── AppSearchField/
│   │   ├── AppTextField/
│   │   ├── AppSelectField/
│   │   ├── AppDateField/
│   │   ├── AppSegmentedControl/
│   │   ├── AppFilterButton/
│   │   ├── AppPageHeader/
│   │   └── AppFab/
│   │
│   ├── patterns/
│   │   ├── CustomerListItem/
│   │   ├── SupplierListItem/
│   │   ├── TransactionCard/
│   │   ├── InventoryAuditListItem/
│   │   ├── SummaryCard/
│   │   ├── EmptyState/
│   │   └── ErrorState/
│   │
│   ├── utils/
│   │   └── cn.ts
│   │
│   └── index.ts
│
├── features/
│   ├── customers/
│   │   ├── pages/
│   │   │   ├── CustomerListPageLegacy.tsx
│   │   │   └── CustomerListPageV2.tsx
│   │   ├── views/
│   │   ├── hooks/
│   │   └── services/
│   │
│   ├── suppliers/
│   ├── orders/
│   └── inventory/
│
├── ui-flags/
│   ├── flags.ts
│   └── useUiVersion.ts
│
└── dev/
    └── UIKitPage.tsx
```

Không yêu cầu AI Agent di chuyển toàn bộ code hiện tại sang cấu trúc này trong một lần.

---

## 6. Design tokens

### 6.1 Quy tắc đặt tên

Dùng semantic token, không dùng tên gắn với màu cụ thể.

Tốt:

```css
--ds-color-text-primary
--ds-color-surface-default
--ds-color-border-muted
--ds-color-status-success
```

Không tốt:

```css
--gray-700
--blue-500
--green-light
```

Token có thể tham chiếu primitive palette nội bộ, nhưng feature code chỉ được dùng semantic token.

### 6.2 Token tối thiểu

```css
:root {
  /* Brand */
  --ds-color-brand-primary: #1769e0;
  --ds-color-brand-primary-hover: #125bc5;
  --ds-color-brand-primary-soft: #eaf2ff;

  /* Background and surface */
  --ds-color-background-page: #f5f6fa;
  --ds-color-surface-default: #ffffff;
  --ds-color-surface-subtle: #f1f3f7;

  /* Text */
  --ds-color-text-primary: #101828;
  --ds-color-text-secondary: #667085;
  --ds-color-text-disabled: #98a2b3;
  --ds-color-text-inverse: #ffffff;

  /* Border */
  --ds-color-border-default: #e4e7ec;
  --ds-color-border-strong: #d0d5dd;

  /* Status */
  --ds-color-status-info: #1769e0;
  --ds-color-status-info-soft: #eaf2ff;
  --ds-color-status-success: #16a34a;
  --ds-color-status-success-soft: #ecfdf3;
  --ds-color-status-warning: #d99a00;
  --ds-color-status-warning-soft: #fff8e5;
  --ds-color-status-danger: #dc2626;
  --ds-color-status-danger-soft: #fef2f2;

  /* Spacing */
  --ds-space-1: 4px;
  --ds-space-2: 8px;
  --ds-space-3: 12px;
  --ds-space-4: 16px;
  --ds-space-5: 20px;
  --ds-space-6: 24px;
  --ds-space-8: 32px;
  --ds-space-10: 40px;

  /* Radius */
  --ds-radius-sm: 8px;
  --ds-radius-md: 12px;
  --ds-radius-lg: 16px;
  --ds-radius-xl: 20px;
  --ds-radius-full: 999px;

  /* Elevation */
  --ds-shadow-none: none;
  --ds-shadow-card:
    0 1px 2px rgb(16 24 40 / 4%),
    0 2px 8px rgb(16 24 40 / 5%);
  --ds-shadow-overlay:
    0 8px 24px rgb(16 24 40 / 14%);

  /* Motion */
  --ds-motion-fast: 120ms;
  --ds-motion-normal: 200ms;
  --ds-motion-slow: 300ms;
  --ds-easing-standard: cubic-bezier(0.2, 0, 0, 1);

  /* Layout */
  --ds-page-padding-x: 16px;
  --ds-control-height-sm: 36px;
  --ds-control-height-md: 44px;
  --ds-control-height-lg: 52px;
}
```

### 6.3 CSS safety rules

AI Agent không được thêm selector toàn cục kiểu:

```css
button {}
input {}
ion-card {}
ion-searchbar {}
```

Phải dùng class hoặc wrapper rõ ràng:

```css
.ds-button {}
.ds-search-field {}
.ds-card {}
```

---

## 7. Component model

### 7.1 Layer 1: Foundations

Không có React component:

- Tokens
- Typography
- Motion
- Elevation
- Ionic mappings
- Safe-area helpers

### 7.2 Layer 2: Primitives

Component nhỏ, không biết business domain:

- `AppText`
- `AppIcon`
- `AppButton`
- `AppIconButton`
- `AppCard`
- `AppBadge`
- `AppDivider`
- `AppSkeleton`

### 7.3 Layer 3: Components

Có behavior UI chung nhưng không biết domain:

- `AppSearchField`
- `AppTextField`
- `AppSelectField`
- `AppDateField`
- `AppSegmentedControl`
- `AppFilterButton`
- `AppPageHeader`
- `AppFab`

### 7.4 Layer 4: Patterns

Biết cấu trúc giao diện nghiệp vụ nhưng không fetch API:

- `CustomerListItem`
- `SupplierListItem`
- `TransactionCard`
- `SummaryCard`
- `InventoryAuditListItem`

### 7.5 Layer 5: Screens

Kết nối controller, route và business logic:

- `CustomerListPageV2`
- `SupplierListPageV2`
- `OrderListPageV2`
- `InventoryAuditPageV2`

---

## 8. Component contract

### Ví dụ: AppStatusBadge

```tsx
export type StatusBadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type StatusBadgeSize = "sm" | "md";

export type AppStatusBadgeProps = {
  tone: StatusBadgeTone;
  size?: StatusBadgeSize;
  children: React.ReactNode;
  className?: string;
};
```

Không cho phép feature truyền màu trực tiếp:

```tsx
// Không được
<AppStatusBadge
  color="#d99a00"
  background="#fff8e5"
>
  Chờ thanh toán
</AppStatusBadge>
```

Phải dùng semantic variant:

```tsx
<AppStatusBadge tone="warning">
  Chờ thanh toán
</AppStatusBadge>
```

### Ví dụ: AppButton bằng CVA

```tsx
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "font-medium",
    "transition-[transform,opacity,background-color]",
    "duration-[var(--ds-motion-fast)]",
    "focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      tone: {
        primary:
          "bg-[var(--ds-color-brand-primary)] text-white",
        neutral:
          "bg-[var(--ds-color-surface-subtle)] text-[var(--ds-color-text-primary)]",
        danger:
          "bg-[var(--ds-color-status-danger)] text-white",
      },
      size: {
        sm: "h-9 px-3 rounded-[var(--ds-radius-sm)]",
        md: "h-11 px-4 rounded-[var(--ds-radius-md)]",
        lg: "h-[52px] px-5 rounded-[var(--ds-radius-lg)]",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      tone: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);
```

---

## 9. Feature flag

### 9.1 Cấp độ flag

Flag được đặt ở cấp screen hoặc pattern lớn.

Tốt:

```tsx
export function CustomerListRoute() {
  const uiVersion = useUiVersion("customer-list");

  return uiVersion === "v2"
    ? <CustomerListPageV2 />
    : <CustomerListPageLegacy />;
}
```

Không tốt:

```tsx
{flag ? <NewButton /> : <OldButton />}
{flag ? <NewCard /> : <OldCard />}
{flag ? <NewInput /> : <OldInput />}
```

### 9.2 Flag config

```ts
export const uiFeatureFlags = {
  customerListV2:
    import.meta.env.VITE_UI_CUSTOMER_LIST_V2 === "true",

  supplierListV2:
    import.meta.env.VITE_UI_SUPPLIER_LIST_V2 === "true",

  supplierDetailV2:
    import.meta.env.VITE_UI_SUPPLIER_DETAIL_V2 === "true",

  orderListV2:
    import.meta.env.VITE_UI_ORDER_LIST_V2 === "true",

  inventoryAuditV2:
    import.meta.env.VITE_UI_INVENTORY_AUDIT_V2 === "true",
} as const;
```

### 9.3 Local QA override

```ts
export function getUiFlag(
  key: keyof typeof uiFeatureFlags,
): boolean {
  const params = new URLSearchParams(window.location.search);
  const override = params.get(key);

  if (override === "true") return true;
  if (override === "false") return false;

  return uiFeatureFlags[key];
}
```

---

## 10. Shared controller pattern

### Mục tiêu

Legacy UI và V2 dùng chung business logic để tránh sửa bug hai nơi.

```tsx
export function useCustomerListController() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<CustomerStatus>("all");

  const query = useCustomersQuery({
    keyword,
    status,
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    keyword,
    setKeyword,
    status,
    setStatus,
    reload: query.refetch,
  };
}
```

```tsx
export function CustomerListPageLegacy() {
  const controller = useCustomerListController();
  return <LegacyCustomerListView {...controller} />;
}

export function CustomerListPageV2() {
  const controller = useCustomerListController();
  return <CustomerListViewV2 {...controller} />;
}
```

AI Agent không được copy API logic sang V2 nếu đã có thể tái sử dụng.

---

## 11. Thứ tự migration đề xuất

### Phase 0: Audit

Kết quả bắt buộc:

- Danh sách màu đang dùng
- Danh sách typography
- Danh sách radius
- Danh sách shadow
- Danh sách spacing bất thường
- Danh sách component trùng lặp
- Danh sách màn hình có list dài
- Danh sách CSS global nguy hiểm
- Baseline screenshots
- Baseline performance

### Phase 1: Foundations

Thực hiện:

- `tokens.css`
- `typography.css`
- `motion.css`
- `elevation.css`
- `ionic-theme.css`
- `cn.ts`
- UI Kit route

Không migrate production screen trong phase này.

### Phase 2: Primitives

Thứ tự:

1. `AppText`
2. `AppIcon`
3. `AppButton`
4. `AppIconButton`
5. `AppCard`
6. `AppBadge`
7. `AppDivider`
8. `AppSkeleton`

### Phase 3: Components

Thứ tự:

1. `AppSearchField`
2. `AppFilterButton`
3. `AppSegmentedControl`
4. `AppPageHeader`
5. `AppFab`
6. `AppDateField`
7. `AppSelectField`

### Phase 4: Patterns

Thứ tự:

1. `CustomerListItem`
2. `SupplierListItem`
3. `SummaryCard`
4. `TransactionCard`
5. `InventoryAuditListItem`
6. `EmptyState`
7. `ErrorState`

### Phase 5: Screens

Thứ tự:

1. Customer List
2. Supplier List
3. Supplier Detail
4. Order / Receipt
5. Inventory Audit
6. Bottom navigation

### Phase 6: Performance

- Virtualize list dài
- Route-level lazy loading
- Đo render
- Giảm DOM
- Giảm shadow
- Xóa nested scroll
- Kiểm tra animation
- Kiểm tra memory
- Kiểm tra PWA standalone

### Phase 7: Legacy cleanup

Chỉ thực hiện khi:

- V2 đã chạy production ổn định
- Đã qua ít nhất một chu kỳ release
- Không còn rollback về Legacy
- Không còn import Legacy từ screen V2
- Visual regression và functional tests ổn định

---

## 12. Thứ tự màn hình cụ thể

### 12.1 Customer List

Mục đích: pilot screen.

Phạm vi:

- Header
- Search field
- Filter chips
- Customer list item
- FAB
- Loading
- Empty
- Error

Không thay:

- API
- Navigation path
- Customer model
- Business permissions
- Pagination contract

### 12.2 Supplier List

Tái sử dụng:

- Search field
- Filter button
- List structure
- Status/money formatting
- Page spacing

### 12.3 Supplier Detail

Tái sử dụng:

- Summary card
- Search field
- Filter bar
- Date range
- Transaction card
- Status badge

### 12.4 Order / Receipt

Tái sử dụng:

- Segmented control
- Search field
- Filter
- Status badge
- Money text
- List item
- FAB

### 12.5 Inventory Audit

Tập trung:

- Filter consistency
- Long list performance
- Numeric emphasis
- Difference status
- Virtualization nếu cần

### 12.6 Bottom Navigation

Thực hiện sau cùng vì ảnh hưởng toàn ứng dụng.

---

## 13. Performance rules

### 13.1 Không dùng transition toàn bộ

Không được:

```css
transition: all 300ms;
```

Được:

```css
transition:
  transform var(--ds-motion-fast) var(--ds-easing-standard),
  opacity var(--ds-motion-fast) var(--ds-easing-standard),
  background-color var(--ds-motion-normal) var(--ds-easing-standard);
```

### 13.2 Ưu tiên transform và opacity

Không animate liên tục:

- width
- height
- top
- left
- margin
- padding
- box-shadow

### 13.3 Shadow budget

- List item: ưu tiên border, không shadow
- Card chính: tối đa elevation 1
- Modal/FAB: elevation 2
- Không dùng shadow blur lớn cho hàng trăm item

### 13.4 Scroll

Mỗi page chỉ nên có một scroll container chính.

Tránh:

```text
IonContent scroll
└── div overflow-y-auto
    └── list overflow-y-scroll
```

### 13.5 List

- Dùng key ổn định
- Không dùng index nếu list có thể reorder
- Không memo hóa toàn app
- Profile trước khi thêm `React.memo`
- Virtualize khi list thực sự dài
- Không virtualize list nhỏ chỉ để “tối ưu”

### 13.6 Bundle

Không thêm dependency UI mới nếu chưa có báo cáo:

- Kích thước dependency
- Kích thước route chunk
- Tree-shaking
- CSS footprint
- Lý do không thể tự triển khai trong Design System

---

## 14. Testing matrix

### Functional

- Search
- Filter
- Sort
- Pagination
- Pull-to-refresh
- Infinite scroll
- Back navigation
- Modal
- Empty
- Error
- Offline
- Retry
- Permission denied

### Visual

- iPhone viewport
- Android viewport
- Tablet viewport
- PWA standalone
- Text dài
- Tên tiếng Việt có dấu
- Số tiền lớn
- Badge dài
- Loading state
- Disabled state
- Error state

### Interaction

- Tap target tối thiểu
- Keyboard không che input
- Safe area
- Back gesture
- Scroll khi bàn phím mở
- Focus visibility
- Screen reader labels
- Reduced motion

### Performance

- Initial page render
- Search input response
- Filter response
- Scroll FPS
- Long tasks
- DOM node count
- Route bundle
- Memory khi chuyển trang nhiều lần

---

## 15. Viewport baseline

Dùng tối thiểu:

```text
390 × 844
393 × 852
412 × 915
768 × 1024
```

Các màn hình baseline:

- Customer List
- Supplier List
- Supplier Detail
- Order / Receipt
- Inventory Audit
- Bottom tabs
- Modal / Filter panel

---

## 16. Definition of Ready

Task chỉ được giao cho AI Agent khi có:

- Screen hoặc component rõ ràng
- File path liên quan
- Behavior hiện tại
- Behavior không được thay đổi
- Screenshot hoặc mô tả visual
- Acceptance criteria
- Feature flag name
- Test command
- Rollback strategy
- Out-of-scope rõ ràng

---

## 17. Definition of Done

### Code

- TypeScript không lỗi
- Không thêm `any` không cần thiết
- Không có import vòng
- Không import Legacy vào V2
- Không có giá trị visual tùy ý
- Không có global CSS nguy hiểm
- Không format file không liên quan

### Functional

- Behavior cũ được giữ nguyên
- Loading, empty và error state đầy đủ
- Navigation đúng
- Filter/search đúng
- Permission và error handling không bị mất

### Visual

- Chỉ dùng token
- Typography đúng scale
- Spacing đúng scale
- Radius đúng scale
- Shadow đúng elevation
- Icon đồng nhất
- Safe area đúng

### Performance

- Không tạo nested scroll mới
- Không tăng render bất thường
- Không thêm animation layout nặng
- Không tăng bundle vượt budget
- List dài được profile

### Rollback

- Có flag
- Legacy vẫn build
- V2 có thể tắt độc lập
- Có hướng dẫn rollback

### Documentation

- Cập nhật UI Kit
- Cập nhật component API
- Ghi rõ breaking change nếu có
- Có screenshot trước/sau

---

## 18. Quy tắc bắt buộc cho AI Agent

### Agent phải làm

1. Đọc task spec trước khi sửa code.
2. Đọc file liên quan và các import trực tiếp.
3. Xác định business behavior phải giữ.
4. Viết implementation plan ngắn.
5. Thực hiện diff nhỏ nhất có thể.
6. Dùng component/token có sẵn trước khi tạo mới.
7. Chạy typecheck, lint và test liên quan.
8. Báo cáo file đã đổi.
9. Báo cáo rủi ro và phần chưa xác minh.
10. Đề xuất PR tiếp theo, không tự mở rộng scope.

### Agent không được làm

- Rewrite cả màn hình khi task chỉ yêu cầu một component
- Đổi API contract
- Đổi route path
- Đổi state management
- Nâng major dependency
- Cài UI framework mới
- Xóa Legacy
- Bật flag production
- Sửa global CSS ngoài phạm vi
- Rename nhiều file
- Format toàn repository
- Thêm animation phức tạp
- Thêm màu/radius/shadow tùy ý
- Sửa bug không liên quan
- “Cleanup” code ngoài phạm vi

### Khi thiếu thông tin

Agent phải dừng và hỏi, không được tự suy đoán nếu thiếu:

- Business rule
- Route behavior
- Permission behavior
- API response
- Feature flag
- Expected empty/error state
- Component ownership

---

## 19. Quy ước PR

### Tên branch

```text
chore/ds-foundations
feat/ds-app-button
feat/ds-search-field
refactor/customer-list-controller
feat/customer-list-v2
perf/customer-list-virtualization
cleanup/customer-list-legacy
```

### Tên PR

```text
[DS] Add semantic color and spacing tokens
[DS] Add AppSearchField
[UI V2] Add Customer List behind feature flag
[PERF] Virtualize Customer List
[CLEANUP] Remove Customer List Legacy UI
```

### Kích thước PR

Khuyến nghị:

- 1–8 file thay đổi cho primitive
- 1–15 file thay đổi cho screen slice
- Không có hàng trăm file bị format
- Không lockfile change nếu không thêm dependency

---

## 20. Mẫu task cho Codex/Cursor

```md
# Task: [Tên task]

## Mục tiêu

[Một câu mô tả kết quả cần đạt.]

## Bối cảnh

- App: Ionic React + TypeScript
- UI hiện tại: Legacy
- UI mục tiêu: Internal Design System
- Screen/Component: [...]
- Feature flag: [...]

## File được phép sửa

- `src/...`
- `src/...`

## File không được sửa

- `src/router/...`
- `src/services/...`
- `package.json`
- Các file ngoài phạm vi

## Behavior phải giữ nguyên

- [...]
- [...]
- [...]

## Yêu cầu visual

- Dùng token [...]
- Dùng component [...]
- Không dùng màu hex trực tiếp
- Không thêm shadow mới ngoài elevation hiện có

## Yêu cầu kỹ thuật

- Không đổi API
- Không đổi route
- Không đổi business logic
- Không thêm dependency
- Không tạo nested scroll
- Có feature flag
- Legacy vẫn hoạt động

## Acceptance criteria

- [ ] Typecheck pass
- [ ] Lint pass
- [ ] Test pass
- [ ] UI Kit được cập nhật
- [ ] Feature flag hoạt động
- [ ] Legacy fallback hoạt động
- [ ] Không có visual literal
- [ ] Không có global CSS selector mới

## Test commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Manual QA

1. [...]
2. [...]
3. [...]

## Out of scope

- [...]
- [...]

## Output mong muốn từ Agent

1. Implementation plan
2. Danh sách file thay đổi
3. Tóm tắt implementation
4. Kết quả test
5. Rủi ro còn lại
6. Hướng rollback
```

---

## 21. Prompt hệ thống đề xuất cho AI Agent

```md
Bạn đang làm việc trên một ứng dụng Ionic React/TypeScript đang được migration dần sang Internal Design System.

Nguyên tắc cao nhất:

1. Giữ nguyên business behavior.
2. Không rewrite ngoài phạm vi.
3. Không thay Ionic app shell, router hoặc page lifecycle.
4. Không thêm Framework7.
5. Không thêm UI dependency nếu task không yêu cầu rõ.
6. Dùng semantic tokens và component variants.
7. Không dùng màu, radius, spacing hoặc shadow tùy ý.
8. Không tạo global CSS selector có thể ảnh hưởng Legacy UI.
9. Mọi screen V2 phải có feature flag và Legacy fallback.
10. Không xóa Legacy trước khi có task cleanup riêng.
11. Không trộn UI migration với API/state/refactor không liên quan.
12. Giữ diff nhỏ, dễ review và dễ rollback.
13. Trước khi code, hãy nêu kế hoạch ngắn.
14. Sau khi code, hãy báo cáo test, rủi ro và file đã thay đổi.
15. Khi thiếu business context, hãy hỏi thay vì đoán.

Ưu tiên triển khai:

Internal Design System > Ionic visual customization > component nội bộ mới > dependency bên ngoài.

Ionic tiếp tục chịu trách nhiệm cho navigation, lifecycle, scroll, safe area, keyboard, overlay và Capacitor.
```

---

## 22. Prompt cho task audit đầu tiên

```md
Audit UI hiện tại để chuẩn bị migration sang Internal Design System.

Chỉ đọc và báo cáo, không sửa code.

Hãy tìm:

1. Tất cả màu hex/rgb/hsl đang dùng trực tiếp.
2. Các giá trị border-radius.
3. Các giá trị box-shadow.
4. Các font-size/font-weight/line-height.
5. Các spacing tùy ý.
6. Các biến thể search field.
7. Các biến thể card.
8. Các biến thể badge/status.
9. Các biến thể header/FAB/filter.
10. Các global CSS selector có thể gây side effect.
11. Các component tương tự nhưng trùng chức năng.
12. Các màn hình có list dài hoặc nested scroll.
13. Các dependency UI/icon đang trùng vai trò.

Output:

- Bảng inventory
- Nhóm giá trị có thể hợp nhất thành token
- Component candidates
- Rủi ro migration
- Thứ tự migration đề xuất
- Không thay đổi file
```

---

## 23. Prompt cho task tạo primitive

```md
Tạo `AppStatusBadge` trong Internal Design System.

Phạm vi:

- Thêm component
- Thêm test
- Thêm ví dụ trong UI Kit

Variants:

- neutral
- info
- success
- warning
- danger

Sizes:

- sm
- md

Ràng buộc:

- Không truyền color/background tùy ý
- Chỉ dùng semantic tokens
- Không sửa screen production
- Không thêm dependency
- Không sửa global CSS
- Không đổi component Legacy
- Dùng TypeScript strict
- Hỗ trợ className
- Có accessible text contrast

Acceptance:

- Typecheck pass
- Lint pass
- UI Kit hiển thị tất cả tone/size/state
- Không có literal visual ngoài token foundation
```

---

## 24. Prompt cho task migrate screen

```md
Migrate Customer List sang UI V2 sau feature flag.

Giữ nguyên:

- Route
- API
- Search behavior
- Filter behavior
- Pagination
- Permissions
- Customer model
- Navigation khi chọn customer
- FAB action

Thực hiện:

1. Tách shared controller nếu chưa có.
2. Tạo `CustomerListPageV2`.
3. Dùng:
   - AppPageHeader
   - AppSearchField
   - AppFilterButton
   - CustomerListItem
   - AppFab
   - AppSkeleton
   - EmptyState
   - ErrorState
4. Thêm flag `customerListV2`.
5. Legacy vẫn là fallback.
6. Không xóa hoặc rename Legacy.
7. Không thay business logic.
8. Không thêm dependency.
9. Không virtualize trong task này, trừ khi được yêu cầu riêng.

Manual QA:

- Search
- Filter
- Scroll
- Loading
- Empty
- Error
- Back
- Customer detail navigation
- FAB
- PWA standalone
```

---

## 25. Prompt cho performance pass

```md
Profile Customer List V2 và tối ưu chỉ các bottleneck đã đo được.

Không thay visual design.

Đo:

- Render count
- Input response
- Scroll long tasks
- DOM nodes
- Route bundle
- Memory
- List size threshold

Chỉ thực hiện tối ưu có bằng chứng.

Có thể cân nhắc:

- React.memo cho list row
- useMemo cho derived list
- useCallback khi prop identity gây render
- Virtualization cho list dài
- Debounce search nếu behavior cho phép
- Route lazy loading
- Giảm shadow
- Loại nested scroll

Không được:

- Memo hóa toàn app
- Thêm virtualization cho list nhỏ
- Thay API
- Đổi UX search
- Thêm dependency nếu chưa có so sánh rõ
```

---

## 26. Chiến lược hotfix trong thời gian migration

### Bug business logic

Sửa shared layer:

- Controller
- Hook
- Service
- Mapper
- Formatter
- Validation

Legacy và V2 cùng nhận fix.

### Bug Legacy UI

Sửa Legacy nếu production đang dùng Legacy.

Không cần port visual workaround sang V2 nếu V2 không có lỗi.

### Bug V2

Tắt feature flag hoặc giữ flag off.

Sửa V2 độc lập.

### Bug shared visual primitive

Sửa Design System primitive và chạy regression trên mọi screen V2 dùng primitive đó.

---

## 27. Rollback plan

Mỗi screen V2 phải có:

- Flag riêng
- Legacy fallback
- Không migration dữ liệu
- Không thay route
- Không thay API contract
- Có cách tắt nhanh

Rollback:

```text
Phát hiện lỗi
    ↓
Tắt flag
    ↓
Production quay lại Legacy
    ↓
Điều tra V2
    ↓
Sửa và bật lại sau QA
```

Không xóa Legacy trong cùng release bật V2.

---

## 28. UI governance

### Rule cho screen Legacy

- Được phép bug fix
- Được phép hotfix
- Không thêm pattern visual mới nếu có thể tái sử dụng Design System
- Feature gấp có thể dùng Legacy nhưng phải ghi tech debt

### Rule cho screen V2

- Không import Legacy component
- Không dùng visual literal
- Không thêm icon style mới
- Không thêm custom shadow
- Không thêm custom radius
- Không thêm custom search/filter variant
- Mọi ngoại lệ phải có ADR hoặc comment giải thích

### Review ownership

- Foundations/primitives: Design System owner review
- Feature pattern: Feature owner + Design System owner
- Screen migration: Feature owner
- Performance: Người review có kinh nghiệm profiling

---

## 29. Backlog mẫu

### Epic: Design System Foundations

- [ ] Audit UI inventory
- [ ] Add semantic color tokens
- [ ] Add spacing tokens
- [ ] Add typography scale
- [ ] Add radius and elevation
- [ ] Add motion tokens
- [ ] Add Ionic token mapping
- [ ] Add UI Kit route
- [ ] Add visual lint rules

### Epic: Core primitives

- [ ] AppText
- [ ] AppIcon
- [ ] AppButton
- [ ] AppIconButton
- [ ] AppCard
- [ ] AppBadge
- [ ] AppDivider
- [ ] AppSkeleton

### Epic: Form and navigation components

- [ ] AppSearchField
- [ ] AppTextField
- [ ] AppSelectField
- [ ] AppDateField
- [ ] AppSegmentedControl
- [ ] AppFilterButton
- [ ] AppPageHeader
- [ ] AppFab

### Epic: Customer screen

- [ ] Extract customer controller
- [ ] CustomerListItem
- [ ] CustomerListPageV2
- [ ] Feature flag
- [ ] Functional QA
- [ ] Visual baseline
- [ ] Performance profile
- [ ] Production rollout
- [ ] Legacy cleanup

---

## 30. Migration scorecard

Mỗi screen được chấm theo bảng sau:

| Nhóm | Tiêu chí | Trạng thái |
|---|---|---|
| Architecture | Dùng Ionic shell | ☐ |
| Architecture | Có Legacy fallback | ☐ |
| Architecture | Có route-level flag | ☐ |
| Logic | Dùng shared controller | ☐ |
| Logic | Không copy API logic | ☐ |
| Visual | Chỉ dùng token | ☐ |
| Visual | Dùng chuẩn typography | ☐ |
| Visual | Dùng chuẩn spacing | ☐ |
| Visual | Dùng chuẩn radius | ☐ |
| Visual | Dùng chuẩn elevation | ☐ |
| UX | Loading state | ☐ |
| UX | Empty state | ☐ |
| UX | Error state | ☐ |
| UX | Keyboard/safe area | ☐ |
| Performance | Không nested scroll | ☐ |
| Performance | List đã profile | ☐ |
| Performance | Không animation layout nặng | ☐ |
| QA | Functional test | ☐ |
| QA | Visual regression | ☐ |
| QA | PWA standalone test | ☐ |
| Rollback | Flag có thể tắt nhanh | ☐ |

---

## 31. Tiêu chí thành công toàn chương trình

Migration được coi là thành công khi:

- Mọi screen mới dùng Internal Design System
- Không còn visual literal trong feature code
- Không còn component trùng vai trò
- Có UI Kit được duy trì
- Có feature flag workflow chuẩn
- Có visual regression cho screen quan trọng
- Không còn Framework7 trong kế hoạch tích hợp
- Konsta chỉ tồn tại nếu spike chứng minh có giá trị
- PWA không chậm hơn baseline
- Bug/hotfix vẫn được triển khai bình thường
- PR migration nhỏ, dễ review và ít conflict
- Legacy được xóa dần sau khi V2 ổn định

---

## 32. Checklist trước khi giao task cho AI Agent

```text
[ ] Task có phạm vi nhỏ
[ ] Có file được phép sửa
[ ] Có file không được sửa
[ ] Có behavior phải giữ
[ ] Có acceptance criteria
[ ] Có feature flag
[ ] Có rollback
[ ] Có test command
[ ] Có manual QA
[ ] Có out-of-scope
[ ] Không yêu cầu refactor không liên quan
[ ] Không yêu cầu nâng dependency
```

---

## 33. Checklist sau khi AI Agent hoàn thành

```text
[ ] Diff đúng phạm vi
[ ] Không có file bị format ngoài ý muốn
[ ] Không đổi route/API
[ ] Không thêm dependency
[ ] Không có global CSS nguy hiểm
[ ] Không có visual literal
[ ] Legacy vẫn build
[ ] Feature flag hoạt động
[ ] Test pass
[ ] Build pass
[ ] Có báo cáo rủi ro
[ ] Có hướng rollback
```

---

## 34. Nguyên tắc cuối cùng

```text
Không rewrite toàn bộ.
Không tạo migration branch dài hạn.
Không thay Ionic app shell.
Không tích hợp Framework7.
Không sửa global CSS sớm.
Không trộn business refactor với redesign.
Không migrate toàn app theo loại component.
Không xóa Legacy trước khi V2 ổn định.
Không tối ưu khi chưa profile.
Không thêm dependency khi chưa chứng minh giá trị.
Migrate theo từng vertical slice có feature flag và rollback.
```
