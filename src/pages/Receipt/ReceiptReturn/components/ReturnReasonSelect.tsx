import { FC, useMemo } from "react";
import { IonSelect, IonSelectOption } from "@ionic/react";
import { ReceiptReturnType } from "@/types/receipt-return.type";
import {
  CUSTOMER_RETURN_REASONS,
  SUPPLIER_RETURN_REASONS,
} from "@/common/constants/receipt-return.constant";

interface Props {
  type?: ReceiptReturnType;
  value: string;
  onChange: (value: string) => void;
  customReason?: string;
  onCustomReasonChange?: (customReason: string) => void;
  error?: string;
  canExchange?: boolean;
}

const normalizeReasonValue = (val: string): string => {
  if (val === "doi-san-pham") return "Đổi sản phẩm";
  if (val === "san-pham-loi") return "Sản phẩm lỗi";
  if (val === "khac" || val === "khach-khong-lay") return "Lý do khác";
  if (val === "ngung-ban") return "Ngừng bán";
  if (val === "loi-san-xuat") return "Lỗi sản xuất";
  return val;
};

const ReturnReasonSelect: FC<Props> = ({
  type = ReceiptReturnType.CUSTOMER,
  value,
  onChange,
  customReason,
  onCustomReasonChange,
  error,
  canExchange = true,
}) => {
  const isSupplier = type === ReceiptReturnType.SUPPLIER;

  const reasons = useMemo(() => {
    if (isSupplier) {
      return SUPPLIER_RETURN_REASONS.map((r) => ({ value: r, label: r }));
    }
    return CUSTOMER_RETURN_REASONS
      .filter((reason) => canExchange || reason !== "Đổi sản phẩm")
      .map((r) => ({ value: r, label: r }));
  }, [isSupplier, canExchange]);

  const normalizedValue = normalizeReasonValue(value);

  return (
    <div className="w-full">
      <IonSelect
        data-cy="return-reason"
        value={normalizedValue}
        onIonChange={(e) => {
          const nextVal = e.detail.value as string;
          onChange(nextVal);
          if (nextVal !== "Lý do khác" && onCustomReasonChange) {
            onCustomReasonChange("");
          }
        }}
        interface="popover"
        placeholder="Chọn lý do trả hàng"
        className={`pl-2 border rounded-lg w-full ${error ? "border-red-500" : "border-gray-300"}`}
      >
        {reasons.map((reason) => (
          <IonSelectOption key={reason.value} value={reason.value}>
            {reason.label}
          </IonSelectOption>
        ))}
      </IonSelect>
      {normalizedValue === "Lý do khác" && (
        <div className="mt-2">
          <input
            type="text"
            data-cy="custom-return-reason"
            placeholder="Nhập lý do khác (tùy chọn)"
            value={customReason || ""}
            onChange={(e) => onCustomReasonChange?.(e.target.value)}
            className="w-full h-11 border border-gray-300 rounded-lg px-3 text-sm bg-white focus:outline-none focus:border-blue-500 placeholder:text-gray-400 transition-colors"
          />
        </div>
      )}
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default ReturnReasonSelect;

