import React from "react";
import { IonCard, IonCardContent, IonButton, IonIcon } from "@ionic/react";
import { chevronBack, checkmarkCircle, cash, qrCode } from "ionicons/icons";
import { formatCurrency } from "@/helpers/formatters";
import { PaymentMethod } from "./PaymentModal";

interface PaymentCompletionProps {
  amount: number;
  method: PaymentMethod;
  onComplete: () => void;
  onBack: () => void;
}

const PaymentCompletion: React.FC<PaymentCompletionProps> = ({
  amount,
  method,
  onComplete,
  onBack,
}) => {
  const getMethodIcon = () => {
    return method === "cash" ? cash : qrCode;
  };

  const getMethodLabel = () => {
    return method === "cash" ? "Tiền mặt" : "Chuyển khoản QR";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <IonButton fill="clear" onClick={onBack} className="p-0">
          <IonIcon icon={chevronBack} className="text-xl" />
        </IonButton>
        <span className="text-lg font-semibold text-gray-800">
          Hoàn tất thanh toán
        </span>
      </div>

      <IonCard>
        <IonCardContent className="p-6 text-center">
          <div className="mb-6">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IonIcon
                icon={checkmarkCircle}
                className="text-4xl text-green-600"
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Xác nhận thanh toán
            </h2>
            <p className="text-gray-600">
              Vui lòng xác nhận thông tin thanh toán dưới đây
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hình thức thanh toán:</span>
                <div className="flex items-center space-x-2">
                  <IonIcon icon={getMethodIcon()} className="text-blue-600" />
                  <span className="font-semibold">{getMethodLabel()}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Số tiền thanh toán:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <IonButton
              expand="block"
              onClick={onComplete}
              className="font-semibold"
            >
              Hoàn tất thanh toán
            </IonButton>

            <p className="text-xs text-gray-500">
              Bằng cách nhấn "Hoàn tất thanh toán", bạn xác nhận đã nhận được số
              tiền trên
            </p>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default PaymentCompletion;
