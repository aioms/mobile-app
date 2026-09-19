import React, { useEffect, useRef, useState } from "react";
import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { close } from "ionicons/icons";
import PaymentOptions from "./PaymentOptions";
import SplitAmountInput from "./SplitAmountInput";
import QRCodeDisplay from "./QRCodeDisplay";
import PaymentCompletion from "./PaymentCompletion";
import { getDate } from "@/helpers/date";
import { PaymentMethod as TransactionPaymentMethod } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";
import { PaymentTransactionDto } from "@/types/payment.type";

export type PaymentMethod = "cash" | "qr" | "mixed" | null;
export type PaymentStep = "options" | "split" | "qr" | "completion";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: { totalAmount: number };
  preSelectedMethod?: PaymentMethod;
  onPaymentComplete: (transactions: PaymentTransactionDto[]) => void | Promise<void>;
}

const getInitialStep = (method: PaymentMethod): PaymentStep => {
  if (method === "mixed") return "split";
  if (method === "qr") return "qr";
  if (method === "cash") return "completion";
  return "options";
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderData,
  preSelectedMethod,
  onPaymentComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>(getInitialStep(preSelectedMethod || null));
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(preSelectedMethod || null);
  const [splitAmounts, setSplitAmounts] = useState({ cash: 0, bank: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedMethod(preSelectedMethod || null);
    setCurrentStep(getInitialStep(preSelectedMethod || null));
    setSplitAmounts({ cash: 0, bank: 0 });
    setIsProcessing(false);
  }, [isOpen, preSelectedMethod, orderData.totalAmount]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setCurrentStep(getInitialStep(method));
  };

  const buildTransactions = (): PaymentTransactionDto[] => {
    if (selectedMethod === "mixed") {
      return [
        { amount: splitAmounts.cash, paymentMethod: TransactionPaymentMethod.CASH, type: TransactionType.PAYMENT },
        { amount: splitAmounts.bank, paymentMethod: TransactionPaymentMethod.BANK_TRANSFER, type: TransactionType.PAYMENT },
      ];
    }

    return [{
      amount: orderData.totalAmount,
      paymentMethod: selectedMethod === "qr" ? TransactionPaymentMethod.BANK_TRANSFER : TransactionPaymentMethod.CASH,
      type: TransactionType.PAYMENT,
    }];
  };

  const handlePaymentComplete = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      await onPaymentComplete(buildTransactions());
      handleClose();
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessingRef.current) return;
    setCurrentStep(getInitialStep(preSelectedMethod || null));
    setSelectedMethod(preSelectedMethod || null);
    setSplitAmounts({ cash: 0, bank: 0 });
    onClose();
  };

  const handleBack = () => {
    if (currentStep === "split") {
      setCurrentStep("options");
      setSelectedMethod(null);
    } else if (currentStep === "qr") {
      setCurrentStep(selectedMethod === "mixed" ? "split" : "options");
    } else if (currentStep === "completion") {
      setCurrentStep(selectedMethod === "mixed" ? "split" : selectedMethod === "qr" ? "qr" : "options");
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "options": return "Chọn hình thức thanh toán";
      case "split": return "Chia khoản thanh toán";
      case "qr": return "Quét mã QR để thanh toán";
      case "completion": return "Hoàn tất thanh toán";
    }
  };

  return (
    <IonModal isOpen={isOpen} canDismiss={!isProcessing} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{getStepTitle()}</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" aria-label="Đóng thanh toán" onClick={handleClose} disabled={isProcessing}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {currentStep === "options" && <PaymentOptions onMethodSelect={handleMethodSelect} />}
        {currentStep === "split" && (
          <SplitAmountInput
            totalAmount={orderData.totalAmount}
            onBack={handleBack}
            onConfirm={(cash, bank) => {
              setSplitAmounts({ cash, bank });
              setCurrentStep("qr");
            }}
          />
        )}
        {currentStep === "qr" && (
          <QRCodeDisplay
            amount={selectedMethod === "mixed" ? splitAmounts.bank : orderData.totalAmount}
            orderCode={getDate(new Date()).format("DDMMYYYY HHmmss")}
            onBack={handleBack}
            onContinue={() => setCurrentStep("completion")}
          />
        )}
        {currentStep === "completion" && (
          <PaymentCompletion
            transactions={buildTransactions().map((transaction) => ({
              amount: transaction.amount,
              method: transaction.paymentMethod === TransactionPaymentMethod.CASH ? "cash" : "qr",
            }))}
            onComplete={handlePaymentComplete}
            onBack={handleBack}
            isProcessing={isProcessing}
          />
        )}
      </IonContent>
    </IonModal>
  );
};

export default PaymentModal;
