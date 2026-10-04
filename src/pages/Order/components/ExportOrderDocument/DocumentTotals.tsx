import { DocumentKind } from "@/common/constants/order-document";
import { OrderDocument } from "@/types/order-document.type";

export default function DocumentTotals(
  { data, kind }: { data: OrderDocument; kind: DocumentKind },
) {
  const quotation = kind === "quotation";
  const rows: [string, number][] = quotation ? [] : [
    ["Tổng số lượng", data.totalQuantity],
    ["Tổng tiền hàng", data.subtotal],
    ["Thuế (VAT)", data.vatAmount],
    ...(data.discountAmount
      ? [["Chiết khấu", -data.discountAmount] as [string, number]]
      : []),
    ...(data.adjustmentAmount
      ? [["Điều chỉnh đổi/trả", data.adjustmentAmount] as [string, number]]
      : []),
  ];
  return (
    <div>
      {rows.map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
            padding: "5px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <span>{label}</span>
          <span>
            {value.toLocaleString("vi-VN")}
            {label !== "Tổng số lượng" && "đ"}
          </span>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontWeight: 700,
          fontSize: quotation ? 18 : 17,
          color: quotation ? "#111" : "#dc143c",
          paddingTop: 9,
        }}
      >
        <span>{quotation ? "Tổng cộng:" : "Cộng:"}</span>
        <span>
          {(quotation ? data.subtotal : data.grandTotal).toLocaleString(
            "vi-VN",
          )}đ
        </span>
      </div>
    </div>
  );
}
