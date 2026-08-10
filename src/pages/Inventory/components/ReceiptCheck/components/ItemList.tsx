import { FC, useMemo, useRef } from "react";
import { useHistory } from "react-router";
import { Toast } from "@capacitor/toast";
import {
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  useIonViewDidLeave,
} from "@ionic/react";
import { AppBadge } from "@/components/UI";
import { createOutline, playOutline, chevronForward } from "ionicons/icons";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useAuth, useBarcodeScanner } from "@/hooks";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_CHECK_STATUS,
  TReceiptCheckStatus,
} from "@/common/constants/receipt-check.constant";
import { formatDate } from "@/helpers/formatters";

const getDifferenceBadgeClasses = (difference: number) => {
  if (difference === 0) return "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
  if (difference > 0) return "bg-amber-50 text-amber-600 border border-amber-200/60";
  return "bg-rose-50 text-rose-600 border border-rose-200/60";
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
  checker: {
    id: string;
    fullname: string;
  };
  date: string;
  status: TReceiptCheckStatus;
  items: ReceiptItem[];
}

type Props = {
  receipt: Receipt;
};

export const ItemList: FC<Props> = ({ receipt }) => {
  const slidingRef = useRef<HTMLIonItemSlidingElement>(null);
  const history = useHistory();

  const { user } = useAuth();
  const { update: updateReceiptCheck, incrementActualInventory } =
    useReceiptCheck();

  const handleBarcodeScanned = async (value: string) => {
    try {
      await incrementActualInventory(
        receipt.id,
        value,
      );
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
    onStop: () => {
      history.push(`/tabs/receipt-check/detail/${receipt.id}`);
    },
    delay: 4000,
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
      receipt.checker?.id === user.id
    );
  }, [receipt, user]);

  const differencePrefix = getDifferencePrefix(totalValueDifference);

  useIonViewDidLeave(() => {
    slidingRef.current?.close();
  });

  return (
    <>
      <IonItemSliding ref={slidingRef}>
        <IonItem
          lines="none"
          detail={false}
          className="ion-activatable ripple-parent rounded-2xl shadow-sm border border-gray-100 mb-3 mx-4 mt-1 [&::part(native)]:bg-white [&::part(native)]:px-4 [&::part(native)]:py-3"
          routerLink={`/tabs/receipt-check/detail/${receipt.id}`}
        >
          <IonLabel className="w-full m-0 p-0 font-sans">
            {/* Header: Receipt Code (Full, No Truncation) + Status Badge */}
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-bold text-gray-900 text-sm sm:text-base whitespace-nowrap shrink-0">
                Mã: {receipt.receiptNumber}
              </span>
              <AppBadge color={getStatusColor(receipt.status)}>
                <span className="text-[11px] font-bold whitespace-nowrap">
                  {getStatusLabel(receiptStatus)}
                </span>
              </AppBadge>
            </div>

            {/* Sub-header: Creation Date */}
            <div className="text-[11px] text-gray-400 font-medium mb-2">
              {formatDate(receipt.date)}
            </div>

            {/* Middle: Structured Product List Box */}
            {receipt.items && receipt.items.length > 0 && (
              <div className="bg-gray-50/80 rounded-xl p-2.5 mb-2.5 space-y-1.5 border border-gray-100/60">
                {receipt.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-xs gap-2"
                  >
                    <span className="text-gray-700 font-medium truncate flex-1 min-w-0">
                      {item.productName}
                    </span>
                    <span className="text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200/80 font-medium text-[11px] shrink-0">
                      SL: {item.inventory}
                    </span>
                  </div>
                ))}

                {receipt.totalItems > receipt.items.length && (
                  <div className="pt-0.5 flex justify-end">
                    <span className="text-blue-600 text-[11px] font-medium">
                      + {receipt.totalItems - receipt.items.length} mặt hàng khác...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Footer: Item Count (Left), Discrepancy + Arrow (Right) */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-gray-500 font-medium">
                Số mặt hàng:{" "}
                <strong className="text-gray-800 font-semibold">
                  {receipt.totalItems}
                </strong>
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-500 font-medium">Chênh lệch:</span>
                <span
                  className={`font-bold text-xs px-2 py-0.5 rounded-full ${getDifferenceBadgeClasses(
                    totalValueDifference
                  )}`}
                >
                  {differencePrefix}
                  {totalValueDifference}
                </span>
                <IonIcon
                  icon={chevronForward}
                  className="text-gray-400 text-sm ml-0.5"
                />
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

