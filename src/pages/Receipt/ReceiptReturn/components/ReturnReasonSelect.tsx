import { FC } from "react";
import { IonSelect, IonSelectOption } from "@ionic/react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const RETURN_REASONS = [
  { value: "khach-khong-lay", label: "Khách không lấy" },
  { value: "san-pham-loi", label: "Sản phẩm lỗi" },
  { value: "doi-san-pham", label: "Đổi sản phẩm" },
  { value: "khac", label: "Khác" },
];

const ReturnReasonSelect: FC<Props> = ({ value, onChange, error }) => {
  return (
    <div className="w-full">
      <IonSelect
        value={value}
        onIonChange={(e) => onChange(e.detail.value as string)}
        interface="popover"
        placeholder="Chọn lý do trả hàng"
        className={`border rounded-lg w-full ${error ? "border-red-500" : "border-gray-300"
          }`}
      >
        {RETURN_REASONS.map((reason) => (
          <IonSelectOption key={reason.value} value={reason.value}>
            {reason.label}
          </IonSelectOption>
        ))}
      </IonSelect>
      {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
    </div>
  );
};

export default ReturnReasonSelect;
