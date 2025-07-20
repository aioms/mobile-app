import { FC, useMemo } from "react";
import { useHistory } from "react-router";
import { Toast } from "@capacitor/toast";
import {
  IonChip,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonText,
} from "@ionic/react";
import { createOutline, playOutline } from "ionicons/icons";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useAuth, useBarcodeScanner } from "@/hooks";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_CHECK_STATUS,
  TReceiptCheckStatus,
} from "@/common/constants/receipt";
import { formatDate } from "@/helpers/formatters";

const getDifferenceColor = (difference: number) => {
  if (difference === 0) return "text-green-500";
  if (difference > 0) return "text-yellow-500";
  return "text-red-500";
};

const getDifferencePrefix = (difference: number) => {
  if (difference > 0) return "+";
  return "";
};

interface ReceiptItem {
  id: string;
  productName: string;
  inventory: number;
  systemInventory: number;
  actualInventory: number;
  costPrice: number;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  systemInventory: number;
  actualInventory: number;
  totalDifference: number;
  totalItems: number;
  checker: string;
  date: string;
  status: TReceiptCheckStatus;
  items: ReceiptItem[];
}

type Props = {
  receipt: Receipt;
};

export const ItemList: FC<Props> = ({ receipt }) => {
  const history = useHistory();

  const { user } = useAuth();
  const { update: updateReceiptCheck, incrementActualInventory } =
    useReceiptCheck();

  const handleBarcodeScanned = async (value: string) => {
    try {
      await incrementActualInventory(receipt.id, value);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  const handleError = async (error: Error) => {
    await Toast.show({
      text: error.message,
      duration: "long",
      position: "center",
    });
  };

  const { startScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleError,
  });

  const handleCheckInventory = () => {
    if (receipt.status !== RECEIPT_CHECK_STATUS.PROCESSING) {
      updateReceiptCheck(receipt.id, {
        status: RECEIPT_CHECK_STATUS.PROCESSING,
      });
    }

    startScan();
  };

  const totalValueDifference = useMemo(() => {
    return receipt.items.reduce((total, item) => {
      return total + (item.actualInventory - item.systemInventory);
    }, 0);
  }, [receipt.items]);

  const receiptStatus = useMemo(() => {
    if (totalValueDifference === 0) {
      return RECEIPT_CHECK_STATUS.BALANCED;
    }

    return receipt.status;
  }, [receipt.status, totalValueDifference]);

  const isShowCheckButton = useMemo(() => {
    if (!user || !receipt) return false;

    return (
      receipt.status !== RECEIPT_CHECK_STATUS.BALANCED &&
      receipt.status !== RECEIPT_CHECK_STATUS.BALANCING_REQUIRED &&
      receipt.checker === user.id
    );
  }, [receipt, user]);

  const differenceColor = getDifferenceColor(totalValueDifference);
  const differencePrefix = getDifferencePrefix(totalValueDifference);

  return (
    <>
      <IonItemSliding>
        <IonItem
          className="py-2"
          lines="full"
          routerLink={`/tabs/receipt-check/${receipt.id}`}
        >
          <IonLabel className="ml-4">
            <div className="md:flex md:items-center mb-2">
              <div>
                <IonText>
                  <span className="font-semibold text-sm mr-1">
                    Mã phiếu: {receipt.receiptNumber}
                  </span>
                </IonText>

                <IonChip color={getStatusColor(receipt.status)}>
                  <span className="text-sm">
                    {getStatusLabel(receiptStatus)}
                  </span>
                </IonChip>
              </div>

              <div className="text-gray-500 text-sm">
                Số mặt hàng: {receipt.totalItems}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="mt-1 text-xs text-gray-600">
                  {receipt.items.map((item) => (
                    <p key={item.id}>
                      {item.productName.length > 15
                        ? `${item.productName.slice(0, 15)}...`
                        : item.productName}{" "}
                      - SL: {item.inventory}
                    </p>
                  ))}

                  {receipt.totalItems > receipt.items.length && (
                    <button
                      className="text-blue-600 text-sm mt-1"
                      onClick={() => {
                        history.push(`/tabs/receipt-check/${receipt.id}`);
                      }}
                    >
                      Xem thêm...
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">Chênh lệch</span>
                  <span className={`font-bold text-sm ${differenceColor}`}>
                    {differencePrefix}
                    {totalValueDifference}
                  </span>
                </div>
                <div className="mt-auto text-right">
                  <div className="flex items-center text-gray-600">
                    <span className="text-sm">{formatDate(receipt.date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </IonLabel>
        </IonItem>

        <IonItemOptions slot="end">
          {isShowCheckButton && (
            <IonItemOption color="warning" onClick={handleCheckInventory}>
              <IonIcon slot="icon-only" icon={playOutline}></IonIcon>
              Kiểm
            </IonItemOption>
          )}
          <IonItemOption>
            <IonIcon slot="icon-only" icon={createOutline}></IonIcon>
            Cập nhật
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    </>
  );
};
