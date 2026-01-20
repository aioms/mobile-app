import React, { FC } from "react";
import { IonText } from "@ionic/react";
import { formatCurrency } from "@/helpers/formatters";

interface Props {
  totalProduct: number;
  totalQuantity: number;
  totalAmount: number;
}

const RefundSummarySection: FC<Props> = ({
  totalProduct,
  totalQuantity,
  totalAmount,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4">
      <h2 className="text-md font-medium text-foreground mb-3">
        Tổng Kết Trả Hàng
      </h2>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tổng số sản phẩm:</span>
          <span className="font-medium">{totalProduct}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Tổng số lượng:</span>
          <span className="font-medium">{totalQuantity}</span>
        </div>

        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <IonText className="text-md font-medium">
              Tổng Tiền Hoàn Trả:
            </IonText>
            <IonText className="text-lg font-bold" color="danger">
              {formatCurrency(totalAmount)}
            </IonText>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundSummarySection;
