import React, { useState, useEffect, useCallback } from "react";
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
  ellipsisVertical,
  // createOutline,
  // cashOutline,
  // cardOutline,
  // ellipsisVerticalOutline,
} from "ionicons/icons";
import {
  dayjsFormat,
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/helpers/formatters";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { useLoading } from "@/hooks";
import {
  getStatusColor,
  getStatusLabel,
  TReceiptDebtStatus,
} from "@/common/constants/receipt";
import { IProductItem } from "@/types/product.type";
import { getDate } from "@/helpers/date";
import { getPaymentMethodLabel, getTransactionStatusLabel, getTransactionStatusColor } from "@/helpers/paymentHelpers";
import PaymentModal, { PaymentMethod } from "./components/PaymentModal";
import { PayDebtRequestDto, PaymentTransactionDto } from "@/types/payment.type";
import { Transaction } from "@/types/transaction.type";
import { PaymentMethod as PaymentMethodEnum } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";

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

interface ResponseData {
  receipt: ReceiptDebt | null;
  items: Record<string, IProductItem[]>;
}

const ReceiptDebtDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [receiptData, setReceiptData] = useState<ResponseData>({
    receipt: null,
    items: {}, // Fix: Initialize as empty object instead of array
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { isLoading, withLoading } = useLoading();
  const { getDetail, payDebt, getPaymentTransactions } = useReceiptDebt();

  // Fetch payment transactions
  const fetchPaymentTransactions = useCallback(async () => {
    try {
      const response = await getPaymentTransactions(id);
      setTransactions(response.transactions);
    } catch (err) {
      console.error("Failed to fetch payment transactions:", err);
      // Don't show error toast for transactions as it's not critical
    }
  }, [id]);

  // Fetch receipt data from API
  const fetchReceiptDetail = useCallback(async () => {
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
        // Also fetch payment transactions
        await fetchPaymentTransactions();
      } catch (err) {
        presentToast({
          message: (err as Error).message || "Đã có lỗi xảy ra",
          duration: 2000,
          position: "top",
        });
      }
    });
  }, [id]);

  useEffect(() => {
    id && fetchReceiptDetail();
  }, [id, fetchReceiptDetail]);

  // Callback handler for payment completion
  const handlePaymentComplete = useCallback(
    async (amount: number, method: PaymentMethod) => {
      await withLoading(async () => {
        try {
          // Validate input
          if (!amount || amount <= 0) {
            throw new Error("Số tiền thanh toán không hợp lệ");
          }

          if (!receiptData.receipt) {
            throw new Error("Không tìm thấy thông tin phiếu thu");
          }

          if (amount > receiptData.receipt?.remainingAmount) {
            throw new Error("Số tiền thanh toán không được vượt quá số tiền còn lại");
          }

          // Map payment method from modal to API enum
          const mapPaymentMethod = (method: PaymentMethod): PaymentMethodEnum => {
            switch (method) {
              case "cash":
                return PaymentMethodEnum.CASH;
              case "qr":
                return PaymentMethodEnum.BANK_TRANSFER; // QR is typically bank transfer
              default:
                return PaymentMethodEnum.CASH;
            }
          };

          // Prepare payment data
          const paymentTransaction: PaymentTransactionDto = {
            amount,
            paymentMethod: mapPaymentMethod(method),
            type: TransactionType.PAYMENT,
            note: `Thanh toán cho phiếu thu ${receiptData.receipt.code}`,
          };
          console.log({ paymentTransaction })

          const paymentData: PayDebtRequestDto = {
            transactions: [paymentTransaction],
            note: `Thanh toán ${formatCurrency(amount)} bằng ${method === "cash" ? "tiền mặt" : "chuyển khoản"
              }`,
          };
          console.log({ paymentData })

          // Call payment API
          const response = await payDebt(id, paymentData);
          console.log({ response });

          if (response.success) {
            await presentToast({
              message: `Đã ghi nhận thanh toán ${formatCurrency(amount)} bằng ${method === "cash" ? "tiền mặt" : "chuyển khoản"
                }`,
              duration: 2000,
              position: "top",
            });

            // Refresh the receipt data to show updated payment status
            await fetchReceiptDetail();
          } else {
            throw new Error(response.message || "Thanh toán thất bại");
          }
        } catch (error) {
          presentToast({
            message: error instanceof Error ? error.message : "Có lỗi xảy ra khi ghi nhận thanh toán",
            duration: 3000,
            position: "top",
          });
        }
      });
    },
    [id, receiptData.receipt]
  );

  const handleActionSheet = () => {
    presentActionSheet({
      header: "Tùy chọn",
      buttons: [
        {
          text: "Thanh toán",
          role: "selected",
          handler: () => {
            setIsPaymentModalOpen(true);
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
              Trở lại
            </IonButton>
          </IonButtons>
          <IonTitle className="text-lg font-semibold text-gray-800">
            Chi tiết phiếu thu
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
                      color={getStatusColor(
                        receipt?.status as TReceiptDebtStatus
                      )}
                      className="text-xs px-3 py-1 rounded-full"
                    >
                      {getStatusLabel(receipt?.status as TReceiptDebtStatus)}
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

          {/* Product List by Period */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Danh Sách Sản Phẩm Theo Đợt Thu
              </h3>
            </div>

            {/* Display items grouped by period */}
            {Object.entries(items).map(([period, periodItems]) => (
              <div
                key={period}
                className="border-b border-gray-100 last:border-b-0"
              >
                {/* Period Header */}
                <div className="bg-blue-50 px-4 py-2">
                  <h4 className="text-sm font-medium text-blue-700">
                    Đợt: {getDate(period).format("DD/MM/YYYY")}
                  </h4>
                </div>

                {/* Table Header */}
                <div className="bg-green-50 px-4 py-3">
                  <IonGrid className="p-0">
                    <IonRow className="text-xs font-medium text-green-700">
                      <IonCol size="2" className="p-0">
                        Mã SP
                      </IonCol>
                      <IonCol size="4" className="p-0 text-center">
                        Tên SP
                      </IonCol>
                      <IonCol size="2" className="p-0 text-right">
                        SL
                      </IonCol>
                      <IonCol size="4" className="p-0 text-right">
                        Đơn Giá
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>

                {/* Table Content for this period */}
                {periodItems.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <IonGrid className="p-0">
                      <IonRow className="text-xs">
                        <IonCol size="3" className="p-0 text-left text-gray-600">
                          {item.code}
                        </IonCol>
                        <IonCol size="4" className="p-0 text-gray-800">
                          {item.productName}
                        </IonCol>
                        <IonCol
                          size="1"
                          className="p-0 text-center text-gray-800"
                        >
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
            ))}

            {/* Show message if no items */}
            {Object.keys(items).length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Chi Tiết Thu Tiền
              </h3>
            </div>

            {transactions.length > 0 ? (
              <>
                {/* Payment Header */}
                <div className="bg-green-50 px-4 py-3">
                  <IonGrid className="p-0">
                    <IonRow className="text-xs font-medium text-green-700">
                      <IonCol size="3" className="p-0">
                        Ngày Thu
                      </IonCol>
                      <IonCol size="3" className="p-0">
                        Số Tiền
                      </IonCol>
                      <IonCol size="3" className="p-0 text-center">
                        Hình Thức
                      </IonCol>
                      <IonCol size="3" className="p-0 text-center">
                        Trạng Thái
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>

                {/* Payment Content */}
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <IonGrid className="p-0">
                      <IonRow className="text-xs">
                        <IonCol size="3" className="p-0 text-gray-800">
                          {dayjsFormat(transaction.processedAt)}
                        </IonCol>
                        <IonCol size="4" className="p-0 text-gray-800 font-medium">
                          {formatCurrency(transaction.amount)}
                        </IonCol>
                        <IonCol size="3" className="p-0 text-gray-600">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </IonCol>
                        <IonCol size="2" className="p-0">
                          <IonChip
                            color={getTransactionStatusColor(transaction.status)}
                            className="text-xs rounded-full"
                          >
                            {getTransactionStatusLabel(transaction.status)}
                          </IonChip>
                        </IonCol>
                      </IonRow>
                      {transaction.description && (
                        <IonRow className="text-xs text-gray-500 mt-1">
                          <IonCol className="p-0">
                            {transaction.description}
                          </IonCol>
                        </IonRow>
                      )}
                    </IonGrid>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Chưa có lịch sử thanh toán
              </div>
            )}
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

      {/* Add PaymentModal at the end before closing IonPage */}
      {receipt && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          receiptData={{
            code: receipt.code,
            remainingAmount: receipt.remainingAmount,
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </IonPage>
  );
};

export default ReceiptDebtDetail;
