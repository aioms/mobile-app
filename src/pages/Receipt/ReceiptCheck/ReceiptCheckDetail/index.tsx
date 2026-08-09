import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useHistory, useParams } from "react-router";

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
import { chevronBack, scanOutline, chevronDownOutline } from "ionicons/icons";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { useAuth, useBarcodeScanner, useLoading } from "@/hooks";
import { createDebounce } from "@/helpers/common";

import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_CHECK_REASONS,
  RECEIPT_CHECK_STATUS,
  TReceiptCheckStatus,
} from "@/common/constants/receipt-check.constant";
import { dayjsFormat, formatCurrency } from "@/helpers/formatters";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import SlideableReceiptItem from "./components/SlideableReceiptItemV2";
import ActivityHistory, { ActivityLog } from "./components/ActivityHistory";
import { UserRole } from "@/common/enums/user";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import { CHANGE_QUANTITY_TYPE } from "@/common/constants/product";

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
  checker: {
    id: string;
    fullname: string
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

  // Barcode scanning state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedItems, setScannedItems] = useState<Map<string, number>>(new Map());
  const [pendingScans, setPendingScans] = useState<string[]>([]);

  const { isLoading, withLoading } = useLoading();
  const { user } = useAuth();
  const {
    getDetail,
    update: updateReceiptCheck,
    incrementActualInventory,
    updateBalanceInventory,
  } = useReceiptCheck();

  const isUserSpecial = useMemo(() => user?.code == '497', [user?.code]);

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
        presentToast({
          message: `Failed to update reason: ${(error as Error).message}`,
          duration: 1000,
          position: "top",
          color: "danger",
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
        presentToast({
          message: `Failed to update note: ${(error as Error).message}`,
          duration: 1000,
          position: "top",
          color: "danger",
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

  const handleInventoryChange = async (itemId: string, newInventory: number) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, actualInventory: newInventory }
          : item
      )
    );

    try {
      if (!receipt?.id) {
        throw new Error("Không tìm thấy phiếu kiểm");
      }

      const productCode = items.find(item => item.id === itemId)?.code;

      if (!productCode) {
        throw new Error("Không tìm thấy sản phẩm");
      }

      await incrementActualInventory(
        receipt?.id,
        productCode,
        newInventory,
        CHANGE_QUANTITY_TYPE.SET
      );
    } catch (error) {
      presentToast({
        message: (error as Error).message,
        duration: 1000,
        position: "top",
        color: "danger",
      });
    }
  };

  const fetchReceiptCheck = async () => {
    await withLoading(async () => {
      try {
        const result = await getDetail(id);

        if (!result) {
          presentToast({
            message: "Không tìm thấy phiếu kiểm",
            duration: 1000,
            position: "top",
          });
          return;
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
        captureException(error as Error, createExceptionContext(
          'ReceiptCheckDetail',
          'ReceiptCheckDetail',
          'fetchReceiptCheck'
        ));
        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra",
          duration: 2000,
          position: "top",
          color: "danger",
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
        presentToast({
          message: "Không tìm thấy phiếu kiểm",
          duration: 1000,
          position: "top",
        });
        return;
      }

      // Update the selected item's system inventory to match actual inventory
      const updatedItems = items.map((item) => ({
        productId: item.productId,
        actualInventory: item.actualInventory,
      }));

      await updateBalanceInventory(
        receipt.id,
        updatedItems
      );

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
        presentToast({
          message: "Không tìm thấy phiếu kiểm",
          duration: 1000,
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
    // if (!isScanning) return;

    // Add to scanned items map and increment quantity
    setScannedItems(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(value) || 0;
      console.log({ prev, currentCount });
      newMap.set(value, currentCount + 1);
      return newMap;
    });

    // Add to pending scans if not already there
    setPendingScans(prev => {
      if (!prev.includes(value)) {
        return [...prev, value];
      }
      return prev;
    });

    // Show toast for successful scan
    presentToast({
      message: `Đã quét: ${value} (Số lượng: ${(scannedItems.get(value) || 0) + 1})`,
      duration: 1500,
      position: "top",
      color: "success",
    });
  };

  const handleError = async (error: Error) => {
    captureException(error, createExceptionContext(
      'ReceiptCheckDetail',
      'BarcodeScanner',
      'handleError'
    ));
    await presentToast({
      message: error.message,
      duration: 2000,
      position: "top",
      color: "danger",
    });
  };

  const { startScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: handleError,
  });

  const startScanning = () => {
    setIsScanning(true);
    setScannedItems(new Map());
    setPendingScans([]);
    startScan();
  };

  const stopScanningAndConfirm = async () => {
    setIsScanning(false);

    if (pendingScans.length === 0) {
      await presentToast({
        message: "Không có sản phẩm nào được quét",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    // Process all scanned items
    await withLoading(async () => {
      try {
        if (!receipt?.id) {
          throw new Error("Không tìm thấy phiếu kiểm");
        }

        // Update inventory for each scanned product
        for (const productCode of pendingScans) {
          const quantity = scannedItems.get(productCode) || 1;

          await incrementActualInventory(
            receipt.id,
            productCode,
            quantity,
            CHANGE_QUANTITY_TYPE.INCREASE
          );
        }

        presentToast({
          message: `Đã cập nhật ${pendingScans.length} sản phẩm thành công`,
          duration: 2000,
          position: "top",
          color: "success",
        });

        // Clear scanning state
        setScannedItems(new Map());
        setPendingScans([]);

        // Refresh the receipt data
        await fetchReceiptCheck();
      } catch (error) {
        captureException(error as Error, createExceptionContext(
          'ReceiptCheckDetail',
          'ReceiptCheckDetail',
          'stopScanningAndConfirm'
        ));

        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra khi cập nhật sản phẩm",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

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

  const { isShowBalanceButton, isShowBalanceRequireButton, isAdmin, isEditable } = useMemo(() => {
    if (!user || !receipt)
      return {
        isShowBalanceButton: false,
        isShowBalanceRequireButton: false,
        isAdmin: false,
        isEditable: false,
      };

    const roles = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.MANAGER];
    const isAdminUser = roles.includes(user.role);

    const isShowBalanceButton =
      receipt.status !== RECEIPT_CHECK_STATUS.BALANCED &&
      isAdminUser;

    const statusAllowed = [RECEIPT_CHECK_STATUS.PROCESSING, RECEIPT_CHECK_STATUS.PENDING] as string[];
    const isShowBalanceRequireButton = statusAllowed.includes(receipt.status);

    // Only allow editing if user is admin AND receipt is not balanced
    const isEditable = isAdminUser && receipt.status !== RECEIPT_CHECK_STATUS.BALANCED || isUserSpecial

    return {
      isShowBalanceButton,
      isShowBalanceRequireButton,
      isAdmin: isAdminUser,
      isEditable,
    };
  }, [receipt, user]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar className="py-2 bg-white">
          <IonButtons slot="start">
            <IonButton
              className="text-gray-900"
              onClick={() => {
                history.goBack();
              }}
            >
              <IonIcon slot="icon-only" icon={chevronBack} />
            </IonButton>
          </IonButtons>

          <div className="flex items-center space-x-2">
            <div>
              <h1 className="text-[16px] font-semibold text-gray-900 leading-tight">
                {receipt?.receiptNumber}
              </h1>
              <p className="text-[13px] text-gray-500">
                {dayjsFormat(receipt?.date || "")}
              </p>
            </div>

            <IonChip 
              color={receiptStatus !== "unknown" ? getStatusColor(receiptStatus) : "medium"}
              className="h-7 text-xs font-medium m-0"
            >
              {receiptStatus !== "unknown" ? getStatusLabel(receiptStatus) : "Unknown"}
            </IonChip>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}

        <Refresher onRefresh={handleRefresh} />

        <div className="px-4 py-4 space-y-4 pb-20">
          {/* Receipt Summary Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[17px] font-semibold text-gray-900">Danh sách sản phẩm</h2>
              {isShowBalanceRequireButton && (
                <div className="flex items-center space-x-2">
                  {!isScanning ? (
                    <IonButtons slot="end">
                      <IonButton color="primary" onClick={startScanning} className="m-0 h-8">
                        <IonIcon icon={scanOutline} slot="icon-only" className="text-2xl text-blue-600" />
                      </IonButton>
                    </IonButtons>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <IonButton
                        color="success"
                        onClick={stopScanningAndConfirm}
                        size="small"
                        className="m-0"
                      >
                        Xác nhận ({pendingScans.length})
                      </IonButton>
                      <IonButton
                        color="medium"
                        fill="outline"
                        onClick={() => setIsScanning(false)}
                        size="small"
                        className="m-0"
                      >
                        Hủy
                      </IonButton>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Scanning Status */}
            {isScanning && (
              <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium text-sm">Đang quét mã vạch...</span>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">
                    {pendingScans.length} sản phẩm
                  </span>
                </div>

                {/* Show scanned items */}
                {pendingScans.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-2">Đã quét:</p>
                    {Array.from(scannedItems.entries()).map(([code, quantity]) => (
                      <div key={code} className="flex justify-between text-sm text-blue-700 bg-white/60 px-3 py-1.5 rounded-lg">
                        <span className="font-medium">{code}</span>
                        <span className="font-semibold">x{quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {items.length > 0 && (
              <SlideableReceiptItem
                items={items}
                onSelect={handleItemSelect}
                isEditable={isEditable}
                onItemUpdate={handleInventoryChange}
              />
            )}
          </div>

          {/* Values */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-medium text-gray-600">Giá trị Tồn</span>
              <span className="font-semibold text-gray-900 text-[15px]">
                {formatCurrency(selectedItemValues.systemInventory)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-medium text-gray-600">Giá trị Thực tế</span>
              <span className="font-semibold text-gray-900 text-[15px]">
                {formatCurrency(selectedItemValues.actualInventory)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[15px] font-medium text-gray-600">Chênh lệch giá trị tăng / giảm</span>
              <span
                className={`px-3 py-1.5 text-white rounded-lg text-sm font-semibold tracking-wide ${selectedItemDifference >= 0 ? "bg-[#22C55E]" : "bg-[#DC2626]"
                  }`}
              >
                {selectedItemDifference > 0 ? "+" : ""}
                {formatCurrency(selectedItemDifference)}
              </span>
            </div>
          </div>

          {isShowBalanceButton && (
            <IonButton
              className="w-full mt-2"
              color="dark"
              onClick={handleBalance}
              disabled={receiptStatus === RECEIPT_CHECK_STATUS.BALANCED}
              style={{ '--border-radius': '12px' }}
            >
              Cân đối
            </IonButton>
          )}

          {isShowBalanceRequireButton && !isAdmin && (
            <IonButton
              className="w-full mt-2"
              color="dark"
              onClick={handleBalanceRequest}
              disabled={receiptStatus === RECEIPT_CHECK_STATUS.BALANCED}
              style={{ '--border-radius': '12px' }}
            >
              Yêu cầu kiểm tra cân đối
            </IonButton>
          )}

          {/* Total Difference */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-[15px] font-medium text-gray-900">Tổng chênh lệch phiếu</span>
              <span
                className={`px-3 py-1.5 text-white rounded-lg text-sm font-semibold tracking-wide ${totalValueDifference >= 0 ? "bg-[#22C55E]" : "bg-[#DC2626]"
                  }`}
              >
                {totalValueDifference > 0 ? "+" : ""}
                {formatCurrency(totalValueDifference)}
              </span>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-600 block">Lý do</label>
              <div className="relative border border-gray-200 rounded-xl bg-white overflow-hidden">
                <select
                  value={selectedReason}
                  onChange={(e) => handleReasonChange(e.target.value)}
                  className="w-full px-4 py-3 bg-transparent appearance-none focus:outline-none text-gray-900"
                >
                  <option value="">Chọn lý do</option>
                  {RECEIPT_CHECK_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <IonIcon icon={chevronDownOutline} />
                </div>
              </div>

              {showReasonNote && (
                <div className="pt-2">
                  <textarea
                    value={reasonNote}
                    onChange={(e) => handleReasonNoteChange(e.target.value)}
                    onBlur={handleReasonNoteBlur}
                    placeholder="Nhập lý do cụ thể..."
                    className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>

          {/* User and Warehouse Selection */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                  Người kiểm
                </label>
                <div className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                  <span className="text-gray-900 font-medium text-sm">
                    {receipt?.checker?.fullname || "Chọn người kiểm"}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-600 mb-2 block">Kho</label>
                <div className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                  <span className="text-gray-900 font-medium text-sm">
                    {receipt?.warehouse || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="text-sm font-medium text-gray-600 mb-2 block">Ghi chú</label>
              <textarea
                value={note}
                onBlur={() => {
                  if (note.trim() && receipt?.id) {
                    debouncedUpdateNote(note.trim());
                  }
                }}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Nhập ghi chú..."
                className="w-full p-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <span className="font-semibold text-gray-900">Lịch sử</span>
            </div>

            <ActivityHistory activityLog={receipt?.activityLog || []} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptCheckDetail;
