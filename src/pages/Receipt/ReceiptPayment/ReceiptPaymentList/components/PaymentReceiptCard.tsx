import React from "react";
import { IonIcon } from "@ionic/react";
import { IReceiptPayment } from "@/types/receiptPayment.type";
import { formatCurrency, dayjsFormat } from "@/helpers/formatters";
import { getPaymentReceiptStatusColor, getPaymentReceiptTypeIcon } from "../../common/utils";

interface PaymentReceiptCardProps {
  receipt: IReceiptPayment;
  onClick?: (receipt: IReceiptPayment) => void;
}

const PaymentReceiptCard: React.FC<PaymentReceiptCardProps> = ({ receipt, onClick }) => {
  const statusStyle = getPaymentReceiptStatusColor(receipt.status);
  const typeStyle = getPaymentReceiptTypeIcon(receipt.type);

  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm mb-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => onClick && onClick(receipt)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`${typeStyle.bg} ${typeStyle.color} p-2 rounded-lg`}>
            <IonIcon icon={typeStyle.icon} className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium mb-0.5">{receipt.code}</div>
            <div className="text-sm font-bold text-gray-800">{receipt.title}</div>
          </div>
        </div>
        <div className={`${statusStyle.bg} ${statusStyle.text} text-[10px] font-bold px-2 py-1 rounded`}>
          {statusStyle.label}
        </div>
      </div>

      <div className="flex justify-between items-end mt-4">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">Ngày chi: {dayjsFormat(receipt.date, "DD/MM/YYYY")}</div>
          {receipt.createdAt && (
            <div className="text-xs text-gray-400 mb-1">
              Ngày tạo: {dayjsFormat(receipt.createdAt, "DD/MM/YYYY HH:mm")}
            </div>
          )}
          <div className="text-sm text-gray-600">{receipt.subjectName}</div>
        </div>
        <div className="text-base font-bold text-blue-600">
          {formatCurrency(receipt.amount)}
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptCard;
