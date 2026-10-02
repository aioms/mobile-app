# Đổi/trả hàng phiếu thu

## Luồng sử dụng

Chi tiết phiếu thu khách hàng → menu Đổi/trả hàng → chọn dòng và số lượng còn có thể trả. Phiếu hoàn thành có thể chọn lý do đổi sản phẩm và chọn hàng nhận/đơn giá/VAT. Hiển thị tổng dự kiến và còn lại; server quyết định số tiền cuối cùng.

Trả thuần có Lưu nháp hoặc Xác nhận. Lịch sử tại chi tiết phiếu cho xác nhận nháp/đang xử lý hoặc hủy phiếu trả với xác nhận. Đổi hàng xác nhận ngay; phiếu đổi hoàn thành bất biến.

## Dữ liệu và tiền

`receiptItemId` phân biệt cùng mã nhưng khác kỳ/giá. Chỉ trừ returnedQuantity một lần trong picker. Hàng nhận tách dòng, có thể đổi/trả tiếp. Kỳ có adjustmentAmount được giữ khi chỉnh sửa và xuất PDF/Excel/ảnh.

Tổng = max(0, tổng cũ − giá trị trả gốc + hàng nhận gồm VAT). Đã thu giữ nguyên; VAT/chiết khấu gốc giữ nguyên. Còn lại âm hiển thị “Đã thu dư … so với tổng phiếu sau đổi/trả. Bạn có thể lập phiếu chi để hoàn khách.” Không tự thu/hoàn tiền; khoản dư không phản ánh đối soát phiếu chi.

API sử dụng hooks/apis/useReceiptReturn và useReceiptDebt. requestId giữ ổn định khi retry; chặn gửi trùng trong lúc đang xử lý. Chi tiết phiếu tải lại khi trở vào trang; hỗ trợ loading, lỗi/thử lại, rỗng/trở lại danh sách, thành công và kéo làm mới. API từ chối phiếu hủy, số lượng vượt dòng nguồn, thiếu tồn kho, đổi khi chưa hoàn thành.

## Thành phần

- ReceiptReturn/hooks/useReceiptReturnForm: dữ liệu biểu mẫu và submit.
- ReceiptReturn/components/ReceiptReturnView, ExchangeProductSection: giao diện.
- ReceiptDebtDetail/components/ReceiptDebtContent, hooks/useDebtReturnActions: lịch sử và xác nhận/hủy.
- components/ReturnExchangeHistory: dùng chung với chi tiết order.
- helpers/receiptBill: tiền hóa đơn, có 3 ca unit test cho ngưỡng 0, cùng SKU khác giá và nhiều kỳ.

## Kiểm tra và giới hạn

Chạy npm run lint, npx tsc --noEmit, npm run vite:build và npx vitest run src/helpers/receiptBill.test.ts --environment node. Chưa có kiểm tra hiển thị/thiết bị thực. Backend contract và migration: [nghiệp vụ backend v3](../../be-service/docs/business/debt-return.md).
