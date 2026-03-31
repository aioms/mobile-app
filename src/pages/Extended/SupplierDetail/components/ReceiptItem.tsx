import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '@/helpers/formatters';
import { ReceiptImportStatus } from '@/common/enums/receipt';

export interface IReceiptImportItem {
  id: string;
  receiptId: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  costPrice: number;
  createdAt: string;
}

export interface IReceiptImport {
  id: string;
  receiptNumber: string;
  note: string | null;
  quantity: number;
  totalProduct: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items?: IReceiptImportItem[];
}

interface ReceiptItemProps {
  receipt: IReceiptImport;
  onClick?: () => void;
  isCompact?: boolean;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case ReceiptImportStatus.COMPLETED:
      return { label: 'Đã hoàn thành', color: 'bg-green-50 text-green-600' };
    case ReceiptImportStatus.PROCESSING:
      return { label: 'Đang xử lý', color: 'bg-orange-50 text-orange-600' };
    case ReceiptImportStatus.CANCELLED:
      return { label: 'Đã huỷ', color: 'bg-red-50 text-red-600' };
    default:
      return { label: 'Đang xử lý', color: 'bg-orange-50 text-orange-600' };
  }
};

const ReceiptItem: React.FC<ReceiptItemProps> = ({ receipt, onClick, isCompact }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = getStatusInfo(receipt.status);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer flex flex-col ${isCompact ? 'h-full' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="text-blue-600 font-bold text-[15px]">#{receipt.receiptNumber}</h4>
          <p className="text-gray-900 font-medium text-[14px] mt-0.5">
            {dayjs(receipt.createdAt).format('DD/MM/YY - H:mm')}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {receipt.items && receipt.items.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {receipt.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-gray-500 text-[13px]">
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <span className="truncate">{item.productName} (x{item.quantity})</span>
            </div>
          ))}
          {receipt.items.length > 2 && (
            <div className="flex items-center gap-2 text-gray-500 text-[13px]">
              <div className="w-1 h-1 rounded-full bg-gray-300"></div>
              <span>... và {receipt.items.length - 2} sản phẩm khác</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center group" onClick={toggleExpand}>
        <span className="text-gray-900 font-bold text-[18px]">{formatCurrency(receipt.totalAmount)}</span>
        {receipt.items && receipt.items.length > 0 && (
          <IonIcon icon={isExpanded ? chevronUpOutline : chevronDownOutline} className="text-gray-400 text-lg transition-transform" />
        )}
      </div>

      {isExpanded && receipt.items && (
        <div className="mt-3 space-y-3 pt-3 border-t border-gray-50 animate-fadeIn">
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
  );
};

export default ReceiptItem;
