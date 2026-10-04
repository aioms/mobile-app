# Theo dõi lỗi mobile/PWA

Shared axios thêm X-Correlation-ID theo từng attempt, giữ X-Request-ID dùng
idempotency. Network/5xx capture PostHog gồm status, duration, response trace ID;
expected4xx/cancelled không tạo exception. API response.data và UI fallback
không đổi. React boundary/global listeners capture Error đã bỏ message,
body/headers/token và arbitrary additionalData. Chỉ capture production/staging;
không thu native crash, ANR, dSYM hay Android mapping trong patch này.

Runtime release là commit của build metadata. Vite tạo hidden source maps;
PostHog rollup plugin upload private khi CI có POSTHOG_API_KEY và
POSTHOG_PROJECT_ID, host POSTHOG_HOST. Key private không dùng VITE_ prefix.
Cleanup xóa mọi *.map trong dist dù thiếu credentials; Firebase ignore cũng
chặn *.map. Thiếu key thì chỉ còn minified frames, không claim symbolication.
Upload thực tế chưa kiểm chứng. npm dùng legacy-peer-deps như .npmrc/CI;
rollup4 root dành cho Vite, Workbox giữ dependency rollup2 riêng.

PostHog analytics/user identification/session settings hiện có là phạm vi
riêng; error sanitization không ẩn mọi dữ liệu analytics. Webhook issue phải
mapping source/mobile/release/issue fingerprint sang backend intake đã có
Bearer secret; secret không nằm trong app. Xem
[runbook chung](../../be-service/docs/operations/observability.md).

Kiểm: npm run lint, npx tsc --noEmit, npm run vite:build; dist không còn .map.
Cần build/install/launch trên iOS/Android rồi tạo JS/API error để kiểm delivery
thật. Native crash reporting là bước triển khai riêng đã deferred.

Public env: `.env.example` ở root project. Private PostHog upload variables
phải được inject vào process environment của CI/build; không chỉ điền vào
file public dotenv. Chưa có credentials thì upload được bỏ qua có chủ đích.
