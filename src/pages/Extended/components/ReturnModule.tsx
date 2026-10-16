import React from "react";
import { IonIcon } from "@ionic/react";
import { arrowUndoOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";

const ReturnModule: React.FC = () => {
  const history = useHistory();

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3 text-gray-800">Trả hàng</h2>
      <div
        data-cy="return-module-card"
        className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
        onClick={() => history.push("/tabs/extended/receipt-returns")}
      >
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <IonIcon icon={arrowUndoOutline} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              Quản lý trả hàng
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Xem và quản lý phiếu trả hàng của khách hàng và nhà cung cấp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModule;
