import { forwardRef } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import { DocumentProps } from "@/types/order-document.type";
export type { DocumentProps } from "@/types/order-document.type";
import DocumentTotals from "./DocumentTotals";

const fmt = (value: number) =>
  value.toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const OrderDocument = forwardRef<HTMLDivElement, DocumentProps>(
  ({ order, kind, entity, issuedAt, authorName }, ref) => {
    const quotation = kind === "quotation";
    const data = order.document;
    if (!data) return null;
    const date = dayjs(issuedAt).utcOffset(7);
    return (
      <div
        ref={ref}
        data-document-kind={kind}
        style={{
          width: quotation ? 720 : 300,
          padding: quotation ? 12 : 4,
          boxSizing: "border-box",
          background: "#fff",
          color: "#111",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: quotation ? 14 : 11,
        }}
      >
        <header data-document-header style={{ marginBottom: 14 }}>
          {quotation
            ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={entity.logo}
                  alt={entity.name}
                  style={{ width: 110, height: 76, objectFit: "contain" }}
                />
                <div>
                  <strong>{entity.name.toUpperCase()}</strong>
                  <div>{entity.address}</div>
                  {entity.taxCode && <div>MST: {entity.taxCode}</div>}
                </div>
              </div>
            )
            : (
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "1px dotted #aaa",
                  paddingBottom: 10,
                }}
              >
                <strong
                  style={{
                    display: "block",
                    fontSize: entity.taxCode ? 14 : 21,
                    color: entity.taxCode ? "#111" : "#800000",
                  }}
                >
                  {entity.name.toUpperCase()}
                </strong>
                <div>ĐC: {entity.address}</div>
                {entity.taxCode && <div>MST: {entity.taxCode}</div>}
                <div>ĐT: {entity.phone}</div>
                <div>STK: {entity.bank}</div>
              </div>
            )}
          <h1
            style={{
              textAlign: "center",
              margin: "16px 0 10px",
              fontSize: quotation ? 26 : 24,
              fontWeight: 700,
            }}
          >
            {quotation ? "BẢNG BÁO GIÁ" : "HÓA ĐƠN"}
          </h1>
          {order.status === "cancelled" && (
            <div
              style={{ textAlign: "center", color: "#c00", fontWeight: 700 }}
            >
              ĐÃ HỦY
            </div>
          )}
          {quotation
            ? (
              <>
                <p style={{ fontWeight: 700, margin: "18px 0" }}>
                  Kính gửi: {order.customer?.name || "Quý Khách Hàng"}
                </p>
                <div>{entity.name} trân trọng báo giá như sau:</div>
              </>
            )
            : (
              <>
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  Số: #{order.code}
                </div>
                <div>Ngày lập: {date.format("DD/MM/YYYY HH:mm")}</div>
                {order.customer?.name && (
                  <div>Khách hàng: {order.customer.name}</div>
                )}
                {order.customer?.address && (
                  <div>Địa chỉ: {order.customer.address}</div>
                )}
              </>
            )}
        </header>
        <table
          data-document-table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: quotation ? 13 : 10,
          }}
        >
          <colgroup>
            <col style={{ width: "9%" }} />
            <col style={{ width: "38%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "21%" }} />
            <col style={{ width: "24%" }} />
          </colgroup>
          <thead>
            <tr>
              {["STT", "Tên hàng", "SL", "Đơn giá", "Thành tiền"].map(
                (label) => (
                  <th
                    key={label}
                    style={{
                      padding: "7px 3px",
                      border: "1px solid #bbb",
                      background: "#f1f3f5",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.key} data-document-row>
                {[
                  index + 1,
                  item.productName,
                  item.quantity,
                  fmt(item.unitPrice),
                  fmt(item.lineTotal),
                ].map((value, cell) => (
                  <td
                    key={cell}
                    style={{
                      padding: "6px 3px",
                      border: "1px solid #bbb",
                      verticalAlign: "top",
                      textAlign: cell === 1
                        ? "left"
                        : cell > 2
                        ? "right"
                        : "center",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <footer data-document-footer style={{ paddingTop: 12 }}>
          <DocumentTotals data={data} kind={kind} />
          {quotation && (
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              *Giá trên chưa bao gồm VAT
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: quotation ? "flex-end" : "space-between",
              alignItems: "flex-start",
              gap: 8,
              textAlign: "center",
              paddingBottom: 20,
              marginTop: 18,
            }}
          >
            {!quotation && (
              <div>
                <p
                  style={{
                    fontStyle: "italic",
                    margin: "0 0 14px",
                    visibility: "hidden",
                    userSelect: "none",
                  }}
                  aria-hidden="true"
                >
                  &nbsp;
                </p>
                <strong>NGƯỜI NHẬN HÀNG</strong>
              </div>
            )}
            <div>
              <p
                style={{
                  fontStyle: "italic",
                  margin: "0 0 14px",
                  whiteSpace: "nowrap",
                }}
              >
                Ngày {date.format("DD")} tháng {date.format("MM")} năm{" "}
                {date.format("YYYY")}
              </p>
              <strong>
                {quotation ? "Người báo giá" : "NGƯỜI VIẾT HÓA ĐƠN"}
              </strong>
              <div style={{ marginTop: 12 }}>{authorName}</div>
            </div>
          </div>
        </footer>
      </div>
    );
  },
);
OrderDocument.displayName = "OrderDocument";
export default OrderDocument;
