import React from "react";
import { IonIcon } from "@ionic/react";
import { personOutline, businessOutline } from "ionicons/icons";
import { ReceiptReturnType } from "@/types/receipt-return.type";

interface ReturnPartnerTabsProps {
  activeType: ReceiptReturnType;
  onChange: (type: ReceiptReturnType) => void;
  className?: string;
}

const ReturnPartnerTabs: React.FC<ReturnPartnerTabsProps> = ({
  activeType,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={`bg-gray-100/80 p-1 rounded-2xl flex items-center gap-1 ${className}`}
    >
      <button
        type="button"
        data-cy="return-tab-customer"
        onClick={() => onChange(ReceiptReturnType.CUSTOMER)}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          activeType === ReceiptReturnType.CUSTOMER
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <IonIcon icon={personOutline} className="text-base" />
        <span>Khách hàng</span>
      </button>

      <button
        type="button"
        data-cy="return-tab-supplier"
        onClick={() => onChange(ReceiptReturnType.SUPPLIER)}
        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          activeType === ReceiptReturnType.SUPPLIER
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        <IonIcon icon={businessOutline} className="text-base" />
        <span>Nhà cung cấp</span>
      </button>
    </div>
  );
};

export default ReturnPartnerTabs;
