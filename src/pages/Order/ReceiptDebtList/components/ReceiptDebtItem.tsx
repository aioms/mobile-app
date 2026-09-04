import React, { useRef, useState } from "react";
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonRippleEffect,
  useIonViewDidLeave,
  useIonToast,
} from "@ionic/react";
import { addCircleSharp, createOutline, printOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { AppBadge } from "@/components/UI";

import { formatCurrency } from "@/helpers/formatters";
import { getDate } from "@/helpers/date";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_DEBT_STATUS,
  TReceiptDebtStatus,
} from "@/common/constants/receipt-debt.constant";
import { useAuth, useBarcodeScanner } from "@/hooks";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import ExportReceiptBillModal from "@/pages/Receipt/ReceiptDebt/components/ExportReceiptBill/ExportReceiptBillModal";
import { IProductItem } from "@/types/product.type";

interface ReceiptDebt {
  id: string;
  code: string;
  dueDate: string;
  customerName: string;
  remainingAmount: number;
  status: TReceiptDebtStatus;
}

interface ReceiptDebtItemProps {
  receiptDebt: ReceiptDebt;
}

const ReceiptDebtItem: React.FC<ReceiptDebtItemProps> = ({ receiptDebt }) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { user } = useAuth();
  const { getDetail } = useReceiptDebt();

  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportData, setExportData] = useState<{
    items: Record<string, IProductItem[]>;
    periods: Record<string, { id: string; vatAmount: number }>;
    paidAmount: number;
    remainingAmount: number;
  } | null>(null);

  // Barcode scanner hook
  const { stopScan } = useBarcodeScanner({
    onBarcodeScanned: (value: string) => {
      stopScan();
      // Redirect to ReceiptDebtPeriod page with scanned barcode
      history.push(`/tabs/debt/period/${receiptDebt.id}?barcode=${value}`);
    },
    onError: async (error: Error) => {
      presentToast({
        message: error.message || "Có lỗi xảy ra khi quét mã vạch",
        duration: 1500,
        position: "top",
        color: "danger",
      });
    },
  });

  const onPrint = async () => {
    slidingRef.current?.close();
    try {
      const result = await getDetail(receiptDebt.id);
      if (!result?.receipt) {
        presentToast({ message: "Không thể tải dữ liệu phiếu thu", duration: 2000, position: "top", color: "danger" });
        return;
      }
      setExportData({
        items: result.items || {},
        periods: result.periods || {},
        paidAmount: result.receipt.paidAmount ?? 0,
        remainingAmount: result.receipt.remainingAmount ?? 0,
      });
      setIsExportOpen(true);
    } catch {
      presentToast({ message: "Có lỗi xảy ra", duration: 2000, position: "top", color: "danger" });
    }
  };

  const handleAddPeriod = async () => {
    // Close the sliding item first
    slidingRef.current?.close();

    history.push(`/tabs/debt/period/${receiptDebt.id}`);

    // Start barcode scanning
    // await startScan();
  };

  useIonViewDidLeave(() => {
    slidingRef.current?.close();
  });

  return (
    <>
    <IonItemSliding ref={slidingRef}>
      <IonItem
        lines="none"
        className="ion-activatable ripple-parent rounded-2xl shadow-sm border border-gray-100 mb-3 mx-4 [&::part(native)]:bg-white [&::part(native)]:px-4"
        routerLink={`/tabs/debt/detail/${receiptDebt.id}`}
      >
        <div className="py-3.5 w-full">
          {/* Header with Code and Status */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-sky-500 font-medium text-sm">
              Mã phiếu: {receiptDebt.code}
            </div>
            <AppBadge
              color={getStatusColor(receiptDebt.status)}
              className="m-0 font-medium"
            >
              {getStatusLabel(receiptDebt.status)}
            </AppBadge>
          </div>

          {/* Due Date */}
          <div className="text-gray-600 text-sm mb-1">
            Ngày dự kiến: {getDate(receiptDebt.dueDate).format("DD/MM/YYYY")}
          </div>

          {/* Customer Name */}
          <div className="text-gray-600 text-sm mb-2">
            Khách hàng: {receiptDebt.customerName}
          </div>

          {/* Remaining Amount */}
          <div className="text-gray-600 text-sm">
            Công nợ còn lại:{" "}
            <span className="font-semibold text-blue-600">
              {formatCurrency(receiptDebt.remainingAmount)}
            </span>
          </div>
        </div>
        <IonRippleEffect></IonRippleEffect>
      </IonItem>

      {receiptDebt.status !== RECEIPT_DEBT_STATUS.CANCELLED &&
        receiptDebt.status !== RECEIPT_DEBT_STATUS.COMPLETED && (
          <IonItemOptions side="end">
            <IonItemOption color="warning" onClick={handleAddPeriod}>
              <IonIcon slot="top" icon={addCircleSharp}></IonIcon>
              Thêm đợt
            </IonItemOption>
            <IonItemOption
              color="tertiary"
              routerLink={`/tabs/debt/update/${receiptDebt.id}`}
            >
              Sửa phiếu
              <IonIcon slot="top" icon={createOutline}></IonIcon>
            </IonItemOption>
            <IonItemOption color="medium" onClick={onPrint}>
              In phiếu
              <IonIcon slot="top" icon={printOutline}></IonIcon>
            </IonItemOption>
          </IonItemOptions>
        )}
    </IonItemSliding>

    {exportData && (
      <ExportReceiptBillModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        receiptCode={receiptDebt.code}
        customerName={receiptDebt.customerName}
        storeCode={user?.storeCode || "KS"}
        paidAmount={exportData.paidAmount}
        remainingAmount={exportData.remainingAmount}
        items={exportData.items}
        periods={exportData.periods}
      />
    )}
    </>
  );
};

export default ReceiptDebtItem;
