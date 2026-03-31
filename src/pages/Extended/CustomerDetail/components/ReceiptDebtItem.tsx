import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { receiptOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '@/helpers/formatters';
import { IReceiptDebt } from '@/types/receipt-debt.type';
import { ReceiptDebtStatus } from '@/common/enums/receipt';
import { getBadgeStyles } from '../utils';

interface ReceiptDebtItemProps {
  receipt: IReceiptDebt;
  onClick?: () => void;
}

const getReceiptDebtStatusLabel = (status: ReceiptDebtStatus) => {
  switch (status) {
    case ReceiptDebtStatus.PENDING:
      return 'Chờ thanh toán';
    case ReceiptDebtStatus.PARTIAL_PAID:
      return 'Thanh toán một phần';
    case ReceiptDebtStatus.COMPLETED:
      return 'Hoàn thành';
    case ReceiptDebtStatus.CANCELLED:
      return 'Đã hủy';
    default:
      return status;
  }
};

const getReceiptDebtStatusColor = (status: ReceiptDebtStatus) => {
  switch (status) {
    case ReceiptDebtStatus.PENDING:
      return 'warning';
    case ReceiptDebtStatus.PARTIAL_PAID:
      return 'primary';
    case ReceiptDebtStatus.COMPLETED:
      return 'success';
    case ReceiptDebtStatus.CANCELLED:
      return 'danger';
    default:
      return 'medium';
  }
};

const ReceiptDebtItem: React.FC<ReceiptDebtItemProps> = ({ receipt, onClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusLabel = getReceiptDebtStatusLabel(receipt.status);
  const statusColor = getReceiptDebtStatusColor(receipt.status);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className="bg-white rounded-2xl p-3 mb-3 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer flex flex-col"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="text-blue-600 font-bold text-[15px]">#{receipt.code}</h4>
          <p className="text-gray-400 text-[13px] mt-0.5">
            {dayjs(receipt.createdAt).format('DD/MM/YY - H:mm')}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${getBadgeStyles(statusColor)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
          <IonIcon icon={receiptOutline} className="text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium text-[15px] truncate">
            {receipt.items?.map(item => item.productName).join(', ') || 'Không có sản phẩm'}
          </p>
          {receipt.note && (
            <p className="text-gray-500 text-[12px] truncate mt-0.5 italic">
              Ghi chú: {receipt.note}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto">
        <div
          className="flex justify-between items-center pt-3 border-t border-gray-50 group"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[13px]">{receipt.items?.length || 0} sản phẩm</span>
            <IonIcon
              icon={isExpanded ? chevronUpOutline : chevronDownOutline}
              className="text-gray-400 text-xs transition-transform"
            />
          </div>
          <div className="text-right">
            <p className="text-gray-900 font-bold text-[18px] leading-tight">{formatCurrency(receipt.totalAmount)}</p>
            {receipt.remainingAmount > 0 && receipt.status !== ReceiptDebtStatus.CANCELLED && (
              <p className="text-red-500 text-[11px] font-medium">Còn nợ: {formatCurrency(receipt.remainingAmount)}</p>
            )}
          </div>
        </div>

        {isExpanded && receipt.items && receipt.items.length > 0 && (
          <div className="mt-2 space-y-3 pt-3 border-t border-gray-50 animate-fadeIn">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px] text-gray-600 leading-tight">
                  <span className="flex-1 pr-4 font-medium">{item.productName}</span>
                  <span className="whitespace-nowrap font-bold text-gray-800">
                    x{item.quantity} x {formatCurrency(item.costPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptDebtItem;
