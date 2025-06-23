import React from "react";
import { IonChip, IonItem, IonRippleEffect } from "@ionic/react";
import { formatCurrency } from "@/helpers/formatters";
import { getDate } from "@/helpers/date";
import {
  getStatusColor,
  getStatusLabel,
  TReceiptDebtStatus,
} from "@/common/constants/receipt";

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
  return (
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
          Số tiền còn lại:{" "}
          <span className="font-semibold text-blue-600">
            {formatCurrency(receiptDebt.remainingAmount)}
          </span>
        </div>
      </div>
      <IonRippleEffect></IonRippleEffect>
    </IonItem>
  );
};

export default ReceiptDebtItem;
