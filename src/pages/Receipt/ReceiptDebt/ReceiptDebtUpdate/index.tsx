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
  IonRefresher,
  IonRefresherContent,
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
import { getStatusLabel, getStatusColor } from "@/common/constants/receipt";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";

import DatePicker from "@/components/DatePicker";
import ContentSkeleton from "@/components/Loading/ContentSkeleton";
import PurchasePeriodList from "./components/PurchasePeriodList";
import { IProductItem } from "@/types/product.type";
import { useLoading } from "@/hooks";
import { Dialog } from "@capacitor/dialog";
import { Toast } from "@capacitor/toast";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import EmptyPage from "@/components/EmptyPage";

const initialFormData = {
  customer: "",
  dueDate: "",
  note: "",
};

interface IReceiptDebtDetail {
  id: string;
  code: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  paymentDate: string | null;
  note: string;
  receiptImportId: string | null;
  receiptReturnId: string | null;
  createdAt: string;
  updatedAt: string;
  supplierName: string | null;
  customerName: string | null;
}

interface ReceiptDebtDetailResponse {
  receipt: IReceiptDebtDetail;
  items: Record<string, IProductItem[]>;
}

const ReceiptDebtUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentToast] = useIonToast();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptDebt, setReceiptDebt] = useState<IReceiptDebtDetail | null>(
    null
  );
  const [productItems, setProductItems] = useState<
    Record<string, IProductItem[]>
  >({});

  const { withLoading, isLoading } = useLoading();

  const { getDetail, update } = useReceiptDebt();

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
        Toast.show({
          text: "Không tìm thấy thông tin phiếu",
          duration: "short",
          position: "center",
        });
        history.goBack();
        return;
      }

      const { customerName, dueDate, note } = response.receipt;

      setReceiptDebt(response.receipt);
      setProductItems(response.items);

      setFormData({
        customer: customerName || "",
        dueDate: getDate(dueDate || new Date()).format(),
        note,
      });
    });
  };

  useEffect(() => {
    fetchReceiptDebtDetails();
  }, [id]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    fetchReceiptDebtDetails().then(() => {
      event.detail.complete();
    });
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

      const response = await update(id!, payload);

      if (response.id) {
        await presentToast({
          message: "Cập nhật Phiếu Thu thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });
      }

      history.goBack();
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Đang tải dữ liệu..." />;
  }

  if (!receiptDebt) {
    return <EmptyPage />;
  }

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
            <IonButton fill="clear" size="default">
              <IonIcon icon={printOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {isLoading ? (
          <ContentSkeleton lines={5} />
        ) : (
          <>
            {/* Display receipt information */}
            <div className="bg-card rounded-lg shadow-sm">
              <div className="px-4 pt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Mã phiếu thu
                </h2>
                <div className="text-base">{receiptDebt?.code}</div>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Trạng thái
                </h2>
                <IonChip color={getStatusColor(receiptDebt?.status as any)}>
                  <IonLabel>
                    {getStatusLabel(receiptDebt?.status as any)}
                  </IonLabel>
                </IonChip>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Tổng tiền
                </h2>
                <div className="text-base">
                  {formatCurrency(receiptDebt?.totalAmount || 0)}
                </div>
              </div>

              <div className="px-4 mt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Đã thanh toán
                </h2>
                <div className="text-base">
                  {formatCurrency(receiptDebt?.paidAmount || 0)}
                </div>
              </div>

              <div className="px-4 mt-4 pb-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Còn lại
                </h2>
                <div className="text-red-600 font-semibold text-base">
                  {formatCurrency(receiptDebt?.remainingAmount || 0)}
                </div>
              </div>

              {/* Khách hàng - Only show customer name, no modal */}
              <div className="px-4 pb-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Khách hàng
                </h2>
                <div className="p-2 bg-gray-50 rounded-lg text-base">
                  {receiptDebt?.customerName || "Chưa có thông tin khách hàng"}
                </div>
              </div>
            </div>

            <PurchasePeriodList items={productItems} />

            {/* <div className="bg-card rounded-lg shadow-sm p-4 mt-3">
              <IonText className="text-xl font-semibold">Tổng Tiền Phải Thu: </IonText>
              <IonText className="text-xl font-bold" color="danger">
                {formatCurrency(
                  receiptDebt?.totalAmount - receiptDebt?.paidAmount
                )}
              </IonText>
            </div> */}

            <div className="bg-card rounded-lg shadow-sm mt-3">
              {/* Dự kiến thu */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  Dự kiến thu
                </h2>
                <div>
                  <DatePicker
                    value={formData.dueDate}
                    presentation="date"
                    onChange={(e) =>
                      handleFormChange("dueDate", e.detail.value)
                    }
                    attrs={{ id: "estimated-date" }}
                    extraClassName="w-full flex items-center justify-start"
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
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  Ghi chú
                </h2>
                <IonTextarea
                  name="note"
                  value={formData.note}
                  onIonInput={(e) => handleFormChange("note", e.target.value)}
                  placeholder="Nhập ghi chú đơn hàng"
                  rows={3}
                  className="border border-input rounded-lg px-2"
                ></IonTextarea>
              </div>
            </div>
          </>
        )}
      </IonContent>

      <IonFooter>
        <div className="ion-padding">
          <IonButton expand="block" size="default" onClick={handleSubmit}>
            <IonIcon icon={checkmarkCircleOutline} slot="start" />
            Cập nhật
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ReceiptDebtUpdate;
