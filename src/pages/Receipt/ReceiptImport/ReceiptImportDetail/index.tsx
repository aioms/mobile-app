import React, { useEffect, useMemo, useState } from "react";
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
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTextarea,
  IonToolbar,
  RefresherEventDetail,
  useIonModal,
} from "@ionic/react";
import {
  checkmarkCircle,
  chevronBack,
  createOutline,
  scanOutline,
} from "ionicons/icons";
import { ChevronDown } from "lucide-react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import useReceiptImport from "@/hooks/apis/useReceiptImport";
import { useAuth, useBarcodeScanner, useLoading } from "@/hooks";

import { UserRole } from "@/common/enums/user";
import { ReceiptImportStatus } from "@/common/enums/receipt";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_IMPORT_STATUS,
  TReceiptImportStatus,
} from "@/common/constants/receipt";

import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import { toISODateTime } from "@/helpers/date";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import DatePicker from "@/components/DatePicker";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ReceiptItem from "./components/ReceiptItem";

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

type IFormData = Pick<
  ReceiptImport,
  "note" | "importDate" | "paymentDate"
> & {
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

  const { isLoading, withLoading } = useLoading();
  const { user } = useAuth();
  const {
    getDetail,
    importQuick,
    update: updateReceiptImport,
  } = useReceiptImport();

  // OPEN MODAL SELECT SUPPLIERS
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

  const handleBarcodeScanned = (value: string) => {
    stopScan();
    handleUpdateInventory(value);
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      Toast.show({
        text: error.message,
        duration: "long",
        position: "center",
      });
    },
  });

  const { showRequestApproval, showComplete, showUpdate } = useMemo(() => {
    if (!user || !receipt)
      return {
        showRequestApproval: false,
        showComplete: false,
      };

    const userRole = user.role;
    const receiptStatus = receipt.status;

    const isUserCreated = user.id === receipt.userCreated;
    const isEmployee = userRole === UserRole.EMPLOYEE;
    const canApprove = (
      [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER] as string[]
    ).includes(userRole);

    const showRequestApproval =
      receiptStatus === ReceiptImportStatus.PROCESSING &&
      isEmployee &&
      isUserCreated;

    const showComplete =
      receiptStatus === ReceiptImportStatus.WAITING && canApprove;

    const showUpdate =
      (
        [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER] as string[]
      ).includes(userRole) && receiptStatus !== ReceiptImportStatus.COMPLETED;

    return {
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
          await Toast.show({
            text: "Không tìm thấy phiếu nhập",
            duration: "short",
            position: "top",
          });
          return;
        }

        const receipt = {
          ...result.receipt,
          items: result.items,
        };

        setReceipt(receipt);
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

      console.log({ formData });
      const result = await updateReceiptImport(receipt.id, {
        ...formData,
        items: receipt?.items,
      });

      if (!result || !result.id) {
        await Toast.show({
          text: "Cập nhật phiếu nhập thất bại",
          duration: "short",
          position: "top",
        });
        return;
      }

      setFormData(initialFormData);
      fetchReceiptImport();

      await Toast.show({
        text: "Đã cập nhật phiếu nhập",
        duration: "short",
        position: "top",
      });
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
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
      await Toast.show({
        text: "Đã gửi yêu cầu duyệt",
        duration: "short",
        position: "top",
      });
      fetchReceiptImport();
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
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

      await updateReceiptImport(receipt.id, {
        status: ReceiptImportStatus.COMPLETED,
      });
      await Toast.show({
        text: "Đã hoàn thành phiếu nhập",
        duration: "short",
        position: "top",
      });
      fetchReceiptImport();
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  const handleUpdateInventory = async (receiptNumber: string) => {
    try {
      if (!receiptNumber) {
        return await Toast.show({
          text: "Không tìm thấy phiếu",
          duration: "short",
          position: "top",
        });
      }

      const response = await importQuick({ code: receiptNumber });
      const receiptId = response?.id;

      if (!receiptId) {
        throw new Error("Cập nhật thất bại");
      }

      await Toast.show({
        text: "Cập nhật thành công",
        duration: "short",
        position: "top",
      });

      fetchReceiptImport();
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "long",
        position: "center",
      });
    }
  };

  const supplierName = useMemo(() => {
    let supplierName = "";

    if (receipt && receipt.supplier) {
      supplierName = receipt.supplier.name;
    }

    if (formData.supplier) {
      supplierName = formData.supplier.split("__")[1];
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
          <button
            className="w-full py-1 px-1.5 rounded-lg border border-solid border-gray-300 text-left flex items-center justify-between"
            onClick={openModalSelectSupplier}
          >
            <span className="text-gray-500">
              {supplierName || <i className="text-sm">Chọn nhà cung cấp</i>}
            </span>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </button>
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

  const renderReceiptItems = useMemo(() => {
    if (!receipt || !user) return null;

    const userRole = user?.role;
    const isEmployee = userRole === UserRole.EMPLOYEE;

    if (receipt.status === RECEIPT_IMPORT_STATUS.COMPLETED || isEmployee) {
      return receipt?.items?.map((item) => (
        <IonItem key={item.id} className="py-2">
          <IonLabel>
            <h2 className="font-medium">{item.productName}</h2>
            <p className="text-gray-500 text-sm">Mã: {item.code}</p>
            <div className="flex justify-between mt-2">
              <span className="text-sm">SL: {item.quantity}</span>
              <span className="text-sm">
                Đơn giá: {formatCurrency(item.costPrice)}
              </span>
            </div>
          </IonLabel>
        </IonItem>
      ));
    }

    return receipt?.items?.map((item, index) => {
      return (
        <ReceiptItem
          key={index}
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
  }, [user?.role, receipt?.status, receipt?.items]);

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

          <div className="flex items-center space-x-2">
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
              {showRequestApproval && (
                <IonButtons slot="end">
                  <IonButton color="primary" onClick={startScan}>
                    <IonIcon icon={scanOutline} slot="icon-only" />
                  </IonButton>
                </IonButtons>
              )}
            </div>
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
              <span>{receipt?.quantity}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-medium">Tổng tiền:</span>
              <span className="font-bold text-lg">
                {formatCurrency(receipt?.totalAmount || 0)}
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
                <span className="text-white">Hoàn thành </span>
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
