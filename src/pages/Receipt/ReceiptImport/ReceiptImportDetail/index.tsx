import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router";

import { Dialog } from "@capacitor/dialog";
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonList,
  IonPage,
  IonTextarea,
  IonToolbar,
  RefresherEventDetail,
  useIonModal,
  useIonToast,
} from "@ionic/react";
import {
  add,
  checkmarkCircle,
  chevronBack,
  createOutline,
  scanOutline,
} from "ionicons/icons";
import { ChevronDown } from "lucide-react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";

import useReceiptImport from "@/hooks/apis/useReceiptImport";
import useSupplier from "@/hooks/apis/useSupplier";
import { useAuth, useBarcodeScanner, useLoading } from "@/hooks";
import { useCustomToast } from "@/hooks/useCustomToast";

import { UserRole } from "@/common/enums/user";
import { DiscountType } from "@/common/enums";
import { ReceiptImportStatus } from "@/common/enums/receipt";
import {
  getStatusColor,
  getStatusLabel,
  TReceiptImportStatus,
  RECEIPT_IMPORT_STATUS,
} from "@/common/constants/receipt-import.constant";

import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import { toISODateTime } from "@/helpers/date";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import DatePicker from "@/components/DatePicker";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ReceiptItem from "./components/ReceiptItem";
import CreateSupplierModal from "./components/CreateSupplierModal";

interface ReceiptItem {
  id: string;
  productId: string;
  productName: string;
  productCode: number;
  code: string;
  quantity: number;
  inventory: number;
  actualInventory: number;
  costPrice: number;
  discount: number;
  discountType?: DiscountType;
}

interface ReceiptImport {
  id: string;
  receiptNumber: string;
  importDate: string;
  paymentDate: string;
  quantity: number;
  status: string;
  warehouse: string;
  note: string;
  userCreated: string;
  supplier: {
    id: string;
    name: string;
  };
  totalAmount: number;
  items: ReceiptItem[];
}

type IFormData = Pick<ReceiptImport, "note" | "importDate" | "paymentDate"> & {
  supplier: string;
};

const initialFormData: IFormData = {
  note: "",
  importDate: "",
  paymentDate: "",
  supplier: "",
};

const ReceiptImportDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [receipt, setReceipt] = useState<ReceiptImport | null>(null);
  const [formData, setFormData] = useState<IFormData>(initialFormData);

  // New state for barcode scanning functionality
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedItems, setScannedItems] = useState<Map<string, number>>(new Map());
  const [pendingImports, setPendingImports] = useState<string[]>([]);

  const { isLoading, withLoading } = useLoading();
  const { user } = useAuth();
  const {
    getDetail,
    importQuick,
    update: updateReceiptImport,
  } = useReceiptImport();

  const { showError } = useCustomToast();
  const [presentToast] = useIonToast();
  const { create: createSupplier } = useSupplier();

  const [presentModalSupplier, dismissModalSupplier] = useIonModal(
    ModalSelectSupplier,
    {
      dismiss: (data: string, role: string) => dismissModalSupplier(data, role),
    }
  );

  const openModalSelectSupplier = () => {
    presentModalSupplier({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role !== "confirm") return;
        if (formData.supplier === data) return;

        setFormData((prev) => ({
          ...prev,
          supplier: data,
        }));
      },
    });
  };

  const [presentCreateSupplierModal, dismissCreateSupplierModal] = useIonModal(
    CreateSupplierModal,
    {
      onDismiss: (data?: { name: string; phone: string; note: string }, role?: string) =>
        dismissCreateSupplierModal(data, role),
    }
  );

  const openCreateSupplierModal = () => {
    presentCreateSupplierModal({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role !== "confirm" || !data) return;

        try {
          // Create the supplier
          const result = await createSupplier(data);

          if (!result || !result.id) {
            await presentToast({
              message: "Tạo nhà cung cấp thất bại",
              duration: 2000,
              position: "top",
              color: "danger",
            });
            return;
          }

          await presentToast({
            message: "Đã tạo nhà cung cấp mới",
            duration: 2000,
            position: "top",
            color: "success",
          });

          // Auto-select the newly created supplier
          setFormData((prev) => ({
            ...prev,
            supplier: `${result.id}__${result.name}`,
          }));
        } catch (error) {
          captureException(error as Error, createExceptionContext(
            'ReceiptImport',
            'ReceiptImportDetail',
            'openCreateSupplierModal'
          ));

          await presentToast({
            message: (error as Error).message || "Có lỗi xảy ra khi tạo nhà cung cấp",
            duration: 2000,
            position: "top",
            color: "danger",
          });
        }
      },
    });
  };

  const handleBarcodeScanned = (value: string) => {
    // if (!isScanning) return;

    // Add to scanned items map and increment quantity
    setScannedItems(prev => {
      const newMap = new Map(prev);
      const currentCount = newMap.get(value) || 0;
      newMap.set(value, currentCount + 1);
      return newMap;
    });

    // Add to pending imports if not already there
    setPendingImports(prev => {
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

  const stopScanningAndImport = async () => {
    setIsScanning(false);

    if (pendingImports.length === 0) {
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
        const products = [];

        for (const productCode of pendingImports) {
          const quantity = scannedItems.get(productCode) || 1;

          products.push({
            code: productCode,
            quantity,
          });
        }

        await handleImport(products);

        presentToast({
          message: `Đã nhập ${pendingImports.length} sản phẩm thành công`,
          duration: 2000,
          position: "top",
          color: "success",
        });

        // Clear scanning state
        setScannedItems(new Map());
        setPendingImports([]);

        // Refresh the receipt data
        await fetchReceiptImport();
      } catch (error) {
        captureException(error as Error, createExceptionContext(
          'ReceiptImport',
          'ReceiptImportDetail',
          'stopScanningAndImport'
        ));

        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra khi nhập sản phẩm",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  const { startScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      captureException(error, createExceptionContext(
        'ReceiptImport',
        'ReceiptImportDetail',
        'useBarcodeScanner.onError'
      ));
      showError(error.message);
    },
    toastTimeout: 1000,
    delay: 2000, // Reduced delay for faster scanning
  });

  const startScanning = () => {
    setIsScanning(true);
    setScannedItems(new Map());
    setPendingImports([]);
    startScan();
  };

  const { showScanProduct, showRequestApproval, showComplete, showUpdate } =
    useMemo(() => {
      if (!user || !receipt)
        return {
          showRequestApproval: false,
          showComplete: false,
        };

      const userRole = user.role;
      const receiptStatus = receipt.status;

      const isUserCreated = user.id === receipt.userCreated;
      const isEmployee = userRole === UserRole.EMPLOYEE;
      const isAdmin = (
        [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER] as string[]
      ).includes(userRole);

      const showScanProduct =
        receiptStatus === ReceiptImportStatus.PROCESSING &&
        (isAdmin || (isEmployee && isUserCreated));

      const showRequestApproval =
        receiptStatus === ReceiptImportStatus.PROCESSING &&
        isEmployee &&
        isUserCreated;

      const showComplete =
        isAdmin &&
        [ReceiptImportStatus.PROCESSING, ReceiptImportStatus.WAITING].includes(
          receiptStatus as ReceiptImportStatus
        );

      const showUpdate =
        isAdmin &&
        receiptStatus !== ReceiptImportStatus.COMPLETED &&
        receiptStatus !== ReceiptImportStatus.CANCELLED;

      return {
        showScanProduct,
        showRequestApproval,
        showComplete,
        showUpdate,
      };
    }, [user, receipt?.userCreated, receipt?.status]);

  const fetchReceiptImport = async () => {
    await withLoading(async () => {
      try {
        const result = await getDetail(id);

        if (!result || !result.receipt) {
          await presentToast({
            message: "Không tìm thấy phiếu nhập",
            duration: 3000,
            position: "top",
            color: "danger",
          });
          return;
        }

        const receipt = {
          ...result.receipt,
          items: result.items,
        };

        setReceipt(receipt);
        setFormData({
          note: receipt.note,
          paymentDate: receipt.paymentDate,
          importDate: receipt.importDate,
          supplier: receipt.supplier?.id,
        });
      } catch (error) {
        captureException(error as Error, createExceptionContext(
          'ReceiptImport',
          'ReceiptImportDetail',
          'fetchReceiptImport'
        ));

        presentToast({
          message: (error as Error).message,
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  useEffect(() => {
    id && fetchReceiptImport();
  }, [id]);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptImport().finally(() => {
      event.detail.complete();
    });
  };

  const handleUpdate = async () => {
    try {
      if (!receipt?.id) return;

      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận cập nhật",
        message: "Bạn có chắc chắn muốn cập nhật phiếu nhập này không?",
      });

      if (!value) return;

      if (formData.supplier) {
        formData.supplier = formData.supplier.split("__")[0];
      }

      const result = await updateReceiptImport(receipt.id, {
        ...formData,
        items: receipt?.items,
      });

      if (!result || !result.id) {
        await presentToast({
          message: "Cập nhật phiếu nhập thất bại",
          duration: 3000,
          position: "top",
          color: "warning",
        });
        return;
      }

      presentToast({
        message: "Đã cập nhật phiếu nhập",
        duration: 3000,
        position: "top",
        color: "success",
      });

      // setFormData(initialFormData);
      fetchReceiptImport();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ReceiptImport',
        'ReceiptImportDetail',
        'handleUpdate'
      ));

      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleRequestApproval = async () => {
    try {
      if (!receipt?.id) return;

      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận yêu cầu duyệt",
        message:
          "Bạn có chắc chắn muốn gửi yêu cầu duyệt phiếu nhập này không?",
      });

      if (!value) return;

      await updateReceiptImport(receipt.id, {
        status: ReceiptImportStatus.WAITING,
      });

      await presentToast({
        message: "Đã gửi yêu cầu duyệt",
        duration: 3000,
        position: "top",
        color: "success",
      });
      fetchReceiptImport();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ReceiptImport',
        'ReceiptImportDetail',
        'handleRequestApproval'
      ));

      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleComplete = async () => {
    try {
      if (!receipt?.id) return;

      // Show confirmation dialog
      const { value } = await Dialog.confirm({
        title: "Xác nhận hoàn thành",
        message: "Bạn có chắc chắn muốn hoàn thành phiếu nhập này không?",
      });

      if (!value) return;

      if (formData.supplier) {
        formData.supplier = formData.supplier.split("__")[0];
      }

      const result = await updateReceiptImport(receipt.id, {
        ...formData,
        items: receipt?.items,
        status: ReceiptImportStatus.COMPLETED,
      });

      if (!result || !result.id) {
        await presentToast({
          message: "Cập nhật phiếu nhập thất bại",
          duration: 3000,
          position: "top",
          color: "warning",
        });
        return;
      }

      await presentToast({
        message: "Đã hoàn thành phiếu nhập",
        duration: 2000,
        position: "top",
        color: "success",
      });

      fetchReceiptImport();
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ReceiptImport',
        'ReceiptImportDetail',
        'handleComplete'
      ));

      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleImport = async (products: { code: string; quantity: number }[]) => {
    try {
      if (!products.length) {
        await presentToast({
          message: "Không tìm thấy phiếu",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return;
      }

      const response = await importQuick({ receiptId: id, products });
      const receiptId = response?.id;

      if (!receiptId) {
        throw new Error("Cập nhật thất bại");
      }
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ReceiptImport',
        'ReceiptImportDetail',
        'handleImport'
      ));

      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const supplierName = useMemo(() => {
    let supplierName = "";

    if (receipt && receipt.supplier) {
      supplierName = receipt.supplier.name;
    }

    if (formData.supplier) {
      const supplierSplited = formData.supplier.split("__");

      if (supplierSplited.length === 2) {
        supplierName = supplierSplited[1];
      }
    }

    return supplierName;
  }, [receipt?.supplier, formData.supplier]);

  const renderReceiptSummary = useMemo(() => {
    if (!receipt || !user) return null;

    const userRole = user.role;
    const isEmployee = userRole === UserRole.EMPLOYEE;

    if (receipt.status === RECEIPT_IMPORT_STATUS.COMPLETED || isEmployee) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày nhập:</span>
            <span>
              {receipt?.importDate ? dayjsFormat(receipt?.importDate) : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày thanh toán:</span>
            <span>
              {receipt?.paymentDate ? dayjsFormat(receipt?.paymentDate) : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nhà cung cấp:</span>
            <span>{receipt?.supplier ? receipt?.supplier?.name : "--"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Kho:</span>
            <span>{receipt?.warehouse || "--"}</span>
          </div>
          {receipt?.note && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ghi chú:</span>
              <span>{receipt?.note || "--"}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        {/* Expect import date selection */}
        <div className="flex flex-col mt-3">
          <IonLabel position="stacked">Ngày nhập dự kiến</IonLabel>
          <DatePicker
            extraClassName="w-full justify-start"
            attrs={{ id: "importDate" }}
            value={toISODateTime(formData.importDate || receipt?.importDate)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                importDate: e.detail.value! as string,
              }))
            }
          />
        </div>

        {/* Payment date selection */}
        <div className="flex flex-col mt-3">
          <IonLabel position="stacked">Ngày thanh toán</IonLabel>
          <DatePicker
            extraClassName="w-full justify-start"
            attrs={{ id: "paymentDate" }}
            value={toISODateTime(formData.paymentDate || receipt?.paymentDate)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                paymentDate: e.detail.value! as string,
              }))
            }
          />
        </div>

        {/* Supplier selection */}
        <div className="flex flex-col mt-4">
          <IonLabel position="stacked">Nhà cung cấp</IonLabel>
          <div className="flex items-center gap-2">
            <button
              className="flex-1 py-1 px-1.5 rounded-lg border border-solid border-gray-300 text-left flex items-center justify-between"
              onClick={openModalSelectSupplier}
            >
              <span className="text-gray-500">
                {supplierName || <i className="text-sm">Chọn nhà cung cấp</i>}
              </span>
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </button>
            <IonButton
              fill="outline"
              size="default"
              onClick={openCreateSupplierModal}
              className="m-0"
            >
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </div>
        </div>

        <div className="flex flex-col mt-3">
          <IonLabel position="stacked">Ghi chú</IonLabel>
          <IonTextarea
            placeholder="Nhập ghi chú..."
            rows={3}
            className="border rounded-lg px-2"
            value={formData.note || receipt?.note}
            onBlur={(e) => {
              setFormData((prev) => ({
                ...prev,
                note: e.target.value! as string,
              }));
            }}
          />
        </div>
      </>
    );
  }, [user?.role, supplierName, receipt, formData]);

  // Calculate total amount from items
  const calculatedTotalAmount = useMemo(() => {
    if (!receipt?.items || receipt.items.length === 0) return 0;

    return receipt.items.reduce((total, item) => {
      const subTotal = item.quantity * item.costPrice;
      let itemTotal = 0;

      if (item.discountType === DiscountType.PERCENTAGE) {
        itemTotal = subTotal * (1 - (item.discount || 0) / 100);
      } else {
        itemTotal = subTotal - (item.discount || 0);
      }

      return total + itemTotal;
    }, 0);
  }, [receipt?.items]);

  // Calculate total quantity from items
  const calculatedTotalQuantity = useMemo(() => {
    if (!receipt?.items || receipt.items.length === 0) return 0;

    return receipt.items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }, [receipt?.items]);

  const renderReceiptItems = useMemo(() => {
    if (!receipt || !user) return null;

    const userRole = user?.role;
    const isEmployee = userRole === UserRole.EMPLOYEE;
    const isReceiptCancelled = receipt.status === RECEIPT_IMPORT_STATUS.CANCELLED;

    return receipt?.items?.map((item, index) => {
      return (
        <ReceiptItem
          key={item.id}
          isEmployee={isEmployee}
          disabled={isReceiptCancelled}
          {...item}
          onRowChange={(data) => {
            setReceipt((prev): ReceiptImport | null => {
              const newReceipt = { ...prev };

              if (!newReceipt.items) {
                newReceipt.items = [];
              }

              newReceipt.items[index] = data;
              return newReceipt as ReceiptImport;
            });
          }}
        />
      );
    });
  }, [user?.role, receipt]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="px-4 py-3 flex items-center justify-between border-b">
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

          <div className="flex items-center justify-between space-x-2">
            <div className="mr-2">
              <h1 className="font-semibold">{receipt?.receiptNumber}</h1>
              <p className="text-sm text-gray-500">
                {receipt?.importDate && dayjsFormat(receipt.importDate)}
              </p>
            </div>

            {receipt?.status && (
              <IonChip
                color={getStatusColor(receipt.status as TReceiptImportStatus)}
              >
                <span className="text-sm">
                  {getStatusLabel(receipt.status as TReceiptImportStatus)}
                </span>
              </IonChip>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}

        <Refresher onRefresh={handleRefresh} />

        <div className="space-y-6">
          {/* Receipt Summary Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Thông tin phiếu nhập</h2>
              {showScanProduct && (
                <div className="flex items-center space-x-2">
                  {!isScanning ? (
                    // <IonButton 
                    //   color="primary" 
                    //   onClick={startScanning}
                    //   size="small"
                    // >
                    //   <IonIcon icon={scanOutline} slot="start" />
                    //   Quét mã
                    // </IonButton>
                    <IonButtons slot="end">
                      <IonButton color="primary" onClick={startScanning}>
                        <IonIcon icon={scanOutline} slot="icon-only" />
                      </IonButton>
                    </IonButtons>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <IonButton
                        color="success"
                        onClick={stopScanningAndImport}
                        size="small"
                      >
                        Hoàn thành ({pendingImports.length})
                      </IonButton>
                      <IonButton
                        color="medium"
                        fill="outline"
                        onClick={() => setIsScanning(false)}
                        size="small"
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
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium">Đang quét mã vạch...</span>
                  </div>
                  <span className="text-blue-600 text-sm">
                    {pendingImports.length} sản phẩm
                  </span>
                </div>

                {/* Show scanned items */}
                {pendingImports.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-blue-600 font-medium">Đã quét:</p>
                    {Array.from(scannedItems.entries()).map(([code, quantity]) => (
                      <div key={code} className="flex justify-between text-sm text-blue-700">
                        <span>{code}</span>
                        <span>x{quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {renderReceiptSummary}
          </div>

          {/* Items Section */}
          <div className="bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="p-4 border-b">
              <span className="font-medium">Danh sách sản phẩm</span>
            </div>

            <IonList lines="full">{renderReceiptItems}</IonList>
          </div>

          {/* Summary Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">Tổng số lượng:</span>
              <span className="font-semibold">{calculatedTotalQuantity}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">Tổng tiền:</span>
              <span className="font-bold text-lg text-blue-600">
                {formatCurrency(calculatedTotalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {showRequestApproval && (
            <IonButton
              expand="block"
              color="tertiary"
              onClick={handleRequestApproval}
            >
              Yêu cầu duyệt
            </IonButton>
          )}

          <div className="flex justify-between space-x-2">
            {showComplete && (
              <IonButton
                expand="block"
                color="success"
                className="w-full"
                onClick={handleComplete}
              >
                <IonIcon icon={checkmarkCircle} className="text-white mr-1" />
                <span className="text-white"> Hoàn thành </span>
              </IonButton>
            )}

            {showUpdate && (
              <IonButton
                expand="block"
                color="primary"
                className="w-full"
                onClick={handleUpdate}
              >
                <IonIcon icon={createOutline} className="text-white mr-1" />
                Cập nhật
              </IonButton>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptImportDetail;
