import React from "react";
import { IonIcon } from "@ionic/react";
import { receiptOutline } from "ionicons/icons";
import { IVatInfo } from "@/types/order.type";

interface VatInfoSectionProps {
  vatInfo: IVatInfo;
}

const VatInfoSection: React.FC<VatInfoSectionProps> = ({ vatInfo }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-2">
            <IonIcon icon={receiptOutline} className="text-white text-sm" />
          </div>
          <span className="font-medium">Thông tin xuất hóa đơn VAT</span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <div className="text-muted-foreground text-sm">Công ty</div>
          <div>{vatInfo.companyName}</div>
        </div>
        <div className="mb-2">
          <div className="text-muted-foreground text-sm">Mã số thuế</div>
          <div>{vatInfo.taxCode}</div>
        </div>
        {vatInfo.email && (
          <div className="mb-2">
            <div className="text-muted-foreground text-sm">Email</div>
            <div>{vatInfo.email}</div>
          </div>
        )}
        {vatInfo.remark && (
          <div>
            <div className="text-muted-foreground text-sm">Ghi chú</div>
            <div>{vatInfo.remark}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VatInfoSection;