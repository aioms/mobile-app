import React, { forwardRef } from "react";
import { ReceiptBillData } from "@/helpers/receiptBill";

interface ReceiptBillDocumentProps {
  storeName: string;
  storeAddress: string;
  customerName: string;
  receiptCode: string;
  billData: ReceiptBillData;
  paidAmount: number;
  remainingAmount: number;
}

/**
 * Pure HTML bill template rendered off-screen for capture (html-to-image / PDF).
 * Uses inline styles so html-to-image captures them correctly.
 */
const ReceiptBillDocument = forwardRef<HTMLDivElement, ReceiptBillDocumentProps>(
  (
    {
      storeName,
      storeAddress,
      customerName,
      receiptCode,
      billData,
      paidAmount,
      remainingAmount,
    },
    ref,
  ) => {
    const fmt = (n: number) =>
      n.toLocaleString("vi-VN", { currency: "VND" });

    return (
      <div
        ref={ref}
        style={{
          width: 720,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 14,
          color: "#111",
          background: "#fff",
          padding: 32,
          boxSizing: "border-box",
        }}
      >
        {/* Store header */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontStyle: "italic", fontWeight: 700, fontSize: 16 }}>
            {storeName}
          </div>
          {storeAddress && (
            <div style={{ fontStyle: "italic", fontSize: 13, color: "#555" }}>
              Địa chỉ: {storeAddress}
            </div>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            textAlign: "center",
            fontSize: 24,
            fontWeight: 700,
            margin: "20px 0 16px",
          }}
        >
          PHIẾU THU TIỀN
        </h1>

        {/* Customer + Code */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <span style={{ fontStyle: "italic", color: "#555" }}>
              Khách hàng
            </span>
            <span style={{ fontWeight: 600 }}>{customerName || "Khách lẻ"}</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ fontStyle: "italic", color: "#555" }}>Mã phiếu</span>
            <span style={{ fontWeight: 600 }}>{receiptCode}</span>
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 16,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #333" }}>
              <th style={{ ...thStyle, textAlign: "left" }}>Tên Sản phẩm</th>
              <th style={{ ...thStyle, textAlign: "center", width: 80 }}>
                Số lượng
              </th>
              <th style={{ ...thStyle, textAlign: "right", width: 110 }}>
                Đơn giá
              </th>
              <th style={{ ...thStyle, textAlign: "right", width: 120 }}>
                Thành tiền
              </th>
            </tr>
          </thead>
          <tbody>
            {billData.periodGroups.map((group) => (
              <React.Fragment key={group.date}>
                {/* Period date header row */}
                <tr>
                  <td
                    colSpan={2}
                    style={{ fontWeight: 600, paddingTop: 10, paddingBottom: 2 }}
                  >
                    Ngày {group.formattedDate}
                  </td>
                  <td
                    colSpan={2}
                    style={{
                      fontStyle: "italic",
                      textAlign: "right",
                      paddingTop: 10,
                      paddingBottom: 2,
                      color: "#555",
                    }}
                  >
                    Tổng ngày{" "}
                    <span style={{ fontWeight: 600, color: "#111" }}>
                      {fmt(group.periodTotal)} đ
                    </span>
                  </td>
                </tr>

                {/* Line items */}
                {group.items.map((item, idx) => (
                  <tr
                    key={idx}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ ...tdStyle, paddingLeft: 16 }}>
                      {item.productName}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {fmt(item.unitPrice)} đ
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {fmt(item.lineTotal)} đ
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Separator */}
        <hr style={{ border: "none", borderTop: "2px solid #333", margin: "8px 0" }} />

        {/* Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 300 }}>
            <SummaryRow
              label="Tổng:"
              value={`${fmt(billData.subtotal)} đ`}
              bold
              valueColor="#d00"
            />
            <SummaryRow
              label="Thuế"
              value={`${fmt(billData.totalVat)} đ`}
              italic
            />
            <SummaryRow
              label="Tổng phải trả"
              value={`${fmt(billData.grandTotal)} đ`}
              bold
            />
            <SummaryRow
              label="Đã Thanh toán"
              value={`${fmt(paidAmount)} đ`}
            />
            <SummaryRow
              label="Còn Lại"
              value={`${fmt(remainingAmount)} đ`}
              bold
            />
          </div>
        </div>
      </div>
    );
  },
);

ReceiptBillDocument.displayName = "ReceiptBillDocument";

export default ReceiptBillDocument;

/* ─── inline style helpers ─── */

const thStyle: React.CSSProperties = {
  padding: "6px 4px",
  fontSize: 13,
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "5px 4px",
  fontSize: 13,
};

const SummaryRow: React.FC<{
  label: string;
  value: string;
  bold?: boolean;
  italic?: boolean;
  valueColor?: string;
}> = ({ label, value, bold, italic, valueColor }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "3px 0",
      fontWeight: bold ? 700 : 400,
      fontStyle: italic ? "italic" : "normal",
    }}
  >
    <span>{label}</span>
    <span style={{ color: valueColor }}>{value}</span>
  </div>
);
