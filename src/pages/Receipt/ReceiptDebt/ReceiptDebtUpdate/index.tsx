import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonFooter,
  IonPage,
  IonIcon,
  IonTextarea,
  useIonToast,
  IonChip,
  IonLabel,
} from "@ionic/react";
import { RefresherEventDetail } from "@ionic/core";
import {
  checkmarkCircleOutline,
  chevronBack,
  printOutline,
} from "ionicons/icons";
import { useHistory, useParams } from "react-router-dom";

import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";
import { getStatusLabel, getStatusColor, TReceiptDebtStatus, RECEIPT_DEBT_STATUS } from "@/common/constants/receipt-debt.constant";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";

import DatePicker from "@/components/DatePicker";
import ContentSkeleton from "@/components/Loading/ContentSkeleton";
import EnhancedPurchasePeriodList from "./components/EnhancedPurchasePeriodList";
import { useAuth, useLoading } from "@/hooks";
import { Dialog } from "@capacitor/dialog";
import ExportReceiptBillModal from "../components/ExportReceiptBill/ExportReceiptBillModal";
import { IProductItem } from "@/types/product.type";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import { 
  IReceiptDebtDetail, 
  ReceiptDebtDetailResponse, 
  IEditableProductItem,
  IReceiptDebtUpdateForm,
  IReceiptDebtUpdateErrors,
  ReceiptPeriodSummary,
} from "./receiptDebtUpdate.d";
import useReceiptCalculations from "./hooks/useReceiptCalculations";
import { Refresher } from "@/components/Refresher/Refresher";

const initialFormData: IReceiptDebtUpdateForm = {
  customer: "",
  dueDate: "",
  note: "",
};

const ReceiptDebtUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<IReceiptDebtUpdateErrors>({});
  const [receiptDebt, setReceiptDebt] = useState<IReceiptDebtDetail | null>(
    null
  );
  const [productItems, setProductItems] = useState<
    Record<string, IEditableProductItem[]>
  >({});
  const [periods, setPeriods] = useState<Record<string, ReceiptPeriodSummary>>(
    {}
  );

  const { withLoading, isLoading } = useLoading();
  const { user } = useAuth();

  // Export modal state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportItems, setExportItems] = useState<Record<string, IProductItem[]>>({});
  const [exportPeriods, setExportPeriods] = useState<Record<string, { id: string; vatAmount: number }>>({});

  const { getDetail, update } = useReceiptDebt();

  // Calculate totals using the custom hook (includes VAT)
  const calculations = useReceiptCalculations(productItems, periods);

  const fetchReceiptDebtDetails = async () => {
    if (!id) {
      await presentToast({
        message: "Không thể load dữ liệu",
        duration: 1000,
        position: "top",
        color: "warning",
      });
      return;
    }

    await withLoading(async () => {
      const response: ReceiptDebtDetailResponse = await getDetail(id);

      if (!response.receipt) {
        await presentToast({
          message: "Không tìm thấy thông tin phiếu",
          duration: 1000,
          position: "top",
          color: "warning",
        });
        history.goBack();
        return;
      }

      const { customerName, dueDate, note } = response.receipt;

      setReceiptDebt(response.receipt);
      setProductItems(response.items);
      setPeriods(response.periods || {});

      setFormData({
        customer: customerName || "",
        dueDate: getDate(dueDate || new Date()).format(),
        note,
      });
    });
  };

  useEffect(() => {
    id && fetchReceiptDebtDetails();
  }, [id]);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptDebtDetails().then(() => {
      event.detail.complete();
    });
  };

  const handleFormChange = (field: keyof IReceiptDebtUpdateForm, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle items change from enhanced component
  const handleItemsChange = (updatedItems: Record<string, IEditableProductItem[]>) => {
    setProductItems(updatedItems);
  };

  const handleVatChange = (periodDate: string, vatAmount: number) => {
    setPeriods((prev) => {
      if (!prev[periodDate]) return prev;
      return {
        ...prev,
        [periodDate]: {
          ...prev[periodDate],
          vatAmount,
        },
      };
    });
  };

  const validateForm = () => {
    const newErrors: IReceiptDebtUpdateErrors = {};

    if (!formData.dueDate) {
      newErrors.dueDate = "Vui lòng chọn ngày dự kiến thu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const isValid = validateForm();

    if (!isValid) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin phiếu",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    const { value } = await Dialog.confirm({
      title: "Xác nhận cập nhật phiếu",
      message: "Bạn có chắc chắn muốn cập nhật phiếu không?",
    });

    if (!value) return;

    await withLoading(async () => {
      const payload = {
        dueDate: formData.dueDate,
        note: formData.note,
      };

      await update(id!, payload);

      await presentToast({
        message: "Cập nhật Phiếu Thu thành công",
        duration: 1000,
        position: "top",
        color: "success",
      });

      history.goBack();
    });
  };

  // Check if editing is disabled based on receipt status
  const isEditingDisabled = receiptDebt?.status === RECEIPT_DEBT_STATUS.CANCELLED || 
                           receiptDebt?.status === RECEIPT_DEBT_STATUS.COMPLETED;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              className="text-gray-600"
              onClick={() => {
                history.goBack();
              }}
            >
              <IonIcon slot="icon-only" icon={chevronBack} />
              Trở lại
            </IonButton>
          </IonButtons>

          <IonTitle>Cập nhật Phiếu Thu</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" size="default" onClick={async () => {
              if (!id) return;
              try {
                const res = await getDetail(id);
                if (res?.receipt) {
                  setExportItems(res.items || {});
                  setExportPeriods(res.periods || {});
                  setIsExportOpen(true);
                }
              } catch {
                presentToast({ message: "Không thể tải dữ liệu", duration: 2000, position: "top", color: "danger" });
              }
            }}>
              <IonIcon icon={printOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
        <Refresher onRefresh={handleRefresh} />

        {isLoading ? (
          <ContentSkeleton lines={5} />
        ) : (
          <>
            {/* Display receipt information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-4 pt-4">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Mã phiếu thu
                </h2>
                <div className="text-base text-gray-900">{receiptDebt?.code}</div>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Trạng thái
                </h2>
                <IonChip color={getStatusColor(receiptDebt?.status as any)} className="m-0 text-sm px-3 py-1 font-medium mt-1">
                  {getStatusLabel(receiptDebt?.status as any)}
                </IonChip>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Tổng tiền
                </h2>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {formatCurrency(calculations.totalAmount)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Tổng {calculations.totalQuantity} sản phẩm
                  {calculations.totalVatAmount > 0
                    ? ` • VAT ${formatCurrency(calculations.totalVatAmount)}`
                    : ""}
                </div>
              </div>

              {/* <div className="px-4 mt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Tổng tiền (Hệ thống)
                </h2>
                <div className="text-base">
                  {formatCurrency(receiptDebt?.totalAmount || 0)}
                </div>
              </div> */}

              <div className="px-4 mt-4">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Đã thanh toán
                </h2>
                <div className="text-base text-gray-900 font-medium">
                  {formatCurrency(receiptDebt?.paidAmount || 0)}
                </div>
              </div>

              <div className="px-4 mt-4 pb-4">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Còn lại
                </h2>
                <div className="text-red-600 font-bold text-lg">
                  {formatCurrency(Math.max(0, calculations.totalAmount - (receiptDebt?.paidAmount || 0)))}
                </div>
              </div>

              {/* Khách hàng - Only show customer name, no modal */}
              <div className="px-4 pb-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">
                  Khách hàng
                </h2>
                <div className="p-3 bg-gray-50 rounded-lg text-base text-gray-900 font-medium">
                  {receiptDebt?.customerName || "Chưa có thông tin khách hàng"}
                </div>
              </div>
            </div>

            <EnhancedPurchasePeriodList 
              items={productItems}
              periods={periods}
              debtId={id!}
              receiptStatus={receiptDebt?.status as TReceiptDebtStatus}
              onItemsChange={handleItemsChange}
              onVatChange={handleVatChange}
              calculations={calculations}
            />

            {/* <div className="bg-card rounded-lg shadow-sm p-4 mt-3">
              <IonText className="text-xl font-semibold">Tổng Tiền Phải Thu: </IonText>
              <IonText className="text-xl font-bold" color="danger">
                {formatCurrency(
                  receiptDebt?.totalAmount - receiptDebt?.paidAmount
                )}
              </IonText>
            </div> */}

            <div className="bg-white rounded-lg shadow-sm mt-3">
              {/* Dự kiến thu */}
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800 mb-2">
                  Dự kiến thu
                </h2>
                <div className="bg-gray-50 rounded-lg">
                  <DatePicker
                    value={formData.dueDate}
                    presentation="date"
                    onChange={(e) =>
                      handleFormChange("dueDate", e.detail.value)
                    }
                    attrs={{ id: "estimated-date", disabled: isEditingDisabled }}
                    extraClassName="w-full flex items-center justify-start py-2.5 text-base"
                  />
                </div>
                {errors.dueDate && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.dueDate}
                  </div>
                )}
              </div>

              {/* Ghi chú */}
              <div className="p-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">
                  Ghi chú
                </h2>
                <IonTextarea
                  name="note"
                  value={formData.note}
                  onIonInput={(e) => handleFormChange("note", e.target.value)}
                  placeholder="Nhập ghi chú đơn hàng"
                  rows={3}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-base"
                  disabled={isEditingDisabled}
                ></IonTextarea>
              </div>
            </div>
          </>
        )}
      </IonContent>

      {/* Footer */}
      <IonFooter className="bg-white ion-no-border border-t border-gray-100 p-4">
        <IonButton expand="block" size="default" onClick={handleSubmit} disabled={isEditingDisabled}>
          <IonIcon icon={checkmarkCircleOutline} slot="start" />
          Cập nhật
        </IonButton>
      </IonFooter>

      {receiptDebt && (
        <ExportReceiptBillModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          receiptCode={receiptDebt.code}
          customerName={receiptDebt.customerName || ""}
          storeCode={user?.storeCode || "KS"}
          paidAmount={receiptDebt.paidAmount}
          remainingAmount={receiptDebt.remainingAmount}
          items={exportItems}
          periods={exportPeriods}
        />
      )}
    </IonPage>
  );
};

export default ReceiptDebtUpdate;
