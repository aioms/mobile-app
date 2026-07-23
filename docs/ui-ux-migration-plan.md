# Kế hoạch Migration UI/UX: Hybrid Approach (Konsta UI + Enterprise Architecture)

> Kế hoạch này là sự kết hợp tối ưu giữa **Tốc độ thực thi** (Sử dụng Konsta UI làm nhân) và **Kiến trúc an toàn** (Feature Flags, Shared Controllers, Strangler Pattern). Mục tiêu là chuẩn hóa Design System, giải quyết giật lag trên PWA mà không gây rủi ro gãy vỡ hệ thống đang chạy.

---

## 1. Quyết định kiến trúc bắt buộc (ADRs)

### ADR-001: Giữ Ionic làm Application Shell
Không thay thế hoàn toàn Ionic. Các thành phần chịu trách nhiệm điều hướng và vòng đời ứng dụng vẫn giữ nguyên để đảm bảo Capacitor và Native behaviors hoạt động đúng.
- **Giữ lại:** `IonApp`, `IonReactRouter`, `IonRouterOutlet`, `IonPage`, `IonContent` (nếu cần xử lý cuộn đặc biệt), `IonTabs`, Capacitor Plugins.
- **Thay thế:** Component hiển thị như `IonList`, `IonItem`, `IonButton`, `IonHeader`...

### ADR-002: Konsta UI là lớp UI Primitives (Mặc định)
Thay vì tự code lại từ đầu bằng `class-variance-authority` (CVA) và Tailwind (tốn thời gian), **Konsta UI sẽ là trái tim của Design System**.
- Tận dụng Konsta UI để có ngay các UI chuẩn iOS/Material Design.
- Gói (Wrap) Konsta UI thành các component nội bộ (ví dụ: `AppButton` bọc `Button` của Konsta) để kiểm soát Props và Design Tokens.

### ADR-003: TailwindCSS là Single Source of Truth
Mọi tokens (Màu sắc, Typography, Spacing, Radius) phải được cấu hình tại `tailwind.config.js`. Konsta UI và các component nội bộ bắt buộc phải gọi màu qua class của Tailwind (vd: `text-primary`, `bg-surface-default`). Không sử dụng mã màu HEX trực tiếp trong Component.

---

## 2. Nguyên tắc Migration (An toàn tuyệt đối)

### 2.1 Strangler Pattern & Feature Flags
Luôn để màn hình cũ (Legacy) và màn hình mới (V2) chạy song song. Chuyển đổi qua lại bằng Feature Flag.
```tsx
// Ví dụ điều hướng
export function CustomerListRoute() {
  const uiVersion = useUiVersion("customer-list"); // Hook đọc cờ từ Env hoặc LocalStorage
  return uiVersion === "v2" ? <CustomerListPageV2 /> : <CustomerListPageLegacy />;
}
```

### 2.2 Shared Controllers (Dùng chung Business Logic)
Không được copy API fetch, state logic từ V1 sang V2. Phải tách logic ra một Custom Hook dùng chung để đảm bảo nếu sửa bug logic thì cả 2 bản đều nhận.
```tsx
// Shared Logic
export function useCustomerListController() {
  const [keyword, setKeyword] = useState("");
  const query = useCustomersQuery({ keyword });
  return { customers: query.data, keyword, setKeyword };
}

// Màn V2 chỉ lo UI
export function CustomerListPageV2() {
  const controller = useCustomerListController();
  return <KonstaCustomerListView {...controller} />;
}
```

### 2.3 Bọc (Wrap) Component thay vì dùng trực tiếp
Tạo ra `Layer 2: Primitives` của riêng team, bên trong gọi Konsta UI. Việc này giúp Design System không bị phụ thuộc cứng vào Konsta.
```tsx
// src/components/design-system/AppButton.tsx
import { Button } from 'konsta/react';

export const AppButton = ({ variant = 'primary', children, ...props }) => {
  return (
    <Button 
      colors={{ primary: 'bg-brand-primary text-white', outline: 'border-brand-primary text-brand-primary' }}
      {...props}
    >
      {children}
    </Button>
  );
};
```

---

## 3. Các giai đoạn thực thi (Action Plan)

### Phase 1: Nền tảng (Foundations)
1. Xác định bảng màu hiện tại và khai báo chuẩn semantic vào `tailwind.config.js` (vd: `brand-primary`, `surface-default`, `text-secondary`).
2. Cài đặt `konsta` và cấu hình tích hợp với Tailwind theo tài liệu gốc.
3. Bọc `<App>` của Konsta ở file root (`App.tsx`) để nhận diện theme OS.
4. Cấu hình cơ chế Feature Flag đơn giản (ví dụ: `VITE_UI_V2_CUSTOMER_LIST=true`).

### Phase 2: Chế tạo Primitives (Bọc Konsta UI)
Chuyển đổi từng component cơ bản. Khởi tạo folder `src/components/design-system/`.
1. Chế tạo `AppButton`, `AppIconButton` (bọc Konsta Button).
2. Chế tạo `AppInput`, `AppSearch` (bọc Konsta List Input).
3. Chế tạo `AppBadge`, `AppCard`.
*(Phase này làm rất nhanh vì logic CSS đã được Konsta lo hết).*

### Phase 3: Tiến hành thay thế theo Màn hình (Vertical Slice)
Chọn một màn hình danh sách dài đang bị lag nhất (ví dụ: `CustomerListPage` hoặc `OrderListPage`) để làm Pilot (thử nghiệm).
1. Tách logic của màn hiện tại ra `use{X}Controller`.
2. Tạo file `CustomerListPageV2.tsx`.
3. Sử dụng `Navbar`, `List`, `ListItem` của Konsta UI (những component này giúp tăng hiệu năng PWA rõ rệt nhất so với Ionic).
4. Bật Feature Flag cho V2, test nội bộ.

### Phase 4: Mở rộng và Hoàn thiện
- Lặp lại Phase 3 cho các màn hình còn lại.
- Fix các lỗi hiển thị lặt vặt (Visual regression).
- Khuyến nghị thay thế dần Ionic Icons bằng Lucide React (nhẹ và thiết kế hiện đại hơn, hợp với Tailwind).

### Phase 5: Cleanup (Gỡ bỏ Legacy)
Chỉ thực hiện khi V2 đã chạy ổn định ít nhất 1-2 tuần trên production.
- Xóa bỏ toàn bộ các file `xxxLegacy.tsx`.
- Gỡ bỏ thư viện `@ionic/react` ở những component không thuộc App Shell.
- Xóa bỏ Feature Flag logic.

---

## 4. Tổng kết
Bản kế hoạch Hybrid này đảm bảo:
- **Tốc độ:** Code rất nhanh nhờ dùng Konsta thay vì tự viết CVA.
- **An toàn:** Lỗi UI ở V2 không ảnh hưởng đến V1 (nhờ Feature Flag và Shared Controller).
- **Hiệu năng:** Giải quyết triệt để bệnh "DOM phình to" của Ionic Web Components bằng các component thuần Tailwind của Konsta.
