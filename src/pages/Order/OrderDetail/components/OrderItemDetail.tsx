import React from "react";
import { formatCurrency } from "@/helpers/formatters";

interface OrderItemDetailProps {
  name: string;
  code: string;
  price: number;
  quantity: number;
}

const OrderItemDetail: React.FC<OrderItemDetailProps> = ({
  name,
  code,
  price,
  quantity,
}) => {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-muted-foreground">Mã SP: {code}</div>
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
