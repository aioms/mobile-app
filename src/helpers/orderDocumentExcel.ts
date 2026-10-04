import * as XLSX from "xlsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DocumentProps } from "@/types/order-document.type";
dayjs.extend(utc);

/** Generate numeric spreadsheet cells from the same server projection as PDF/PNG. */
export function orderDocumentExcel(
  { order, kind, entity, issuedAt, authorName }: DocumentProps,
): Blob {
  const data = order.document;
  if (!data) throw new Error("Thiếu dữ liệu xuất đơn");
  const quotation = kind === "quotation";
  const rows: (string | number)[][] = [
    [entity.name],
    [entity.address],
    ...(entity.taxCode ? [[`MST: ${entity.taxCode}`]] : []),
    [`ĐT: ${entity.phone}`],
    [`STK: ${entity.bank}`],
    [],
    [quotation ? "BẢNG BÁO GIÁ" : "HÓA ĐƠN"],
    [`Mã đơn: ${order.code}`],
    ...(order.status === "cancelled" ? [["ĐÃ HỦY"]] : []),
    [`${quotation ? "Kính gửi" : "Khách hàng"}: ${
      order.customer?.name || (quotation ? "Quý Khách Hàng" : "Khách lẻ")
    }`],
    ...(order.customer?.address
      ? [[`Địa chỉ: ${order.customer.address}`]]
      : []),
    ["Ngày lập", dayjs(issuedAt).utcOffset(7).format("DD/MM/YYYY HH:mm")],
    [],
    ["STT", "Tên hàng", "Số lượng", "Đơn giá", "Thành tiền"],
    ...data.items.map((
      item,
      index,
    ) => [
      index + 1,
      item.productName,
      item.quantity,
      item.unitPrice,
      item.lineTotal,
    ]),
    [],
  ];
  if (!quotation) {
    rows.push(["", "", "", "Tổng số lượng", data.totalQuantity], [
      "",
      "",
      "",
      "Tổng tiền hàng",
      data.subtotal,
    ], ["", "", "", "Thuế (VAT)", data.vatAmount]);
    if (data.discountAmount) {
      rows.push(["", "", "", "Chiết khấu", -data.discountAmount]);
    }
    if (data.adjustmentAmount) {
      rows.push(["", "", "", "Điều chỉnh đổi/trả", data.adjustmentAmount]);
    }
  }
  rows.push([
    "",
    "",
    "",
    "Tổng cộng",
    quotation ? data.subtotal : data.grandTotal,
  ]);
  if (quotation) rows.push(["Giá trên chưa bao gồm VAT"]);
  rows.push([quotation ? "Người báo giá" : "Người viết hóa đơn", authorName]);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 5 }, { wch: 45 }, { wch: 12 }, { wch: 24 }, {
    wch: 18,
  }];
  for (const cell of Object.values(sheet)) {
    if (cell && typeof cell === "object" && "t" in cell && cell.t === "n") {
      cell.z = "#,##0";
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    quotation ? "Báo giá" : "Hóa đơn",
  );
  return new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
