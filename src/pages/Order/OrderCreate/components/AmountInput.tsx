import React, { useState } from "react";
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import { PaymentMethod } from "./PaymentModal";

interface AmountInputProps {
  maxAmount: number;
  onAmountConfirm: (amount: number) => void;
  onBack: () => void;
  method: PaymentMethod;
}

const AmountInput: React.FC<AmountInputProps> = ({
  maxAmount,
  onAmountConfirm,
  onBack,
  method,
}) => {
  const [displayAmount, setDisplayAmount] = useState<string>("");
  const [numericAmount, setNumericAmount] = useState<number>(0);
  const [error, setError] = useState<string>("");

  const handleAmountChange = (value: string | number | null | undefined) => {
    const stringValue = String(value || "");

    // Parse the numeric value from input
    const parsed = parseCurrencyInput(stringValue);
    setNumericAmount(parsed);

    // Format for display
    if (parsed === 0) {
      setDisplayAmount("");
    } else {
      setDisplayAmount(formatCurrencyWithoutSymbol(parsed));
    }

    setError("");
  };

  const validateAndConfirm = () => {
    if (!numericAmount || numericAmount <= 0) {
      setError("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (numericAmount > maxAmount) {
      setError(`Số tiền không được vượt quá ${formatCurrency(maxAmount)}`);
      return;
    }

    onAmountConfirm(numericAmount);
  };

  const setMaxAmount = () => {
    setNumericAmount(maxAmount);
    setDisplayAmount(formatCurrencyWithoutSymbol(maxAmount));
    setError("");
  };

  const getPaymentMethodText = () => {
    return method === "cash" ? "Tiền mặt" : "Chuyển khoản QR";
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Nhập số tiền thanh toán</h3>
        <IonText color="medium">
          <p>Hình thức: {getPaymentMethodText()}</p>
          <p>Tổng tiền đơn hàng: {formatCurrency(maxAmount)}</p>
        </IonText>
      </div>

      <IonItem className="mb-4">
        <IonLabel position="stacked">Số tiền (VNĐ)</IonLabel>
        <IonInput
          type="text"
          value={displayAmount}
          placeholder="Nhập số tiền"
          onIonInput={(e) => handleAmountChange(e.detail.value!)}
          className={error ? "ion-invalid" : ""}
        />
      </IonItem>

      {error && (
        <IonText color="danger" className="block mb-4">
          <p className="text-sm">{error}</p>
        </IonText>
      )}

      <div className="mb-4">
        <IonButton
          fill="outline"
          size="small"
          onClick={setMaxAmount}
          className="w-full"
        >
          Thanh toán toàn bộ ({formatCurrency(maxAmount)})
        </IonButton>
      </div>

      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonButton fill="outline" expand="block" onClick={onBack}>
              Quay lại
            </IonButton>
          </IonCol>
          <IonCol size="6">
            <IonButton
              expand="block"
              onClick={validateAndConfirm}
              disabled={!numericAmount}
            >
              Xác nhận
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default AmountInput;