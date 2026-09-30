import React from "react";
import { IonInput, IonText } from "@ionic/react";

import { formatCurrency } from "@/helpers/formatters";

interface ReceiptPeriodTotalsProps {
  subtotal: number;
  discountAmountDisplay: string;
  vatAmountDisplay: string;
  total: number;
  discountError?: string;
  onDiscountAmountChange: (value: string | null | undefined) => void;
  onVatAmountChange: (value: string | null | undefined) => void;
}

const ReceiptPeriodTotals: React.FC<ReceiptPeriodTotalsProps> = ({
  subtotal,
  discountAmountDisplay,
  vatAmountDisplay,
  total,
  discountError,
  onDiscountAmountChange,
  onVatAmountChange,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-4 mt-3 space-y-4">
    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
      <IonText className="text-base font-medium text-gray-800">
        Tổng Tiền Đợt Thu Mới:
      </IonText>
      <IonText className="text-lg font-bold text-blue-600">
        {formatCurrency(subtotal)}
      </IonText>
    </div>

    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        Chiết khấu
      </h2>
      <div
        className={`border rounded-lg px-3 py-2 bg-white ${
          discountError ? "border-red-500" : "border-gray-300"
        }`}
      >
        <IonInput
          type="text"
          inputMode="numeric"
          value={discountAmountDisplay}
          placeholder="Nhập số tiền chiết khấu"
          className="text-base"
          onIonInput={(event) => onDiscountAmountChange(event.detail.value)}
        />
      </div>
      {discountError && (
        <p className="text-sm text-red-500 mt-1">{discountError}</p>
      )}
    </div>

    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-1">
        VAT đợt thu
      </h2>
      <div className="border border-gray-300 rounded-lg px-3 py-2 bg-white">
        <IonInput
          type="text"
          inputMode="numeric"
          value={vatAmountDisplay}
          placeholder="Nhập số tiền VAT"
          className="text-base"
          onIonInput={(event) => onVatAmountChange(event.detail.value)}
        />
      </div>
    </div>

    <div className="flex justify-between items-center pt-2">
      <IonText className="text-base font-medium text-gray-800">
        Tổng cộng (sau chiết khấu, gồm VAT):
      </IonText>
      <IonText className="text-xl font-bold text-red-600">
        {formatCurrency(total)}
      </IonText>
    </div>
  </div>
);

export default ReceiptPeriodTotals;
