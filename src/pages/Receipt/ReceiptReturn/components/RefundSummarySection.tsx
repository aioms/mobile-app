import React, { FC } from "react";
import { IonText } from "@ionic/react";
import { formatCurrency } from "@/helpers/formatters";

interface Props {
  totalProduct: number;
  totalQuantity: number;
  totalAmount: number;
  isDebt?: boolean;
}

const RefundSummarySection: FC<Props> = ({
  totalProduct,
  totalQuantity,
  totalAmount,
  isDebt = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-3.5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
        Tổng kết trả hàng
      </h2>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center text-gray-600">
          <span>Tổng số mặt hàng:</span>
          <span className="font-semibold text-gray-800">{totalProduct}</span>
        </div>

        <div className="flex justify-between items-center text-gray-600">
          <span>Tổng số lượng trả:</span>
          <span className="font-semibold text-gray-800">{totalQuantity}</span>
        </div>

        <div className="border-t border-dashed border-gray-200 pt-2 mt-2 flex justify-between items-center">
          <span className="text-xs font-bold text-gray-900">
            {isDebt ? "Giá trị hàng trả:" : "Tổng tiền hoàn trả:"}
          </span>
          <span className="text-base font-extrabold text-rose-600">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RefundSummarySection;
