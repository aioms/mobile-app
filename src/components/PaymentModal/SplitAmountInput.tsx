import React, { useMemo, useState } from "react";
import {
  IonButton,
  IonCol,
  IonGrid,
  IonInput,
  IonItem,
  IonLabel,
  IonRow,
  IonText,
} from "@ionic/react";
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import { getSplitPaymentState } from "./splitPayment";

interface SplitAmountInputProps {
  totalAmount: number;
  onConfirm: (cashAmount: number, bankAmount: number) => void;
  onBack: () => void;
}

const SplitAmountInput: React.FC<SplitAmountInputProps> = ({
  totalAmount,
  onConfirm,
  onBack,
}) => {
  const [cashAmount, setCashAmount] = useState(0);
  const [bankAmount, setBankAmount] = useState(0);
  const [error, setError] = useState("");

  const { enteredAmount, difference, isValid } = useMemo(
    () => getSplitPaymentState(totalAmount, cashAmount, bankAmount),
    [totalAmount, cashAmount, bankAmount],
  );

  const updateAmount = (
    value: string | number | null | undefined,
    setter: (value: number) => void,
  ) => {
    const amount = parseCurrencyInput(String(value || ""));
    setter(Number.isFinite(amount) && amount >= 0 ? amount : 0);
    setError("");
  };

  const handleConfirm = () => {
    if (!isValid) {
      setError(
        difference < 0
          ? "Tổng tiền khách đưa còn thiếu"
          : difference > 0
          ? "Tổng tiền khách đưa đang vượt Thành tiền"
          : "Mỗi phương thức phải có số tiền lớn hơn 0",
      );
      return;
    }
    onConfirm(cashAmount, bankAmount);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Chia khoản thanh toán</h3>
        <IonText color="medium">
          <p>Thành tiền: {formatCurrency(totalAmount)}</p>
        </IonText>
      </div>

      <IonItem className="mb-3">
        <IonLabel position="stacked">Tiền mặt (VNĐ)</IonLabel>
        <IonInput
          type="text"
          inputMode="numeric"
          value={cashAmount ? formatCurrencyWithoutSymbol(cashAmount) : ""}
          placeholder="Nhập tiền mặt"
          aria-label="Số tiền tiền mặt"
          onIonInput={(event) => updateAmount(event.detail.value, setCashAmount)}
        />
      </IonItem>

      <IonItem className="mb-3">
        <IonLabel position="stacked">Chuyển khoản (VNĐ)</IonLabel>
        <IonInput
          type="text"
          inputMode="numeric"
          value={bankAmount ? formatCurrencyWithoutSymbol(bankAmount) : ""}
          placeholder="Nhập tiền chuyển khoản"
          aria-label="Số tiền chuyển khoản"
          onIonInput={(event) => updateAmount(event.detail.value, setBankAmount)}
        />
      </IonItem>

      <div className="rounded-lg bg-gray-50 p-3 mb-4 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Tổng khách đưa</span>
          <strong>{formatCurrency(enteredAmount)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Chênh lệch</span>
          <strong className={difference === 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(Math.abs(difference))}
          </strong>
        </div>
      </div>

      {error && (
        <IonText color="danger" className="block mb-4" role="alert">
          <p className="text-sm">{error}</p>
        </IonText>
      )}

      <IonGrid>
        <IonRow>
          <IonCol size="6">
            <IonButton fill="outline" expand="block" onClick={onBack}>
              Quay lại
            </IonButton>
          </IonCol>
          <IonCol size="6">
            <IonButton
              color="success"
              expand="block"
              onClick={handleConfirm}
              disabled={!isValid}
            >
              Xác nhận
            </IonButton>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default SplitAmountInput;
