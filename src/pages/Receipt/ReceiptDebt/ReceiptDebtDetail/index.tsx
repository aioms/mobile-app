import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router";
import { Toast } from "@capacitor/toast";
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  useIonToast,
  useIonActionSheet,
} from "@ionic/react";
import {
  chevronBack,
  createOutline,
  cashOutline,
  cardOutline,
  addCircleOutline,
  ellipsisVertical,
  ellipsisVerticalOutline,
} from "ionicons/icons";
import {
  dayjsFormat,
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/helpers/formatters";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { useLoading } from "@/hooks";

// Updated interfaces to match API response
export interface ReceiptDebt {
  id: string;
  code: string;
  type: "customer_debt" | "supplier_debt";
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "paid" | "overdue" | "debt";
  dueDate: Date;
  paymentDate: Date | null;
  note?: string | null;
  createdAt: Date;
  supplierName: string;
  customerName: string;
}

interface ReceiptItem {
  id: string;
  code: string;
  productId: string;
  productCode: number;
  productName: string;
  quantity: number;
  costPrice: number;
}

interface ResponseData {
  receipt: ReceiptDebt | null;
  items: ReceiptItem[];
}

interface PaymentDetail {
  id: string;
  date: string;
  amount: number;
  method: "cash" | "transfer";
  description: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
    case "debt":
      return "warning";
    case "overdue":
      return "danger";
    default:
      return "medium";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Đã thanh toán";
    case "pending":
      return "Chờ thanh toán";
    case "debt":
      return "Công nợ";
    case "overdue":
      return "Quá hạn";
    default:
      return "Không xác định";
  }
};

const ReceiptDebtDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();

  const [receiptData, setReceiptData] = useState<ResponseData>({
    receipt: null,
    items: [],
  });

  const { isLoading, withLoading } = useLoading();
  const { getDetail } = useReceiptDebt();

  // Fetch receipt data from API
  useEffect(() => {
    const fetchReceiptDetail = async () => {
      await withLoading(async () => {
        try {
          const result = await getDetail(id);

          if (!result) {
            return await Toast.show({
              text: "Không tìm thấy phiếu",
              duration: "short",
              position: "top",
            });
          }

          setReceiptData(result);
        } catch (err) {
          presentToast({
            message: (err as Error).message || "Đã có lỗi xảy ra",
            duration: 2000,
            position: "top",
          });
        }
      });
    };

    id && fetchReceiptDetail();
  }, [id]);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex justify-center items-center h-full">
            <div>Đang tải...</div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const handleActionSheet = () => {
    presentActionSheet({
      header: "Tùy chọn",
      buttons: [
        {
          text: "Thanh toán",
          role: "selected",
          handler: () => {
            Toast.show({
              text: "Tính năng này đang được phát triển",
              duration: "short",
              position: "center",
            });
          },
        },
        {
          text: "Chỉnh sửa",
          handler: () => {
            history.push(`/tabs/debt/update/${id}`);
          },
        },
        {
          text: "In phiếu",
          handler: () => {
            Toast.show({
              text: "Tính năng này đang được phát triển",
              duration: "short",
              position: "center",
            });
          },
        },
        {
          text: "Hủy",
          role: "cancel",
        },
      ],
    });
  };

  const { receipt, items } = receiptData;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => history.goBack()}
              className="text-gray-600"
            >
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle className="text-lg font-semibold text-gray-800">
            Mã Phiếu Thu - {receipt?.code}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleActionSheet}>
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <div className="p-4 space-y-4">
          {/* Receipt Information */}
          <IonCard className="shadow-sm">
            <IonCardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Mã phiếu:</span>
                  <span className="text-gray-800 font-medium">
                    {receipt?.code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Ngày Tạo:</span>
                  <span className="text-gray-800 font-medium">
                    {dayjsFormat(receipt?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Ngày Thu Dự Kiến:
                  </span>
                  <span className="text-gray-800 font-medium">
                    {dayjsFormat(receipt?.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {receipt?.type === "customer_debt"
                      ? "Khách Hàng:"
                      : "Nhà Cung Cấp:"}
                  </span>
                  <span className="text-gray-800 font-medium">
                    {receipt?.type === "customer_debt"
                      ? receipt?.customerName
                      : receipt?.supplierName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Trạng Thái:</span>
                  {receipt?.status && (
                    <IonChip
                      color={getStatusColor(receipt?.status)}
                      className="text-xs px-3 py-1 rounded-full"
                    >
                      {getStatusLabel(receipt?.status)}
                    </IonChip>
                  )}
                </div>
                {receipt?.note && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Ghi Chú:</span>
                    <span className="text-gray-800 font-medium">
                      {receipt?.note}
                    </span>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Product List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Danh Sách Sản Phẩm
              </h3>
              <IonButton
                fill="clear"
                size="small"
                className="text-green-500 p-0 m-0"
              >
                <IonIcon icon={addCircleOutline} />
              </IonButton>
            </div>

            {/* Table Header */}
            <div className="bg-green-50 px-4 py-3">
              <IonGrid className="p-0">
                <IonRow className="text-xs font-medium text-green-700">
                  <IonCol size="2" className="p-0">
                    Mã SP
                  </IonCol>
                  <IonCol size="4" className="p-0">
                    Tên SP
                  </IonCol>
                  <IonCol size="2" className="p-0 text-center">
                    SL
                  </IonCol>
                  <IonCol size="4" className="p-0 text-right">
                    Đơn Giá
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            {/* Table Content */}
            {items.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-gray-100">
                <IonGrid className="p-0">
                  <IonRow className="text-sm">
                    <IonCol size="2" className="p-0 text-gray-600">
                      {item.code}
                    </IonCol>
                    <IonCol size="4" className="p-0 text-gray-800">
                      {item.productName}
                    </IonCol>
                    <IonCol size="2" className="p-0 text-center text-gray-800">
                      {item.quantity}
                    </IonCol>
                    <IonCol
                      size="4"
                      className="p-0 text-right text-gray-800 font-medium"
                    >
                      {formatCurrencyWithoutSymbol(item.costPrice)}đ
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            ))}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Chi Tiết Thu Tiền
              </h3>
            </div>

            {/* Payment Header */}
            <div className="bg-green-50 px-4 py-3">
              <IonGrid className="p-0">
                <IonRow className="text-xs font-medium text-green-700">
                  <IonCol size="3" className="p-0">
                    Ngày Thu
                  </IonCol>
                  <IonCol size="4" className="p-0">
                    Số Tiền
                  </IonCol>
                  <IonCol size="5" className="p-0">
                    Hình Thức
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>

            {/* Payment Content */}
            {/* {[].map((payment) => (
              <div
                key={payment.id}
                className="px-4 py-3 border-b border-gray-100"
              >
                <IonGrid className="p-0">
                  <IonRow className="text-sm items-center">
                    <IonCol size="3" className="p-0">
                      <span className="text-blue-500 font-medium">
                        {dayjsFormat(payment.date)}
                      </span>
                    </IonCol>
                    <IonCol size="4" className="p-0">
                      <span className="text-gray-800 font-medium">
                        {formatCurrencyWithoutSymbol(payment.amount)}đ
                      </span>
                    </IonCol>
                    <IonCol size="5" className="p-0 flex items-center">
                      <IonIcon
                        icon={
                          payment.method === "cash" ? cashOutline : cardOutline
                        }
                        className="text-gray-500 mr-2"
                        size="small"
                      />
                      <span className="text-gray-600">
                        {payment.description}
                      </span>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            ))} */}
          </div>

          {/* Summary */}
          <IonCard className="shadow-sm">
            <IonCardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-800">
                    Tổng công nợ
                  </span>
                  <span className="text-xl font-bold text-red-500">
                    {receipt?.totalAmount &&
                      formatCurrency(receipt?.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Đã Thu:</span>
                  <span className="text-green-500 font-semibold">
                    {receipt?.paidAmount && formatCurrency(receipt?.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Còn Lại:</span>
                  <span className="text-blue-500 font-semibold">
                    {receipt?.remainingAmount &&
                      formatCurrency(receipt?.remainingAmount)}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptDebtDetail;
