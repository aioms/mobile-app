# Nguồn tiền mặt trong ngày

## Mục đích và dữ liệu

Một ngày có nhiều nguồn `{ name, amount }`, lưu trong `cashbook_daily_actual_cash.cash_sources` (JSONB). Số tiền là VND nguyên không âm. `cash_for_day` luôn bằng tổng nguồn khi cập nhật danh sách. Tên bắt buộc, tối đa 120 ký tự; tối đa 100 nguồn/ngày.

## Luồng

Chọn ngày → tải daily-balance → sửa nguồn → kiểm tra → lưu nguyên danh sách và tổng trong cùng transaction → tải lại tồn dự tính. Thêm/xóa trong form chỉ áp dụng sau khi Lưu. Xóa yêu cầu xác nhận.

## API

`GET /api/v1/cashbook/daily-balance?date=YYYY-MM-DD` trả thêm `cashSources`.
`PUT /api/v1/cashbook/daily-balance/cash-for-day` nhận `{ date, cashForDay, cashSources? }`. Tổng không khớp bị từ chối 400. Cập nhật vẫn dùng phân quyền Cashbook hiện có và ghi activity.

## Tương thích và edge cases

Dữ liệu cũ chỉ có tổng được biểu diễn thành nguồn “Tiền mặt ngày”. Client cũ gửi tổng vẫn được nhận, thay danh sách bằng một nguồn cùng tên. Mảng rỗng với tổng 0 xóa hết nguồn. Lưu tiền mặt thực tế không ghi đè danh sách nguồn. Hai người sửa cùng ngày: lần lưu sau cùng thắng, giống cơ chế tổng cũ.

Mobile cung cấp form nguồn; dashboard hiện chưa có màn Cashbook nên không thêm màn mới. Dashboard order filter là thay đổi riêng.
