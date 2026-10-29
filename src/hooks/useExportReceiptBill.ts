import { RefObject, useState } from "react";
import { useIonToast } from "@ionic/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

import { ReceiptBillData } from "@/helpers/receiptBill";
import { paginateDocument, waitForDocumentAssets } from "@/helpers/orderDocumentPages";
import { shareOrDownload } from "@/helpers/shareFile";

export type ExportFormat = "pdf" | "excel" | "image";

interface StoreHeader {
  name: string;
  address: string;
}

interface ExportParams {
  format: ExportFormat;
  billRef: RefObject<HTMLDivElement | null>;
  billData: ReceiptBillData;
  receiptCode: string;
  customerName: string;
  storeHeader: StoreHeader;
  paidAmount: number;
  remainingAmount: number;
}

export function useExportReceiptBill() {
  const [isExporting, setIsExporting] = useState(false);
  const [presentToast] = useIonToast();

  const exportBill = async (params: ExportParams) => {
    setIsExporting(true);
    try {
      switch (params.format) {
        case "image":
          await exportAsImage(params);
          break;
        case "pdf":
          await exportAsPdf(params);
          break;
        case "excel":
          await exportAsExcel(params);
          break;
      }
      presentToast({
        message: "Xuất phiếu thu thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });
    } catch (error) {
      console.error("Export error:", error);
      presentToast({
        message: "Có lỗi xảy ra khi xuất phiếu thu",
        duration: 3000,
        position: "top",
        color: "danger",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportBill, isExporting };
}

/* ─── format-specific exporters ─── */

async function exportAsImage({ billRef, receiptCode }: ExportParams) {
  const el = billRef.current;
  if (!el) throw new Error("Bill element not found");

  const dataUrl = await toPng(el, {
    pixelRatio: 2, backgroundColor: "#fff",
    width: el.scrollWidth, height: el.scrollHeight,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileName = `${receiptCode}_phieu-thu.png`;
  await shareOrDownload(blob, fileName, "image/png");
}

async function exportAsPdf({ billRef, receiptCode }: ExportParams) {
  const el = billRef.current;
  if (!el) throw new Error("Bill element not found");

  await waitForDocumentAssets(el);
  const contentWidth = 190;
  const margin = 10;
  const { host, pages } = paginateDocument(el, el.offsetWidth * 277 / contentWidth);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  try {
    for (const [index, page] of pages.entries()) {
      const image = await toPng(page, { pixelRatio: 2, backgroundColor: "#fff" });
      if (index > 0) pdf.addPage();
      pdf.addImage(
        image, "PNG", margin, margin, contentWidth,
        page.offsetHeight * contentWidth / page.offsetWidth, undefined, "FAST",
      );
    }
  } finally {
    host.remove();
  }

  const pdfBlob = pdf.output("blob");
  const fileName = `${receiptCode}_phieu-thu.pdf`;
  await shareOrDownload(pdfBlob, fileName, "application/pdf");
}

async function exportAsExcel({
  billData,
  receiptCode,
  customerName,
  storeHeader,
  paidAmount,
  remainingAmount,
}: ExportParams) {
  const rows: (string | number)[][] = [];

  // Header
  rows.push([storeHeader.name]);
  if (storeHeader.address) rows.push([`Địa chỉ: ${storeHeader.address}`]);
  rows.push([]);
  rows.push(["PHIẾU THU TIỀN"]);
  rows.push([`Khách hàng: ${customerName || "Khách lẻ"}`]);
  rows.push([`Mã phiếu: ${receiptCode}`]);
  rows.push([]);

  // Table header
  rows.push(["Tên Sản phẩm", "Người nhận", "Số lượng", "Đơn giá", "Thành tiền"]);

  for (const group of billData.periodGroups) {
    rows.push([`Ngày ${group.formattedDate}`, "", "", "", ""]);
    for (const item of group.items) {
      rows.push([
        item.productName,
        item.recipientName || "",
        item.quantity,
        item.unitPrice,
        item.lineTotal,
      ]);
    }
    rows.push(["", "", "", "Tổng ngày", group.periodTotal]);
    if (group.discountAmount > 0) {
      rows.push(["", "", "", "Chiết khấu đợt", -group.discountAmount]);
    }
    if (group.adjustmentAmount) {
      rows.push(["", "", "", "Điều chỉnh đổi/trả", group.adjustmentAmount]);
    }
    if (group.vatAmount > 0) {
      rows.push(["", "", "", "VAT đợt", group.vatAmount]);
    }
  }

  rows.push([]);
  rows.push(["", "", "", "Tổng:", billData.subtotal]);
  rows.push(["", "", "", "Chiết khấu:", -billData.totalDiscount]);
  rows.push(["", "", "", "Thuế (VAT):", billData.totalVat]);
  rows.push(["", "", "", "Thành tiền:", billData.grandTotal]);
  rows.push(["", "", "", "Tổng phải trả:", remainingAmount + paidAmount]);
  rows.push(["", "", "", "Đã thanh toán:", paidAmount]);
  rows.push(["", "", "", "Còn lại:", remainingAmount]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Phiếu Thu");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const fileName = `${receiptCode}_phieu-thu.xlsx`;
  await shareOrDownload(blob, fileName, blob.type);
}
