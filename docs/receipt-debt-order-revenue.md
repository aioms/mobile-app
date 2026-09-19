# Phiếu Thu — Doanh thu Đơn hàng

Màn hình tạo Phiếu Thu có tickbox **Doanh thu của Đơn hàng**, mặc định bỏ chọn.

- Bỏ chọn: thanh toán nằm trong nhóm Phiếu thu của Sổ Thu Chi.
- Chọn: số tiền thanh toán nằm trong nhóm Đơn hàng của Sổ Thu Chi.
- Tổng doanh thu và tổng tiền mặt không bị cộng thêm.
- Số lượng vẫn theo nguồn chứng từ: phiếu vẫn được đếm ở nhóm Phiếu thu.
- Có thể đổi lựa chọn trước giao dịch thanh toán đầu tiên.
- Sau khi đã thanh toán một phần/toàn bộ hoặc phiếu bị hủy, tickbox bị khóa.

Backend lưu trạng thái tại `receipt_debts.is_order_revenue`; dữ liệu Phiếu Thu cũ
được giữ ở trạng thái bỏ chọn.
