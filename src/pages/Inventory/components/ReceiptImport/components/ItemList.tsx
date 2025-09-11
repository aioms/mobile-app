import React from "react";
import {
  IonItem,
  IonLabel,
  IonChip,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from "@ionic/react";
import {
  calendar,
  cube,
  checkmarkOutline,
  arrowUpOutline,
  closeOutline,
} from "ionicons/icons";
import { formatDate } from "@/helpers/formatters";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/common/enums/user";
import { ReceiptImportStatus } from "@/common/enums/receipt";
import { getStatusColor, getStatusLabel, TReceiptImportStatus } from "@/common/constants/receipt";

interface ItemListProps {
  id: string;
  receiptNumber: string;
  importDate: string;
  quantity: number;
  status: string;
  warehouse: string;
  note: string;
  userCreated: string;
  createdAt: string;
  onRequestApproval?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const ItemList: React.FC<ItemListProps> = ({
  id,
  receiptNumber,
  importDate,
  quantity,
  status,
  warehouse,
  userCreated,
  createdAt,
  onRequestApproval,
  onComplete,
  onCancel,
}) => {
  const { user } = useAuth();
  const userRole = user?.role || "";

  const isUserCreated = user?.id === userCreated;
  const isEmployee = userRole === UserRole.EMPLOYEE;
  const canApprove = (
    [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER] as string[]
  ).includes(userRole);

  const showRequestApproval =
    status === ReceiptImportStatus.PROCESSING && isEmployee && isUserCreated;
  const showComplete = status === ReceiptImportStatus.WAITING && canApprove;
  const showCancel =
    (status === ReceiptImportStatus.PROCESSING || status === ReceiptImportStatus.WAITING) &&
    (canApprove || (isEmployee && isUserCreated));

  return (
    <IonItemSliding>
      <IonItem
        lines="full"
        className="py-2"
        routerLink={`/tabs/receipt-import/detail/${id}`}
      >
        <IonLabel className="ml-4">
          <div className="md:flex md:items-center">
            <span className="font-semibold text-lg">
              Mã phiếu: {receiptNumber}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            Trạng thái:
            <IonChip color={getStatusColor(status as TReceiptImportStatus)} className="ml-2">
              <span className="text-sm">{getStatusLabel(status as TReceiptImportStatus)}</span>
            </IonChip>
          </p>
          <p className="text-gray-500 text-sm">Cửa hàng: {warehouse || "--"}</p>
          <div className="flex justify-start items-center mt-5">
            <div className="flex items-center text-gray-600 mr-3">
              <IonIcon icon={calendar} className="mr-2" />
              <span className="text-sm">{formatDate(createdAt)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <IonIcon icon={cube} className="mr-2" />
              <span className="text-sm">Số lượng: {quantity}</span>
            </div>
          </div>
        </IonLabel>
      </IonItem>

      <IonItemOptions side="end">
        {showRequestApproval && (
          <IonItemOption
            color="tertiary"
            onClick={() => onRequestApproval?.(id)}
          >
            Yêu cầu duyệt
            <IonIcon slot="icon-only" icon={arrowUpOutline}></IonIcon>
          </IonItemOption>
        )}
        {showComplete && (
          <IonItemOption
            color="success"
            style={{ color: "white" }}
            onClick={() => onComplete?.(id)}
          >
            <IonIcon slot="icon-only" icon={checkmarkOutline}></IonIcon>
            Hoàn thành
          </IonItemOption>
        )}
        {showCancel && (
          <IonItemOption
            color="danger"
            onClick={() => onCancel?.(id)}
          >
            <IonIcon slot="icon-only" icon={closeOutline}></IonIcon>
            Hủy
          </IonItemOption>
        )}
      </IonItemOptions>
    </IonItemSliding>
  );
};

export default ItemList;
