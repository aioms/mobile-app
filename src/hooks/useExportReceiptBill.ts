import { RefObject, useState } from "react";
import { useIonToast } from "@ionic/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

import { ReceiptBillData } from "@/helpers/receiptBill";
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

  const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: "#fff" });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const fileName = `${receiptCode}_phieu-thu.png`;
  await shareOrDownload(blob, fileName, "image/png");
}

async function exportAsPdf({ billRef, receiptCode }: ExportParams) {
  const el = billRef.current;
  if (!el) throw new Error("Bill element not found");

  const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: "#fff" });
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  // A4 portrait dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Scale image to fit page width
  const imgRatio = img.height / img.width;
  const contentHeight = contentWidth * imgRatio;

  const pdf = new jsPDF("p", "mm", "a4");

  // Handle multi-page if bill is taller than one page
  let yOffset = 0;
  const maxContentHeight = pageHeight - margin * 2;

  while (yOffset < contentHeight) {
    if (yOffset > 0) pdf.addPage();

    // Calculate source crop for this page
    const sourceY = (yOffset / contentHeight) * img.height;
    const sourceHeight = Math.min(
      (maxContentHeight / contentHeight) * img.height,
      img.height - sourceY,
    );
    const destHeight = Math.min(maxContentHeight, contentHeight - yOffset);

    // Create a canvas to crop the image for this page
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available");
    ctx.drawImage(
      img,
      0,
      sourceY,
      img.width,
      sourceHeight,
      0,
      0,
      img.width,
      sourceHeight,
    );

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      contentWidth,
      destHeight,
    );

    yOffset += maxContentHeight;
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
  rows.push(["Tên Sản phẩm", "Số lượng", "Đơn giá", "Thành tiền"]);

  for (const group of billData.periodGroups) {
    rows.push([`Ngày ${group.formattedDate}`, "", "", ""]);
    for (const item of group.items) {
      rows.push([item.productName, item.quantity, item.unitPrice, item.lineTotal]);
    }
    rows.push(["", "", "Tổng ngày", group.periodTotal]);
    if (group.vatAmount > 0) {
      rows.push(["", "", "VAT đợt", group.vatAmount]);
    }
  }

  rows.push([]);
  rows.push(["", "", "Tổng:", billData.subtotal]);
  rows.push(["", "", "Thuế (VAT):", billData.totalVat]);
  rows.push(["", "", "Tổng phải trả:", billData.grandTotal]);
  rows.push(["", "", "Đã Thanh toán:", paidAmount]);
  rows.push(["", "", "Còn Lại:", remainingAmount]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 30 },
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
