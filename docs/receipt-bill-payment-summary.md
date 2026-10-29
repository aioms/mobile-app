# Thông tin thanh toán trên phiếu in

PDF/PNG dùng ReceiptBillDocument; Excel dùng useExportReceiptBill. Tổng tiền hàng, thuế, chiết khấu và điều chỉnh đổi/trả lấy từ các đợt hàng được chọn. Thành tiền là tổng phiếu theo lựa chọn đó.

Thông tin thanh toán lấy từ toàn phiếu: Đã thanh toán là tổng giao dịch thành công có processedAt gần nhất (TM và CK cùng thời điểm gộp thành một đợt). Bỏ giao dịch thất bại, đang chờ và hoàn tiền. Còn lại lấy từ receipt.remainingAmount hiện tại; Tổng phải trả là số còn lại cộng tiền thu lần gần nhất, tức số cần trả trước lần thu đó. Sau thanh toán, trang tải lại phiếu và lịch sử giao dịch.

Chọn một phần đợt hàng chỉ thay đổi phần hàng; dư nợ vẫn là dư nợ toàn phiếu. Trước lần thu đầu tiên: đã thu 0, tổng phải trả bằng còn lại. API payment-details trả thêm type giao dịch để phân biệt hoàn tiền.

PDF chia trang HTML bằng `paginateDocument` trước khi capture, thay vì cắt một ảnh dài theo tọa độ pixel. Mỗi dòng sản phẩm (kể cả tên xuống dòng) nằm nguyên trên một trang; lặp lại đầu phiếu và tiêu đề bảng. Khối tổng kết thanh toán chỉ xuất hiện ở trang cuối và chuyển nguyên khối sang trang mới nếu thiếu chỗ. Mỗi ảnh trang nằm trong vùng A4 190 × 277 mm, lề 10 mm; tránh giới hạn canvas đối với phiếu dài. Nếu một dòng vượt chiều cao trang, báo lỗi thay vì cắt mất nội dung. Host tạm được dọn cả khi export thất bại.

PNG capture theo scrollWidth/scrollHeight. Test `receiptBillPages.test.ts` bao phủ phiếu nhiều trang, dòng nhiều dòng, footer chuyển trang và lỗi dòng quá cao.
