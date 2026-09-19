# Thanh toán đơn hàng kết hợp

## Flow

Order Create và Order Update dùng cùng selector ba lựa chọn: Tiền mặt, Chuyển khoản, Cả hai. Hai lựa chọn đầu giữ flow modal cũ và tự gán toàn bộ Thành tiền.

Với Cả hai, modal hiển thị hai input số nguyên VND. Tổng khách đưa và chênh lệch được cập nhật tức thời. Nút Xác nhận chỉ enable khi cả hai khoản lớn hơn 0 và tổng đúng bằng Thành tiền.

Nếu có chuyển khoản, QR dùng đúng số tiền chuyển khoản. Màn hoàn tất hiển thị từng nguồn tiền. Callback gửi `transactions[]` lên API.

## Draft và validation

Draft chỉ lưu `paymentMethod: mixed`; amount phân bổ nhập lại khi nhân viên xác nhận thanh toán. Backend vẫn là nguồn xác thực cuối cùng.

## Chi tiết đơn

Order Detail hiển thị nhãn Kết hợp và breakdown từ `paymentDetails.transactions`.
