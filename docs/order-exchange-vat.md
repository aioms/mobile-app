# VAT khi đổi hàng từ đơn bán

Phiếu đổi từ đơn bán mặc định chọn **Giữ nguyên VAT đã xuất hóa đơn**.
Chỉ tính tiền hàng trả/nhận sau phân bổ chiết khấu gốc, không thu/hoàn VAT.
Bỏ chọn để tính cả VAT hai bên theo quy tắc trước đây.

Ví dụ 18 món giá 45.000 đổi sang 18 món giá 50.000, VAT 8%:
giữ VAT bù 90.000đ; tính lại VAT bù 97.200đ.

Luồng: chọn hàng trả → lý do đổi sản phẩm → chọn cách xử lý VAT → chọn hàng nhận
→ kiểm tra tiền bù → xác nhận. Đổi hàng xác nhận ngay, không lưu nháp;
phiếu hoàn tất không sửa/hủy. Mở phiếu mới đặt lại lựa chọn giữ VAT.

API gửi `vatHandling=preserve` khi giữ VAT; bỏ field khi tính lại.
Backend kiểm tra đơn gốc và tự tính tiền; preview không quyết định số tiền ghi sổ.
Lịch sử hiển thị chế độ đã lưu trong `exchangeItems[].vatHandling`.
Xuất đơn giữ VAT gốc theo snapshot backend.

Chế độ mới chỉ dùng cho đổi hàng từ đơn bán. Trả thuần và phiếu thu công nợ
vẫn theo quy tắc riêng hiện tại. Không sửa dữ liệu hóa đơn bên ngoài hệ thống.
Phiếu cũ không có lựa chọn lưu tiếp tục dùng tổng tiền đã ghi.
