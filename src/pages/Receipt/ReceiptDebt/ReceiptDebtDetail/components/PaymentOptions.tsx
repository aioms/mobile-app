import React from "react";
import { IonCard, IonCardContent, IonIcon } from "@ionic/react";
import { cash, qrCode } from "ionicons/icons";
import { PaymentMethod } from "./PaymentModal";

interface PaymentOptionsProps {
  onMethodSelect: (method: PaymentMethod) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ onMethodSelect }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Chọn hình thức thanh toán
        </h2>
        <p className="text-gray-600 text-sm">
          Vui lòng chọn phương thức thanh toán phù hợp
        </p>
      </div>

      <IonCard
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onMethodSelect("cash")}
      >
        <IonCardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full">
              <IonIcon icon={cash} className="text-2xl text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Thanh toán tiền mặt
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Thanh toán trực tiếp bằng tiền mặt
              </p>
            </div>
            <div className="text-gray-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </IonCardContent>
      </IonCard>

      <IonCard
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onMethodSelect("qr")}
      >
        <IonCardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <IonIcon icon={qrCode} className="text-2xl text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Chuyển khoản QR
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Quét mã QR để chuyển khoản ngân hàng
              </p>
            </div>
            <div className="text-gray-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default PaymentOptions;
