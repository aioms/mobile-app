import React, { useState } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
} from "@ionic/react";
import { close } from "ionicons/icons";
import PaymentOptions from "./PaymentOptions";
import AmountInput from "./AmountInput";
import QRCodeDisplay from "./QRCodeDisplay";
import PaymentCompletion from "./PaymentCompletion";
import { getDate } from "@/helpers/date";

export type PaymentMethod = "cash" | "qr" | null;
export type PaymentStep = "options" | "amount" | "qr" | "completion";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    totalAmount: number;
  };
  preSelectedMethod?: PaymentMethod;
  onPaymentComplete: (amount: number, method: PaymentMethod) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  preSelectedMethod,
  onPaymentComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>(
    preSelectedMethod ? (preSelectedMethod === "qr" ? "qr" : "completion") : "options"
  );
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(preSelectedMethod || null);
  const [paymentAmount, setPaymentAmount] = useState<number>(preSelectedMethod ? orderData.totalAmount : 0);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep("amount");
  };

  const handleAmountConfirm = (amount: number) => {
    setPaymentAmount(amount);
    if (selectedMethod === "qr") {
      setCurrentStep("qr");
    } else {
      setCurrentStep("completion");
    }
  };

  const handlePaymentComplete = () => {
    onPaymentComplete(paymentAmount, selectedMethod);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(preSelectedMethod ? (preSelectedMethod === "qr" ? "qr" : "completion") : "options");
    setSelectedMethod(preSelectedMethod || null);
    setPaymentAmount(preSelectedMethod ? orderData.totalAmount : 0);
    onClose();
  };

  const handleBack = () => {
    switch (currentStep) {
      case "amount":
        setCurrentStep("options");
        setSelectedMethod(null);
        break;
      case "qr":
        setCurrentStep("amount");
        break;
      case "completion":
        if (selectedMethod === "qr") {
          setCurrentStep("qr");
        } else {
          setCurrentStep("amount");
        }
        break;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "options":
        return "Chọn hình thức thanh toán";
      case "amount":
        return "Nhập số tiền thanh toán";
      case "qr":
        return "Quét mã QR để thanh toán";
      case "completion":
        return "Hoàn tất thanh toán";
      default:
        return "Thanh toán";
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{getStepTitle()}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" onClick={handleClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {currentStep === "options" && (
          <PaymentOptions onMethodSelect={handleMethodSelect} />
        )}

        {currentStep === "amount" && (
          <AmountInput
            maxAmount={orderData.totalAmount}
            onAmountConfirm={handleAmountConfirm}
            onBack={handleBack}
            method={selectedMethod}
          />
        )}

        {currentStep === "qr" && (
          <QRCodeDisplay
            amount={paymentAmount}
            orderCode={getDate(new Date()).format("DDMMYYYY HHmmss")}
            onBack={handleBack}
            onContinue={() => setCurrentStep("completion")}
          />
        )}

        {currentStep === "completion" && (
          <PaymentCompletion
            amount={paymentAmount}
            method={selectedMethod}
            onComplete={handlePaymentComplete}
            onBack={handleBack}
          />
        )}
      </IonContent>
    </IonModal>
  );
};

export default PaymentModal;