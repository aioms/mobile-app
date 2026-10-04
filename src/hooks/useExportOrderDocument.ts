import { RefObject, useRef, useState } from "react";
import { useIonToast } from "@ionic/react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { OrderStatus } from "@/common/enums/order";
import { DocumentProps } from "@/types/order-document.type";
import { OrderExportFormat } from "@/common/constants/order-document";
import { orderDocumentExcel } from "@/helpers/orderDocumentExcel";
import {
  paginateDocument,
  waitForDocumentAssets,
} from "@/helpers/orderDocumentPages";
import { shareOrDownload, shareOrDownloadFiles } from "@/helpers/shareFile";

export function useExportOrderDocument() {
  const [isExporting, setIsExporting] = useState(false);
  const active = useRef(false);
  const [toast] = useIonToast();
  const exportDocument = async (
    props: DocumentProps,
    format: OrderExportFormat,
    ref: RefObject<HTMLDivElement>,
  ) => {
    if (active.current || props.order.status === OrderStatus.CANCELLED || !props.order.document?.items.length) return;
    active.current = true;
    setIsExporting(true);
    try {
      // Allow the export timestamp and locked controls to commit before capturing DOM.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const filename = `${props.order.code.replace(/[^a-zA-Z0-9_-]/g, "_")}_${
        props.kind === "quotation" ? "bao-gia" : "hoa-don"
      }_${props.entity.taxCode ? "ngan-kim" : "kim-sang"}`;
      if (format === "excel") {
        const blob = orderDocumentExcel(props);
        await shareOrDownload(
          blob,
          `${filename}.xlsx`,
          blob.type,
          "Chia sẻ đơn hàng",
        );
      } else {
        if (!ref.current) throw new Error("Không tìm thấy bản xem trước");
        await exportVisual(
          ref.current,
          props.kind === "quotation",
          format,
          filename,
        );
      }
      await toast({
        message: "Đã tạo file đơn hàng",
        duration: 2000,
        color: "success",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /cancel(?:led|ed)?|canceled/i.test(error.message)
      ) return;
      console.error("Order document export failed", error);
      await toast({
        message: error instanceof Error
          ? error.message
          : "Không thể xuất đơn hàng. Vui lòng thử lại.",
        duration: 3500,
        color: "danger",
      });
    } finally {
      active.current = false;
      setIsExporting(false);
    }
  };
  return { exportDocument, isExporting };
}

async function exportVisual(
  element: HTMLDivElement,
  quotation: boolean,
  format: "pdf" | "image",
  filename: string,
) {
  await waitForDocumentAssets(element);
  const width = quotation ? 190 : 72;
  const margin = quotation ? 10 : 4;
  const height = quotation ? 277 : 992;
  const { host, pages } = paginateDocument(
    element,
    element.offsetWidth * height / width,
  );
  try {
    let pdf: jsPDF | undefined;
    const images: { data: Blob; fileName: string }[] = [];
    for (const [index, page] of pages.entries()) {
      const image = await toPng(page, {
        pixelRatio: 2,
        backgroundColor: "#fff",
      });
      if (format === "image") {
        const blob = await (await fetch(image)).blob();
        const suffix = pages.length > 1 ? `_${index + 1}` : "";
        images.push({ data: blob, fileName: `${filename}${suffix}.png` });
        continue;
      }
      const pageHeight = quotation ? 297 : Math.max(
        80,
        page.offsetHeight * width / page.offsetWidth + margin * 2,
      );
      if (!pdf) {
        pdf = new jsPDF({
          orientation: "portrait",
          compress: true,
          unit: "mm",
          format: [width + margin * 2, pageHeight],
        });
      } else pdf.addPage([width + margin * 2, pageHeight], "portrait");
      pdf.addImage(
        image,
        "PNG",
        margin,
        margin,
        width,
        page.offsetHeight * width / page.offsetWidth,
        undefined,
        "FAST",
      );
    }
    if (images.length) await shareOrDownloadFiles(images, "Chia sẻ đơn hàng");
    if (pdf) {
      await shareOrDownload(
        pdf.output("blob"),
        `${filename}.pdf`,
        "application/pdf",
        "Chia sẻ đơn hàng",
      );
    }
  } finally {
    host.remove();
  }
}
