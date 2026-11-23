# Phiếu nhập và thêm lại sản phẩm đã trả

Phiếu nhập hỗ trợ hàng tặng (`metadata.isGift`), giá và chiết khấu bằng 0.
Hoàn tất vẫn cộng tồn, không đổi giá vốn danh mục. Hàng thường cập nhật giá vốn
sau chiết khấu, làm tròn VND; chiết khấu phần trăm tối đa 3 số lẻ, nhận dấu phẩy
hoặc dấu chấm. Chiết khấu tiền tính trên mỗi đơn vị. Tổng dòng làm tròn sau nhân số lượng.

Phiếu Thu lưu số lượng lũy kế, giữ nguyên `returnedQuantity`. Danh sách chỉnh sửa
ẩn dòng trả hết và hiển thị số còn lại. Chọn lại sản phẩm cùng ngày cộng vào dòng gốc;
input hiển thị số còn lại, payload gửi số lũy kế. Ví dụ 1 → trả 1 → thêm 1:
quantity=2, returnedQuantity=1, còn=1. Lịch sử trả không thay đổi.

Dòng có trả hàng giữ nguyên đơn giá/cách giao hàng; chỉ được thêm số lượng.
Backend đối chiếu originalQuantity với dữ liệu khóa trong transaction. HTTP 409 yêu cầu
người dùng tải lại khi dữ liệu cũ; không trừ kho lần nữa. API chi tiết vẫn trả đầy đủ lịch sử.
