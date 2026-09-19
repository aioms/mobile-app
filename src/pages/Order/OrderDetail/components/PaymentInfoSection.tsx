import React, { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { cardOutline } from "ionicons/icons";

import { formatCurrency } from "@/helpers/formatters";
import { IOrderItem } from "@/types";
import { OrderPaymentDetails } from "@/types/payment.type";
import { PaymentMethod } from "@/common/enums/payment";

interface PaymentInfoSectionProps {
  subtotal: number;
  discount: number;
  paymentMethod: string;
  items: IOrderItem[];
  exchangeSummary?: {
    returnedAmount: number;
    replacementAmount: number;
    differenceAmount: number;
  };
  paymentDetails?: OrderPaymentDetails | null;
}

const PaymentInfoSection: React.FC<PaymentInfoSectionProps> = ({
  subtotal,
  discount,
  paymentMethod,
  items,
  exchangeSummary,
  paymentDetails,
}) => {
  // Calculate money using the same logic as OrderUpdate
  const calculateTotalVat = () => {
    return items.reduce((totalVat, item) => {
      const itemPrice = item.price * item.quantity;
      const vatAmount = (itemPrice * (item.vatRate || 0)) / 100;
      return totalVat + vatAmount;
    }, 0);
  };

  const totalVat = useMemo(() => calculateTotalVat(), [items]);

  const finalTotal = useMemo(() => {
    const finalTotal = subtotal - discount // + totalVat;
    return finalTotal > 0 ? finalTotal : 0;
  }, [subtotal, discount]);

  return (
    <div className="bg-card rounded-lg shadow-sm mb-4">
      <div className="p-4 border-b border-border">
        <div className="flex items-center">
          <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center mr-2">
            <IonIcon icon={cardOutline} className="text-white text-sm" />
          </div>
          <span className="font-medium">Thông tin thanh toán</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Tổng tiền hàng:</span>
          <span>{formatCurrency(subtotal - totalVat)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Giảm giá:</span>
          {discount && (
            <span className="text-red-500">-{formatCurrency(discount)}</span>
          )}
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Tổng VAT:</span>
          <span>{formatCurrency(totalVat)}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">Phương thức thanh toán:</span>
          <span>{paymentMethod}</span>
        </div>
        {paymentDetails?.transactions.map((transaction) => (
          <div className="flex justify-between items-center mb-2 pl-4" key={transaction.id}>
            <span className="text-muted-foreground">
              {transaction.paymentMethod === PaymentMethod.CASH ? "Tiền mặt" : "Chuyển khoản"}:
            </span>
            <span>{formatCurrency(Number(transaction.amount))}</span>
          </div>
        ))}
        {exchangeSummary && (
          <div className="border-t border-border pt-2 mt-2 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Giá trị trả:</span>
              <span>{formatCurrency(exchangeSummary.returnedAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Giá trị đổi:</span>
              <span>{formatCurrency(exchangeSummary.replacementAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Chênh lệch:</span>
              <span className={exchangeSummary.differenceAmount < 0 ? "text-red-500" : "text-green-500"}>
                {formatCurrency(Math.abs(exchangeSummary.differenceAmount))}
              </span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-medium">Tổng thanh toán:</span>
          <span className="text-green-500 font-medium">
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoSection;
