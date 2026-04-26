import React from "react";
import { IonIcon } from "@ionic/react";
import { walletOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

const CashBookModule: React.FC = () => {
  const history = useHistory();

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3 text-gray-800">Sổ thu chi</h2>
      <div
        className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
        onClick={() => history.push("/tabs/extended/cashbook")}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <IonIcon icon={walletOutline} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Theo dõi thu chi</h3>
            <p className="text-xs text-gray-500 mt-1">
              Xem báo cáo tổng quan và quản lý quỹ tiền mặt tại quầy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBookModule;
