import React from "react";
import { dayjsFormat } from "@/helpers/formatters";
import { CustomerType } from "@/common/enums/order";

interface OrderInfoSectionProps {
  orderDate: string;
  customerType: string;
  note?: string;
}

const getCustomerTypeLabel = (type: string): string => {
  switch (type) {
    case CustomerType.INDIVIDUAL:
      return "Khách lẻ";
    case CustomerType.LOYAL:
      return "Khách sỉ";
    default:
      return "Không xác định";
  }
};

const OrderInfoSection: React.FC<OrderInfoSectionProps> = ({
  orderDate,
  customerType,
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
          <span className="text-muted-foreground">Loại khách hàng</span>
          <span>{getCustomerTypeLabel(customerType)}</span>
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
