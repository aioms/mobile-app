import React from "react";
import { dayjsFormat } from "@/helpers/formatters";
import { getCustomerTypeLabel } from "@/common/constants/order";
import type { ICustomer } from "@/types/order.type";

interface OrderInfoSectionProps {
  orderDate: string;
  customer: ICustomer | null;
  note?: string;
}

const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({
  orderDate,
  customer,
  note,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Ngày đặt hàng</span>
          <span>{dayjsFormat(orderDate)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Khách hàng</span>
          <span>{getCustomerTypeLabel(customer)}</span>
        </div>
        {note && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Ghi chú</span>
            <span>{note}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderInfoSection;
