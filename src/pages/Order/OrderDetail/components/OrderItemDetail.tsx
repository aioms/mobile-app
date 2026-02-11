import React from "react";
import { formatCurrency } from "@/helpers/formatters";

interface OrderItemDetailProps {
  name: string;
  code: string;
  price: number;
  quantity: number;
  returnedQuantity?: number;
  shipNow?: boolean;
}

const OrderItemDetail: React.FC<OrderItemDetailProps> = ({
  name,
  code,
  price,
  quantity,
  returnedQuantity = 0,
  shipNow = false,
}) => {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            Mã SP: {code}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {returnedQuantity > 0 && (
              <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                {returnedQuantity === quantity ? "Đã trả hàng" : `Đã trả ${returnedQuantity}`}
              </span>
            )}
            {shipNow && (
              <span className="bg-green-100 text-green-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                Giao ngay
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-orange-500 font-medium">
            {formatCurrency(price)} {quantity > 1 && `x${quantity}`}
          </div>
          {quantity > 1 && (
            <div className="text-orange-500 font-medium">
              {formatCurrency(price * quantity)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderItemDetail;
