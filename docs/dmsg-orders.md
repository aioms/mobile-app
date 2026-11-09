# Đơn gộp ĐMSG — Mobile/PWA

Nguồn nghiệp vụ: `be-service/docs/business/dmsg-orders.md`.

- Từ Tạo đơn hàng chọn Đơn gộp ĐMSG; chọn sản phẩm và số lượng.
- Nhập tổng vốn chưa VAT, tổng hóa đơn đã VAT, VAT %, hoa hồng %, phí.
- Bóc VAT rồi chia tiếp hệ số hoa hồng; phí không trừ tiền chuyển khách.
- Lưu nháp xuất kho thật. Sửa nháp xuất/hoàn chênh lệch; hoàn thành không xuất lại.
- Nháp chỉ dự kiến; completed ghi nhận doanh thu và lợi nhuận.
- Sửa tài chính completed giữ ngày ghi nhận gốc. Hủy đảo báo cáo và hoàn hàng một lần.
- Tiền khách chuyển sau được ghi ở Tiền thực thu/chi; có nhận từng đợt, chuyển khách,
  trả phí và hoàn tiền. Không tạo giao dịch chỉ vì bấm hoàn thành.
- Tổng phải thu đối soát dùng hóa đơn, khác doanh thu ĐMSG. Sổ quỹ theo tiền thực tế.
- Sau hủy vẫn giữ lịch sử tiền và cho ghi hoàn số đã nhận; không tự chuyển tiền ngân hàng.
- API/hooks ở `src/hooks/apis/useDmsgOrder.ts`; form react-hook-form;
  tính tiền chính xác trong helpers, server là nguồn cuối; dùng AppCard/Ionic theo DESIGN.md.
- Màn tạo/chi tiết ở `/tabs/orders/dmsg/create` và `/tabs/orders/dmsg/detail/:id`.
- Màn danh sách có báo cáo ĐMSG hôm nay, bộ lọc loại đơn; Cashbook có breakdown ĐMSG.
- Không hỗ trợ trả/đổi một phần, in/Excel đơn bán lẻ hay sửa hàng completed ở bản đầu.

## Kiểm thử và demo

Backend: `deno task test:system --spec cypress/e2e/mobile/dmsg-order.cy.ts`.
Runner dựng PostgreSQL tạm, migration và API thật; Cypress thao tác UI thật,
kiểm tồn từ DB qua fixture guard. Không dùng mock API cho happy path.

Demo: từ backend chạy `deno task test:system --demo`; runner in URL và tài khoản
kiểm thử, tạo đơn mẫu 108 triệu và kho test riêng. Dừng runner xóa môi trường tạm.
