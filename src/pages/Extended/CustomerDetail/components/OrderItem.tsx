import React, { useState } from 'react';
import { IonIcon, IonChip, IonLabel } from '@ionic/react';
import { bagOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import dayjs from 'dayjs';
import { formatCurrency } from '@/helpers/formatters';
import { IOrder } from '@/types/order.type';
import { getOrderStatusLabel, getOrderStatusColor } from '@/common/constants/order';
import { getBadgeStyles } from '../utils';

interface OrderItemProps {
  order: IOrder;
  onClick?: () => void;
  isCompact?: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onClick, isCompact }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusLabel = getOrderStatusLabel(order.status);
  const statusColor = getOrderStatusColor(order.status);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={`bg-white rounded-2xl p-3 mb-3 shadow-sm border border-gray-100 active:bg-gray-50 cursor-pointer flex flex-col ${isCompact ? 'h-full' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1 pr-2">
          <h4 className="text-blue-600 font-bold text-[15px]">#{order.code}</h4>
          <p className="text-gray-400 text-[13px] mt-0.5">
            {dayjs(order.createdAt).format('DD/MM/YY - H:mm')}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase whitespace-nowrap ${getBadgeStyles(statusColor)}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
          <IonIcon icon={bagOutline} className="text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-medium text-[15px] truncate">
            {order.items.map(item => item.productName).join(', ')}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <div
          className="flex justify-between items-center pt-3 border-t border-gray-50 group"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-1">
            <span className="text-gray-400 text-[13px]">{order.items.length} sản phẩm</span>
            <IonIcon
              icon={isExpanded ? chevronUpOutline : chevronDownOutline}
              className="text-gray-400 text-xs transition-transform"
            />
          </div>
          <span className="text-gray-900 font-bold text-[18px]">{formatCurrency(order.totalAmount)}</span>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-3 pt-3 border-t border-gray-50 animate-fadeIn">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px] text-gray-600 leading-tight">
                  <span className="flex-1 pr-4 font-medium">{item.productName}</span>
                  <span className="whitespace-nowrap font-bold text-gray-800">
                    x{item.quantity} x {formatCurrency(item.price)}
                  </span>
                </div>
                {(item.shipNow || (item.returnedQuantity ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {item.shipNow && (
                      <IonChip color="success" className="h-5 m-0 px-2 text-[10px] font-bold">
                        <IonLabel>Giao ngay</IonLabel>
                      </IonChip>
                    )}
                    {(item.returnedQuantity ?? 0) > 0 && (
                      <IonChip color="danger" className="h-5 m-0 px-2 text-[10px] font-bold">
                        <IonLabel>Đã trả: {item.returnedQuantity}</IonLabel>
                      </IonChip>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderItem;
