import React from "react";
import { IonIcon } from "@ionic/react";
import { briefcaseOutline, timeOutline } from "ionicons/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { formatCurrency } from "@/helpers/formatters";
import { ISupplier } from "@/types/supplier";
import { AppCard } from "@/components/UI";

dayjs.extend(relativeTime);

interface SupplierCardProps {
  supplier: ISupplier;
  onClick?: () => void;
}

const getIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "cty":
      return "bg-blue-50 text-blue-600";
    case "sạp chợ":
      return "bg-green-50 text-green-600";
    case "cá nhân":
      return "bg-orange-50 text-orange-600";
    default:
      return "bg-purple-50 text-purple-600";
  }
};

const SupplierCard: React.FC<SupplierCardProps> = ({ supplier, onClick }) => {
  return (
    <AppCard onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${getIcon(supplier.type || "")}`}>
            <IonIcon icon={briefcaseOutline} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-[15px] leading-tight mb-1">
              {supplier.name}
            </h3>
            <div className="flex items-center gap-1 text-gray-400 text-[11px]">
              <IonIcon icon={timeOutline} className="text-[12px]" />
              <span>
                GD cuối: {supplier.lastTransactionDate
                  ? dayjs(supplier.lastTransactionDate).fromNow()
                  : "Chưa có giao dịch"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-900 text-[16px]">
            {formatCurrency(supplier.totalPurchased || 0)}
          </div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            TỔNG GIAO DỊCH
          </div>
        </div>
      </div>
      <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
        <span className="text-[12px] text-gray-500 font-medium">Nợ hiện tại:</span>
        <span className={`text-[14px] font-bold ${supplier.totalDebt && supplier.totalDebt > 0 ? 'text-red-500' : 'text-gray-900'}`}>
          {formatCurrency(supplier.totalDebt || 0)}
        </span>
      </div>
    </AppCard>
  );
};

export default SupplierCard;
