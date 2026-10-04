# Xuất báo giá và hóa đơn đơn hàng

## Luồng mobile

Chi tiết hoặc chỉnh sửa đơn bán đã lưu → In đơn → chọn mẫu/pháp nhân/định dạng → xem trước →
xuất. Mặc định Báo giá / Kim Sang / PDF. Người báo giá lấy fullname, thiếu dùng
username. Modal tải lại chi tiết để lấy trạng thái mới; lỗi có retry, hết hàng
có nút trở lại. Đang xuất khóa lựa chọn/đóng; hủy chia sẻ không báo thành công.
Ngày lập theo UTC+7. Hỗ trợ nháp, đang xử lý, hoàn tất và đổi/trả; đơn hủy và điều chuyển không có nút In đơn. Bản in dùng dữ liệu đã lưu, không tự lưu thay đổi đang sửa. Modal kiểm lại trạng thái khi mở để chặn đơn vừa bị hủy.

## Giao diện và xuất

Báo giá A4 dùng logo hai pháp nhân trong public/order-documents; header góc
trái, STT/tên hàng/SL/đơn giá/thành tiền, tổng và người báo giá. Hóa đơn 80mm
header giữa, khách/địa chỉ khi có, tổng cộng đỏ, phần ký nhận. Lặp header khi
phân trang, không cắt dòng. PDF/PNG dùng cùng mẫu; Excel là bảng dữ liệu ô số,
không nhúng logo. Chờ logo/font; PNG nhiều trang chia nhiều file và chia sẻ cùng
một sheet native. Web tải Blob; iOS/Android ghi cache rồi Share. Chỉ xuất khi
còn ít nhất một dòng hàng.

## Hợp đồng và nghiệp vụ

Nguồn tiền/hàng và thông tin pháp nhân:
[tài liệu backend](../../be-service/docs/business/order-document-export.md).
`GET /orders/:id` thêm customer.address/document; giữ tương thích các trường cũ.
Mobile dùng trực tiếp projection backend cho cả 3 định dạng, không tự tính lại
VAT/đổi trả.

## Kiểm thử

Cypress order-export kiểm 12 tổ hợp, file thật, OCR PDF, XLSX tổng/người lập, và
đơn dài có VAT/tên hàng dài/phân trang PDF/PNG. shareFile unit kiểm ghi cache,
URI cho PDF/XLSX/PNG, chia sẻ nhiều ảnh và lỗi ghi file bằng mocked native
plugin. Mock không thay thế bằng chứng bảng Share trên thiết bị iOS/Android.

## Kết quả kiểm chứng — 03/10/2026

- Mobile lint, TypeScript và Vite build: qua; dashboard build: qua.
- E2E thực tế với DB/API test: 18/18, gồm 12 tổ hợp, 80 dòng tên dài/VAT nhiều mức,
  PDF A4/80mm, PNG nhiều trang, lỗi/retry, đơn rỗng/điều chuyển, ngày xuất qua nửa đêm.
- PDF thật được OCR kiểm tổng, kiểm khổ bằng PyMuPDF, xem trang cuối để kiểm dòng và footer.
- Native Share: 5/5 unit với mock plugin. Chưa mở bảng chia sẻ trên thiết bị iOS/Android.
- File mẫu và PDF dài lưu ở test-results/order-exports (dữ liệu fixture, không phải đơn thật).
- Deploy backend bổ sung document trước mobile; không cần migration.

## Cập nhật trạng thái — 04/10/2026

In đơn dùng chung ở màn hình chi tiết và chỉnh sửa. Hỗ trợ tất cả trạng thái: Nháp (draft),
Chờ xử lý (pending), Hoàn thành (completed), Đổi/trả (returned) và cả đơn Chuyển kho nội bộ (internal_transfer);
chỉ có đơn Đã hủy (cancelled) và đơn không còn hàng bị chặn.
Dữ liệu in là bản đã lưu, không tự lưu form chỉnh sửa.

Ở màn hình chi tiết, nút In đơn đã được thiết kế lại lên Header (icon máy in cạnh menu 3 chấm),
loại bỏ nút in full-width ở phần thân trang và giữ menu 3 chấm gọn gàng cho các thao tác trả/sửa/hủy.

Kiểm tra lại: mobile lint/typecheck/Vite build qua.
