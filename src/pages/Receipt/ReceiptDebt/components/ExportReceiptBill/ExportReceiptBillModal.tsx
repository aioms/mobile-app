import React, { useMemo, useRef, useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCheckbox,
  IonSpinner,
} from "@ionic/react";
import { close } from "ionicons/icons";
import dayjs from "dayjs";

import { IProductItem } from "@/types/product.type";
import { buildReceiptBill, ReceiptBillData } from "@/helpers/receiptBill";
import { getStoreBillHeader } from "@/helpers/storeBillHeader";
import { formatCurrency } from "@/helpers/formatters";
import ReceiptBillDocument from "./ReceiptBillDocument";
import { useExportReceiptBill, ExportFormat } from "@/hooks/useExportReceiptBill";

interface PeriodSummary {
  id: string;
  vatAmount: number;
}

interface ExportReceiptBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptCode: string;
  customerName: string;
  storeCode: string;
  paidAmount: number;
  remainingAmount: number;
  items: Record<string, IProductItem[]>;
  periods: Record<string, PeriodSummary>;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "image", label: "Hình ảnh (PNG)" },
];

const ExportReceiptBillModal: React.FC<ExportReceiptBillModalProps> = ({
  isOpen,
  onClose,
  receiptCode,
  customerName,
  storeCode,
  paidAmount,
  remainingAmount,
  items,
  periods,
}) => {
  const billRef = useRef<HTMLDivElement>(null);

  // All available period dates sorted chronologically
  const allDates = useMemo(
    () =>
      Object.keys(items).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
      ),
    [items],
  );

  const [selectedDates, setSelectedDates] = useState<string[]>(allDates);
  const [format, setFormat] = useState<ExportFormat>("pdf");

  // Keep selection in sync when items change
  React.useEffect(() => {
    setSelectedDates(allDates);
  }, [allDates]);

  const allSelected = selectedDates.length === allDates.length;

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const toggleAll = () => {
    setSelectedDates(allSelected ? [] : [...allDates]);
  };

  // Build bill data from selected periods
  const billData: ReceiptBillData = useMemo(
    () => buildReceiptBill(items, periods, selectedDates),
    [items, periods, selectedDates],
  );

  const storeHeader = useMemo(() => getStoreBillHeader(storeCode), [storeCode]);

  const { exportBill, isExporting } = useExportReceiptBill();

  const handleExport = async () => {
    if (selectedDates.length === 0) return;
    await exportBill({
      format,
      billRef,
      billData,
      receiptCode,
      customerName,
      storeHeader,
      paidAmount,
      remainingAmount,
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Xuất phiếu thu</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-gray-50">
        {/* Period selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Chọn đợt thu
          </h3>

          <div className="mb-3">
            <IonCheckbox
              checked={allSelected}
              onIonChange={toggleAll}
              labelPlacement="end"
              className="text-sm"
            >
              <span className="text-sm font-medium text-gray-700 ml-2">
                Chọn tất cả ({allDates.length} đợt)
              </span>
            </IonCheckbox>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allDates.map((date) => {
              const periodItems = items[date] || [];
              const periodTotal = periodItems.reduce((sum, item) => {
                const qty = Math.max(0, item.quantity - (item.returnedQuantity ?? 0));
                return sum + qty * item.costPrice;
              }, 0);

              return (
                <div
                  key={date}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-gray-50"
                >
                  <IonCheckbox
                    checked={selectedDates.includes(date)}
                    onIonChange={() => toggleDate(date)}
                    labelPlacement="end"
                    className="text-sm"
                  >
                    <span className="text-sm text-gray-800 ml-2">
                      {dayjs(date).format("DD/MM/YYYY")}
                    </span>
                  </IonCheckbox>
                  <span className="text-sm font-medium text-gray-600">
                    {formatCurrency(periodTotal)}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedDates.length === 0 && (
            <p className="text-sm text-red-500 mt-2">
              Vui lòng chọn ít nhất một đợt thu
            </p>
          )}
        </div>

        {/* Format selection */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">
            Định dạng xuất
          </h3>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  format === opt.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Số đợt thu:</span>
            <span className="font-medium">{billData.periodGroups.length}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Tổng tiền:</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(billData.subtotal)}
            </span>
          </div>
          {billData.totalVat > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">VAT:</span>
              <span className="font-medium">
                {formatCurrency(billData.totalVat)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tổng phải trả:</span>
            <span className="font-bold">{formatCurrency(billData.grandTotal)}</span>
          </div>
        </div>

        {/* Export button */}
        <IonButton
          expand="block"
          onClick={handleExport}
          disabled={selectedDates.length === 0 || isExporting}
          className="mb-4"
        >
          {isExporting ? (
            <>
              <IonSpinner name="crescent" className="mr-2" />
              Đang xuất...
            </>
          ) : (
            `Xuất ${FORMAT_OPTIONS.find((o) => o.value === format)?.label}`
          )}
        </IonButton>

        {/* Off-screen bill for capture */}
        <div
          style={{
            position: "fixed",
            left: -9999,
            top: 0,
            zIndex: -1,
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          <ReceiptBillDocument
            ref={billRef}
            storeName={storeHeader.name}
            storeAddress={storeHeader.address}
            customerName={customerName}
            receiptCode={receiptCode}
            billData={billData}
            paidAmount={paidAmount}
            remainingAmount={remainingAmount}
          />
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ExportReceiptBillModal;
