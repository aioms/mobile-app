import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useHistory, useParams } from "react-router";

import { Toast } from "@capacitor/toast";
import { Dialog } from "@capacitor/dialog";
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonToolbar,
  RefresherEventDetail,
  useIonToast,
} from "@ionic/react";
import { chevronBack, scanOutline } from "ionicons/icons";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useAuth, useBarcodeScanner, useLoading } from "@/hooks";
import { createDebounce } from "@/helpers/common";

import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_CHECK_REASONS,
  RECEIPT_CHECK_STATUS,
  TReceiptCheckStatus,
} from "@/common/constants/receipt";
import { dayjsFormat, formatCurrency } from "@/helpers/formatters";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import SlideableReceiptItem from "./components/SlideableReceiptItemV2";
import ActivityHistory, { ActivityLog } from "./components/ActivityHistory";
import { UserRole } from "@/common/enums/user";

interface ReceiptItem {
  id: string;
  productId: string;
  code: string;
  productName: string;
  productCode: string;
  systemInventory: number;
  actualInventory: number;
  costPrice: number;
}

interface ReceiptCheck {
  id: string;
  receiptNumber: string;
  systemInventory: number;
  actualInventory: number;
  totalDifference: number;
  totalItems: number;
  supplier: {
    id: string;
    name: string;
  };
  warehouse: string;
  activityLog: ActivityLog[];
  date: string;
  status: TReceiptCheckStatus;
}

const ReceiptCheckDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();

  const [presentToast] = useIonToast();

  const [receipt, setReceipt] = useState<ReceiptCheck | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [showReasonNote, setShowReasonNote] = useState(false);
  const [reasonNote, setReasonNote] = useState("");
  const [note, setNote] = useState("");

  const { isLoading, withLoading } = useLoading();
  const { user } = useAuth();
  const {
    getDetail,
    update: updateReceiptCheck,
    incrementActualInventory,
    updateBalanceInventory,
  } = useReceiptCheck();

  // Get available reason values
  const availableReasons = useMemo(() => {
    return RECEIPT_CHECK_REASONS.map((r) => r.value);
  }, [RECEIPT_CHECK_REASONS]);

  // Debounced update function for reason
  const debouncedUpdateReason = useCallback(
    createDebounce(async (reason: string) => {
      if (!receipt?.id) return;

      try {
        await updateReceiptCheck(receipt.id, { reason });
        console.log("Reason updated successfully");
      } catch (error) {
        await Toast.show({
          text: `Failed to update reason: ${(error as Error).message}`,
          duration: "short",
          position: "top",
        });
      }
    }, 500),
    [receipt?.id, updateReceiptCheck, availableReasons]
  );

  // Debounced update function for note
  const debouncedUpdateNote = useCallback(
    createDebounce(async (note: string) => {
      if (!receipt?.id) return;

      try {
        await updateReceiptCheck(receipt.id, { note });
        console.log("Note updated successfully");
      } catch (error) {
        await Toast.show({
          text: `Failed to update note: ${(error as Error).message}`,
          duration: "short",
          position: "top",
        });
      }
    }, 500),
    [receipt?.id, updateReceiptCheck]
  );

  const handleReasonChange = (value: string) => {
    setSelectedReason(value);
    setShowReasonNote(value === "other");

    if (value !== "other") {
      setReasonNote("");

      if (receipt?.id) {
        debouncedUpdateReason(value);
      }
    }
  };

  const handleReasonNoteChange = (value: string) => {
    setReasonNote(value);
  };

  const handleReasonNoteBlur = () => {
    if (reasonNote.trim() && receipt?.id) {
      debouncedUpdateReason(reasonNote.trim());
    }
  };

  const handleNoteChange = (value: string) => {
    setNote(value);
  };

  const fetchReceiptCheck = async () => {
    await withLoading(async () => {
      try {
        const result = await getDetail(id);

        if (!result) {
          return await Toast.show({
            text: "Không tìm thấy phiếu kiểm",
            duration: "short",
            position: "top",
          });
        }

        const { receipt, items } = result;

        setReceipt(receipt);
        setItems(items);

        // Set initial values from receipt data if available
        if (receipt.reason) {
          // Check if the reason exists in available reasons
          const reasonExists = availableReasons.includes(receipt.reason);
          if (reasonExists) {
            setSelectedReason(receipt.reason);
          } else {
            setSelectedReason("other");
            setShowReasonNote(true);
            setReasonNote(receipt.reason);
          }
        }
        if (receipt.reasonNote) {
          setReasonNote(receipt.reasonNote);
        }
        if (receipt.note) {
          setNote(receipt.note);
        }
      } catch (error) {
        await Toast.show({
          text: (error as Error).message,
          duration: "short",
          position: "top",
        });
      }
    });
  };

  useEffect(() => {
    id && fetchReceiptCheck();
  }, [id]);

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptCheck().then(() => {
      event.detail.complete();
    });
  };

  const handleBalance = async () => {
    const { value } = await Dialog.confirm({
      title: "Xác nhận cân đối",
      message: `Bạn có chắc chắn muốn cân đối phiếu kiểm ${receipt?.receiptNumber} không?`,
    });
    if (!value) return;

    try {
      if (!receipt?.id) {
        await Toast.show({
          text: "Không tìm thấy sản phẩm để cân đối",
          duration: "short",
          position: "top",
        });
        return;
      }

      // Update the selected item's system inventory to match actual inventory
      const updatedItems = items.map((item) => ({
        productId: item.productId,
        actualInventory: item.actualInventory,
      }));

      const { success } = await updateBalanceInventory(
        receipt.id,
        updatedItems
      );
      if (!success) {
        throw new Error("Cân đối thất bại");
      }

      await presentToast({
        message: "Đã cân đối thành công",
        duration: 1000,
        position: "top",
        color: "success",
      });

      // Refresh the receipt data
      fetchReceiptCheck();
    } catch (error) {
      await presentToast({
        message: (error as Error).message,
        duration: 1000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleBalanceRequest = async () => {
    const { value } = await Dialog.confirm({
      title: "Xác nhận yêu cầu cân đối",
      message: `Bạn có chắc chắn muốn gửi yêu cầu cân đối phiếu kiểm ${receipt?.receiptNumber} không?`,
    });
    if (!value) return;

    try {
      if (!receipt?.id) {
        await Toast.show({
          text: "Không tìm thấy phiếu",
          duration: "short",
          position: "top",
        });
        return;
      }

      const response = await updateReceiptCheck(receipt.id, {
        status: RECEIPT_CHECK_STATUS.BALANCING_REQUIRED,
      });
      if (!response.id) {
        throw new Error("Gửi yêu cầu cân đối thất bại");
      }

      await presentToast({
        message: "Gửi yêu cầu cân đối thành công",
        duration: 1000,
        position: "top",
        color: "success",
      });
    } catch (error) {
      await presentToast({
        message: (error as Error).message,
        duration: 1000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleBarcodeScanned = async (value: string) => {
    try {
      if (!receipt?.id) {
        throw new Error("Không tìm thấy phiếu kiểm");
      }

      await incrementActualInventory(receipt?.id, value);
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

  const { selectedItemValues, selectedItemDifference } = useMemo(() => {
    const selectedItem = items.find((item) => item.id === selectedItemId);

    if (!selectedItem) {
      return {
        selectedItemValues: {
          systemInventory: 0,
          actualInventory: 0,
        },
        selectedItemDifference: 0,
      };
    }

    const systemInventoryValue =
      selectedItem.systemInventory * selectedItem.costPrice;
    const actualInventoryValue =
      selectedItem.actualInventory * selectedItem.costPrice;
    const difference = actualInventoryValue - systemInventoryValue;

    return {
      selectedItemValues: {
        systemInventory: systemInventoryValue,
        actualInventory: actualInventoryValue,
      },
      selectedItemDifference: difference,
    };
  }, [selectedItemId, items]);

  const totalValueDifference = useMemo(() => {
    return items.reduce((total, item) => {
      const systemInventoryValue = item.systemInventory * item.costPrice;
      const actualInventoryValue = item.actualInventory * item.costPrice;
      return total + (actualInventoryValue - systemInventoryValue);
    }, 0);
  }, [items]);

  const receiptStatus = useMemo(() => {
    if (!receipt) {
      return "unknown";
    }

    return receipt?.status;
  }, [receipt?.status]);

  const { isShowBalanceButton, isShowBalanceRequireButton } = useMemo(() => {
    if (!user || !receipt)
      return {
        isShowBalanceButton: false,
        isShowBalanceRequireButton: false,
      };

    const roles = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.MANAGER];
    const isShowBalanceButton =
      receipt.status !== RECEIPT_CHECK_STATUS.BALANCED &&
      roles.includes(user.role);

    const isShowBalanceRequireButton =
      receipt.status === RECEIPT_CHECK_STATUS.PROCESSING &&
      [UserRole.EMPLOYEE].includes(user.role);

    return {
      isShowBalanceButton,
      isShowBalanceRequireButton,
    };
  }, [receipt, user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="py-3 flex items-center justify-between border-b">
          <IonButtons slot="start">
            <IonButton
              className="text-gray-600"
              onClick={() => {
                history.goBack();
              }}
            >
              <IonIcon slot="icon-only" icon={chevronBack} />
            </IonButton>
          </IonButtons>

          <div className="flex items-center space-x-1">
            <div>
              <h1 className="text-base font-semibold">
                {receipt?.receiptNumber}
              </h1>
              <p className="text-sm text-gray-500">
                {dayjsFormat(receipt?.date || "")}
              </p>
            </div>

            <IonChip color={getStatusColor(receiptStatus)}>
              <span className="text-sm">{getStatusLabel(receiptStatus)}</span>
            </IonChip>
          </div>

          <IonButtons slot="end">
            {isShowBalanceRequireButton && (
              <IonButton className="text-gray-600" onClick={() => startScan()}>
                <IonIcon slot="icon-only" icon={scanOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}

        <Refresher onRefresh={handleRefresh} />

        <div className="space-y-6">
          {/* Receipt Summary Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Danh sách sản phẩm</h2>
            {items.length > 0 && (
              <SlideableReceiptItem items={items} onSelect={handleItemSelect} />
            )}
          </div>

          {/* Values */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Giá trị Tồn</span>
              <span className="font-medium">
                {formatCurrency(selectedItemValues.systemInventory)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Giá trị Thực tế</span>
              <span className="font-medium">
                {formatCurrency(selectedItemValues.actualInventory)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Chênh lệch giá trị tăng / giảm</span>
              <span
                className={`px-3 py-1 bg-gray-600 text-white rounded-full text-sm ${
                  selectedItemDifference >= 0 ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {selectedItemDifference > 0 ? "+" : ""}
                {formatCurrency(selectedItemDifference)}
              </span>
            </div>
          </div>

          {isShowBalanceButton && (
            <IonButton
              className="w-full"
              color="dark"
              onClick={handleBalance}
              disabled={receiptStatus === RECEIPT_CHECK_STATUS.BALANCED}
            >
              Cân đối
            </IonButton>
          )}

          {isShowBalanceRequireButton && (
            <IonButton
              className="w-full"
              color="dark"
              onClick={handleBalanceRequest}
              disabled={receiptStatus === RECEIPT_CHECK_STATUS.BALANCED}
            >
              Yêu cầu kiểm tra cân đối
            </IonButton>
          )}

          {/* Total Difference */}
          <div className="bg-white rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Tổng chênh lệch phiếu</span>
              <span
                className={`px-3 py-1 bg-gray-600 text-white rounded-full text-sm ${
                  totalValueDifference >= 0 ? "bg-green-600" : "bg-red-600"
                }`}
              >
                {totalValueDifference > 0 ? "+" : ""}
                {formatCurrency(totalValueDifference)}
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="bg-white rounded-lg p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Lý do</label>
                <select
                  value={selectedReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="mt-1 w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn lý do</option>
                  {RECEIPT_CHECK_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {showReasonNote && (
                <div>
                  <textarea
                    value={reasonNote}
                    onChange={(e) => handleReasonNoteChange(e.target.value)}
                    onBlur={handleReasonNoteBlur}
                    placeholder="Nhập lý do cụ thể..."
                    className="w-full p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* User and Warehouse Selection */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">
                  Người kiểm
                </label>
                <button className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white">
                  <span className="text-gray-500">
                    {receipt?.supplier.name || "Chọn người kiểm"}
                  </span>
                </button>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600 mb-1 block">Kho</label>
                <button className="w-full flex items-center justify-between px-4 py-2 border rounded-lg bg-white">
                  <span className="text-gray-500">
                    {receipt?.warehouse || "Unknown"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <textarea
              value={note}
              onBlur={() => {
                if (note.trim() && receipt?.id) {
                  debouncedUpdateNote(note.trim());
                }
              }}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="Ghi chú"
              className="w-full p-3 border rounded-lg bg-white"
              rows={3}
            />
          </div>

          {/* History Section */}
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b">
              <span className="font-medium">Lịch sử</span>
            </div>

            <ActivityHistory activityLog={receipt?.activityLog || []} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptCheckDetail;
