import React from "react";
import { ReceiptPaymentStatus } from "@/common/enums/receipt";

interface FilterTab {
  label: string;
  value: ReceiptPaymentStatus | "all";
}

const filterTabs: FilterTab[] = [
  { label: "TẤT CẢ", value: "all" },
  { label: "ĐÃ THANH TOÁN", value: ReceiptPaymentStatus.PAID }, // We will map this to mean paid or debt_payment in the filter logic
  { label: "NHÁP", value: ReceiptPaymentStatus.DRAFT },
  { label: "ĐÃ HUỶ", value: ReceiptPaymentStatus.CANCELLED },
];

interface PaymentReceiptFilterProps {
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

const PaymentReceiptFilter: React.FC<PaymentReceiptFilterProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-4 pb-1">
      {filterTabs.map((tab) => {
        const isActive = activeFilter === tab.value;
        return (
          <div
            key={tab.value}
            onClick={() => onFilterChange(tab.value)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
              isActive
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-500 border-gray-200"
            }`}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
};

export default PaymentReceiptFilter;
