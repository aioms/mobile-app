import React, { useRef } from "react";
import {
  IonChip,
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

import { formatCurrency } from "@/helpers/formatters";
import { getDate } from "@/helpers/date";
import {
  getStatusColor,
  getStatusLabel,
  TReceiptDebtStatus,
} from "@/common/constants/receipt";
import { useBarcodeScanner } from "@/hooks";

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

  // Barcode scanner hook
  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: (value: string) => {
      stopScan();
      // Redirect to ReceiptDebtPeriod page with scanned barcode
      history.push(`/tabs/debt/period/${receiptDebt.id}?barcode=${value}`);
    },
    onError: async (error: Error) => {
      await presentToast({
        message: error.message || "Có lỗi xảy ra khi quét mã vạch",
        duration: 1500,
        position: "top",
        color: "danger",
      });
    },
  });

  const onPrint = () => {};

  const handleAddPeriod = async () => {
    // Close the sliding item first
    slidingRef.current?.close();

    // Start barcode scanning
    await startScan();
  };

  useIonViewDidLeave(() => {
    slidingRef.current?.close();
  });

  return (
    <IonItemSliding ref={slidingRef}>
      <IonItem
        lines="full"
        className="ion-activatable ripple-parent rounded-lg shadow-sm mb-2 bg-white"
        routerLink={`/tabs/debt/detail/${receiptDebt.id}`}
      >
        <div className="py-3 w-full">
          {/* Header with Code and Status */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-blue-500 font-medium text-sm">
              Mã đơn: {receiptDebt.code}
            </div>
            <IonChip
              color={getStatusColor(receiptDebt.status)}
              className="m-0 text-xs font-medium"
            >
              {getStatusLabel(receiptDebt.status)}
            </IonChip>
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
    </IonItemSliding>
  );
};

export default ReceiptDebtItem;
