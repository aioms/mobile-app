import React from "react";
import { IonItem, IonLabel, IonChip, IonIcon } from "@ionic/react";
import { calendar, cube } from "ionicons/icons";
import { formatDate } from "@/helpers/formatters";

interface ItemListProps {
  id: string;
  receiptNumber: string;
  expectedImportDate: string;
  quantity: number;
  status: string;
  warehouseLocation: string;
  note: string;
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return {
        label: "Nháp",
        color: "medium",
      };
    case "processing":
      return {
        label: "Đang xử lý",
        color: "warning",
      };
    case "cancelled":
      return {
        label: "Đã hủy",
        color: "danger",
      };
    case "completed":
      return {
        label: "Hoàn thành",
        color: "success",
      };
    case "short_received":
      return {
        label: "Giao thiếu",
        color: "dark",
      };
    case "over_received":
      return {
        label: "Giao dư",
        color: "dark",
      };
    default:
      return {
        label: "Không có trạng thái",
        color: "light",
      };
  }
};

const ItemList: React.FC<ItemListProps> = ({
  id,
  receiptNumber,
  expectedImportDate,
  quantity,
  status,
  warehouseLocation,
  note,
}) => {
  return (
    <IonItem lines="full" className="py-2" routerLink={`/tabs/receipt-import/${id}`}>
      <IonLabel className="ml-4">
        <div className="md:flex md:items-center">
          <span className="font-semibold text-lg">
            Mã phiếu: {receiptNumber}
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          Trạng thái:
          <IonChip color={getStatusColor(status).color} className="ml-2">
            <span className="text-sm">{getStatusColor(status).label}</span>
          </IonChip>
        </p>
        <p className="text-gray-500 text-sm">Cửa hàng: {warehouseLocation}</p>
        {/* {note && <p className="text-gray-500 text-sm">Ghi chú: {note}</p>} */}
        <div className="flex justify-start items-center mt-5">
          <div className="flex items-center text-gray-600 mr-3">
            <IonIcon icon={calendar} className="mr-2" />
            <span className="text-sm">{formatDate(expectedImportDate)}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <IonIcon icon={cube} className="mr-2" />
            <span className="text-sm">Số lượng: {quantity}</span>
          </div>
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default ItemList;
