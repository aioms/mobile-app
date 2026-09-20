import React from "react";
import { IonButton, IonCard, IonCardContent, IonIcon, IonSpinner } from "@ionic/react";
import { cash, chevronBack, checkmarkCircle, qrCode } from "ionicons/icons";
import { formatCurrency } from "@/helpers/formatters";

interface PaymentCompletionProps {
  transactions: Array<{ amount: number; method: "cash" | "qr" }>;
  onComplete: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const PaymentCompletion: React.FC<PaymentCompletionProps> = ({
  transactions,
  onComplete,
  onBack,
  isProcessing,
}) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-3 mb-6">
      <IonButton fill="clear" onClick={onBack} disabled={isProcessing}>
        <IonIcon icon={chevronBack} className="text-xl" />
      </IonButton>
      <span className="text-lg font-semibold text-gray-800">Hoàn tất thanh toán</span>
    </div>

    <IonCard>
      <IonCardContent className="p-6 text-center">
        <div className="mb-6">
          <IonIcon icon={checkmarkCircle} className="text-5xl text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Xác nhận thanh toán</h2>
          <p className="text-gray-600">Vui lòng xác nhận thông tin thanh toán dưới đây</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          {transactions.map((transaction) => (
            <div className="flex justify-between items-center" key={transaction.method}>
              <div className="flex items-center gap-2 text-gray-600">
                <IonIcon icon={transaction.method === "cash" ? cash : qrCode} className="text-blue-600" />
                <span>{transaction.method === "cash" ? "Tiền mặt" : "Chuyển khoản"}</span>
              </div>
              <span className="font-bold text-green-600">{formatCurrency(transaction.amount)}</span>
            </div>
          ))}
        </div>

        <IonButton expand="block" onClick={onComplete} disabled={isProcessing} color="success">
          {isProcessing ? <><IonSpinner name="crescent" slot="start" />Đang xử lý...</> : "Xác nhận"}
        </IonButton>
      </IonCardContent>
    </IonCard>
  </div>
);

export default PaymentCompletion;
